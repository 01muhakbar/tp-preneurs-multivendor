"use strict";

const TABLE = "product_reviews";

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable(TABLE);
    const add = async (name, definition) => {
      if (!columns[name]) await queryInterface.addColumn(TABLE, name, definition);
    };

    await add("status", {
      type: Sequelize.STRING(24),
      allowNull: false,
      defaultValue: "published",
    });
    await add("moderation_reason", { type: Sequelize.TEXT, allowNull: true });
    await add("seller_reply", { type: Sequelize.STRING(500), allowNull: true });
    await add("replied_at", { type: Sequelize.DATE, allowNull: true });
    await add("replied_by_user_id", {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "users", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
    await add("reported_at", { type: Sequelize.DATE, allowNull: true });
    await add("report_reason", { type: Sequelize.TEXT, allowNull: true });
    await add("reported_by_user_id", {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "users", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
    await add("helpful_count", {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    });
    await add("not_helpful_count", {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    });

    const indexes = await queryInterface.showIndex(TABLE);
    if (!indexes.some((index) => index.name === "idx_product_reviews_status")) {
      await queryInterface.addIndex(TABLE, ["status"], {
        name: "idx_product_reviews_status",
      });
    }
  },

  async down(queryInterface) {
    const indexes = await queryInterface.showIndex(TABLE);
    if (indexes.some((index) => index.name === "idx_product_reviews_status")) {
      await queryInterface.removeIndex(TABLE, "idx_product_reviews_status");
    }

    const names = [
      "not_helpful_count",
      "helpful_count",
      "reported_by_user_id",
      "report_reason",
      "reported_at",
      "replied_by_user_id",
      "replied_at",
      "seller_reply",
      "moderation_reason",
      "status",
    ];
    const columns = await queryInterface.describeTable(TABLE);
    for (const name of names) {
      if (columns[name]) await queryInterface.removeColumn(TABLE, name);
    }
  },
};
