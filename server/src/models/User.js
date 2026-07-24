const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      firstName: { type: DataTypes.STRING(100), allowNull: false },
      lastName: { type: DataTypes.STRING(100), allowNull: false },
      email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      password: { type: DataTypes.STRING, allowNull: false },
      roleId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'roles', key: 'id' },
      },
      isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
      lastLoginAt: { type: DataTypes.DATE, allowNull: true },
      refreshToken: { type: DataTypes.STRING, allowNull: true },
      mustChangePassword: { type: DataTypes.BOOLEAN, defaultValue: false },
      employeeId: {
        type: DataTypes.UUID,
        allowNull: true,
        unique: true,
        references: { model: 'employees', key: 'id' },
        comment: 'Set only for Employee-role accounts - links the login to their employee record',
      },
    },
    {
      tableName: 'users',
      timestamps: true,
      hooks: {
        beforeCreate: async (user) => {
          user.password = await bcrypt.hash(user.password, 12);
        },
        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            user.password = await bcrypt.hash(user.password, 12);
          }
        },
      },
      defaultScope: {
        attributes: { exclude: ['password', 'refreshToken'] },
      },
      scopes: {
        withPassword: { attributes: {} },
      },
    }
  );

  User.prototype.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };

  User.associate = (models) => {
    User.belongsTo(models.Role, { foreignKey: 'roleId', as: 'role' });
    User.belongsTo(models.Employee, { foreignKey: 'employeeId', as: 'employee' });
    User.hasMany(models.AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
  };

  return User;
};
