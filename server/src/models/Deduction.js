// Catalog of deduction TYPES (e.g. Loan Repayment, Union Dues).
// Statutory deductions (PAYE, NAPSA, NHIMA) are computed by the payroll engine, not stored here.
module.exports = (sequelize, DataTypes) => {
  const Deduction = sequelize.define(
    'Deduction',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      description: { type: DataTypes.STRING(255), allowNull: true },
    },
    { tableName: 'deductions', timestamps: true }
  );

  Deduction.associate = (models) => {
    Deduction.hasMany(models.EmployeeDeduction, { foreignKey: 'deductionId', as: 'employeeDeductions' });
  };

  return Deduction;
};
