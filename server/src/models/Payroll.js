// One row per employee per pay period. Header + computed totals.
// Line-item breakdown (which allowance/deduction contributed what) lives in PayrollItem.
module.exports = (sequelize, DataTypes) => {
  const Payroll = sequelize.define(
    'Payroll',
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
      payPeriodMonth: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 12 } },
      payPeriodYear: { type: DataTypes.INTEGER, allowNull: false },
      basicSalary: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      totalAllowances: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      grossPay: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      payeTax: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      napsaContribution: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      nhimaContribution: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      otherDeductions: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      totalDeductions: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      netPay: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      status: {
        type: DataTypes.ENUM('draft', 'processed', 'approved', 'paid'),
        defaultValue: 'draft',
      },
      processedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      processedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'payrolls',
      timestamps: true,
      indexes: [
        { unique: true, fields: ['employeeId', 'payPeriodMonth', 'payPeriodYear'] },
        { fields: ['payPeriodYear', 'payPeriodMonth'] },
        { fields: ['status'] },
      ],
    }
  );

  Payroll.associate = (models) => {
    Payroll.belongsTo(models.Employee, { foreignKey: 'employeeId', as: 'employee' });
    Payroll.belongsTo(models.User, { foreignKey: 'processedBy', as: 'processor' });
    Payroll.hasMany(models.PayrollItem, { foreignKey: 'payrollId', as: 'items' });
    Payroll.hasOne(models.Payslip, { foreignKey: 'payrollId', as: 'payslip' });
  };

  return Payroll;
};
