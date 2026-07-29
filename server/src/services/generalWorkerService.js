const { Op } = require('sequelize');
const ExcelJS = require('exceljs');
const { sequelize, GeneralWorker } = require('../models');
const ApiError = require('../utils/ApiError');

// Header text -> system field, matched case-insensitively against trimmed header cells.
// Sites don't share a spreadsheet template, so uploads go through a mapping step -
// this table just seeds a best-guess default mapping the HR user can correct.
const FIELD_SYNONYMS = {
  fullName: ['name', 'full name', 'employee name', 'worker name', 'staff name'],
  nationalId: ['nrc', 'national id', 'id number', 'nrc number', 'national registration card'],
  workerNumber: ['staff no', 'staff number', 'worker no', 'worker number', 'employee no', 'id no'],
  jobTitle: ['job title', 'role', 'position', 'designation'],
  payRate: ['rate', 'daily rate', 'monthly rate', 'pay rate', 'wage'],
  payRateType: ['rate type', 'pay type', 'payment frequency'],
  phone: ['phone', 'mobile', 'contact', 'phone number', 'contact number'],
  nextOfKinName: ['next of kin', 'nok', 'next of kin name', 'kin name'],
  nextOfKinPhone: ['next of kin phone', 'nok phone', 'kin phone', 'kin contact'],
  contractStartDate: ['start date', 'contract start', 'contract start date', 'date started'],
  contractEndDate: ['end date', 'contract end', 'contract end date', 'expiry date', 'expiry'],
  leaveBalance: ['leave balance', 'leave days', 'leave days remaining', 'balance'],
};

const normalizeHeader = (header) => String(header || '').trim().toLowerCase();

const buildSuggestedMapping = (headers) => {
  const mapping = {};
  Object.entries(FIELD_SYNONYMS).forEach(([field, synonyms]) => {
    const index = headers.findIndex((h) => synonyms.includes(normalizeHeader(h)));
    if (index !== -1) mapping[field] = index;
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
  return normalized === 'monthly' || normalized === 'daily' ? normalized : null;
};

const applyMapping = (row, mapping) => {
  const get = (field) => {
    const colIndex = mapping[field];
    return colIndex === undefined || colIndex === null || colIndex === '' ? undefined : row[Number(colIndex)];
  };

  return {
    fullName: coerceString(get('fullName')),
    nationalId: coerceString(get('nationalId')),
    workerNumber: coerceString(get('workerNumber')),
    jobTitle: coerceString(get('jobTitle')),
    payRate: coerceNumber(get('payRate')),
    payRateType: coercePayRateType(get('payRateType')),
    phone: coerceString(get('phone')),
    nextOfKinName: coerceString(get('nextOfKinName')),
    nextOfKinPhone: coerceString(get('nextOfKinPhone')),
    contractStartDate: coerceDate(get('contractStartDate')),
    contractEndDate: coerceDate(get('contractEndDate')),
    leaveBalance: coerceNumber(get('leaveBalance')),
  };
};

// Upserts each row by nationalId (preferred) or (site, workerNumber) as a fallback -
// whichever the sheet actually provides. Rows with neither are always inserted as new,
// since there's nothing reliable to match them against on a re-upload.
const importWorkers = async ({ site, mapping, rows, sourceFileName }) => {
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
        sourceFileName,
        lastUploadedAt: new Date(),
      };

      let existing = null;
      if (record.nationalId) {
        existing = await GeneralWorker.findOne({ where: { nationalId: record.nationalId }, transaction: t });
      } else if (record.workerNumber) {
        existing = await GeneralWorker.findOne({ where: { site, workerNumber: record.workerNumber }, transaction: t });
      }

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
    where[Op.or] = [
      { fullName: { [Op.iLike]: `%${search}%` } },
      { nationalId: { [Op.iLike]: `%${search}%` } },
      { workerNumber: { [Op.iLike]: `%${search}%` } },
    ];
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

const createGeneralWorker = async (data) => {
  if (data.nationalId) {
    const existing = await GeneralWorker.findOne({ where: { nationalId: data.nationalId } });
    if (existing) throw ApiError.conflict('A worker with this National ID already exists');
  }
  return GeneralWorker.create(data);
};

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
