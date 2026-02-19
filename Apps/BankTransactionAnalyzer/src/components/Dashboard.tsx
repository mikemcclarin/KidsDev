import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import type { Transaction, AccountType } from '../core/types';
import type { TransactionFilter } from '../App';
import { summarizeByCategory } from '../core/aggregate';
import { monthlyCashFlow } from '../core/aggregate';

interface Props {
  transactions: Transaction[];
  accountType: AccountType;
  onDrillDown: (filter: TransactionFilter) => void;
}

const COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
  '#1abc9c', '#e67e22', '#34495e', '#d35400', '#27ae60',
  '#2980b9', '#8e44ad', '#c0392b', '#16a085', '#f1c40f',
];

export function Dashboard({ transactions, accountType, onDrillDown }: Props) {
  const isCC = accountType === 'credit_card';

  const categoryData = useMemo(() => {
    return summarizeByCategory(transactions)
      .filter((c) => c.total < 0) // spending only
      .map((c) => ({ name: c.category, value: Math.abs(c.total), count: c.count }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const cashFlowData = useMemo(() => {
    return monthlyCashFlow(transactions);
  }, [transactions]);

  const totalSpending = categoryData.reduce((s, c) => s + c.value, 0);
  // For CC, positive amounts are payments/credits back to the card — not income
  const totalCredits = transactions
    .filter((t) => t.amount_signed > 0 && t.type !== 'refund')
    .reduce((s, t) => s + t.amount_signed, 0);

  const incomeCreditLabel = isCC ? 'Total Credits' : 'Total Income';
  const netLabel = isCC ? 'Net Charges' : 'Net';
  const chartTitle = isCC ? 'Monthly Card Activity' : 'Monthly Cash Flow';
  const creditBarLabel = isCC ? 'Payments & Credits' : 'Income';

  return (
    <div className="dashboard">
      <div className="summary-cards">
        <div className="summary-card spending clickable" onClick={() => onDrillDown({ amountSign: 'negative' })}>
          <div className="card-label">{isCC ? 'Total Charges' : 'Total Spending'}</div>
          <div className="card-value">-${totalSpending.toFixed(2)}</div>
        </div>
        <div className="summary-card income clickable" onClick={() => onDrillDown({ amountSign: 'positive' })}>
          <div className="card-label">{incomeCreditLabel}</div>
          <div className="card-value">+${totalCredits.toFixed(2)}</div>
        </div>
        <div className="summary-card net">
          <div className="card-label">{netLabel}</div>
          <div className="card-value">{(totalCredits - totalSpending) >= 0 ? '+' : ''}{(totalCredits - totalSpending).toFixed(2)}</div>
        </div>
        <div className="summary-card count clickable" onClick={() => onDrillDown({})}>
          <div className="card-label">Transactions</div>
          <div className="card-value">{transactions.length}</div>
        </div>
      </div>

      <div className="chart-grid">
        {categoryData.length > 0 && (
          <div className="chart-card">
            <h3>Spending by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={COLORS[i % COLORS.length]}
                      cursor="pointer"
                      onClick={() => onDrillDown({ category: entry.name })}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number | string | undefined) => `$${Number(v ?? 0).toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {cashFlowData.length > 0 && (
          <div className="chart-card">
            <h3>{chartTitle}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(v: number | string | undefined) => `$${Number(v ?? 0).toFixed(2)}`} />
                <Legend />
                <Bar
                  dataKey="income"
                  fill="#2ecc71"
                  name={creditBarLabel}
                  cursor="pointer"
                  onClick={(data: { month?: string }) => {
                    if (data?.month) onDrillDown({ month: data.month, amountSign: 'positive' });
                  }}
                />
                <Bar
                  dataKey="spending"
                  fill="#e74c3c"
                  name={isCC ? 'Charges' : 'Spending'}
                  cursor="pointer"
                  onClick={(data: { month?: string }) => {
                    if (data?.month) onDrillDown({ month: data.month, amountSign: 'negative' });
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
