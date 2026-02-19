import { useState, useCallback, useEffect, useRef } from 'react';
import type { Transaction, ColumnMapping, MerchantEntry, Rule, RefundSettings, RawRow, AccountType } from '../core/types';
import { DEFAULT_REFUND_SETTINGS } from '../core/types';
import { SEED_MERCHANTS } from '../core/merchant';
import { parseCSV, detectColumnMapping, formatSignature, detectAccountType } from '../core/parse';
import type { AccountTypeDetection } from '../core/parse';
import { mapRows } from '../core/map';
import { resolveAllMerchants } from '../core/merchant';
import { categorizeAll } from '../core/rules';
import { linkRefunds } from '../core/refunds';
import * as db from '../store/db';

export type AppStep = 'import' | 'mapping' | 'review';

export function useTransactionPipeline() {
  const [step, setStep] = useState<AppStep>('import');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<RawRow[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [accountType, setAccountType] = useState<AccountType>('unknown');
  const [detectedAccountType, setDetectedAccountType] = useState<AccountTypeDetection | null>(null);

  // Persisted state
  const [merchants, setMerchants] = useState<MerchantEntry[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [overrides, setOverrides] = useState<Map<string, string>>(new Map());
  const [refundSettings, setRefundSettings] = useState<RefundSettings>(DEFAULT_REFUND_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const fileNameRef = useRef('');

  // Load persisted data on mount
  useEffect(() => {
    (async () => {
      const [savedMerchants, savedRules, savedOverrides, savedSettings] = await Promise.all([
        db.loadMerchants(),
        db.loadRules(),
        db.loadOverrides(),
        db.loadRefundSettings(),
      ]);

      // Merge seed merchants with saved (saved take priority by canonical name)
      const savedNames = new Set(savedMerchants.map((m) => m.canonical_name));
      const merged = [...savedMerchants, ...SEED_MERCHANTS.filter((m) => !savedNames.has(m.canonical_name))];

      setMerchants(merged);
      setRules(savedRules);
      setOverrides(savedOverrides);
      setRefundSettings(savedSettings);
      setLoaded(true);
    })();
  }, []);

  // Import CSV file
  const importFile = useCallback(async (file: File) => {
    fileNameRef.current = file.name;
    const result = await parseCSV(file);
    setHeaders(result.headers);
    setRawRows(result.rows);
    setParseErrors(result.errors);

    // Detect account type from headers and sample rows
    const detection = detectAccountType(result.headers, result.rows.slice(0, 100));
    setDetectedAccountType(detection);

    // Try auto-detect column mapping
    const detected = detectColumnMapping(result.headers);

    // Check if we have a saved format
    const sig = formatSignature(result.headers);
    const savedFormats = await db.loadFormats();
    const savedFormat = savedFormats.find((f) => formatSignature(f.columns) === sig);

    if (savedFormat) {
      setMapping(savedFormat.mapping);
      // Restore saved account type (overrides detection)
      setAccountType(savedFormat.account_type ?? detection.type);
    } else {
      if (detected) setMapping(detected);
      setAccountType(detection.type);
    }

    setStep('mapping');
  }, []);

  // Confirm mapping and process
  const confirmMapping = useCallback(async (m: ColumnMapping, chosenAccountType: AccountType) => {
    setMapping(m);
    setAccountType(chosenAccountType);

    // Save format signature (including account type) for future imports
    const sig = formatSignature(headers);
    await db.saveFormat({
      id: sig,
      name: fileNameRef.current,
      columns: headers,
      mapping: m,
      account_type: chosenAccountType,
    });

    // Run full pipeline
    const mapped = mapRows(rawRows, m, chosenAccountType);
    const withMerchants = resolveAllMerchants(mapped, merchants, overrides);
    const categorized = categorizeAll(withMerchants, rules, merchants, chosenAccountType);
    const withRefunds = linkRefunds(categorized, refundSettings);

    setTransactions(withRefunds);
    setStep('review');
  }, [headers, rawRows, merchants, overrides, rules, refundSettings]);

  // Re-process transactions (after rule/merchant/setting changes)
  const reprocess = useCallback(() => {
    if (!mapping || rawRows.length === 0) return;
    const mapped = mapRows(rawRows, mapping, accountType);
    const withMerchants = resolveAllMerchants(mapped, merchants, overrides);
    const categorized = categorizeAll(withMerchants, rules, merchants, accountType);
    const withRefunds = linkRefunds(categorized, refundSettings);
    setTransactions(withRefunds);
  }, [rawRows, mapping, merchants, overrides, rules, refundSettings, accountType]);

  // Merchant operations
  const updateMerchant = useCallback(async (entry: MerchantEntry) => {
    await db.saveMerchant(entry);
    setMerchants((prev) => {
      const idx = prev.findIndex((m) => m.canonical_name === entry.canonical_name);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = entry;
        return next;
      }
      return [...prev, entry];
    });
  }, []);

  const addOverride = useCallback(async (raw: string, canonical: string) => {
    await db.saveOverride(raw, canonical);
    setOverrides((prev) => new Map(prev).set(raw, canonical));
  }, []);

  // Rule operations
  const addRule = useCallback(async (rule: Rule) => {
    await db.saveRule(rule);
    setRules((prev) => [...prev.filter((r) => r.id !== rule.id), rule]);
  }, []);

  const removeRule = useCallback(async (id: string) => {
    await db.deleteRule(id);
    setRules((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // Settings
  const updateRefundSettings = useCallback(async (s: RefundSettings) => {
    await db.saveRefundSettings(s);
    setRefundSettings(s);
  }, []);

  const reset = useCallback(() => {
    setStep('import');
    setHeaders([]);
    setRawRows([]);
    setMapping(null);
    setTransactions([]);
    setParseErrors([]);
    setAccountType('unknown');
    setDetectedAccountType(null);
  }, []);

  return {
    step, headers, rawRows, mapping, transactions, parseErrors, loaded,
    merchants, rules, overrides, refundSettings,
    accountType, detectedAccountType,
    importFile, confirmMapping, reprocess, reset,
    updateMerchant, addOverride, addRule, removeRule, updateRefundSettings,
    setTransactions,
  };
}
