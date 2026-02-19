import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Transaction, MerchantEntry, Rule } from '../core/types';
import { DEFAULT_CATEGORIES } from '../core/types';

interface Props {
  transaction: Transaction;
  transactions: Transaction[];
  onClose: () => void;
  onAddOverride: (raw: string, canonical: string) => void;
  onUpdateMerchant: (entry: MerchantEntry) => void;
  onAddRule: (rule: Rule) => void;
  onReprocess: () => void;
}

export function TransactionDetail({
  transaction: t,
  transactions,
  onClose,
  onAddOverride,
  onUpdateMerchant,
  onAddRule,
  onReprocess,
}: Props) {
  const [merchantName, setMerchantName] = useState(t.merchant_canonical);
  const [category, setCategory] = useState(t.category);
  const [applyAll, setApplyAll] = useState(false);

  const similarCount = transactions.filter(
    (tx) => tx.merchant_canonical === t.merchant_canonical && tx.id !== t.id
  ).length;

  const handleSave = () => {
    // Save merchant override
    if (merchantName !== t.merchant_canonical) {
      onAddOverride(t.raw_description, merchantName);
    }

    // If "apply to all similar", create a rule
    if (applyAll && category) {
      onAddRule({
        id: uuidv4(),
        enabled: true,
        priority: 10,
        name: `${merchantName} → ${category}`,
        match: { merchant: merchantName || t.merchant_canonical },
        action: { category },
      });

      // Also update merchant default category
      onUpdateMerchant({
        canonical_name: merchantName || t.merchant_canonical,
        aliases: [merchantName || t.merchant_canonical],
        patterns: [],
        pattern_strings: [],
        default_category: category,
      });
    } else if (category !== t.category) {
      // Just a one-off rule for this description
      onAddRule({
        id: uuidv4(),
        enabled: true,
        priority: 5,
        name: `${t.raw_description.slice(0, 30)}... → ${category}`,
        match: { keyword: t.raw_description.slice(0, 20) },
        action: { category },
      });
    }

    onReprocess();
    onClose();
  };

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <h3>Transaction Detail</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="detail-body">
        <div className="detail-row">
          <span className="detail-label">Date</span>
          <span>{t.date}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Raw Description</span>
          <span className="raw-desc">{t.raw_description}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Amount</span>
          <span className={t.amount_signed >= 0 ? 'amt-pos' : 'amt-neg'}>
            {t.amount_signed >= 0 ? '+' : ''}{t.amount_signed.toFixed(2)}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Type</span>
          <span>{t.type}{t.linked_transaction_id ? ` (linked)` : ''}</span>
        </div>

        <hr />

        <label className="detail-field">
          Merchant Name
          <input
            type="text"
            value={merchantName}
            onChange={(e) => setMerchantName(e.target.value)}
          />
        </label>

        <label className="detail-field">
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">-- select --</option>
            {DEFAULT_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>

        {similarCount > 0 && (
          <label className="filter-check">
            <input
              type="checkbox"
              checked={applyAll}
              onChange={(e) => setApplyAll(e.target.checked)}
            />
            Apply to all similar ({similarCount} other transactions)
          </label>
        )}

        <div className="detail-actions">
          <button onClick={onClose}>Cancel</button>
          <button className="primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
