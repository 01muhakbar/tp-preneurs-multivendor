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
    return indexes.some((idx) => idx.name === indexName);
  } catch {
    return false;
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const usersTable = await resolveUsersTable(queryInterface);
    const TABLE = 'user_registration_verifications';

    if (!(await tableExists(queryInterface, TABLE))) {
      await queryInterface.createTable(TABLE, {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        user_id: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: usersTable, key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        public_id: { type: Sequelize.STRING(64), allowNull: false, unique: true },
        channel: { type: Sequelize.STRING(16), allowNull: false, defaultValue: 'EMAIL' },
        status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'PENDING' },
        otp_hash: { type: Sequelize.STRING(128), allowNull: false },
        otp_expires_at: { type: Sequelize.DATE, allowNull: false },
        resend_available_at: { type: Sequelize.DATE, allowNull: false },
        last_sent_at: { type: Sequelize.DATE, allowNull: true },
        attempts: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
        max_attempts: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 5 },
        resend_count: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
        max_resends: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 5 },
        verified_at: { type: Sequelize.DATE, allowNull: true },
        consumed_at: { type: Sequelize.DATE, allowNull: true },
        last_attempt_at: { type: Sequelize.DATE, allowNull: true },
        blocked_at: { type: Sequelize.DATE, allowNull: true },
        last_delivery_error: { type: Sequelize.TEXT, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      });
    }

    const IDX_USER   = 'user_registration_verifications_user_id_idx';
    const IDX_STATUS = 'user_registration_verifications_status_idx';

    if (!(await indexExists(queryInterface, TABLE, IDX_USER))) {
      await queryInterface.addIndex(TABLE, ['user_id'], { name: IDX_USER });
    }
    if (!(await indexExists(queryInterface, TABLE, IDX_STATUS))) {
      await queryInterface.addIndex(TABLE, ['status'], { name: IDX_STATUS });
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('user_registration_verifications');
  },
};
