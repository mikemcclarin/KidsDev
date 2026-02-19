import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Rule } from '../core/types';
import { DEFAULT_CATEGORIES } from '../core/types';

interface Props {
  rules: Rule[];
  onAddRule: (rule: Rule) => void;
  onRemoveRule: (id: string) => void;
  onReprocess: () => void;
}

export function RulesPanel({ rules, onAddRule, onRemoveRule, onReprocess }: Props) {
  const [name, setName] = useState('');
  const [matchType, setMatchType] = useState<'merchant' | 'keyword' | 'regex'>('merchant');
  const [matchValue, setMatchValue] = useState('');
  const [category, setCategory] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleAdd = () => {
    if (!name || !matchValue || !category) return;
    const match: Record<string, string> = {};
    match[matchType] = matchValue;

    onAddRule({
      id: uuidv4(),
      enabled: true,
      priority: rules.length + 1,
      name,
      match,
      action: { category },
    });
    setName('');
    setMatchValue('');
    setCategory('');
    setShowForm(false);
    onReprocess();
  };

  const handleToggle = (rule: Rule) => {
    onAddRule({ ...rule, enabled: !rule.enabled });
    onReprocess();
  };

  const handleDelete = (id: string) => {
    onRemoveRule(id);
    onReprocess();
  };

  return (
    <div className="rules-panel">
      <div className="panel-header">
        <h3>Category Rules</h3>
        <button className="primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Rule'}
        </button>
      </div>

      {showForm && (
        <div className="rule-form">
          <input placeholder="Rule name" value={name} onChange={(e) => setName(e.target.value)} />
          <select value={matchType} onChange={(e) => setMatchType(e.target.value as 'merchant' | 'keyword' | 'regex')}>
            <option value="merchant">Merchant equals</option>
            <option value="keyword">Description contains</option>
            <option value="regex">Regex pattern</option>
          </select>
          <input placeholder="Match value" value={matchValue} onChange={(e) => setMatchValue(e.target.value)} />
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Category...</option>
            {DEFAULT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button className="primary" onClick={handleAdd} disabled={!name || !matchValue || !category}>
            Save Rule
          </button>
        </div>
      )}

      <div className="rules-list">
        {rules.length === 0 && <p className="empty-msg">No custom rules yet. Rules let you auto-categorize transactions.</p>}
        {rules.map((r) => (
          <div key={r.id} className={`rule-item ${r.enabled ? '' : 'disabled'}`}>
            <div className="rule-info">
              <strong>{r.name}</strong>
              <span className="rule-match">
                {r.match.merchant && `merchant = "${r.match.merchant}"`}
                {r.match.keyword && `contains "${r.match.keyword}"`}
                {r.match.regex && `regex /${r.match.regex}/`}
                {' → '}{r.action.category}
              </span>
            </div>
            <div className="rule-actions">
              <button onClick={() => handleToggle(r)}>{r.enabled ? 'Disable' : 'Enable'}</button>
              <button className="danger" onClick={() => handleDelete(r.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
