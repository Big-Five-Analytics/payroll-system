'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('payslips', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      payrollId: {
        type: Sequelize.UUID, allowNull: false, unique: true,
        references: { model: 'payrolls', key: 'id' }, onDelete: 'CASCADE',
      },
      employeeId: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'employees', key: 'id' }, onDelete: 'RESTRICT',
      },
      payslipNumber: { type: Sequelize.STRING(30), allowNull: false, unique: true },
      issuedAt: { type: Sequelize.DATE, allowNull: false },
      pdfPath: { type: Sequelize.STRING(255) },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },
  down: async (queryInterface) => queryInterface.dropTable('payslips'),
};
