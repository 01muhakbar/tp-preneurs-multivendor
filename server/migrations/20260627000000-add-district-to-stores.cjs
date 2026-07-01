"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("stores", "district", {
      type: Sequelize.STRING(120),
      allowNull: true,
      after: "city",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("stores", "district");
  },
};
