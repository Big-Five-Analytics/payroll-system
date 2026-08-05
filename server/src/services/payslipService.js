const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { Payslip, Payroll, Employee, Department, PayrollItem } = require('../models');
const ApiError = require('../utils/ApiError');
const COMPANY = require('../config/company');

const PAYSLIP_DIR = path.join(__dirname, '../../storage/payslips');
if (!fs.existsSync(PAYSLIP_DIR)) fs.mkdirSync(PAYSLIP_DIR, { recursive: true });

const LOGO_PATH = path.join(__dirname, '../assets/bfi-logo.png');

// Palette pulled from the BFI crest (olive frame, amber accents, charcoal center).
const COLORS = {
  charcoal: '#1a1a1a',
  olive: '#5c5f3f',
  oliveDark: '#3f4130',
  amber: '#b8621f',
  amberLight: '#f6ead9',
  gray: '#6b7280',
  grayLight: '#e2e0d8',
  red: '#a3342c',
  cream: '#fbf6ec',
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const money = (n) =>
  `ZMW ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const generatePayslipNumber = (payroll) =>
  `PS-${payroll.payPeriodYear}${String(payroll.payPeriodMonth).padStart(2, '0')}-${payroll.employeeId.slice(0, 8).toUpperCase()}`;

const generatePayslip = async (payrollId) => {
  const payroll = await Payroll.findByPk(payrollId, {
    include: [
      { model: Employee, as: 'employee', include: [{ model: Department, as: 'department' }] },
      { model: PayrollItem, as: 'items' },
    ],
  });
  if (!payroll) throw ApiError.notFound('Payroll record not found');
  if (payroll.status === 'draft') throw ApiError.badRequest('Cannot generate a payslip for an unprocessed payroll');

  const existing = await Payslip.findOne({ where: { payrollId } });
  if (existing) return existing;

  const payslipNumber = generatePayslipNumber(payroll);
  const fileName = `${payslipNumber}.pdf`;
  const filePath = path.join(PAYSLIP_DIR, fileName);

  await renderPayslipPdf(payroll, filePath, payslipNumber);

  return Payslip.create({
    payrollId: payroll.id,
    employeeId: payroll.employeeId,
    payslipNumber,
    pdfPath: filePath,
  });
};

// ─── PDF layout ───
// Built with pdfkit primitives (no HTML/CSS available), section by section, each
// returning the Y coordinate the next section should start at.

function drawHeader(doc, payroll) {
  const margin = doc.page.margins.left;
  const contentWidth = doc.page.width - margin * 2;
  const logoSize = 58;
  const textX = margin + logoSize + 16;

  if (fs.existsSync(LOGO_PATH)) {
    doc.image(LOGO_PATH, margin, 34, { width: logoSize });
  }

  doc
    .font('Helvetica-Bold')
    .fontSize(17)
    .fillColor(COLORS.charcoal)
    .text(COMPANY.name, textX, 36, { width: contentWidth - logoSize - 16 });
  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(COLORS.gray)
    .text(COMPANY.address, textX, 57, { width: contentWidth - logoSize - 16 })
    .text(`${COMPANY.phone}  |  ${COMPANY.email}  |  ${COMPANY.website}`, textX, 69, {
      width: contentWidth - logoSize - 16,
    });

  const barY = 104;
  const barHeight = 30;
  doc.rect(margin, barY, contentWidth, barHeight).fill(COLORS.charcoal);
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor('#ffffff')
    .text('PAYSLIP', margin + 14, barY + 9);
  const period = `${MONTH_NAMES[payroll.payPeriodMonth - 1]} ${payroll.payPeriodYear}`;
  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(COLORS.amberLight)
    .text(period, margin, barY + 9.5, { width: contentWidth - 14, align: 'right' });

  doc.rect(margin, barY + barHeight, contentWidth, 3).fill(COLORS.amber);

  return barY + barHeight + 3 + 18;
}

function drawKV(doc, x, y, width, label, value) {
  doc
    .font('Helvetica-Bold')
    .fontSize(7.5)
    .fillColor(COLORS.oliveDark)
    .text(label.toUpperCase(), x, y, { width, characterSpacing: 0.4 });
  doc
    .font('Helvetica')
    .fontSize(9.5)
    .fillColor(COLORS.charcoal)
    .text(value || '-', x, y + 10, { width });
}

function drawInfoPanel(doc, payroll, startY) {
  const margin = doc.page.margins.left;
  const contentWidth = doc.page.width - margin * 2;
  const emp = payroll.employee;
  const colWidth = contentWidth / 2;
  const rowGap = 28;
  const rows = 5;
  const boxHeight = rows * rowGap + 24;

  doc
    .roundedRect(margin, startY, contentWidth, boxHeight, 4)
    .fillAndStroke(COLORS.cream, COLORS.grayLight);

  const leftX = margin + 16;
  const rightX = margin + colWidth + 8;
  const fieldWidth = colWidth - 32;
  const top = startY + 14;

  const leftRows = [
    ['Employee Name', `${emp.firstName} ${emp.lastName}`],
    ['Employee No.', emp.employeeNumber],
    ['Job Title', emp.jobTitle],
    ['Department', emp.department ? emp.department.name : 'N/A'],
    ['National ID (NRC)', emp.nationalId],
  ];
  const rightRows = [
    ['NAPSA No.', emp.napsaNumber],
    ['NHIMA No.', emp.nhimaNumber],
    ['TPIN', emp.tpin],
    ['Bank', emp.bankName],
    ['Account No.', emp.bankAccountNumber],
  ];

  leftRows.forEach(([label, value], i) => drawKV(doc, leftX, top + i * rowGap, fieldWidth, label, value));
  rightRows.forEach(([label, value], i) => drawKV(doc, rightX, top + i * rowGap, fieldWidth, label, value));

  return startY + boxHeight + 22;
}

function drawRow(doc, x, y, width, label, value, { bold = false, negative = false } = {}) {
  doc
    .font(bold ? 'Helvetica-Bold' : 'Helvetica')
    .fontSize(bold ? 10 : 9.5)
    .fillColor(COLORS.charcoal)
    .text(label, x, y, { width: width * 0.58 });
  doc
    .fillColor(negative && !bold ? COLORS.red : COLORS.charcoal)
    .text(value, x + width * 0.5, y, { width: width * 0.5, align: 'right' });
  return y + (bold ? 18 : 15);
}

function drawEarningsAndDeductions(doc, payroll, startY) {
  const margin = doc.page.margins.left;
  const contentWidth = doc.page.width - margin * 2;
  const gutter = 24;
  const colWidth = (contentWidth - gutter) / 2;
  const leftX = margin;
  const rightX = margin + colWidth + gutter;

  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(COLORS.oliveDark)
    .text('EARNINGS', leftX, startY, { characterSpacing: 0.5 })
    .text('DEDUCTIONS', rightX, startY, { characterSpacing: 0.5 });

  doc.lineWidth(1.2).strokeColor(COLORS.olive);
  doc.moveTo(leftX, startY + 14).lineTo(leftX + colWidth, startY + 14).stroke();
  doc.moveTo(rightX, startY + 14).lineTo(rightX + colWidth, startY + 14).stroke();

  // Earnings: Basic Salary + a single combined Total Allowances line, then Gross Pay.
  let ly = startY + 26;
  ly = drawRow(doc, leftX, ly, colWidth, 'Basic Salary', money(payroll.basicSalary));
  ly = drawRow(doc, leftX, ly, colWidth, 'Total Allowances', money(payroll.totalAllowances));
  ly += 6;
  doc.lineWidth(1).strokeColor(COLORS.charcoal)
    .moveTo(leftX, ly).lineTo(leftX + colWidth, ly).stroke();
  ly += 10;
  ly = drawRow(doc, leftX, ly, colWidth, 'GROSS PAY', money(payroll.grossPay), { bold: true });

  // Deductions: statutory trio always shown, then any other deduction items (staff
  // loan, union dues, salary advance, ...) - these only exist as rows when they
  // actually apply, so a zero-value salary advance never appears on the slip.
  let ry = startY + 26;
  ry = drawRow(doc, rightX, ry, colWidth, 'PAYE Tax', money(payroll.payeTax), { negative: true });
  ry = drawRow(doc, rightX, ry, colWidth, 'NAPSA Contribution (5%)', money(payroll.napsaContribution), { negative: true });
  ry = drawRow(doc, rightX, ry, colWidth, 'NHIMA Contribution (1%)', money(payroll.nhimaContribution), { negative: true });

  const extraDeductions = (payroll.items || []).filter((i) => i.type === 'deduction');
  extraDeductions.forEach((item) => {
    ry = drawRow(doc, rightX, ry, colWidth, item.label, money(item.amount), { negative: true });
  });

  ry += 6;
  doc.lineWidth(1).strokeColor(COLORS.charcoal)
    .moveTo(rightX, ry).lineTo(rightX + colWidth, ry).stroke();
  ry += 10;
  ry = drawRow(doc, rightX, ry, colWidth, 'TOTAL DEDUCTIONS', money(payroll.totalDeductions), { bold: true, negative: true });

  return Math.max(ly, ry) + 22;
}

function drawNetPay(doc, payroll, startY) {
  const margin = doc.page.margins.left;
  const contentWidth = doc.page.width - margin * 2;
  const boxHeight = 46;

  doc.rect(margin, startY, contentWidth, boxHeight).fill(COLORS.cream);

  // Double-rule border top and bottom for a traditional "final total" look.
  doc.lineWidth(2).strokeColor(COLORS.olive);
  doc.moveTo(margin, startY).lineTo(margin + contentWidth, startY).stroke();
  doc.moveTo(margin, startY + boxHeight).lineTo(margin + contentWidth, startY + boxHeight).stroke();
  doc.lineWidth(0.75).strokeColor(COLORS.amber);
  doc.moveTo(margin, startY + 4).lineTo(margin + contentWidth, startY + 4).stroke();
  doc.moveTo(margin, startY + boxHeight - 4).lineTo(margin + contentWidth, startY + boxHeight - 4).stroke();

  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor(COLORS.oliveDark)
    .text('NET PAY', margin + 16, startY + 16, { characterSpacing: 0.5 });
  doc
    .font('Helvetica-Bold')
    .fontSize(17)
    .fillColor(COLORS.charcoal)
    .text(money(payroll.netPay), margin, startY + 13, { width: contentWidth - 16, align: 'right' });

  return startY + boxHeight + 22;
}

function drawFooter(doc, payslipNumber, startY) {
  const margin = doc.page.margins.left;
  const contentWidth = doc.page.width - margin * 2;

  doc.lineWidth(0.5).strokeColor(COLORS.grayLight)
    .moveTo(margin, startY).lineTo(margin + contentWidth, startY).stroke();

  doc
    .font('Helvetica')
    .fontSize(7.5)
    .fillColor(COLORS.gray)
    .text(`Payslip No: ${payslipNumber}  |  Issued: ${new Date().toLocaleDateString('en-GB')}`, margin, startY + 10)
    .text('This is a system-generated payslip and does not require a signature.', margin, startY + 22, {
      width: contentWidth,
      align: 'center',
    });
  doc
    .font('Helvetica-Bold')
    .text(`${COMPANY.name} — Confidential`, margin, startY + 34, { width: contentWidth, align: 'center' });
}

const renderPayslipPdf = (payroll, filePath, payslipNumber) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    let y = drawHeader(doc, payroll);
    y = drawInfoPanel(doc, payroll, y);
    y = drawEarningsAndDeductions(doc, payroll, y);
    y = drawNetPay(doc, payroll, y);
    drawFooter(doc, payslipNumber, y);

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

const getPayslipById = async (id) => {
  const payslip = await Payslip.findByPk(id, {
    include: [
      { model: Payroll, as: 'payroll', include: [{ model: PayrollItem, as: 'items' }] },
      { model: Employee, as: 'employee' },
    ],
  });
  if (!payslip) throw ApiError.notFound('Payslip not found');
  return payslip;
};

const getPayslipByPayrollId = (payrollId) => Payslip.findOne({ where: { payrollId } });

const listPayslipsForEmployee = (employeeId) =>
  Payslip.findAll({
    where: { employeeId },
    include: [{ model: Payroll, as: 'payroll' }],
    order: [['issuedAt', 'DESC']],
  });

// Employee self-service view: only payslips whose payroll run has actually been PAID.
// A processed/approved-but-unpaid payslip shouldn't be downloadable by the employee yet.
const listPaidPayslipsForEmployee = (employeeId) =>
  Payslip.findAll({
    where: { employeeId },
    include: [{ model: Payroll, as: 'payroll', where: { status: 'paid' } }],
    order: [['issuedAt', 'DESC']],
  });

module.exports = {
  generatePayslip,
  getPayslipById,
  getPayslipByPayrollId,
  listPayslipsForEmployee,
  listPaidPayslipsForEmployee,
  PAYSLIP_DIR,
};
