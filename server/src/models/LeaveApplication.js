module.exports = (sequelize, DataTypes) => {
  const LeaveApplication = sequelize.define(
    'LeaveApplication',
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
      leaveType: {
        type: DataTypes.ENUM('annual', 'sick', 'maternity', 'paternity', 'unpaid', 'compassionate', 'other'),
        allowNull: false,
      },
      startDate: { type: DataTypes.DATEONLY, allowNull: false },
      endDate: { type: DataTypes.DATEONLY, allowNull: false },
      numberOfDays: { type: DataTypes.INTEGER, allowNull: false },
      reason: { type: DataTypes.TEXT, allowNull: false },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
      },
      reviewedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      reviewedAt: { type: DataTypes.DATE, allowNull: true },
      reviewComment: { type: DataTypes.STRING(500), allowNull: true },
    },
    {
      tableName: 'leave_applications',
      timestamps: true,
      indexes: [
        { fields: ['employeeId'] },
        { fields: ['status'] },
      ],
      validate: {
        endDateAfterStartDate() {
          if (this.endDate < this.startDate) {
            throw new Error('End date must be on or after the start date');
          }
        },
      },
    }
  );

  LeaveApplication.associate = (models) => {
    LeaveApplication.belongsTo(models.Employee, { foreignKey: 'employeeId', as: 'employee' });
    LeaveApplication.belongsTo(models.User, { foreignKey: 'reviewedBy', as: 'reviewer' });
  };

  return LeaveApplication;
};
