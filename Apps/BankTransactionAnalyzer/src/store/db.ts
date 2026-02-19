import { openDB, type IDBPDatabase } from 'idb';
import type { MerchantEntry, Rule, BankFormatSignature, RefundSettings } from '../core/types';
import { DEFAULT_REFUND_SETTINGS } from '../core/types';

const DB_NAME = 'bank-analyzer';
const DB_VERSION = 1;

interface AppDB {
  merchants: {
    key: string;
    value: MerchantEntry;
  };
  rules: {
    key: string;
    value: Rule;
  };
  formats: {
    key: string;
    value: BankFormatSignature;
  };
  overrides: {
    key: string; // raw_description
    value: { raw: string; canonical: string };
  };
  settings: {
    key: string;
    value: unknown;
  };
}

let dbPromise: Promise<IDBPDatabase<AppDB>> | null = null;

function getDB(): Promise<IDBPDatabase<AppDB>> {
  if (!dbPromise) {
    dbPromise = openDB<AppDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('merchants')) {
          db.createObjectStore('merchants', { keyPath: 'canonical_name' });
        }
        if (!db.objectStoreNames.contains('rules')) {
          db.createObjectStore('rules', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('formats')) {
          db.createObjectStore('formats', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('overrides')) {
          db.createObjectStore('overrides', { keyPath: 'raw' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      },
    });
  }
  return dbPromise;
}

// ─── Merchants ──────────────────────────────────────────────────────
export async function loadMerchants(): Promise<MerchantEntry[]> {
  const db = await getDB();
  const entries = await db.getAll('merchants');
  // Rehydrate RegExp patterns from strings
  return entries.map((e) => ({
    ...e,
    patterns: (e.pattern_strings ?? []).map((p: string) => new RegExp(p, 'i')),
  }));
}

export async function saveMerchant(entry: MerchantEntry): Promise<void> {
  const db = await getDB();
  await db.put('merchants', {
    ...entry,
    patterns: [], // Don't store RegExp objects
  });
}

export async function deleteMerchant(canonical_name: string): Promise<void> {
  const db = await getDB();
  await db.delete('merchants', canonical_name);
}

// ─── Rules ──────────────────────────────────────────────────────────
export async function loadRules(): Promise<Rule[]> {
  const db = await getDB();
  return db.getAll('rules');
}

export async function saveRule(rule: Rule): Promise<void> {
  const db = await getDB();
  await db.put('rules', rule);
}

export async function deleteRule(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('rules', id);
}

// ─── Format Signatures ─────────────────────────────────────────────
export async function loadFormats(): Promise<BankFormatSignature[]> {
  const db = await getDB();
  return db.getAll('formats');
}

export async function saveFormat(fmt: BankFormatSignature): Promise<void> {
  const db = await getDB();
  await db.put('formats', fmt);
}

// ─── User Overrides (raw desc -> canonical merchant) ────────────────
export async function loadOverrides(): Promise<Map<string, string>> {
  const db = await getDB();
  const entries = await db.getAll('overrides');
  return new Map(entries.map((e) => [e.raw, e.canonical]));
}

export async function saveOverride(raw: string, canonical: string): Promise<void> {
  const db = await getDB();
  await db.put('overrides', { raw, canonical });
}

// ─── Settings ───────────────────────────────────────────────────────
export async function loadRefundSettings(): Promise<RefundSettings> {
  const db = await getDB();
  const val = await db.get('settings', 'refundSettings');
  return (val as RefundSettings) ?? DEFAULT_REFUND_SETTINGS;
}

export async function saveRefundSettings(settings: RefundSettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', settings, 'refundSettings');
}
