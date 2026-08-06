module.exports = (sequelize, DataTypes) => {
  const SalaryAdvanceApplication = sequelize.define(
    'SalaryAdvanceApplication',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      employeeId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'employees', key: 'id' },
      },
      amountRequested: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: { min: 0.01 },
      },
      reason: { type: DataTypes.TEXT, allowNull: false },
      // Informational only - HR/Finance sees this as the employee's stated preference,
      // but the payroll engine (payrollService.generatePayroll) always recovers the
      // full amount from the next payroll run regardless of what's selected here.
      repaymentPlan: {
        type: DataTypes.ENUM('full', 'two_months', 'three_months'),
        allowNull: true,
      },
      dateRequested: { type: DataTypes.DATEONLY, allowNull: true },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
      },
      reviewedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      reviewedAt: { type: DataTypes.DATE, allowNull: true },
      reviewComment: { type: DataTypes.STRING(500), allowNull: true },
      // Set automatically by the payroll engine the first time this employee's payroll
      // is run after approval - never set manually, and never re-applied on a later run.
      recovered: { type: DataTypes.BOOLEAN, defaultValue: false },
      recoveredInPayrollId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'payrolls', key: 'id' },
      },
    },
    {
      tableName: 'salary_advance_applications',
      timestamps: true,
      indexes: [
        { fields: ['employeeId'] },
        { fields: ['status'] },
        { fields: ['status', 'recovered'] },
      ],
    }
  );

  SalaryAdvanceApplication.associate = (models) => {
    SalaryAdvanceApplication.belongsTo(models.Employee, { foreignKey: 'employeeId', as: 'employee' });
    SalaryAdvanceApplication.belongsTo(models.User, { foreignKey: 'reviewedBy', as: 'reviewer' });
    SalaryAdvanceApplication.belongsTo(models.Payroll, { foreignKey: 'recoveredInPayrollId', as: 'recoveryPayroll' });
  };

  return SalaryAdvanceApplication;
};
