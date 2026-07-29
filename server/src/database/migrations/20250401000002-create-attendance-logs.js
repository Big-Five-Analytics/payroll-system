'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('attendance_logs', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      employeeId: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'employees', key: 'id' }, onDelete: 'CASCADE',
      },
      logDate: { type: Sequelize.DATEONLY, allowNull: false },
      clockInAt: { type: Sequelize.DATE },
      clockInIp: { type: Sequelize.STRING(50) },
      lateMinutes: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      clockOutAt: { type: Sequelize.DATE },
      clockOutIp: { type: Sequelize.STRING(50) },
      overtimeMinutes: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('attendance_logs', ['employeeId', 'logDate'], { unique: true });
    await queryInterface.addIndex('attendance_logs', ['logDate']);
  },
  down: async (queryInterface) => queryInterface.dropTable('attendance_logs'),
};
