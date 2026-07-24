'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('leave_applications', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      employeeId: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'employees', key: 'id' }, onDelete: 'CASCADE',
      },
      leaveType: {
        type: Sequelize.ENUM('annual', 'sick', 'maternity', 'paternity', 'unpaid', 'compassionate', 'other'),
        allowNull: false,
      },
      startDate: { type: Sequelize.DATEONLY, allowNull: false },
      endDate: { type: Sequelize.DATEONLY, allowNull: false },
      numberOfDays: { type: Sequelize.INTEGER, allowNull: false },
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
    await queryInterface.addIndex('leave_applications', ['employeeId']);
    await queryInterface.addIndex('leave_applications', ['status']);
  },
  down: async (queryInterface) => queryInterface.dropTable('leave_applications'),
};
