module.exports = (sequelize, DataTypes) => {
  const Payslip = sequelize.define(
    'Payslip',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      payrollId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'payrolls', key: 'id' },
      },
      employeeId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'employees', key: 'id' },
      },
      payslipNumber: { type: DataTypes.STRING(30), allowNull: false, unique: true },
      issuedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      pdfPath: { type: DataTypes.STRING(255), allowNull: true },
    },
    {
      tableName: 'payslips',
      timestamps: true,
    }
  );

  Payslip.associate = (models) => {
    Payslip.belongsTo(models.Payroll, { foreignKey: 'payrollId', as: 'payroll' });
    Payslip.belongsTo(models.Employee, { foreignKey: 'employeeId', as: 'employee' });
  };

  return Payslip;
};
