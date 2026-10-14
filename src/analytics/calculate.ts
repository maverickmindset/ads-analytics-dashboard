import type { MetaAdsRow } from '../models/analytics';
export const divide = (numerator: number | null, denominator: number | null, scale = 1): number | null => {
  if (numerator === null || denominator === null || denominator <= 0) return null;
  const result = numerator / denominator * scale;
  return Number.isFinite(result) ? result : null;
};
// Partial coverage is unknown, not a misleading partial total.
export const sum = (rows: MetaAdsRow[], field: keyof MetaAdsRow): number | null => {
  if (!rows.length) return null;
  const values = rows.map(row => row[field]);
  if (!values.every((v): v is number => typeof v === 'number' && Number.isFinite(v))) return null;
  const total = values.reduce((a, b) => a + b, 0);
  return Number.isFinite(total) ? total : null;
};
export function summarize(rows: MetaAdsRow[]) {
  const spend = sum(rows, 'spend'), revenue = sum(rows, 'revenue'), orders = sum(rows, 'orders');
  const impressions = sum(rows, 'impressions'), costOfGoods = sum(rows, 'costOfGoods');
  return { spend, revenue, orders, cac: divide(spend, orders), roas: divide(revenue, spend),
    profit: spend !== null && revenue !== null && costOfGoods !== null ? revenue - spend - costOfGoods : null,
    impressions, reach: sum(rows, 'reach'), ctr: divide(sum(rows, 'outboundClicks'), impressions, 100),
    cpc: divide(spend, sum(rows, 'clicks')), cpm: divide(spend, impressions, 1000) };
}
export function dailyPerformance(rows: MetaAdsRow[]) {
  const groups = new Map<string, MetaAdsRow[]>();
  rows.forEach(row => { if (row.date && (!row.dateStop || row.dateStop === row.date)) groups.set(row.date, [...(groups.get(row.date) ?? []), row]); });
  return [...groups].sort(([a], [b]) => a.localeCompare(b)).map(([date, records]) => ({ date, ...summarize(records) }));
}
