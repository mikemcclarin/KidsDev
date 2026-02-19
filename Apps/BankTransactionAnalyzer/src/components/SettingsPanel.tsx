import { useState } from 'react';
import type { RefundSettings } from '../core/types';

interface Props {
  settings: RefundSettings;
  onSave: (settings: RefundSettings) => void;
  onReprocess: () => void;
}

export function SettingsPanel({ settings, onSave, onReprocess }: Props) {
  const [daysWindow, setDaysWindow] = useState(settings.days_window);
  const [amountTol, setAmountTol] = useState(settings.amount_tolerance);
  const [matchThresh, setMatchThresh] = useState(settings.match_threshold);

  const handleSave = () => {
    const updated: RefundSettings = {
      days_window: daysWindow,
      amount_tolerance: amountTol,
      match_threshold: matchThresh,
    };
    onSave(updated);
    onReprocess();
  };

  return (
    <div className="settings-panel">
      <h3>Refund Linking Settings</h3>
      <p className="settings-desc">
        These thresholds control how refunds are matched to original purchases.
        Adjust if you see incorrect refund links.
      </p>

      <label className="setting-field">
        Days window (max days between purchase and refund)
        <input
          type="number"
          min={1}
          max={365}
          value={daysWindow}
          onChange={(e) => setDaysWindow(parseInt(e.target.value) || 90)}
        />
      </label>

      <label className="setting-field">
        Amount tolerance ({(amountTol * 100).toFixed(0)}%)
        <input
          type="range"
          min={0}
          max={0.5}
          step={0.01}
          value={amountTol}
          onChange={(e) => setAmountTol(parseFloat(e.target.value))}
        />
        <span className="setting-value">{(amountTol * 100).toFixed(0)}%</span>
      </label>

      <label className="setting-field">
        Merchant match threshold ({(matchThresh * 100).toFixed(0)}%)
        <input
          type="range"
          min={0.1}
          max={1}
          step={0.05}
          value={matchThresh}
          onChange={(e) => setMatchThresh(parseFloat(e.target.value))}
        />
        <span className="setting-value">{(matchThresh * 100).toFixed(0)}%</span>
      </label>

      <button className="primary" onClick={handleSave}>Save & Reprocess</button>
    </div>
  );
}
