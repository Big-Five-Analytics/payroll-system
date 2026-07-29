import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { previewWorkerUpload, commitWorkerUpload } from '../../services/generalWorkerService';

const SYSTEM_FIELDS = [
  { key: 'fullName', label: 'Full Name', required: true },
  { key: 'nationalId', label: 'National ID / NRC' },
  { key: 'workerNumber', label: 'Worker Number' },
  { key: 'jobTitle', label: 'Job Title' },
  { key: 'payRate', label: 'Pay Rate' },
  { key: 'payRateType', label: 'Pay Rate Type (daily/monthly)' },
  { key: 'phone', label: 'Phone' },
  { key: 'nextOfKinName', label: 'Next of Kin Name' },
  { key: 'nextOfKinPhone', label: 'Next of Kin Phone' },
  { key: 'contractStartDate', label: 'Contract Start Date' },
  { key: 'contractEndDate', label: 'Contract End Date' },
  { key: 'leaveBalance', label: 'Leave Balance (days)' },
];

const emptyState = { step: 1, site: '', file: null, preview: null, mapping: {}, result: null };

export default function UploadWorkersModal({ open, onClose, onImported, sites }) {
  const [state, setState] = useState(emptyState);
  const [loading, setLoading] = useState(false);
  const { step, site, file, preview, mapping, result } = state;

  const close = () => {
    setState(emptyState);
    onClose();
  };

  const handlePreview = async () => {
    if (!site.trim()) return toast.error('Site is required');
    if (!file) return toast.error('Please choose a spreadsheet file');
    setLoading(true);
    try {
      const { data } = await previewWorkerUpload(file, site.trim());
      const { headers, suggestedMapping, sampleRows, totalRows, rows } = data.data;
      setState((s) => ({
        ...s,
        step: 2,
        preview: { headers, sampleRows, totalRows, rows },
        mapping: suggestedMapping,
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to read spreadsheet');
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (mapping.fullName === undefined || mapping.fullName === '') {
      return toast.error('Full Name must be mapped to a column');
    }
    setLoading(true);
    try {
      const { data } = await commitWorkerUpload({
        site: site.trim(),
        mapping,
        rows: preview.rows,
        fileName: file.name,
      });
      setState((s) => ({ ...s, step: 3, result: data.data }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to import spreadsheet');
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    onImported();
    close();
  };

  return (
    <Modal open={open} onClose={close} title="Upload Worker Spreadsheet" size="xl" footer={
      <>
        <Button variant="secondary" onClick={close}>{step === 3 ? 'Close' : 'Cancel'}</Button>
        {step === 1 && (
          <Button onClick={handlePreview} disabled={loading}>{loading ? 'Reading...' : 'Next'}</Button>
        )}
        {step === 2 && (
          <Button onClick={handleCommit} disabled={loading}>{loading ? 'Importing...' : 'Confirm Import'}</Button>
        )}
        {step === 3 && (
          <Button onClick={handleDone}>Done</Button>
        )}
      </>
    }>
      <p className="mb-4 text-xs font-medium uppercase tracking-wide text-brand-600">
        {step === 3 ? 'Import complete' : `Step ${step} of 2 - ${step === 1 ? 'Choose file' : 'Map columns'}`}
      </p>

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-500">
            Choose the site this spreadsheet belongs to and pick the .xlsx/.xls file. You'll map its columns
            to worker fields on the next step - layouts don't need to match between sites.
          </p>
          <Input
            label="Site"
            list="upload-site-options"
            value={site}
            onChange={(e) => setState((s) => ({ ...s, site: e.target.value }))}
            placeholder="e.g. Kitwe Warehouse"
          />
          <datalist id="upload-site-options">
            {sites.map((s) => <option key={s} value={s} />)}
          </datalist>
          <Input
            label="Spreadsheet file"
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setState((s) => ({ ...s, file: e.target.files?.[0] || null }))}
          />
        </div>
      )}

      {step === 2 && preview && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-500">
            {preview.totalRows} row{preview.totalRows === 1 ? '' : 's'} detected. Map each field to the matching
            column from the spreadsheet (columns already guessed where possible).
          </p>

          <div className="grid grid-cols-2 gap-3">
            {SYSTEM_FIELDS.map(({ key, label, required }) => (
              <Select
                key={key}
                label={label + (required ? ' *' : '')}
                value={mapping[key] ?? ''}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    mapping: { ...s.mapping, [key]: e.target.value === '' ? undefined : Number(e.target.value) },
                  }))
                }
              >
                <option value="">-- Not in file --</option>
                {preview.headers.map((h, idx) => (
                  <option key={idx} value={idx}>{h || `Column ${idx + 1}`}</option>
                ))}
              </Select>
            ))}
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Preview (first {preview.sampleRows.length} rows)</p>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 text-left text-gray-500">
                    {preview.headers.map((h, idx) => (
                      <th key={idx} className="py-2 px-3 font-medium whitespace-nowrap">{h || `Column ${idx + 1}`}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.sampleRows.map((row, rIdx) => (
                    <tr key={rIdx} className="border-t border-gray-100">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="py-2 px-3 whitespace-nowrap text-gray-600">{String(cell ?? '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {step === 3 && result && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-green-50 py-3">
              <p className="text-2xl font-semibold text-green-700">{result.created}</p>
              <p className="text-xs text-green-700">Created</p>
            </div>
            <div className="rounded-lg bg-blue-50 py-3">
              <p className="text-2xl font-semibold text-blue-700">{result.updated}</p>
              <p className="text-xs text-blue-700">Updated</p>
            </div>
            <div className="rounded-lg bg-gray-100 py-3">
              <p className="text-2xl font-semibold text-gray-700">{result.skipped}</p>
              <p className="text-xs text-gray-700">Skipped</p>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div>
              <p className="text-sm font-medium text-red-700 mb-1">Row issues</p>
              <div className="max-h-40 overflow-y-auto rounded-lg border border-red-100 bg-red-50 p-2 text-xs text-red-700">
                {result.errors.map((e, idx) => (
                  <p key={idx}>Row {e.row}: {e.reason}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
