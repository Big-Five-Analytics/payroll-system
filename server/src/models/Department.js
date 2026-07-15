module.exports = (sequelize, DataTypes) => {
  const Department = sequelize.define(
    'Department',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      description: { type: DataTypes.STRING(255), allowNull: true },
    },
    {
      tableName: 'departments',
      timestamps: true,
    }
  );

  Department.associate = (models) => {
    Department.hasMany(models.Employee, { foreignKey: 'departmentId', as: 'employees' });
  };

  return Department;
};
