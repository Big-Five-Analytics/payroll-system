module.exports = (sequelize, DataTypes) => {
  const Employee = sequelize.define(
    'Employee',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      employeeNumber: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      firstName: { type: DataTypes.STRING(100), allowNull: false },
      lastName: { type: DataTypes.STRING(100), allowNull: false },
      email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      phone: { type: DataTypes.STRING(20), allowNull: true },
      nationalId: { type: DataTypes.STRING(30), allowNull: false, unique: true },
      napsaNumber: { type: DataTypes.STRING(30), allowNull: true },
      nhimaNumber: { type: DataTypes.STRING(30), allowNull: true },
      tpin: { type: DataTypes.STRING(30), allowNull: true }, // tax payer id number
      departmentId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'departments', key: 'id' },
      },
      jobTitle: { type: DataTypes.STRING(100), allowNull: false },
      dateOfHire: { type: DataTypes.DATEONLY, allowNull: false },
      dateOfBirth: { type: DataTypes.DATEONLY, allowNull: true },
      basicSalary: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: { min: 0 },
      },
      bankName: { type: DataTypes.STRING(100), allowNull: true },
      bankAccountNumber: { type: DataTypes.STRING(50), allowNull: true },
      status: {
        type: DataTypes.ENUM('active', 'suspended', 'terminated'),
        defaultValue: 'active',
      },
      terminationDate: { type: DataTypes.DATEONLY, allowNull: true },
    },
    {
      tableName: 'employees',
      timestamps: true,
      indexes: [
        { fields: ['departmentId'] },
        { fields: ['status'] },
        { fields: ['lastName', 'firstName'] },
      ],
    }
  );

  Employee.associate = (models) => {
    Employee.belongsTo(models.Department, { foreignKey: 'departmentId', as: 'department' });
    Employee.hasMany(models.Payroll, { foreignKey: 'employeeId', as: 'payrolls' });
    Employee.hasMany(models.EmployeeAllowance, { foreignKey: 'employeeId', as: 'allowances' });
    Employee.hasMany(models.EmployeeDeduction, { foreignKey: 'employeeId', as: 'deductions' });
    Employee.hasMany(models.Payslip, { foreignKey: 'employeeId', as: 'payslips' });
    Employee.hasOne(models.User, { foreignKey: 'employeeId', as: 'account' });
    Employee.hasMany(models.LeaveApplication, { foreignKey: 'employeeId', as: 'leaveApplications' });
    Employee.hasMany(models.SalaryAdvanceApplication, { foreignKey: 'employeeId', as: 'salaryAdvanceApplications' });
    Employee.hasMany(models.AttendanceLog, { foreignKey: 'employeeId', as: 'attendanceLogs' });
  };

  return Employee;
};
