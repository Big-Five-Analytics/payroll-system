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
      nationalId: { type: DataTypes.STRING(30), allowNull: true, unique: true },
      workerNumber: { type: DataTypes.STRING(30), allowNull: true },
      jobTitle: { type: DataTypes.STRING(100), allowNull: true },
      payRate: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      payRateType: { type: DataTypes.ENUM('daily', 'monthly'), allowNull: true },
      phone: { type: DataTypes.STRING(20), allowNull: true },
      nextOfKinName: { type: DataTypes.STRING(150), allowNull: true },
      nextOfKinPhone: { type: DataTypes.STRING(20), allowNull: true },
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
    },
    {
      tableName: 'general_workers',
      timestamps: true,
      indexes: [
        { fields: ['site'] },
        { fields: ['contractEndDate'] },
        { unique: true, fields: ['site', 'workerNumber'], name: 'general_workers_site_worker_number_unique' },
      ],
    }
  );

  // Standalone entity - no associations. General workers never get a User login or
  // payroll history, so unlike Employee there's nothing else in the schema to link to.
  GeneralWorker.associate = () => {};

  return GeneralWorker;
};
