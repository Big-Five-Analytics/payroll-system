// PAYE tax bracket definitions. Supports progressive tax bands, e.g. Zambian PAYE bands.
// minAmount/maxAmount define the band; maxAmount = null means "and above".
module.exports = (sequelize, DataTypes) => {
  const TaxRate = sequelize.define(
    'TaxRate',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      bandName: { type: DataTypes.STRING(50), allowNull: false },
      minAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      maxAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
      rate: {
        type: DataTypes.DECIMAL(5, 4),
        allowNull: false,
        comment: 'Decimal rate e.g. 0.25 for 25%',
      },
      effectiveFrom: { type: DataTypes.DATEONLY, allowNull: false },
      effectiveTo: { type: DataTypes.DATEONLY, allowNull: true },
      isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    {
      tableName: 'tax_rates',
      timestamps: true,
      indexes: [{ fields: ['isActive'] }],
    }
  );

  return TaxRate;
};
