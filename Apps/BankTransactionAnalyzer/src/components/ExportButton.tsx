import type { Transaction } from '../core/types';

interface Props {
  transactions: Transaction[];
}

export function ExportButton({ transactions }: Props) {
  const handleExport = () => {
    const examples = transactions.slice(0, 50).map((t) => ({
      raw_description: t.raw_description,
      merchant_canonical: t.merchant_canonical,
      category: t.category,
      type: t.type,
    }));

    const blob = new Blob([JSON.stringify(examples, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'examples.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button onClick={handleExport} title="Export sanitized examples (no amounts)">
      Export Examples
    </button>
  );
}
