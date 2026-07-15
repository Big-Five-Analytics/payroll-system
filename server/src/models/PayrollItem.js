// Line-item breakdown for a single Payroll record - one row per allowance/deduction
// applied during that run. Keeps the audit trail granular (what made up gross/net pay).
module.exports = (sequelize, DataTypes) => {
  const PayrollItem = sequelize.define(
    'PayrollItem',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      payrollId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'payrolls', key: 'id' },
      },
      type: {
        type: DataTypes.ENUM('allowance', 'deduction', 'statutory'),
        allowNull: false,
      },
      label: { type: DataTypes.STRING(100), allowNull: false },
      amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    },
    {
      tableName: 'payroll_items',
      timestamps: true,
      indexes: [{ fields: ['payrollId'] }],
    }
  );

  PayrollItem.associate = (models) => {
    PayrollItem.belongsTo(models.Payroll, { foreignKey: 'payrollId', as: 'payroll' });
  };

  return PayrollItem;
};
