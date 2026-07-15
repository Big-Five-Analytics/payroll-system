'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('audit_logs', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      userId: {
        type: Sequelize.UUID, allowNull: true,
        references: { model: 'users', key: 'id' }, onDelete: 'SET NULL',
      },
      action: { type: Sequelize.STRING(50), allowNull: false },
      entityType: { type: Sequelize.STRING(50) },
      entityId: { type: Sequelize.UUID },
      details: { type: Sequelize.JSONB },
      ipAddress: { type: Sequelize.STRING(50) },
      createdAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('audit_logs', ['userId']);
    await queryInterface.addIndex('audit_logs', ['action']);
    await queryInterface.addIndex('audit_logs', ['entityType', 'entityId']);
    await queryInterface.addIndex('audit_logs', ['createdAt']);
  },
  down: async (queryInterface) => queryInterface.dropTable('audit_logs'),
};
