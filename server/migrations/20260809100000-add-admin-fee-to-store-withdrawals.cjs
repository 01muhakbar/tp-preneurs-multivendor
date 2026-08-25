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

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableName = "store_withdrawals";
    if (!(await tableExists(queryInterface, tableName))) return;

    if (!(await columnExists(queryInterface, tableName, "adminFeeAmount"))) {
      await queryInterface.addColumn(tableName, "adminFeeAmount", {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 6500,
        after: "amount",
      });
    }

    if (!(await columnExists(queryInterface, tableName, "netTransferAmount"))) {
      await queryInterface.addColumn(tableName, "netTransferAmount", {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
        after: "adminFeeAmount",
      });
    }

    await queryInterface.sequelize.query(`
      UPDATE ${tableName}
      SET
        adminFeeAmount = CASE
          WHEN adminFeeAmount IS NULL OR adminFeeAmount = 0 THEN 6500
          ELSE adminFeeAmount
        END,
        netTransferAmount = GREATEST(0, amount - CASE
          WHEN adminFeeAmount IS NULL OR adminFeeAmount = 0 THEN 6500
          ELSE adminFeeAmount
        END)
      WHERE netTransferAmount IS NULL
         OR netTransferAmount = 0
    `);
  },

  async down(queryInterface) {
    const tableName = "store_withdrawals";
    if (!(await tableExists(queryInterface, tableName))) return;

    if (await columnExists(queryInterface, tableName, "netTransferAmount")) {
      await queryInterface.removeColumn(tableName, "netTransferAmount");
    }
    if (await columnExists(queryInterface, tableName, "adminFeeAmount")) {
      await queryInterface.removeColumn(tableName, "adminFeeAmount");
    }
  },
};
