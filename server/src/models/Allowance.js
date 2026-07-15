// Catalog of allowance TYPES (e.g. Housing, Transport, Medical).
// Actual amounts per employee live in EmployeeAllowance (join table).
module.exports = (sequelize, DataTypes) => {
  const Allowance = sequelize.define(
    'Allowance',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      isTaxable: { type: DataTypes.BOOLEAN, defaultValue: true },
      description: { type: DataTypes.STRING(255), allowNull: true },
    },
    { tableName: 'allowances', timestamps: true }
  );

  Allowance.associate = (models) => {
    Allowance.hasMany(models.EmployeeAllowance, { foreignKey: 'allowanceId', as: 'employeeAllowances' });
  };

  return Allowance;
};
