module.exports = (sequelize, DataTypes) => {
  const GeneralWorker = sequelize.define(
    'GeneralWorker',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      fullName: { type: DataTypes.STRING(150), allowNull: false },
      site: { type: DataTypes.STRING(100), allowNull: false },
      jobTitle: { type: DataTypes.STRING(100), allowNull: true }, // Trade/Role in the wage-bill sheets
      payRate: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      payRateType: { type: DataTypes.ENUM('hourly', 'daily', 'monthly'), allowNull: true },
      contractStartDate: { type: DataTypes.DATEONLY, allowNull: true },
      contractEndDate: { type: DataTypes.DATEONLY, allowNull: true },
      leaveBalance: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active',
      },
      sourceFileName: { type: DataTypes.STRING(255), allowNull: true },
      lastUploadedAt: { type: DataTypes.DATE, allowNull: true },

      // Monthly wage-bill snapshot (e.g. MFEZ-style casual/hourly wage sheets) - flat
      // columns holding the most recently uploaded/edited month's figures only, tagged
      // with wageBillMonth/Year. Re-importing a new month's bill overwrites these.
      daysWorkedWeekday: { type: DataTypes.INTEGER, allowNull: true },
      daysWorkedSaturday: { type: DataTypes.INTEGER, allowNull: true },
      daysWorkedSundayPH: { type: DataTypes.INTEGER, allowNull: true },
      normalHoursWeekday: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
      normalHoursSaturday: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
      totalNormalHours: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
      basicPay: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      otHoursWeekday: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
      otPayWeekday: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      otHoursSaturday: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
      otPaySaturday: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      otHoursSundayPH: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
      otPaySundayPH: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      monthlyNormalHoursTarget: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
      housingAllowance: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      transportAllowance: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      totalPay: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      wageBillMonth: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 1, max: 12 } },
      wageBillYear: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      tableName: 'general_workers',
      timestamps: true,
      indexes: [
        { fields: ['site'] },
        { fields: ['contractEndDate'] },
      ],
    }
  );

  // Standalone entity - no associations. General workers never get a User login or
  // payroll history, so unlike Employee there's nothing else in the schema to link to.
  GeneralWorker.associate = () => {};

  return GeneralWorker;
};
