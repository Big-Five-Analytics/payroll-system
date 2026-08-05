const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { Payslip, Payroll, Employee, Department, PayrollItem } = require('../models');
const ApiError = require('../utils/ApiError');

const PAYSLIP_DIR = path.join(__dirname, '../../storage/payslips');
if (!fs.existsSync(PAYSLIP_DIR)) fs.mkdirSync(PAYSLIP_DIR, { recursive: true });

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

  await renderPayslipPdf(payroll, filePath);

  return Payslip.create({
    payrollId: payroll.id,
    employeeId: payroll.employeeId,
    payslipNumber,
    pdfPath: filePath,
  });
};

const renderPayslipPdf = (payroll, filePath) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const emp = payroll.employee;

    doc.fontSize(18).text('Big Five Investments Ltd', { align: 'center' });
    doc.fontSize(12).text('Payslip', { align: 'center' });
    doc.moveDown();

    doc.fontSize(10);
    doc.text(`Employee: ${emp.firstName} ${emp.lastName} (${emp.employeeNumber})`);
    doc.text(`Department: ${emp.department ? emp.department.name : 'N/A'}`);
    doc.text(`Job Title: ${emp.jobTitle}`);
    doc.text(`Pay Period: ${payroll.payPeriodMonth}/${payroll.payPeriodYear}`);
    doc.moveDown();

    doc.fontSize(12).text('Earnings', { underline: true });
    doc.fontSize(10);
    doc.text(`Basic Salary: ZMW ${Number(payroll.basicSalary).toFixed(2)}`);
    payroll.items
      .filter((i) => i.type === 'allowance')
      .forEach((i) => doc.text(`${i.label}: ZMW ${Number(i.amount).toFixed(2)}`));
    doc.text(`Gross Pay: ZMW ${Number(payroll.grossPay).toFixed(2)}`, { bold: true });
    doc.moveDown();

    doc.fontSize(12).text('Deductions', { underline: true });
    doc.fontSize(10);
    payroll.items
      .filter((i) => i.type === 'deduction' || i.type === 'statutory')
      .forEach((i) => doc.text(`${i.label}: ZMW ${Number(i.amount).toFixed(2)}`));
    doc.text(`Total Deductions: ZMW ${Number(payroll.totalDeductions).toFixed(2)}`);
    doc.moveDown();

    doc.fontSize(13).text(`Net Pay: ZMW ${Number(payroll.netPay).toFixed(2)}`, { underline: true });
    doc.moveDown(2);
    doc.fontSize(8).text('This is a system-generated payslip and does not require a signature.', {
      align: 'center',
      color: 'grey',
    });

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
