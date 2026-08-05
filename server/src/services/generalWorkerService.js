const { Op } = require('sequelize');
const ExcelJS = require('exceljs');
const { sequelize, GeneralWorker } = require('../models');
const ApiError = require('../utils/ApiError');

// Header text -> system field, matched as a substring against a normalized header
// (lowercased, punctuation collapsed to spaces). Sites don't share a spreadsheet
// template, so uploads go through a mapping step - this table just seeds a best-guess
// default mapping the HR user can correct.
const FIELD_SYNONYMS = {
  fullName: ['employee name', 'full name', 'worker name', 'staff name', 'name'],
  jobTitle: ['trade role', 'job title', 'trade', 'role', 'position', 'designation'],
  payRate: ['hourly rate', 'rate', 'daily rate', 'monthly rate', 'pay rate', 'wage'],
  payRateType: ['rate type', 'pay type', 'payment frequency'],
  contractStartDate: ['start date', 'contract start', 'contract start date', 'date started'],
  contractEndDate: ['end date', 'contract end', 'contract end date', 'expiry date', 'expiry'],
  leaveBalance: ['leave balance', 'leave days', 'leave days remaining', 'balance'],

  // Monthly wage-bill snapshot (e.g. hourly-rate casual wage sheets)
  daysWorkedWeekday: ['days worked mon fri', 'days worked'],
  daysWorkedSaturday: ['saturdays worked', 'saturday worked', 'days worked sat'],
  daysWorkedSundayPH: ['sundays ph worked', 'sunday ph worked', 'sundays worked', 'sunday worked'],
  normalHoursWeekday: ['normal hours mon fri', 'normal hours weekday'],
  normalHoursSaturday: ['normal hours sat'],
  monthlyNormalHoursTarget: ['monthly total normal hours', 'monthly normal hours'],
  totalNormalHours: ['total normal hours'],
  basicPay: ['basic pay'],
  otHoursWeekday: ['ot hours weekday', 'overtime hours weekday'],
  otHoursSaturday: ['ot hours saturday', 'ot hours sat'],
  otPaySaturday: ['ot pay 1 5', '1 5x', 'ot pay saturday'],
  otHoursSundayPH: ['ot hours sunday', 'ot hours ph'],
  otPaySundayPH: ['ot pay 2 0', '2 0x', 'ot pay sunday'],
  otPayWeekday: ['ot pay'],
  housingAllowance: ['housing allowance', 'housing'],
  transportAllowance: ['transport'],
  totalPay: ['total pay'],
};

// Assignment order matters: more specific synonyms (e.g. "OT Pay (1.5x)") must claim
// their column before the generic fallbacks (e.g. bare "OT Pay" for the weekday rate,
// or "name" as a last-resort match for fullName) get a turn at the leftovers.
const FIELD_MATCH_ORDER = [
  'contractStartDate', 'contractEndDate', 'leaveBalance',
  'daysWorkedWeekday', 'daysWorkedSaturday', 'daysWorkedSundayPH',
  'normalHoursWeekday', 'normalHoursSaturday', 'monthlyNormalHoursTarget', 'totalNormalHours',
  'basicPay', 'otHoursWeekday', 'otHoursSaturday', 'otPaySaturday', 'otHoursSundayPH', 'otPaySundayPH',
  'otPayWeekday', 'housingAllowance', 'transportAllowance', 'totalPay',
  'payRateType', 'payRate', 'jobTitle', 'fullName',
];

const normalizeHeader = (header) =>
  String(header || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const buildSuggestedMapping = (headers) => {
  const normalized = headers.map(normalizeHeader);
  const claimed = new Set();
  const mapping = {};

  FIELD_MATCH_ORDER.forEach((field) => {
    const synonyms = FIELD_SYNONYMS[field] || [];
    const index = normalized.findIndex((h, i) => !claimed.has(i) && synonyms.some((syn) => h.includes(syn)));
    if (index !== -1) {
      mapping[field] = index;
      claimed.add(index);
    }
  });

  return mapping;
};

// Excel stores dates either as JS Date objects (when the cell is date-formatted) or as
// a bare serial number (days since 1899-12-30). Handle both, plus a plain date string.
const EXCEL_EPOCH = new Date(Date.UTC(1899, 11, 30));
const coerceDate = (value) => {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'number') {
    const ms = EXCEL_EPOCH.getTime() + value * 86400 * 1000;
    return new Date(ms).toISOString().slice(0, 10);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
};

const coerceNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

const coerceString = (value) => {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str === '' ? null : str;
};

const MAX_PREVIEW_ROWS = 5000;

const parseWorkbook = async (buffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw ApiError.badRequest('The uploaded file has no worksheets');

  const headerRow = worksheet.getRow(1);
  const headers = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber - 1] = coerceString(cell.value) || '';
  });

  const rows = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const values = [];
    for (let col = 1; col <= headers.length; col += 1) {
      values[col - 1] = row.getCell(col).value;
    }
    if (values.some((v) => v !== null && v !== undefined && String(v).trim() !== '')) {
      rows.push(values);
    }
  });

  if (rows.length > MAX_PREVIEW_ROWS) {
    throw ApiError.badRequest(`This file has ${rows.length} rows - a single upload is limited to ${MAX_PREVIEW_ROWS}`);
  }

  return { headers, rows };
};

const previewUpload = async (buffer) => {
  const { headers, rows } = await parseWorkbook(buffer);
  return {
    headers,
    suggestedMapping: buildSuggestedMapping(headers),
    sampleRows: rows.slice(0, 5),
    totalRows: rows.length,
    rows,
  };
};

const coercePayRateType = (value) => {
  const normalized = coerceString(value)?.toLowerCase();
  return ['hourly', 'daily', 'monthly'].includes(normalized) ? normalized : null;
};

const applyMapping = (row, mapping) => {
  const get = (field) => {
    const colIndex = mapping[field];
    return colIndex === undefined || colIndex === null || colIndex === '' ? undefined : row[Number(colIndex)];
  };

  return {
    fullName: coerceString(get('fullName')),
    jobTitle: coerceString(get('jobTitle')),
    payRate: coerceNumber(get('payRate')),
    payRateType: coercePayRateType(get('payRateType')),
    contractStartDate: coerceDate(get('contractStartDate')),
    contractEndDate: coerceDate(get('contractEndDate')),
    leaveBalance: coerceNumber(get('leaveBalance')),

    daysWorkedWeekday: coerceNumber(get('daysWorkedWeekday')),
    daysWorkedSaturday: coerceNumber(get('daysWorkedSaturday')),
    daysWorkedSundayPH: coerceNumber(get('daysWorkedSundayPH')),
    normalHoursWeekday: coerceNumber(get('normalHoursWeekday')),
    normalHoursSaturday: coerceNumber(get('normalHoursSaturday')),
    totalNormalHours: coerceNumber(get('totalNormalHours')),
    basicPay: coerceNumber(get('basicPay')),
    otHoursWeekday: coerceNumber(get('otHoursWeekday')),
    otPayWeekday: coerceNumber(get('otPayWeekday')),
    otHoursSaturday: coerceNumber(get('otHoursSaturday')),
    otPaySaturday: coerceNumber(get('otPaySaturday')),
    otHoursSundayPH: coerceNumber(get('otHoursSundayPH')),
    otPaySundayPH: coerceNumber(get('otPaySundayPH')),
    monthlyNormalHoursTarget: coerceNumber(get('monthlyNormalHoursTarget')),
    housingAllowance: coerceNumber(get('housingAllowance')),
    transportAllowance: coerceNumber(get('transportAllowance')),
    totalPay: coerceNumber(get('totalPay')),
  };
};

// Upserts each row by (site, fullName) - these wage-bill sheets carry no NRC or staff
// number, so name is the only identifier available. The wage-bill figures are a flat,
// latest-month-only snapshot - re-importing next month's bill overwrites this month's
// numbers rather than keeping history.
const importWorkers = async ({ site, mapping, rows, sourceFileName, wageBillMonth, wageBillYear }) => {
  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors = [];

  await sequelize.transaction(async (t) => {
    for (let i = 0; i < rows.length; i += 1) {
      const rowNumber = i + 2; // account for the header row + 1-indexing
      const record = applyMapping(rows[i], mapping);

      if (!record.fullName) {
        skipped += 1;
        errors.push({ row: rowNumber, reason: 'Missing full name' });
        continue;
      }

      const payload = {
        ...record,
        site,
        leaveBalance: record.leaveBalance ?? 0,
        wageBillMonth: wageBillMonth || null,
        wageBillYear: wageBillYear || null,
        sourceFileName,
        lastUploadedAt: new Date(),
      };

      const existing = await GeneralWorker.findOne({ where: { site, fullName: record.fullName }, transaction: t });

      if (existing) {
        await existing.update(payload, { transaction: t });
        updated += 1;
      } else {
        await GeneralWorker.create(payload, { transaction: t });
        created += 1;
      }
    }
  });

  return { created, updated, skipped, errors };
};

const listGeneralWorkers = async ({ page = 1, limit = 20, search, site, status, expiringInDays }) => {
  const offset = (page - 1) * limit;
  const where = {};

  if (search) {
    where.fullName = { [Op.iLike]: `%${search}%` };
  }
  if (site) where.site = site;
  if (status) where.status = status;
  if (expiringInDays) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + Number(expiringInDays));
    where.contractEndDate = { [Op.lte]: cutoff.toISOString().slice(0, 10) };
  }

  const { rows, count } = await GeneralWorker.findAndCountAll({
    where,
    limit: Number(limit),
    offset,
    order: [['fullName', 'ASC']],
  });

  return { generalWorkers: rows, total: count, page: Number(page), pages: Math.ceil(count / limit) };
};

const getGeneralWorkerById = async (id) => {
  const worker = await GeneralWorker.findByPk(id);
  if (!worker) throw ApiError.notFound('General worker not found');
  return worker;
};

const createGeneralWorker = async (data) => GeneralWorker.create(data);

const updateGeneralWorker = async (id, data) => {
  const worker = await GeneralWorker.findByPk(id);
  if (!worker) throw ApiError.notFound('General worker not found');
  await worker.update(data);
  return worker;
};

const deleteGeneralWorker = async (id) => {
  const worker = await GeneralWorker.findByPk(id);
  if (!worker) throw ApiError.notFound('General worker not found');
  await worker.destroy();
  return worker;
};

const listSites = async () => {
  const rows = await GeneralWorker.findAll({
    attributes: [[sequelize.fn('DISTINCT', sequelize.col('site')), 'site']],
    order: [['site', 'ASC']],
    raw: true,
  });
  return rows.map((r) => r.site);
};

const getExpiringContracts = async (days = 30) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + Number(days));
  return GeneralWorker.findAll({
    where: {
      status: 'active',
      contractEndDate: { [Op.lte]: cutoff.toISOString().slice(0, 10) },
    },
    order: [['contractEndDate', 'ASC']],
  });
};

module.exports = {
  previewUpload,
  importWorkers,
  listGeneralWorkers,
  getGeneralWorkerById,
  createGeneralWorker,
  updateGeneralWorker,
  deleteGeneralWorker,
  listSites,
  getExpiringContracts,
};
