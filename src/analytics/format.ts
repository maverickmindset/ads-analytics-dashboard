const valid = (value: number | null | undefined): value is number => typeof value === 'number' && Number.isFinite(value);
export const formatINR = (value: number | null | undefined) => valid(value) ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value) : '—';
export const formatNumber = (value: number | null | undefined) => valid(value) ? new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value) : '—';
export const formatCompact = (value: number | null | undefined) => valid(value) ? new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(value) : '—';
export const formatPercent = (value: number | null | undefined) => valid(value) ? `${value.toFixed(2)}%` : '—';
export const formatRatio = (value: number | null | undefined) => valid(value) ? `${value.toFixed(2)}×` : '—';
