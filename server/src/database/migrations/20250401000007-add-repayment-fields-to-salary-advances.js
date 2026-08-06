'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('salary_advance_applications', 'repaymentPlan', {
      type: Sequelize.ENUM('full', 'two_months', 'three_months'),
      allowNull: true,
    });
    await queryInterface.addColumn('salary_advance_applications', 'dateRequested', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('salary_advance_applications', 'repaymentPlan');
    await queryInterface.removeColumn('salary_advance_applications', 'dateRequested');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_salary_advance_applications_repaymentPlan";');
  },
};
