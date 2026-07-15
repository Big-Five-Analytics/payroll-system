// Join table: which allowances apply to which employee, and at what amount.
module.exports = (sequelize, DataTypes) => {
  const EmployeeAllowance = sequelize.define(
    'EmployeeAllowance',
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
      allowanceId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'allowances', key: 'id' },
      },
      amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, validate: { min: 0 } },
    },
    {
      tableName: 'employee_allowances',
      timestamps: true,
      indexes: [{ unique: true, fields: ['employeeId', 'allowanceId'] }],
    }
  );

  EmployeeAllowance.associate = (models) => {
    EmployeeAllowance.belongsTo(models.Employee, { foreignKey: 'employeeId', as: 'employee' });
    EmployeeAllowance.belongsTo(models.Allowance, { foreignKey: 'allowanceId', as: 'allowance' });
  };

  return EmployeeAllowance;
};
