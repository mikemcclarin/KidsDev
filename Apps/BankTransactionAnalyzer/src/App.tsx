import { useState } from 'react';
import { useTransactionPipeline } from './hooks/useTransactionPipeline';
import { FileImport } from './components/FileImport';
import { ColumnMapper } from './components/ColumnMapper';
import { TransactionTable } from './components/TransactionTable';
import { TransactionDetail } from './components/TransactionDetail';
import { Dashboard } from './components/Dashboard';
import { RulesPanel } from './components/RulesPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { ExportButton } from './components/ExportButton';
import type { Transaction } from './core/types';
import './App.css';

export interface TransactionFilter {
  category?: string;
  month?: string;          // YYYY-MM for bar chart clicks
  amountSign?: 'positive' | 'negative';
}

type Tab = 'transactions' | 'dashboard' | 'rules' | 'settings';

function App() {
  const pipeline = useTransactionPipeline();
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [tab, setTab] = useState<Tab>('transactions');
  const [drillFilter, setDrillFilter] = useState<TransactionFilter | null>(null);

  const handleDrillDown = (filter: TransactionFilter) => {
    setDrillFilter(filter);
    setTab('transactions');
  };

  if (!pipeline.loaded) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Bank Transaction Analyzer</h1>
        <span className="privacy-badge">100% Local</span>
      </header>

      {pipeline.step === 'import' && (
        <FileImport onFile={pipeline.importFile} />
      )}

      {pipeline.step === 'mapping' && (
        <ColumnMapper
          headers={pipeline.headers}
          rows={pipeline.rawRows}
          initialMapping={pipeline.mapping}
          initialAccountType={pipeline.accountType}
          detectedAccountType={pipeline.detectedAccountType}
          errors={pipeline.parseErrors}
          onConfirm={pipeline.confirmMapping}
          onBack={pipeline.reset}
        />
      )}

      {pipeline.step === 'review' && (
        <>
          <nav className="tabs">
            <button className={tab === 'transactions' ? 'active' : ''} onClick={() => { setTab('transactions'); setDrillFilter(null); }}>
              Transactions
            </button>
            <button className={tab === 'dashboard' ? 'active' : ''} onClick={() => { setTab('dashboard'); setDrillFilter(null); }}>
              Dashboard
            </button>
            <button className={tab === 'rules' ? 'active' : ''} onClick={() => { setTab('rules'); setDrillFilter(null); }}>
              Rules
            </button>
            <button className={tab === 'settings' ? 'active' : ''} onClick={() => { setTab('settings'); setDrillFilter(null); }}>
              Settings
            </button>
            <div className="tab-spacer" />
            <ExportButton transactions={pipeline.transactions} />
            <button onClick={pipeline.reset}>New Import</button>
          </nav>

          {tab === 'transactions' && (
            <div className="main-content">
              <TransactionTable
                transactions={pipeline.transactions}
                onSelectTransaction={setSelectedTxn}
                externalFilter={drillFilter}
                onClearExternalFilter={() => setDrillFilter(null)}
              />
              {selectedTxn && (
                <TransactionDetail
                  transaction={selectedTxn}
                  transactions={pipeline.transactions}
                  onClose={() => setSelectedTxn(null)}
                  onAddOverride={pipeline.addOverride}
                  onUpdateMerchant={pipeline.updateMerchant}
                  onAddRule={pipeline.addRule}
                  onReprocess={pipeline.reprocess}
                />
              )}
            </div>
          )}

          {tab === 'dashboard' && (
            <Dashboard transactions={pipeline.transactions} accountType={pipeline.accountType} onDrillDown={handleDrillDown} />
          )}

          {tab === 'rules' && (
            <RulesPanel
              rules={pipeline.rules}
              onAddRule={pipeline.addRule}
              onRemoveRule={pipeline.removeRule}
              onReprocess={pipeline.reprocess}
            />
          )}

          {tab === 'settings' && (
            <SettingsPanel
              settings={pipeline.refundSettings}
              onSave={pipeline.updateRefundSettings}
              onReprocess={pipeline.reprocess}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;
