const { NAPSA_RATE, NAPSA_CEILING, NHIMA_RATE } = require('../config/constants');

/**
 * Compute PAYE tax using progressive tax bands.
 * @param {number} taxableIncome
 * @param {Array} bands - TaxRate rows sorted ascending by minAmount
 */
function calculatePAYE(taxableIncome, bands) {
  let tax = 0;
  for (const band of bands) {
    const min = Number(band.minAmount);
    const max = band.maxAmount === null ? Infinity : Number(band.maxAmount);
    const rate = Number(band.rate);

    if (taxableIncome > min) {
      const amountInBand = Math.min(taxableIncome, max) - min;
      if (amountInBand > 0) tax += amountInBand * rate;
    }
  }
  return round2(tax);
}

function calculateNAPSA(basicSalary) {
  const contributable = Math.min(basicSalary, NAPSA_CEILING);
  return round2(contributable * NAPSA_RATE);
}

function calculateNHIMA(grossPay) {
  return round2(grossPay * NHIMA_RATE);
}

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

module.exports = { calculatePAYE, calculateNAPSA, calculateNHIMA, round2 };
