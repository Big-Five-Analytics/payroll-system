'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('employee_allowances', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      employeeId: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'employees', key: 'id' }, onDelete: 'CASCADE',
      },
      allowanceId: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'allowances', key: 'id' }, onDelete: 'CASCADE',
      },
      amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('employee_allowances', ['employeeId', 'allowanceId'], { unique: true });
  },
  down: async (queryInterface) => queryInterface.dropTable('employee_allowances'),
};
