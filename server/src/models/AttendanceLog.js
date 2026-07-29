// One row per employee per calendar day. Clock-in creates the row; clock-out fills it in.
// lateMinutes/overtimeMinutes are computed and stored at the moment of the clock action
// (against WORK_START_HOUR/WORK_END_HOUR), the same snapshot pattern used elsewhere in
// this codebase (e.g. PayrollItem) so historical reports don't shift if the work-hours
// configuration changes later.
module.exports = (sequelize, DataTypes) => {
  const AttendanceLog = sequelize.define(
    'AttendanceLog',
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
      logDate: { type: DataTypes.DATEONLY, allowNull: false },
      clockInAt: { type: DataTypes.DATE, allowNull: true },
      clockInIp: { type: DataTypes.STRING(50), allowNull: true },
      lateMinutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      clockOutAt: { type: DataTypes.DATE, allowNull: true },
      clockOutIp: { type: DataTypes.STRING(50), allowNull: true },
      overtimeMinutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    {
      tableName: 'attendance_logs',
      timestamps: true,
      indexes: [
        { unique: true, fields: ['employeeId', 'logDate'] },
        { fields: ['logDate'] },
      ],
    }
  );

  AttendanceLog.associate = (models) => {
    AttendanceLog.belongsTo(models.Employee, { foreignKey: 'employeeId', as: 'employee' });
  };

  return AttendanceLog;
};
