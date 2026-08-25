'use strict';

const PAYMENT_ENUM_WITH_CANCELLED =
  "ENUM('CREATED','PENDING_CONFIRMATION','PAID','FAILED','CANCELLED','EXPIRED','REJECTED')";
const PAYMENT_ENUM_WITHOUT_CANCELLED =
  "ENUM('CREATED','PENDING_CONFIRMATION','PAID','FAILED','EXPIRED','REJECTED')";

async function tableExists(queryInterface, tableName) {
  try {
    await queryInterface.describeTable(tableName);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const paymentsExists = await tableExists(queryInterface, 'payments');
    if (!paymentsExists) return;

    await queryInterface.sequelize.query(
      `ALTER TABLE payments MODIFY COLUMN status ${PAYMENT_ENUM_WITH_CANCELLED} NOT NULL DEFAULT 'CREATED'`
    );

    const hasLogs = await tableExists(queryInterface, 'payment_status_logs');
    const hasSuborders = await tableExists(queryInterface, 'suborders');
    const hasSuborderItems = await tableExists(queryInterface, 'suborder_items');
    const hasProducts = await tableExists(queryInterface, 'products');

    if (!hasLogs || !hasSuborders) return;

    await queryInterface.sequelize.query('DROP TEMPORARY TABLE IF EXISTS tmp_cancelled_payment_backfill');
    await queryInterface.sequelize.query(`
      CREATE TEMPORARY TABLE tmp_cancelled_payment_backfill AS
      SELECT DISTINCT p.id AS payment_id, p.suborder_id, s.order_id
      FROM payments p
      INNER JOIN payment_status_logs psl ON psl.payment_id = p.id
      INNER JOIN suborders s ON s.id = p.suborder_id
      WHERE p.status = 'FAILED'
        AND psl.new_status = 'FAILED'
        AND (
          psl.note LIKE '%source=payments:cancel%'
          OR psl.note LIKE '%Buyer cancelled this payment%'
        )
    `);

    if (hasSuborderItems && hasProducts) {
      await queryInterface.sequelize.query(`
        UPDATE products p
        INNER JOIN (
          SELECT si.product_id, SUM(si.qty) AS restore_qty
          FROM suborder_items si
          INNER JOIN tmp_cancelled_payment_backfill tmp ON tmp.suborder_id = si.suborder_id
          GROUP BY si.product_id
        ) restored ON restored.product_id = p.id
        SET p.stock = p.stock + restored.restore_qty
      `);
    }

    await queryInterface.sequelize.query(`
      UPDATE payments p
      INNER JOIN tmp_cancelled_payment_backfill tmp ON tmp.payment_id = p.id
      SET p.status = 'CANCELLED', p.paid_at = NULL
    `);

    await queryInterface.sequelize.query(`
      UPDATE suborders s
      INNER JOIN tmp_cancelled_payment_backfill tmp ON tmp.suborder_id = s.id
      SET s.payment_status = 'CANCELLED',
          s.fulfillment_status = 'CANCELLED',
          s.paid_at = NULL
    `);

    await queryInterface.sequelize.query(`
      UPDATE orders o
      SET o.status = 'cancelled'
      WHERE EXISTS (
        SELECT 1
        FROM tmp_cancelled_payment_backfill tmp
        WHERE tmp.order_id = o.id
      )
      AND NOT EXISTS (
        SELECT 1
        FROM suborders active_s
        WHERE active_s.order_id = o.id
          AND active_s.fulfillment_status <> 'CANCELLED'
      )
    `);

    await queryInterface.sequelize.query('DROP TEMPORARY TABLE IF EXISTS tmp_cancelled_payment_backfill');
  },

  async down(queryInterface, Sequelize) {
    const paymentsExists = await tableExists(queryInterface, 'payments');
    if (!paymentsExists) return;

    await queryInterface.sequelize.query(`
      UPDATE payments
      SET status = 'FAILED'
      WHERE status = 'CANCELLED'
    `);

    await queryInterface.sequelize.query(
      `ALTER TABLE payments MODIFY COLUMN status ${PAYMENT_ENUM_WITHOUT_CANCELLED} NOT NULL DEFAULT 'CREATED'`
    );
  },
};
