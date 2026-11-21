'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableName = 'suborders';
    const table = await queryInterface.describeTable(tableName);

    if (!table['return_status']) {
      await queryInterface.addColumn(tableName, 'return_status', {
        type: Sequelize.STRING(40),
        allowNull: false,
        defaultValue: 'NONE',
      });
    }

    if (!table['return_reason']) {
      await queryInterface.addColumn(tableName, 'return_reason', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }

    if (!table['return_notes']) {
      await queryInterface.addColumn(tableName, 'return_notes', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    if (!table['return_solution_type']) {
      await queryInterface.addColumn(tableName, 'return_solution_type', {
        type: Sequelize.STRING(40),
        allowNull: true,
        defaultValue: 'REFUND_ONLY',
      });
    }

    if (!table['return_bank_details']) {
      await queryInterface.addColumn(tableName, 'return_bank_details', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }

    if (!table['return_requested_at']) {
      await queryInterface.addColumn(tableName, 'return_requested_at', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    if (!table['return_seller_notes']) {
      await queryInterface.addColumn(tableName, 'return_seller_notes', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    if (!table['return_seller_responded_at']) {
      await queryInterface.addColumn(tableName, 'return_seller_responded_at', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    if (!table['return_admin_notes']) {
      await queryInterface.addColumn(tableName, 'return_admin_notes', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    if (!table['return_admin_decided_at']) {
      await queryInterface.addColumn(tableName, 'return_admin_decided_at', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const tableName = 'suborders';
    const table = await queryInterface.describeTable(tableName);

    const cols = [
      'return_admin_decided_at',
      'return_admin_notes',
      'return_seller_responded_at',
      'return_seller_notes',
      'return_requested_at',
      'return_bank_details',
      'return_solution_type',
      'return_notes',
      'return_reason',
      'return_status',
    ];

    for (const col of cols) {
      if (table[col]) {
        await queryInterface.removeColumn(tableName, col);
      }
    }
  },
};
