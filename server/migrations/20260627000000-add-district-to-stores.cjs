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
    if (!(await columnExists(queryInterface, "stores", "district"))) {
      await queryInterface.addColumn("stores", "district", {
        type: Sequelize.STRING(120),
        allowNull: true,
        after: "city",
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("stores", "district");
  },
};
