"use strict";

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

async function addPayoutColumns(queryInterface, Sequelize, tableName) {
  if (!(await tableExists(queryInterface, tableName))) return;

  if (!(await columnExists(queryInterface, tableName, "bank_name"))) {
    await queryInterface.addColumn(tableName, "bank_name", {
      type: Sequelize.STRING(160),
      allowNull: true,
      after: "merchant_id",
    });
  }

  if (!(await columnExists(queryInterface, tableName, "account_number"))) {
    await queryInterface.addColumn(tableName, "account_number", {
      type: Sequelize.STRING(120),
      allowNull: true,
      after: "bank_name",
    });
  }

  if (!(await columnExists(queryInterface, tableName, "account_holder_name"))) {
    await queryInterface.addColumn(tableName, "account_holder_name", {
      type: Sequelize.STRING(160),
      allowNull: true,
      after: "account_number",
    });
  }

  if (!(await columnExists(queryInterface, tableName, "payout_proof_image_url"))) {
    await queryInterface.addColumn(tableName, "payout_proof_image_url", {
      type: Sequelize.TEXT("long"),
      allowNull: true,
      after: "account_holder_name",
    });
  }

  await queryInterface.sequelize.query(`
    UPDATE ${tableName}
    SET
      account_holder_name = CASE
        WHEN account_holder_name IS NULL OR account_holder_name = '' THEN account_name
        ELSE account_holder_name
      END,
      account_number = CASE
        WHEN account_number IS NULL OR account_number = '' THEN merchant_id
        ELSE account_number
      END
    WHERE (account_holder_name IS NULL OR account_holder_name = '')
       OR (account_number IS NULL OR account_number = '')
  `);
}

async function removePayoutColumns(queryInterface, tableName) {
  if (!(await tableExists(queryInterface, tableName))) return;

  for (const columnName of [
    "payout_proof_image_url",
    "account_holder_name",
    "account_number",
    "bank_name",
  ]) {
    if (await columnExists(queryInterface, tableName, columnName)) {
      await queryInterface.removeColumn(tableName, columnName);
    }
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await addPayoutColumns(queryInterface, Sequelize, "store_payment_profiles");
    await addPayoutColumns(queryInterface, Sequelize, "store_payment_profile_requests");
  },

  async down(queryInterface) {
    await removePayoutColumns(queryInterface, "store_payment_profile_requests");
    await removePayoutColumns(queryInterface, "store_payment_profiles");
  },
};
