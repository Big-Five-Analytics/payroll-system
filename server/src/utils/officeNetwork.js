const ipRangeCheck = require('ip-range-check');
const { OfficeNetwork } = require('../models');

// Express (and Node's net module generally) often reports IPv4 clients as an
// IPv4-mapped IPv6 address like "::ffff:127.0.0.1" - strip that prefix so it
// compares correctly against a plain IPv4 entry in the allowlist.
const normalizeIp = (ip) => (ip && ip.startsWith('::ffff:') ? ip.slice(7) : ip);

/**
 * Checks whether the given request IP falls within any active OfficeNetwork range.
 * Returns { allowed: boolean, reason?: string } rather than throwing, so callers can
 * decide how to surface the failure (and so a misconfiguration is loud, not silent).
 */
const isOnOfficeNetwork = async (requestIp) => {
  const ip = normalizeIp(requestIp);
  const activeRanges = await OfficeNetwork.findAll({ where: { isActive: true } });

  if (!activeRanges.length) {
    return {
      allowed: false,
      reason: 'No office network ranges are configured yet - an Administrator must add at least one before anyone can clock in or out.',
    };
  }

  const allowed = activeRanges.some((range) => {
    try {
      return ipRangeCheck(ip, range.ipRange);
    } catch {
      return false; // a malformed stored range should never crash the request
    }
  });

  return allowed
    ? { allowed: true }
    : { allowed: false, reason: `Your current network (${ip}) is not recognized as an office network.` };
};

module.exports = { isOnOfficeNetwork, normalizeIp };
