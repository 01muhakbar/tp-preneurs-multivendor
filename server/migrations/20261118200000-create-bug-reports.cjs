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
    const tableName = "bug_reports";
    if (!(await tableExists(queryInterface, tableName))) {
      await queryInterface.createTable(tableName, {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        ticket_number: {
          type: Sequelize.STRING(64),
          allowNull: false,
          unique: true,
        },
        page_url: {
          type: Sequelize.STRING(2048),
          allowNull: false,
        },
        error_name: {
          type: Sequelize.STRING(255),
          allowNull: false,
          defaultValue: "ApplicationError",
        },
        error_message: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        error_stack: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        user_agent: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        reporter_email: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        reporter_user_id: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: true,
          references: {
            model: "users",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
        },
        user_note: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        status: {
          type: Sequelize.ENUM("NEW", "INVESTIGATING", "FIXED", "CLOSED"),
          allowNull: false,
          defaultValue: "NEW",
        },
        priority: {
          type: Sequelize.ENUM("LOW", "MEDIUM", "HIGH", "CRITICAL"),
          allowNull: false,
          defaultValue: "MEDIUM",
        },
        resolution_note: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        resolved_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        resolved_by: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: true,
          references: {
            model: "users",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
      });
    }

    await addIndexIfMissing(queryInterface, tableName, ["status"], {
      name: "idx_bug_reports_status",
    });
    await addIndexIfMissing(queryInterface, tableName, ["reporter_email"], {
      name: "idx_bug_reports_reporter_email",
    });
    await addIndexIfMissing(queryInterface, tableName, ["created_at"], {
      name: "idx_bug_reports_created_at",
    });
  },

  async down(queryInterface) {
    const tableName = "bug_reports";
    if (await tableExists(queryInterface, tableName)) {
      await queryInterface.dropTable(tableName);
    }
  },
};
