module.exports = (sequelize, DataTypes) => {
  const EmployeeDeduction = sequelize.define(
    'EmployeeDeduction',
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
      deductionId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'deductions', key: 'id' },
      },
      amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, validate: { min: 0 } },
    },
    {
      tableName: 'employee_deductions',
      timestamps: true,
      indexes: [{ unique: true, fields: ['employeeId', 'deductionId'] }],
    }
  );

  EmployeeDeduction.associate = (models) => {
    EmployeeDeduction.belongsTo(models.Employee, { foreignKey: 'employeeId', as: 'employee' });
    EmployeeDeduction.belongsTo(models.Deduction, { foreignKey: 'deductionId', as: 'deduction' });
  };

  return EmployeeDeduction;
};
