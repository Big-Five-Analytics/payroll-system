'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_general_workers_payRateType" ADD VALUE IF NOT EXISTS 'hourly';`
    );

    await queryInterface.addColumn('general_workers', 'daysWorkedWeekday', { type: Sequelize.INTEGER, allowNull: true });
    await queryInterface.addColumn('general_workers', 'daysWorkedSaturday', { type: Sequelize.INTEGER, allowNull: true });
    await queryInterface.addColumn('general_workers', 'daysWorkedSundayPH', { type: Sequelize.INTEGER, allowNull: true });
    await queryInterface.addColumn('general_workers', 'normalHoursWeekday', { type: Sequelize.DECIMAL(6, 2), allowNull: true });
    await queryInterface.addColumn('general_workers', 'normalHoursSaturday', { type: Sequelize.DECIMAL(6, 2), allowNull: true });
    await queryInterface.addColumn('general_workers', 'totalNormalHours', { type: Sequelize.DECIMAL(6, 2), allowNull: true });
    await queryInterface.addColumn('general_workers', 'basicPay', { type: Sequelize.DECIMAL(10, 2), allowNull: true });
    await queryInterface.addColumn('general_workers', 'otHoursWeekday', { type: Sequelize.DECIMAL(6, 2), allowNull: true });
    await queryInterface.addColumn('general_workers', 'otPayWeekday', { type: Sequelize.DECIMAL(10, 2), allowNull: true });
    await queryInterface.addColumn('general_workers', 'otHoursSaturday', { type: Sequelize.DECIMAL(6, 2), allowNull: true });
    await queryInterface.addColumn('general_workers', 'otPaySaturday', { type: Sequelize.DECIMAL(10, 2), allowNull: true });
    await queryInterface.addColumn('general_workers', 'otHoursSundayPH', { type: Sequelize.DECIMAL(6, 2), allowNull: true });
    await queryInterface.addColumn('general_workers', 'otPaySundayPH', { type: Sequelize.DECIMAL(10, 2), allowNull: true });
    await queryInterface.addColumn('general_workers', 'monthlyNormalHoursTarget', { type: Sequelize.DECIMAL(6, 2), allowNull: true });
    await queryInterface.addColumn('general_workers', 'housingAllowance', { type: Sequelize.DECIMAL(10, 2), allowNull: true });
    await queryInterface.addColumn('general_workers', 'transportAllowance', { type: Sequelize.DECIMAL(10, 2), allowNull: true });
    await queryInterface.addColumn('general_workers', 'totalPay', { type: Sequelize.DECIMAL(10, 2), allowNull: true });
    await queryInterface.addColumn('general_workers', 'wageBillMonth', { type: Sequelize.INTEGER, allowNull: true });
    await queryInterface.addColumn('general_workers', 'wageBillYear', { type: Sequelize.INTEGER, allowNull: true });
  },
  down: async (queryInterface) => {
    const columns = [
      'daysWorkedWeekday', 'daysWorkedSaturday', 'daysWorkedSundayPH',
      'normalHoursWeekday', 'normalHoursSaturday', 'totalNormalHours', 'basicPay',
      'otHoursWeekday', 'otPayWeekday', 'otHoursSaturday', 'otPaySaturday',
      'otHoursSundayPH', 'otPaySundayPH', 'monthlyNormalHoursTarget',
      'housingAllowance', 'transportAllowance', 'totalPay', 'wageBillMonth', 'wageBillYear',
    ];
    for (const column of columns) {
      await queryInterface.removeColumn('general_workers', column);
    }
    // Postgres doesn't support removing an enum value - 'hourly' stays in the type on rollback.
  },
};
