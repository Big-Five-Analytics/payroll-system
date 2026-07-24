// Archive table for terminated employees. A snapshot is written here at the moment of
// termination so HR retains a clean record (rehire checks, reference lookups, compliance)
// separate from the active headcount - without breaking the foreign keys that payroll,
// payslip, leave, and salary advance history still hold against the original employees row.
//
// The original employees.id row is kept (status set to 'terminated') specifically so that
// historical Payroll/Payslip/LeaveApplication/SalaryAdvanceApplication records - which are
// legally/operationally important to retain - stay intact and queryable. This table is the
// HR-facing "terminated employees list"; the employees table is the payroll-integrity source
// of truth. See docs/database.md for the full reasoning.
module.exports = (sequelize, DataTypes) => {
  const TerminatedEmployee = sequelize.define(
    'TerminatedEmployee',
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
        comment: 'Points back to the original employees row, retained for payroll history integrity',
      },
      employeeNumber: { type: DataTypes.STRING(20), allowNull: false },
      firstName: { type: DataTypes.STRING(100), allowNull: false },
      lastName: { type: DataTypes.STRING(100), allowNull: false },
      email: { type: DataTypes.STRING(150), allowNull: false },
      nationalId: { type: DataTypes.STRING(30), allowNull: false },
      departmentName: { type: DataTypes.STRING(100), allowNull: true },
      jobTitle: { type: DataTypes.STRING(100), allowNull: false },
      dateOfHire: { type: DataTypes.DATEONLY, allowNull: false },
      terminationDate: { type: DataTypes.DATEONLY, allowNull: false },
      lastBasicSalary: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      reason: { type: DataTypes.STRING(500), allowNull: true },
      terminatedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
    },
    {
      tableName: 'terminated_employees',
      timestamps: true,
      updatedAt: false,
      indexes: [
        { fields: ['employeeId'] },
        { fields: ['terminationDate'] },
      ],
    }
  );

  TerminatedEmployee.associate = (models) => {
    TerminatedEmployee.belongsTo(models.Employee, { foreignKey: 'employeeId', as: 'employee' });
    TerminatedEmployee.belongsTo(models.User, { foreignKey: 'terminatedBy', as: 'terminator' });
  };

  return TerminatedEmployee;
};
