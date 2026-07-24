'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('salary_advance_applications', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      employeeId: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'employees', key: 'id' }, onDelete: 'CASCADE',
      },
      amountRequested: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      reason: { type: Sequelize.TEXT, allowNull: false },
      status: { type: Sequelize.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
      reviewedBy: {
        type: Sequelize.UUID, allowNull: true,
        references: { model: 'users', key: 'id' }, onDelete: 'SET NULL',
      },
      reviewedAt: { type: Sequelize.DATE },
      reviewComment: { type: Sequelize.STRING(500) },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('salary_advance_applications', ['employeeId']);
    await queryInterface.addIndex('salary_advance_applications', ['status']);
  },
  down: async (queryInterface) => queryInterface.dropTable('salary_advance_applications'),
};
