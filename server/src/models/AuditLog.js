module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define(
    'AuditLog',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      action: { type: DataTypes.STRING(50), allowNull: false },
      entityType: { type: DataTypes.STRING(50), allowNull: true },
      entityId: { type: DataTypes.UUID, allowNull: true },
      details: { type: DataTypes.JSONB, allowNull: true },
      ipAddress: { type: DataTypes.STRING(50), allowNull: true },
    },
    {
      tableName: 'audit_logs',
      timestamps: true,
      updatedAt: false,
      indexes: [
        { fields: ['userId'] },
        { fields: ['action'] },
        { fields: ['entityType', 'entityId'] },
        { fields: ['createdAt'] },
      ],
    }
  );

  AuditLog.associate = (models) => {
    AuditLog.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return AuditLog;
};
