'use strict';

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

module.exports = {
  async up(queryInterface, Sequelize) {
    if (!(await columnExists(queryInterface, 'duitku_callback_inbox', 'payment_code_raw'))) {
      await queryInterface.addColumn('duitku_callback_inbox', 'payment_code_raw', {
        type: Sequelize.STRING(40),
        allowNull: true,
        after: 'provider_reference_raw',
      });
    }

    if (!(await indexExists(queryInterface, 'duitku_callback_inbox', 'idx_dci_payment_code'))) {
      await queryInterface.addIndex('duitku_callback_inbox', ['payment_code_raw'], {
        name: 'idx_dci_payment_code',
      });
    }
  },

  async down(queryInterface) {
    if (await indexExists(queryInterface, 'duitku_callback_inbox', 'idx_dci_payment_code')) {
      await queryInterface.removeIndex('duitku_callback_inbox', 'idx_dci_payment_code');
    }

    if (await columnExists(queryInterface, 'duitku_callback_inbox', 'payment_code_raw')) {
      await queryInterface.removeColumn('duitku_callback_inbox', 'payment_code_raw');
    }
  },
};
