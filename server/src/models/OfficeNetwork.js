// Admin-managed allowlist of IP addresses/CIDR ranges that count as "at the office" for
// attendance clock-in/clock-out. Supports multiple entries so a company with more than
// one office (or a VPN range) can be accommodated without code changes.
module.exports = (sequelize, DataTypes) => {
  const OfficeNetwork = sequelize.define(
    'OfficeNetwork',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      label: { type: DataTypes.STRING(100), allowNull: false },
      ipRange: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'A single IP (e.g. 41.63.12.4) or CIDR block (e.g. 41.63.12.0/24)',
      },
      isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    {
      tableName: 'office_networks',
      timestamps: true,
    }
  );

  return OfficeNetwork;
};
