'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('terminated_employees', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      employeeId: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'employees', key: 'id' }, onDelete: 'CASCADE',
      },
      employeeNumber: { type: Sequelize.STRING(20), allowNull: false },
      firstName: { type: Sequelize.STRING(100), allowNull: false },
      lastName: { type: Sequelize.STRING(100), allowNull: false },
      email: { type: Sequelize.STRING(150), allowNull: false },
      nationalId: { type: Sequelize.STRING(30), allowNull: false },
      departmentName: { type: Sequelize.STRING(100) },
      jobTitle: { type: Sequelize.STRING(100), allowNull: false },
      dateOfHire: { type: Sequelize.DATEONLY, allowNull: false },
      terminationDate: { type: Sequelize.DATEONLY, allowNull: false },
      lastBasicSalary: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      reason: { type: Sequelize.STRING(500) },
      terminatedBy: {
        type: Sequelize.UUID, allowNull: true,
        references: { model: 'users', key: 'id' }, onDelete: 'SET NULL',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('terminated_employees', ['employeeId']);
    await queryInterface.addIndex('terminated_employees', ['terminationDate']);
  },
  down: async (queryInterface) => queryInterface.dropTable('terminated_employees'),
};
