'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('employees', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      employeeNumber: { type: Sequelize.STRING(20), allowNull: false, unique: true },
      firstName: { type: Sequelize.STRING(100), allowNull: false },
      lastName: { type: Sequelize.STRING(100), allowNull: false },
      email: { type: Sequelize.STRING(150), allowNull: false, unique: true },
      phone: { type: Sequelize.STRING(20) },
      nationalId: { type: Sequelize.STRING(30), allowNull: false, unique: true },
      napsaNumber: { type: Sequelize.STRING(30) },
      nhimaNumber: { type: Sequelize.STRING(30) },
      tpin: { type: Sequelize.STRING(30) },
      departmentId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'departments', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      jobTitle: { type: Sequelize.STRING(100), allowNull: false },
      dateOfHire: { type: Sequelize.DATEONLY, allowNull: false },
      dateOfBirth: { type: Sequelize.DATEONLY },
      basicSalary: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      bankName: { type: Sequelize.STRING(100) },
      bankAccountNumber: { type: Sequelize.STRING(50) },
      status: {
        type: Sequelize.ENUM('active', 'suspended', 'terminated'),
        defaultValue: 'active',
      },
      terminationDate: { type: Sequelize.DATEONLY },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('employees', ['departmentId']);
    await queryInterface.addIndex('employees', ['status']);
    await queryInterface.addIndex('employees', ['lastName', 'firstName']);
  },
  down: async (queryInterface) => queryInterface.dropTable('employees'),
};
