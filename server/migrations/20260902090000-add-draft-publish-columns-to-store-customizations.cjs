"use strict";

async function tableExists(queryInterface, tableName) {
  try {
    await queryInterface.describeTable(tableName);
    return true;
  } catch {
    return false;
  }
}

async function columnExists(queryInterface, tableName, columnName) {
  try {
    const definition = await queryInterface.describeTable(tableName);
    return Boolean(definition?.[columnName]);
  } catch {
    return false;
  }
}

async function addColumnIfMissing(queryInterface, Sequelize, tableName, columnName, definition) {
  if (await columnExists(queryInterface, tableName, columnName)) return;
  await queryInterface.addColumn(tableName, columnName, definition);
}

async function removeColumnIfExists(queryInterface, tableName, columnName) {
  if (!(await columnExists(queryInterface, tableName, columnName))) return;
  await queryInterface.removeColumn(tableName, columnName);
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableName = "store_customizations";
    if (!(await tableExists(queryInterface, tableName))) return;

    await addColumnIfMissing(queryInterface, Sequelize, tableName, "draftData", {
      type: Sequelize.TEXT("long"),
      allowNull: true,
      after: "data",
    });

    await addColumnIfMissing(queryInterface, Sequelize, tableName, "publishedData", {
      type: Sequelize.TEXT("long"),
      allowNull: true,
      after: "draftData",
    });

    await addColumnIfMissing(queryInterface, Sequelize, tableName, "hasUnpublishedChanges", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      after: "publishedData",
    });

    await addColumnIfMissing(queryInterface, Sequelize, tableName, "draftUpdatedAt", {
      type: Sequelize.DATE,
      allowNull: true,
      after: "hasUnpublishedChanges",
    });

    await addColumnIfMissing(queryInterface, Sequelize, tableName, "publishedAt", {
      type: Sequelize.DATE,
      allowNull: true,
      after: "draftUpdatedAt",
    });

    await addColumnIfMissing(queryInterface, Sequelize, tableName, "draftUpdatedBy", {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      after: "publishedAt",
    });

    await addColumnIfMissing(queryInterface, Sequelize, tableName, "publishedBy", {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      after: "draftUpdatedBy",
    });

    await queryInterface.sequelize.query(`
      UPDATE store_customizations
      SET
        draftData = CASE
          WHEN draftData IS NULL THEN data
          ELSE draftData
        END,
        publishedData = CASE
          WHEN publishedData IS NULL THEN data
          ELSE publishedData
        END,
        draftUpdatedAt = CASE
          WHEN draftUpdatedAt IS NULL THEN updatedAt
          ELSE draftUpdatedAt
        END,
        publishedAt = CASE
          WHEN publishedAt IS NULL AND data IS NOT NULL THEN updatedAt
          ELSE publishedAt
        END
      WHERE draftData IS NULL
         OR publishedData IS NULL
         OR draftUpdatedAt IS NULL
         OR (publishedAt IS NULL AND data IS NOT NULL)
    `);
  },

  async down(queryInterface) {
    const tableName = "store_customizations";
    if (!(await tableExists(queryInterface, tableName))) return;

    for (const columnName of [
      "publishedBy",
      "draftUpdatedBy",
      "publishedAt",
      "draftUpdatedAt",
      "hasUnpublishedChanges",
      "publishedData",
      "draftData",
    ]) {
      await removeColumnIfExists(queryInterface, tableName, columnName);
    }
  },
};
