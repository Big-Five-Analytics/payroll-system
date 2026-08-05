'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('notifications', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      type: { type: Sequelize.STRING(50), allowNull: false },
      title: { type: Sequelize.STRING(150), allowNull: false },
      message: { type: Sequelize.STRING(500), allowNull: false },
      link: { type: Sequelize.STRING(255), allowNull: true },
      entityType: { type: Sequelize.STRING(50), allowNull: true },
      entityId: { type: Sequelize.UUID, allowNull: true },
      isRead: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      readAt: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('notifications', ['userId']);
    await queryInterface.addIndex('notifications', ['userId', 'isRead']);
    await queryInterface.addIndex('notifications', ['createdAt']);
  },
  down: async (queryInterface) => queryInterface.dropTable('notifications'),
};
