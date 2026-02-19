import { useState, useEffect } from 'react';
import type { ColumnMapping, RawRow, AccountType } from '../core/types';
import type { AccountTypeDetection } from '../core/parse';

interface Props {
  headers: string[];
  rows: RawRow[];
  initialMapping: ColumnMapping | null;
  initialAccountType: AccountType;
  detectedAccountType: AccountTypeDetection | null;
  errors: string[];
  onConfirm: (mapping: ColumnMapping, accountType: AccountType) => void;
  onBack: () => void;
}

const ACCOUNT_TYPE_EXPLANATIONS: Record<AccountType, string> = {
  bank: 'Credits (money in) may be income, transfers, or bank interest. Debits (money out) may be expenses, transfers, or fees.',
  credit_card: 'Credits are payments made to the card, merchandise returns, or rewards — never income. Debits are charges on the card — never transfers.',
  unknown: 'Select an account type so transactions are categorized correctly.',
};

export function ColumnMapper({
  headers, rows, initialMapping, initialAccountType, detectedAccountType,
  errors, onConfirm, onBack,
}: Props) {
  const [date, setDate] = useState(initialMapping?.date ?? '');
  const [description, setDescription] = useState(initialMapping?.description ?? '');
  const [amountMode, setAmountMode] = useState<'single' | 'split'>(
    initialMapping?.debit ? 'split' : 'single'
  );
  const [amount, setAmount] = useState(initialMapping?.amount ?? '');
  const [debit, setDebit] = useState(initialMapping?.debit ?? '');
  const [credit, setCredit] = useState(initialMapping?.credit ?? '');
  const [categoryCol, setCategoryCol] = useState(initialMapping?.category ?? '');
  const [selectedAccountType, setSelectedAccountType] = useState<AccountType>(initialAccountType);

  useEffect(() => {
    if (initialMapping) {
      setDate(initialMapping.date);
      setDescription(initialMapping.description);
      if (initialMapping.debit) {
        setAmountMode('split');
        setDebit(initialMapping.debit);
        setCredit(initialMapping.credit ?? '');
      } else {
        setAmountMode('single');
        setAmount(initialMapping.amount ?? '');
      }
      setCategoryCol(initialMapping.category ?? '');
    }
    setSelectedAccountType(initialAccountType);
  }, [initialMapping, initialAccountType]);

  const isValid =
    date && description && (amountMode === 'single' ? amount : debit && credit);

  const handleConfirm = () => {
    if (!isValid) return;
    const categoryField = categoryCol ? { category: categoryCol } : {};
    const mapping: ColumnMapping =
      amountMode === 'single'
        ? { date, description, amount, ...categoryField }
        : { date, description, debit, credit, ...categoryField };
    onConfirm(mapping, selectedAccountType);
  };

  const preview = rows.slice(0, 5);

  const detectionLabel = detectedAccountType
    ? detectedAccountType.type === 'credit_card' ? 'Credit Card'
    : detectedAccountType.type === 'bank' ? 'Bank / Checking / Savings'
    : null
    : null;

  return (
    <div className="mapper-screen">
      <h2>Map Columns</h2>
      <p>{rows.length} rows found. {errors.length > 0 && <span className="warn">{errors.length} parse warning(s)</span>}</p>

      <div className="mapper-grid">
        <label>
          Date column
          <select value={date} onChange={(e) => setDate(e.target.value)}>
            <option value="">-- select --</option>
            {headers.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </label>

        <label>
          Description column
          <select value={description} onChange={(e) => setDescription(e.target.value)}>
            <option value="">-- select --</option>
            {headers.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </label>

        <label>
          Amount format
          <select value={amountMode} onChange={(e) => setAmountMode(e.target.value as 'single' | 'split')}>
            <option value="single">Single amount column (signed)</option>
            <option value="split">Separate debit/credit columns</option>
          </select>
        </label>

        {amountMode === 'single' ? (
          <label>
            Amount column
            <select value={amount} onChange={(e) => setAmount(e.target.value)}>
              <option value="">-- select --</option>
              {headers.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          </label>
        ) : (
          <>
            <label>
              Debit column (money out)
              <select value={debit} onChange={(e) => setDebit(e.target.value)}>
                <option value="">-- select --</option>
                {headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </label>
            <label>
              Credit column (money in)
              <select value={credit} onChange={(e) => setCredit(e.target.value)}>
                <option value="">-- select --</option>
                {headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </label>
          </>
        )}

        <label>
          Category column <span className="optional-label">(optional — improves accuracy)</span>
          <select value={categoryCol} onChange={(e) => setCategoryCol(e.target.value)}>
            <option value="">-- none --</option>
            {headers.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </label>
      </div>

      {/* Account Type */}
      <div className="account-type-section">
        <h3>Account Type</h3>

        {detectedAccountType && detectedAccountType.confidence === 'high' && detectionLabel && (
          <p className="detection-notice">
            Detected: <strong>{detectionLabel}</strong>
            {detectedAccountType.reasons.length > 0 && (
              <span className="detection-reasons">
                {' '}— {detectedAccountType.reasons.join('; ')}
              </span>
            )}
          </p>
        )}

        {(!detectedAccountType || detectedAccountType.confidence === 'low' || detectedAccountType.type === 'unknown') && (
          <p className="detection-notice warn">
            Could not automatically determine the account type. Please select one below — it affects how transactions are categorized.
          </p>
        )}

        <div className="account-type-toggle">
          <button
            type="button"
            className={`toggle-btn${selectedAccountType === 'bank' ? ' active' : ''}`}
            onClick={() => setSelectedAccountType('bank')}
          >
            Bank / Checking / Savings
          </button>
          <button
            type="button"
            className={`toggle-btn${selectedAccountType === 'credit_card' ? ' active' : ''}`}
            onClick={() => setSelectedAccountType('credit_card')}
          >
            Credit Card
          </button>
        </div>

        <p className="account-type-explanation">
          {ACCOUNT_TYPE_EXPLANATIONS[selectedAccountType]}
        </p>
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div className="preview-table-wrap">
          <h3>Preview (first 5 rows)</h3>
          <table className="preview-table">
            <thead>
              <tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {preview.map((row, i) => (
                <tr key={i}>
                  {headers.map((h) => <td key={h}>{row[h]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mapper-actions">
        <button onClick={onBack}>Back</button>
        <button className="primary" disabled={!isValid} onClick={handleConfirm}>
          Process Transactions
        </button>
      </div>
    </div>
  );
}
