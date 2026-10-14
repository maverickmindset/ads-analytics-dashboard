import { format, addDays } from 'date-fns';
import type { MetaAdsRow } from '../models/analytics';
export const demoRows: MetaAdsRow[] = Array.from({ length: 30 }, (_, day) => {
  const spend = Math.round(1800 + day * 23 + Math.sin(day * 1.8) * 340);
  const orders = Math.round(29 + day * .8 + Math.sin(day * .7) * 8);
  return { id: `demo-${day}`, date: format(addDays(new Date(2026, 8, 1), day), 'yyyy-MM-dd'), campaignId: 'demo-campaign', campaignName: 'Biryani lovers · Demo', adSetId: 'demo-adset', adSetName: 'Local discovery · Demo', adId: 'demo-ad', adName: 'Signature biryani · Demo', product: 'Signature biryani', location: 'Demo location', spend, revenue: orders * 349, orders, impressions: Math.round(spend * 29), reach: Math.round(spend * 21), outboundClicks: Math.round(spend * .49), clicks: Math.round(spend * .58), costOfGoods: orders * 135 };
});
