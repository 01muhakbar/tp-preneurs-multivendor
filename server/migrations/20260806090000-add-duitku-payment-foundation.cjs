'use strict';

const FUTURE_TABLES = [
  'order_collection_claims',
  'order_payment_attempts',
  'duitku_callback_inbox',
  'order_payment_attempt_events',
  'order_payment_security_events',
];

const PAYMENT_CHANNEL_ENUM = "ENUM('QRIS','DUITKU')";
const PAYMENT_CHANNEL_QRIS_ONLY = "ENUM('QRIS')";
const PAYMENT_TYPE_ENUM = "ENUM('QRIS_STATIC','DUITKU_POP')";
const PAYMENT_TYPE_QRIS_ONLY = "ENUM('QRIS_STATIC')";
const SUBORDER_PAYMENT_METHOD_ENUM = "ENUM('QRIS','DUITKU')";
const SUBORDER_PAYMENT_METHOD_QRIS_ONLY = "ENUM('QRIS')";

function quoteIdentifier(value) {
  return `\`${String(value).replace(/`/g, '``')}\``;
}

async function tableExists(queryInterface, tableName) {
  try {
    await queryInterface.describeTable(tableName);
    return true;
  } catch {
    return false;
  }
}

async function columnExists(queryInterface, tableName, columnName) {
  try {
    const definition = await queryInterface.describeTable(tableName);
    return Boolean(definition?.[columnName]);
  } catch {
    return false;
  }
}

async function indexExists(queryInterface, tableName, indexName) {
  try {
    const indexes = await queryInterface.showIndex(tableName);
    return indexes.some((index) => String(index.name || '') === indexName);
  } catch {
    return false;
  }
}

async function addIndexIfMissing(queryInterface, tableName, fields, options) {
  if (await indexExists(queryInterface, tableName, options.name)) return;
  await queryInterface.addIndex(tableName, fields, options);
}

async function foreignKeyExists(queryInterface, tableName, constraintName) {
  const [rows] = await queryInterface.sequelize.query(
    `
      SELECT CONSTRAINT_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND CONSTRAINT_NAME = ?
        AND REFERENCED_TABLE_NAME IS NOT NULL
      LIMIT 1
    `,
    { replacements: [tableName, constraintName] }
  );
  return Array.isArray(rows) && rows.length > 0;
}

async function addConstraintIfMissing(queryInterface, tableName, fields, options) {
  if (await foreignKeyExists(queryInterface, tableName, options.name)) return;
  await queryInterface.addConstraint(tableName, {
    ...options,
    fields,
    type: 'foreign key',
  });
}

async function removeConstraintIfExists(queryInterface, tableName, constraintName) {
  if (!(await foreignKeyExists(queryInterface, tableName, constraintName))) return;
  await queryInterface.removeConstraint(tableName, constraintName);
}

async function resolvePhysicalTable(queryInterface, logicalName) {
  const [rows] = await queryInterface.sequelize.query(
    `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
        AND LOWER(table_name) = LOWER(?)
      ORDER BY table_name
    `,
    { replacements: [logicalName] }
  );
  if (!Array.isArray(rows) || rows.length !== 1) {
    throw new Error(`Expected exactly one physical table for ${logicalName}, found ${rows?.length || 0}.`);
  }
  return rows[0].table_name;
}

async function countRows(queryInterface, sql, replacements = []) {
  const [rows] = await queryInterface.sequelize.query(sql, { replacements });
  const row = Array.isArray(rows) ? rows[0] : null;
  return Number(row?.row_count || row?.count || 0);
}

async function assertSafeDown(queryInterface, paymentsTable, subordersTable) {
  for (const tableName of FUTURE_TABLES) {
    if (!(await tableExists(queryInterface, tableName))) continue;
    const rowCount = await countRows(
      queryInterface,
      `SELECT COUNT(*) AS row_count FROM ${quoteIdentifier(tableName)}`
    );
    if (rowCount > 0) {
      throw new Error(`Refusing Duitku rollback: ${tableName} contains ${rowCount} row(s).`);
    }
  }

  if (await tableExists(queryInterface, paymentsTable)) {
    const hasAllocationKey = await columnExists(queryInterface, paymentsTable, 'allocation_key');
    const hasPaidByAttempt = await columnExists(queryInterface, paymentsTable, 'paid_by_order_payment_attempt_id');
    const allocationChecks = [];
    if (hasAllocationKey) allocationChecks.push('allocation_key IS NOT NULL');
    if (hasPaidByAttempt) allocationChecks.push('paid_by_order_payment_attempt_id IS NOT NULL');
    allocationChecks.push("payment_channel = 'DUITKU'");
    allocationChecks.push("payment_type = 'DUITKU_POP'");

    const paymentEvidence = await countRows(
      queryInterface,
      `SELECT COUNT(*) AS row_count FROM ${quoteIdentifier(paymentsTable)} WHERE ${allocationChecks.join(' OR ')}`
    );
    if (paymentEvidence > 0) {
      throw new Error(`Refusing Duitku rollback: payments contain ${paymentEvidence} Duitku/allocation evidence row(s).`);
    }
  }

  if (await tableExists(queryInterface, subordersTable)) {
    const duitkuSuborders = await countRows(
      queryInterface,
      `SELECT COUNT(*) AS row_count FROM ${quoteIdentifier(subordersTable)} WHERE payment_method = 'DUITKU'`
    );
    if (duitkuSuborders > 0) {
      throw new Error(`Refusing Duitku rollback: suborders contain ${duitkuSuborders} DUITKU row(s).`);
    }
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const ordersTable = await resolvePhysicalTable(queryInterface, 'orders');
    const usersTable = await resolvePhysicalTable(queryInterface, 'users');
    const paymentsTable = await resolvePhysicalTable(queryInterface, 'payments');
    const subordersTable = await resolvePhysicalTable(queryInterface, 'suborders');

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS order_collection_claims (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        order_id INT UNSIGNED NOT NULL,
        rail ENUM('DUITKU_POP','QRIS_STATIC') NOT NULL,
        claim_state ENUM('CLAIMED','PAID','FAILED','EXPIRED','CANCELLED') NOT NULL DEFAULT 'CLAIMED',
        claim_source ENUM('DUITKU_CREATE_INVOICE','QRIS_FALLBACK','ADMIN_RECOVERY') NOT NULL,
        order_payment_attempt_id INT UNSIGNED NULL DEFAULT NULL,
        claimed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        paid_at DATETIME NULL DEFAULT NULL,
        terminal_at DATETIME NULL DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_occ_order_id (order_id),
        KEY idx_occ_rail_state (rail, claim_state),
        KEY idx_occ_source (claim_source),
        KEY idx_occ_attempt (order_payment_attempt_id),
        KEY idx_occ_claimed_at (claimed_at),
        KEY idx_occ_paid_at (paid_at),
        KEY idx_occ_terminal_at (terminal_at),
        CONSTRAINT fk_occ_order
          FOREIGN KEY (order_id) REFERENCES ${quoteIdentifier(ordersTable)} (id)
          ON UPDATE CASCADE ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS order_payment_attempts (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        order_id INT UNSIGNED NOT NULL,
        provider ENUM('DUITKU') NOT NULL DEFAULT 'DUITKU',
        status ENUM('CREATED','PENDING','PAID','FAILED','CANCELLED','EXPIRED','UNKNOWN') NOT NULL DEFAULT 'CREATED',
        requires_manual_review TINYINT(1) NOT NULL DEFAULT 0,
        manual_review_reason VARCHAR(120) NULL DEFAULT NULL,
        manual_review_created_at DATETIME NULL DEFAULT NULL,
        manual_reviewed_by_user_id INT UNSIGNED NULL DEFAULT NULL,
        manual_reviewed_at DATETIME NULL DEFAULT NULL,
        merchant_order_id VARCHAR(50) NOT NULL,
        provider_reference VARCHAR(160) NULL DEFAULT NULL,
        payment_url TEXT NULL DEFAULT NULL,
        amount BIGINT UNSIGNED NOT NULL,
        currency CHAR(3) NOT NULL DEFAULT 'IDR',
        expiry_period_minutes INT UNSIGNED NOT NULL DEFAULT 60,
        expires_at DATETIME NULL DEFAULT NULL,
        created_at_provider DATETIME NULL DEFAULT NULL,
        paid_at DATETIME NULL DEFAULT NULL,
        cancelled_at DATETIME NULL DEFAULT NULL,
        expired_at DATETIME NULL DEFAULT NULL,
        idempotency_key_hash CHAR(64) NOT NULL,
        request_fingerprint CHAR(64) NOT NULL,
        provider_last_code VARCHAR(40) NULL DEFAULT NULL,
        provider_last_message VARCHAR(255) NULL DEFAULT NULL,
        last_reconciled_at DATETIME NULL DEFAULT NULL,
        reconcile_attempt_count INT UNSIGNED NOT NULL DEFAULT 0,
        next_reconcile_at DATETIME NULL DEFAULT NULL,
        last_reconcile_error_code VARCHAR(64) NULL DEFAULT NULL,
        last_reconcile_error_at DATETIME NULL DEFAULT NULL,
        created_by_user_id INT UNSIGNED NULL DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_opa_merchant_order_id (merchant_order_id),
        UNIQUE KEY uniq_opa_provider_reference (provider_reference),
        UNIQUE KEY uniq_opa_order_idempotency (order_id, idempotency_key_hash),
        KEY idx_opa_provider_status (provider, status),
        KEY idx_opa_order_status (order_id, status),
        KEY idx_opa_manual_review_queue (requires_manual_review, status, manual_review_created_at),
        KEY idx_opa_reconcile_due (next_reconcile_at, status, reconcile_attempt_count),
        KEY idx_opa_amount (amount),
        KEY idx_opa_expires_at (expires_at),
        KEY idx_opa_paid_at (paid_at),
        KEY idx_opa_request_fingerprint (request_fingerprint),
        KEY idx_opa_created_at (created_at),
        CONSTRAINT fk_opa_order
          FOREIGN KEY (order_id) REFERENCES ${quoteIdentifier(ordersTable)} (id)
          ON UPDATE CASCADE ON DELETE RESTRICT,
        CONSTRAINT fk_opa_manual_user
          FOREIGN KEY (manual_reviewed_by_user_id) REFERENCES ${quoteIdentifier(usersTable)} (id)
          ON UPDATE CASCADE ON DELETE SET NULL,
        CONSTRAINT fk_opa_created_user
          FOREIGN KEY (created_by_user_id) REFERENCES ${quoteIdentifier(usersTable)} (id)
          ON UPDATE CASCADE ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await addConstraintIfMissing(queryInterface, 'order_collection_claims', ['order_payment_attempt_id'], {
      name: 'fk_occ_attempt',
      references: {
        table: 'order_payment_attempts',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS duitku_callback_inbox (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        payment_attempt_id INT UNSIGNED NULL DEFAULT NULL,
        resolved_payment_attempt_id INT UNSIGNED NULL DEFAULT NULL,
        merchant_code_raw VARCHAR(64) NOT NULL,
        merchant_order_id_raw VARCHAR(128) NOT NULL,
        provider_reference_raw VARCHAR(192) NULL DEFAULT NULL,
        amount_raw VARCHAR(64) NOT NULL,
        result_code_raw VARCHAR(40) NOT NULL,
        signature_state ENUM('VALID') NOT NULL DEFAULT 'VALID',
        binding_state ENUM('BOUND','UNBOUND','AMBIGUOUS','RESOLVED') NOT NULL DEFAULT 'UNBOUND',
        processing_result ENUM('APPLIED','IGNORED','QUARANTINED','ERROR') NOT NULL DEFAULT 'QUARANTINED',
        quarantine_reason VARCHAR(120) NULL DEFAULT NULL,
        occurrence_key CHAR(64) NOT NULL,
        event_hash CHAR(64) NOT NULL,
        raw_body_digest CHAR(64) NOT NULL,
        field_values_digest CHAR(64) NOT NULL,
        duplicate_count INT UNSIGNED NOT NULL DEFAULT 0,
        first_received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME NULL DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_dci_occurrence (occurrence_key),
        KEY idx_dci_attempt (payment_attempt_id),
        KEY idx_dci_resolved_attempt (resolved_payment_attempt_id),
        KEY idx_dci_merchant_code (merchant_code_raw),
        KEY idx_dci_merchant_order (merchant_order_id_raw),
        KEY idx_dci_reference (provider_reference_raw),
        KEY idx_dci_result_code (result_code_raw),
        KEY idx_dci_signature_binding (signature_state, binding_state),
        KEY idx_dci_processing (processing_result),
        KEY idx_dci_quarantine (quarantine_reason, first_received_at),
        KEY idx_dci_event_hash (event_hash),
        KEY idx_dci_raw_body_digest (raw_body_digest),
        KEY idx_dci_received (first_received_at),
        KEY idx_dci_last_received (last_received_at),
        KEY idx_dci_resolved_at (resolved_at),
        CONSTRAINT fk_dci_attempt
          FOREIGN KEY (payment_attempt_id) REFERENCES order_payment_attempts (id)
          ON UPDATE CASCADE ON DELETE RESTRICT,
        CONSTRAINT fk_dci_resolved_attempt
          FOREIGN KEY (resolved_payment_attempt_id) REFERENCES order_payment_attempts (id)
          ON UPDATE CASCADE ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS order_payment_attempt_events (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        payment_attempt_id INT UNSIGNED NOT NULL,
        callback_inbox_id INT UNSIGNED NULL DEFAULT NULL,
        event_type ENUM('CREATE_INVOICE','CALLBACK','STATUS_CHECK','RECOVERY','RETURN_OBSERVED') NOT NULL,
        occurrence_key CHAR(64) NOT NULL,
        provider_call_id CHAR(36) NULL DEFAULT NULL,
        reconciliation_run_id CHAR(36) NULL DEFAULT NULL,
        merchant_order_id VARCHAR(50) NULL DEFAULT NULL,
        provider_reference VARCHAR(160) NULL DEFAULT NULL,
        provider_amount_raw VARCHAR(64) NULL DEFAULT NULL,
        amount_normalized BIGINT UNSIGNED NULL DEFAULT NULL,
        provider_result_code VARCHAR(40) NULL DEFAULT NULL,
        provider_status_code VARCHAR(40) NULL DEFAULT NULL,
        payment_code VARCHAR(40) NULL DEFAULT NULL,
        signature_state ENUM('VALID','NOT_APPLICABLE','NOT_CHECKED') NOT NULL DEFAULT 'NOT_CHECKED',
        processing_result ENUM('APPLIED','IGNORED','QUARANTINED','ERROR') NOT NULL,
        event_hash CHAR(64) NOT NULL,
        raw_body_digest CHAR(64) NULL DEFAULT NULL,
        duplicate_count INT UNSIGNED NOT NULL DEFAULT 0,
        first_received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_opae_occurrence (payment_attempt_id, event_type, occurrence_key),
        UNIQUE KEY uniq_opae_callback_inbox (callback_inbox_id),
        KEY idx_opae_attempt_id (payment_attempt_id),
        KEY idx_opae_provider_call_id (provider_call_id),
        KEY idx_opae_reconciliation_run_id (reconciliation_run_id),
        KEY idx_opae_merchant_order_id (merchant_order_id),
        KEY idx_opae_provider_reference (provider_reference),
        KEY idx_opae_result_code (provider_result_code),
        KEY idx_opae_status_code (provider_status_code),
        KEY idx_opae_signature_state (signature_state),
        KEY idx_opae_processing_result (processing_result),
        KEY idx_opae_event_hash (event_hash),
        KEY idx_opae_first_received_at (first_received_at),
        KEY idx_opae_last_received_at (last_received_at),
        CONSTRAINT fk_opae_attempt
          FOREIGN KEY (payment_attempt_id) REFERENCES order_payment_attempts (id)
          ON UPDATE CASCADE ON DELETE RESTRICT,
        CONSTRAINT fk_opae_callback_inbox
          FOREIGN KEY (callback_inbox_id) REFERENCES duitku_callback_inbox (id)
          ON UPDATE CASCADE ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS order_payment_security_events (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        event_type ENUM('CALLBACK_INVALID_SIGNATURE','CALLBACK_MALFORMED','CALLBACK_OVERSIZED') NOT NULL,
        merchant_code_prefix VARCHAR(64) NULL DEFAULT NULL,
        merchant_order_id_prefix VARCHAR(128) NULL DEFAULT NULL,
        provider_reference_prefix VARCHAR(192) NULL DEFAULT NULL,
        amount_prefix VARCHAR(64) NULL DEFAULT NULL,
        result_code_prefix VARCHAR(40) NULL DEFAULT NULL,
        signature_state ENUM('INVALID','NOT_CHECKED') NOT NULL DEFAULT 'NOT_CHECKED',
        raw_body_digest CHAR(64) NULL DEFAULT NULL,
        field_values_digest CHAR(64) NULL DEFAULT NULL,
        source_ip_hash CHAR(64) NULL DEFAULT NULL,
        user_agent_hash CHAR(64) NULL DEFAULT NULL,
        received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_opse_type_received (event_type, received_at),
        KEY idx_opse_order_prefix (merchant_order_id_prefix),
        KEY idx_opse_signature (signature_state),
        KEY idx_opse_raw_digest (raw_body_digest),
        KEY idx_opse_ip_time (source_ip_hash, received_at),
        KEY idx_opse_received (received_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryInterface.sequelize.query(
      `ALTER TABLE ${quoteIdentifier(paymentsTable)} MODIFY payment_channel ${PAYMENT_CHANNEL_ENUM} NOT NULL DEFAULT 'QRIS'`
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE ${quoteIdentifier(paymentsTable)} MODIFY payment_type ${PAYMENT_TYPE_ENUM} NOT NULL DEFAULT 'QRIS_STATIC'`
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE ${quoteIdentifier(paymentsTable)} MODIFY qr_image_url LONGTEXT NULL DEFAULT NULL`
    );

    if (!(await columnExists(queryInterface, paymentsTable, 'allocation_key'))) {
      await queryInterface.addColumn(paymentsTable, 'allocation_key', {
        type: Sequelize.STRING(160),
        allowNull: true,
        defaultValue: null,
      });
    }
    await addIndexIfMissing(queryInterface, paymentsTable, ['allocation_key'], {
      name: 'uniq_payments_allocation_key',
      unique: true,
    });

    if (!(await columnExists(queryInterface, paymentsTable, 'paid_by_order_payment_attempt_id'))) {
      await queryInterface.addColumn(paymentsTable, 'paid_by_order_payment_attempt_id', {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null,
      });
    }
    await addIndexIfMissing(queryInterface, paymentsTable, ['paid_by_order_payment_attempt_id'], {
      name: 'idx_payments_paid_by_attempt',
    });
    await addConstraintIfMissing(queryInterface, paymentsTable, ['paid_by_order_payment_attempt_id'], {
      name: 'fk_payments_paid_by_attempt',
      references: {
        table: 'order_payment_attempts',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });

    await queryInterface.sequelize.query(
      `ALTER TABLE ${quoteIdentifier(subordersTable)} MODIFY payment_method ${SUBORDER_PAYMENT_METHOD_ENUM} NOT NULL DEFAULT 'QRIS'`
    );
  },

  async down(queryInterface, Sequelize) {
    const paymentsTable = await resolvePhysicalTable(queryInterface, 'payments');
    const subordersTable = await resolvePhysicalTable(queryInterface, 'suborders');

    await assertSafeDown(queryInterface, paymentsTable, subordersTable);

    await removeConstraintIfExists(queryInterface, paymentsTable, 'fk_payments_paid_by_attempt');
    if (await indexExists(queryInterface, paymentsTable, 'idx_payments_paid_by_attempt')) {
      await queryInterface.removeIndex(paymentsTable, 'idx_payments_paid_by_attempt');
    }
    if (await columnExists(queryInterface, paymentsTable, 'paid_by_order_payment_attempt_id')) {
      await queryInterface.removeColumn(paymentsTable, 'paid_by_order_payment_attempt_id');
    }
    if (await indexExists(queryInterface, paymentsTable, 'uniq_payments_allocation_key')) {
      await queryInterface.removeIndex(paymentsTable, 'uniq_payments_allocation_key');
    }
    if (await columnExists(queryInterface, paymentsTable, 'allocation_key')) {
      await queryInterface.removeColumn(paymentsTable, 'allocation_key');
    }

    await queryInterface.sequelize.query(
      `ALTER TABLE ${quoteIdentifier(paymentsTable)} MODIFY qr_image_url LONGTEXT NOT NULL`
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE ${quoteIdentifier(paymentsTable)} MODIFY payment_type ${PAYMENT_TYPE_QRIS_ONLY} NOT NULL DEFAULT 'QRIS_STATIC'`
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE ${quoteIdentifier(paymentsTable)} MODIFY payment_channel ${PAYMENT_CHANNEL_QRIS_ONLY} NOT NULL DEFAULT 'QRIS'`
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE ${quoteIdentifier(subordersTable)} MODIFY payment_method ${SUBORDER_PAYMENT_METHOD_QRIS_ONLY} NOT NULL DEFAULT 'QRIS'`
    );

    if (await tableExists(queryInterface, 'order_payment_attempt_events')) {
      await queryInterface.dropTable('order_payment_attempt_events');
    }
    if (await tableExists(queryInterface, 'duitku_callback_inbox')) {
      await queryInterface.dropTable('duitku_callback_inbox');
    }
    if (await tableExists(queryInterface, 'order_payment_security_events')) {
      await queryInterface.dropTable('order_payment_security_events');
    }
    if (await tableExists(queryInterface, 'order_collection_claims')) {
      await removeConstraintIfExists(queryInterface, 'order_collection_claims', 'fk_occ_attempt');
      await queryInterface.dropTable('order_collection_claims');
    }
    if (await tableExists(queryInterface, 'order_payment_attempts')) {
      await queryInterface.dropTable('order_payment_attempts');
    }
  },
};
