"use strict";

async function tableExists(queryInterface, tableName) {
  try {
    await queryInterface.describeTable(tableName);
    return true;
  } catch {
    return false;
  }
}

async function indexExists(queryInterface, tableName, indexName) {
  try {
    const indexes = await queryInterface.showIndex(tableName);
    return indexes.some((index) => String(index.name || "") === indexName);
  } catch {
    return false;
  }
}

async function addIndexIfMissing(queryInterface, tableName, fields, options) {
  if (await indexExists(queryInterface, tableName, options.name)) return;
  await queryInterface.addIndex(tableName, fields, options);
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const showcasesTable = "store_showcases";
    if (!(await tableExists(queryInterface, showcasesTable))) {
      await queryInterface.createTable(showcasesTable, {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        store_id: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
          references: {
            model: "stores",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        name: {
          type: Sequelize.STRING(120),
          allowNull: false,
        },
        slug: {
          type: Sequelize.STRING(140),
          allowNull: false,
        },
        description: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        icon: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        sort_order: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn("NOW"),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn("NOW"),
        },
      });
    }

    await addIndexIfMissing(
      queryInterface,
      showcasesTable,
      ["store_id", "slug"],
      {
        name: "unq_store_showcases_store_slug",
        unique: true,
      }
    );

    await addIndexIfMissing(
      queryInterface,
      showcasesTable,
      ["store_id", "is_active", "sort_order"],
      {
        name: "idx_store_showcases_lookup",
      }
    );

    const showcaseProductsTable = "store_showcase_products";
    if (!(await tableExists(queryInterface, showcaseProductsTable))) {
      await queryInterface.createTable(showcaseProductsTable, {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        showcase_id: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
          references: {
            model: "store_showcases",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        product_id: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
          references: {
            model: "products",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        sort_order: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn("NOW"),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn("NOW"),
        },
      });
    }

    await addIndexIfMissing(
      queryInterface,
      showcaseProductsTable,
      ["showcase_id", "product_id"],
      {
        name: "unq_showcase_product",
        unique: true,
      }
    );

    await addIndexIfMissing(
      queryInterface,
      showcaseProductsTable,
      ["product_id"],
      {
        name: "idx_showcase_products_product",
      }
    );
  },

  async down(queryInterface) {
    if (await tableExists(queryInterface, "store_showcase_products")) {
      await queryInterface.dropTable("store_showcase_products");
    }
    if (await tableExists(queryInterface, "store_showcases")) {
      await queryInterface.dropTable("store_showcases");
    }
  },
};
