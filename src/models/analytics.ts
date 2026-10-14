import type { numericFields, textFields } from '../lib/columnAliases';
/** Normalized daily ad record. Monetary values are INR; null means unavailable. */
export type ImportedMetrics = Partial<Record<typeof numericFields[number], number | null>> & Partial<Record<typeof textFields[number], string | null>>;
export interface MetaAdsRow extends ImportedMetrics {
  sourceFile?: string | null;
  id: string;
  date: string | null;
  campaignId: string | null;
  campaignName: string | null;
  adSetId: string | null;
  adSetName: string | null;
  adId: string | null;
  adName: string | null;
  product: string | null;
  location: string | null;
  spend: number | null;
  revenue: number | null;
  orders: number | null;
  impressions: number | null;
  reach: number | null;
  outboundClicks: number | null;
  clicks: number | null;
  costOfGoods: number | null;
}
/** Business-side results kept separate from attributed advertising metrics. */
export interface BusinessOutcome {
  id: string;
  date: string;
  source: 'pos' | 'delivery' | 'manual';
  location: string | null;
  product: string | null;
  revenue: number | null;
  orders: number | null;
  costOfGoods: number | null;
  operatingCosts: number | null;
}
