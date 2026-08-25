'use strict';

async function resolveUsersTable(queryInterface) {
  for (const candidate of ['users', 'Users']) {
    try {
      await queryInterface.describeTable(candidate);
      return candidate;
    } catch {
      // try next candidate
    }
  }
  return 'users';
}

async function indexExists(queryInterface, tableName, indexName) {
  try {
    const indexes = await queryInterface.showIndex(tableName);
    return indexes.some((idx) => idx.name === indexName);
  } catch {
    return false;
  }
}

module.exports = {
  async up(queryInterface) {
    const tableName = await resolveUsersTable(queryInterface);
    const IDX = 'users_phone_number_unique';
    if (!(await indexExists(queryInterface, tableName, IDX))) {
      await queryInterface.addIndex(tableName, ['phone_number'], {
        name: IDX,
        unique: true,
      });
    }
  },

  async down(queryInterface) {
    const tableName = await resolveUsersTable(queryInterface);
    await queryInterface.removeIndex(tableName, 'users_phone_number_unique');
  },
};
