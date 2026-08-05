const { NAPSA_RATE, NAPSA_CEILING, NHIMA_RATE } = require('../config/constants');

/**
 * Compute PAYE tax using progressive tax bands (ZRA method).
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

// NAPSA: 5% of GROSS earnings (basic salary + all allowances), capped at the statutory
// pensionable-earnings ceiling (NAPSA_CEILING) - contributions above the ceiling aren't charged.
function calculateNAPSA(grossPay) {
  return round2(Math.min(grossPay, NAPSA_CEILING) * NAPSA_RATE);
}

// NHIMA: 1% of BASIC salary only (not gross pay - allowances are excluded from this one).
function calculateNHIMA(basicSalary) {
  return round2(basicSalary * NHIMA_RATE);
}

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

module.exports = { calculatePAYE, calculateNAPSA, calculateNHIMA, round2 };
