module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    'Notification',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      type: { type: DataTypes.STRING(50), allowNull: false },
      title: { type: DataTypes.STRING(150), allowNull: false },
      message: { type: DataTypes.STRING(500), allowNull: false },
      link: { type: DataTypes.STRING(255), allowNull: true },
      entityType: { type: DataTypes.STRING(50), allowNull: true },
      entityId: { type: DataTypes.UUID, allowNull: true },
      isRead: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      readAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'notifications',
      timestamps: true,
      indexes: [
        { fields: ['userId'] },
        { fields: ['userId', 'isRead'] },
        { fields: ['createdAt'] },
      ],
    }
  );

  Notification.associate = (models) => {
    Notification.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return Notification;
};
