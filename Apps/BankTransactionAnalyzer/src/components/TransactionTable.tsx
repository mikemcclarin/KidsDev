import { useState, useMemo, useEffect } from 'react';
import type { Transaction, TransactionType } from '../core/types';
import type { TransactionFilter } from '../App';

interface Props {
  transactions: Transaction[];
  onSelectTransaction: (t: Transaction) => void;
  externalFilter?: TransactionFilter | null;
  onClearExternalFilter?: () => void;
}

type SortField = 'date' | 'amount_signed' | 'merchant_canonical' | 'category';
type SortDir = 'asc' | 'desc';

const TYPE_COLORS: Record<TransactionType, string> = {
  purchase: '#e74c3c',
  refund: '#2ecc71',
  transfer: '#3498db',
  fee: '#e67e22',
  income: '#27ae60',
  reward: '#9b59b6',
  payment: '#f39c12',
  atm: '#95a5a6',
  unknown: '#bdc3c7',
};

export function TransactionTable({ transactions, onSelectTransaction, externalFilter, onClearExternalFilter }: Props) {
  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [showUncategorized, setShowUncategorized] = useState(false);
  const [showLowConfidence, setShowLowConfidence] = useState(false);

  // Apply external drill-down filter
  useEffect(() => {
    if (!externalFilter) return;

    // Reset all filters first
    setSearch('');
    setTypeFilter('all');
    setAmountMin('');
    setAmountMax('');
    setShowUncategorized(false);
    setShowLowConfidence(false);

    if (externalFilter.category) {
      setCategoryFilter(externalFilter.category);
    } else {
      setCategoryFilter('all');
    }

    if (externalFilter.month) {
      const [y, m] = externalFilter.month.split('-');
      const lastDay = new Date(Number(y), Number(m), 0).getDate();
      setDateFrom(`${externalFilter.month}-01`);
      setDateTo(`${externalFilter.month}-${String(lastDay).padStart(2, '0')}`);
    } else {
      setDateFrom('');
      setDateTo('');
    }
  }, [externalFilter]);

  // Sort
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const categories = useMemo(() => {
    const set = new Set(transactions.map((t) => t.category).filter(Boolean));
    return Array.from(set).sort();
  }, [transactions]);

  const filtered = useMemo(() => {
    let list = transactions;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.raw_description.toLowerCase().includes(q) ||
          t.merchant_canonical.toLowerCase().includes(q)
      );
    }
    if (typeFilter !== 'all') list = list.filter((t) => t.type === typeFilter);
    if (categoryFilter !== 'all') list = list.filter((t) => t.category === categoryFilter);
    if (dateFrom) list = list.filter((t) => t.date >= dateFrom);
    if (dateTo) list = list.filter((t) => t.date <= dateTo);
    if (amountMin) list = list.filter((t) => Math.abs(t.amount_signed) >= parseFloat(amountMin));
    if (amountMax) list = list.filter((t) => Math.abs(t.amount_signed) <= parseFloat(amountMax));
    if (showUncategorized) list = list.filter((t) => !t.category || t.category === 'Other');
    if (showLowConfidence) list = list.filter((t) => t.merchant_confidence < 0.5);

    // External amountSign filter
    if (externalFilter?.amountSign === 'negative') {
      list = list.filter((t) => t.amount_signed < 0);
    } else if (externalFilter?.amountSign === 'positive') {
      list = list.filter((t) => t.amount_signed > 0);
    }

    // Sort
    list = [...list].sort((a, b) => {
      let cmp: number;
      switch (sortField) {
        case 'date': cmp = a.date.localeCompare(b.date); break;
        case 'amount_signed': cmp = a.amount_signed - b.amount_signed; break;
        case 'merchant_canonical': cmp = a.merchant_canonical.localeCompare(b.merchant_canonical); break;
        case 'category': cmp = a.category.localeCompare(b.category); break;
        default: cmp = 0;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [transactions, search, typeFilter, categoryFilter, dateFrom, dateTo, amountMin, amountMax, showUncategorized, showLowConfidence, sortField, sortDir, externalFilter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortIcon = (field: SortField) => {
    if (sortField !== field) return '';
    return sortDir === 'asc' ? ' ▲' : ' ▼';
  };

  const formatAmount = (n: number) => {
    const prefix = n >= 0 ? '+' : '';
    return prefix + n.toFixed(2);
  };

  const confidenceLabel = (c: number) => {
    if (c >= 0.9) return { text: 'High', cls: 'conf-high' };
    if (c >= 0.5) return { text: 'Med', cls: 'conf-med' };
    return { text: 'Low', cls: 'conf-low' };
  };

  const filterDescription = (() => {
    if (!externalFilter) return null;
    const parts: string[] = [];
    if (externalFilter.category) parts.push(`Category = ${externalFilter.category}`);
    if (externalFilter.month) parts.push(`Month = ${externalFilter.month}`);
    if (externalFilter.amountSign === 'negative') parts.push('Debits only');
    if (externalFilter.amountSign === 'positive') parts.push('Credits only');
    return parts.length > 0 ? parts.join(', ') : 'All transactions';
  })();

  return (
    <div className="txn-table-section">
      {/* Drill-down filter banner */}
      {filterDescription && (
        <div className="drill-filter-banner">
          <span>Filtered by: {filterDescription}</span>
          <button onClick={onClearExternalFilter}>Clear filter</button>
        </div>
      )}

      {/* Filter bar */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search description or merchant..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="filter-search"
        />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">All Types</option>
          <option value="purchase">Purchase</option>
          <option value="refund">Refund</option>
          <option value="transfer">Transfer</option>
          <option value="fee">Fee</option>
          <option value="income">Income</option>
          <option value="reward">Reward</option>
          <option value="payment">Payment</option>
          <option value="atm">ATM</option>
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="all">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} title="From date" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} title="To date" />
        <input type="number" placeholder="Min $" value={amountMin} onChange={(e) => setAmountMin(e.target.value)} className="filter-amt" />
        <input type="number" placeholder="Max $" value={amountMax} onChange={(e) => setAmountMax(e.target.value)} className="filter-amt" />
        <label className="filter-check">
          <input type="checkbox" checked={showUncategorized} onChange={(e) => setShowUncategorized(e.target.checked)} />
          Uncategorized
        </label>
        <label className="filter-check">
          <input type="checkbox" checked={showLowConfidence} onChange={(e) => setShowLowConfidence(e.target.checked)} />
          Low confidence
        </label>
      </div>

      <div className="txn-count">{filtered.length} of {transactions.length} transactions</div>

      <div className="table-wrap">
        <table className="txn-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('date')}>Date{sortIcon('date')}</th>
              <th>Raw Description</th>
              <th onClick={() => handleSort('merchant_canonical')}>Merchant{sortIcon('merchant_canonical')}</th>
              <th onClick={() => handleSort('category')}>Category{sortIcon('category')}</th>
              <th onClick={() => handleSort('amount_signed')}>Amount{sortIcon('amount_signed')}</th>
              <th>Type</th>
              <th>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => {
              const conf = confidenceLabel(t.merchant_confidence);
              return (
                <tr key={t.id} onClick={() => onSelectTransaction(t)} className="txn-row">
                  <td>{t.date}</td>
                  <td className="desc-cell" title={t.raw_description}>{t.raw_description}</td>
                  <td>{t.merchant_canonical}</td>
                  <td>{t.category}</td>
                  <td className={t.amount_signed >= 0 ? 'amt-pos' : 'amt-neg'}>
                    {formatAmount(t.amount_signed)}
                  </td>
                  <td>
                    <span className="type-badge" style={{ backgroundColor: TYPE_COLORS[t.type] }}>
                      {t.type}
                    </span>
                    {t.linked_transaction_id && (
                      <span className="linked-badge" title={`Linked to ${t.linked_transaction_id}`}>🔗</span>
                    )}
                  </td>
                  <td><span className={conf.cls}>{conf.text}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
