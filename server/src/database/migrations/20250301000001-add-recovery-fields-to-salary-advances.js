'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('salary_advance_applications', 'recovered', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.addColumn('salary_advance_applications', 'recoveredInPayrollId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'payrolls', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addIndex('salary_advance_applications', ['status', 'recovered']);
  },
  down: async (queryInterface) => {
    await queryInterface.removeIndex('salary_advance_applications', ['status', 'recovered']);
    await queryInterface.removeColumn('salary_advance_applications', 'recoveredInPayrollId');
    await queryInterface.removeColumn('salary_advance_applications', 'recovered');
  },
};
