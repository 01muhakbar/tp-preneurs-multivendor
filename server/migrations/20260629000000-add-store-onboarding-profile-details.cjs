"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable("stores");
    if (!columns.owner_identity) {
      await queryInterface.addColumn("stores", "owner_identity", {
        type: Sequelize.JSON,
        allowNull: true,
        after: "shipping_setup",
      });
    }
    if (!columns.business_details) {
      await queryInterface.addColumn("stores", "business_details", {
        type: Sequelize.JSON,
        allowNull: true,
        after: "owner_identity",
      });
    }
  },

  async down(queryInterface) {
    const columns = await queryInterface.describeTable("stores");
    if (columns.business_details) {
      await queryInterface.removeColumn("stores", "business_details");
    }
    if (columns.owner_identity) {
      await queryInterface.removeColumn("stores", "owner_identity");
    }
  },
};
