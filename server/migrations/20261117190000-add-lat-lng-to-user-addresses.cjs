"use strict";

async function columnExists(queryInterface, tableName, columnName) {
  try {
    const desc = await queryInterface.describeTable(tableName);
    return Object.prototype.hasOwnProperty.call(desc, columnName);
  } catch {
    return false;
  }
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (!(await columnExists(queryInterface, "user_addresses", "latitude"))) {
      await queryInterface.addColumn("user_addresses", "latitude", {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true,
      });
    }
    if (!(await columnExists(queryInterface, "user_addresses", "longitude"))) {
      await queryInterface.addColumn("user_addresses", "longitude", {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    if (await columnExists(queryInterface, "user_addresses", "latitude")) {
      await queryInterface.removeColumn("user_addresses", "latitude");
    }
    if (await columnExists(queryInterface, "user_addresses", "longitude")) {
      await queryInterface.removeColumn("user_addresses", "longitude");
    }
  },
};
