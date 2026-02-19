# Bank Transaction Analyzer

A local-first web app that analyzes bank transaction CSVs with merchant normalization, customizable categories, and return/refund detection.

## Privacy

**All data stays on your device.** No data is uploaded, transmitted, or stored remotely. Transaction data is processed entirely in-browser. Your rules, merchant overrides, and settings are persisted in IndexedDB (local browser storage).

## Quick Start

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## How to Use

### 1. Import a CSV

Drag and drop your bank CSV file (or click to browse). Most bank CSV formats are supported.

### 2. Map Columns

The app will try to auto-detect your date, description, and amount columns. Adjust if needed. Your mapping is saved per CSV format so future imports auto-map.

### 3. Review Transactions

- **Transactions tab**: Full sortable/filterable table. Click any row to edit its merchant name or category.
- **Dashboard tab**: Spending by category (pie chart), monthly cash flow (bar chart), summary cards.
- **Rules tab**: Create category rules (by merchant, keyword, or regex). Rules persist across sessions.
- **Settings tab**: Tune refund-linking thresholds.

### 4. Export Sanitized Examples

Click "Export Examples" to download a JSON file with raw descriptions, resolved merchants, categories, and types (no amounts). Useful for building test fixtures.

## Adding Merchant / Category Rules

### Via the Transaction Detail Panel

1. Click any transaction in the table
2. Edit the merchant name and/or select a category
3. Check "Apply to all similar" to create a rule for all matching transactions
4. Click Save

### Via the Rules Tab

1. Click "+ Add Rule"
2. Choose match type: merchant name, keyword in description, or regex
3. Set the target category
4. Save — the rule applies immediately

Rules are ordered by priority (lower number = higher priority). You can enable/disable or delete rules.

## How Refund Linking Works

The app detects refunds and links them to original purchases using a scoring algorithm:

1. **Keyword detection**: Transactions with words like "REFUND", "RETURN", "REVERSAL" in the description are flagged as refund candidates.
2. **Merchant similarity**: Uses bigram (Dice coefficient) text similarity to compare merchant names between credits and debits.
3. **Amount matching**: Refund amount must be <= purchase amount (with configurable tolerance for rounding differences).
4. **Time window**: Purchase must precede refund within configurable days (default: 90).
5. **Scoring**: Final match score = 40% amount closeness + 40% merchant similarity + 20% time recency.

### Exclusions

- **Rewards/cashback**: Keywords like "REWARD", "CASHBACK" -> classified as `reward`, never as refund
- **Transfers**: Zelle, Venmo, PayPal, ACH -> classified as `transfer`
- **Income**: Payroll, salary, direct deposit -> classified as `income`

### Tuning Thresholds (Settings tab)

| Setting | Default | Description |
|---------|---------|-------------|
| Days window | 90 | Max days between purchase and refund |
| Amount tolerance | 5% | How close refund amount must be to purchase amount |
| Merchant match threshold | 40% | Minimum text similarity between merchant names |

## Architecture

```
src/
  core/               # Pure logic (no React, no side effects)
    types.ts          # Data models
    parse.ts          # CSV parsing + column detection
    map.ts            # Column mapping -> Transaction objects
    merchant.ts       # Normalization pipeline + dictionary
    rules.ts          # Category rules + type detection
    refunds.ts        # Refund classification + linking
    aggregate.ts      # Summary calculations for charts
    __tests__/        # Vitest tests
  components/         # React UI components
  hooks/              # useTransactionPipeline (orchestrates core modules)
  store/              # IndexedDB persistence
fixtures/             # Test fixture data
```

## Testing

```bash
npm test            # run all tests once
npm run test:watch  # watch mode
```

66 tests covering merchant normalization, date/amount parsing, transaction type detection, category rules, and refund linking.

## Tech Stack

- Vite + React + TypeScript
- PapaParse (CSV parsing)
- Recharts (charts)
- idb (IndexedDB wrapper)
- Vitest (testing)
