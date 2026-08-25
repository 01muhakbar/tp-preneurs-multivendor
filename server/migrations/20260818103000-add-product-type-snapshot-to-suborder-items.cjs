'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableName = 'suborder_items';
    const table = await queryInterface.describeTable(tableName);

    if (!table['product_type_snapshot']) {
      await queryInterface.addColumn(tableName, 'product_type_snapshot', {
        type: Sequelize.STRING(30),
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const tableName = 'suborder_items';
    const table = await queryInterface.describeTable(tableName);

    if (table['product_type_snapshot']) {
      await queryInterface.removeColumn(tableName, 'product_type_snapshot');
    }
  },
};
