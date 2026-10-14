import { Banknote, ShoppingBag, Target, TrendingUp, Wallet, Eye, Users, MousePointer2, Coins, Receipt, ArrowUpRight, Database } from 'lucide-react';
import { subDays } from 'date-fns';
import { useAnalytics } from '../state/analytics';
import { summarize } from '../analytics/calculate';
import { formatCompact, formatINR, formatNumber, formatPercent, formatRatio } from '../analytics/format';
import { KpiCard } from '../components/KpiCard';
import { PerformanceChart } from '../components/PerformanceChart';
export function Overview() {
  const { rows, dateRange, campaign, loadDemo } = useAnalytics();
  const latest = rows.reduce((max, row) => row.date && row.date > max ? row.date : max, '');
  const cutoff = latest && dateRange !== 'all' ? subDays(new Date(`${latest}T00:00:00`), dateRange === 'last7' ? 6 : 13).getTime() : -Infinity;
  const filtered = rows.filter(row => (campaign === 'all' || (row.campaignId ?? row.campaignName ?? 'unknown') === campaign) && (dateRange === 'all' || (row.date !== null && new Date(`${row.date}T00:00:00`).getTime() >= cutoff)));
  const values = summarize(filtered);
  if (!rows.length) return <div className="empty-state"><Database size={36}/><h2>Your next insight starts with data</h2><p>No dataset is loaded. Explore the dashboard with clearly labelled sample data.</p><button className="primary" onClick={loadDemo}>Load demo dataset <ArrowUpRight size={16}/></button></div>;
  const cards = [
    { label: 'Spend', value: formatINR(values.spend), icon: Wallet, description: 'Total advertising investment' },
    { label: 'Revenue', value: formatINR(values.revenue), icon: Banknote, description: 'Attributed purchase value', featured: true },
    { label: 'Orders', value: formatNumber(values.orders), icon: ShoppingBag, description: 'Attributed purchases' },
    { label: 'CAC', value: formatINR(values.cac), icon: Target, description: 'Spend per attributed order' },
    { label: 'ROAS', value: formatRatio(values.roas), icon: TrendingUp, description: 'Revenue for every ₹1 spent', featured: true },
    { label: 'Profit', value: formatINR(values.profit), icon: Coins, description: 'Revenue − spend − product costs' },
    { label: 'Impressions', value: formatCompact(values.impressions), icon: Eye, description: 'Total ad views' },
    { label: 'Reach', value: formatCompact(values.reach), icon: Users, description: 'Sum of daily reach · not unique' },
    { label: 'Outbound CTR', value: formatPercent(values.ctr), icon: MousePointer2, description: 'Outbound clicks / impressions' },
    { label: 'CPC', value: formatINR(values.cpc), icon: MousePointer2, description: 'Spend per click · all clicks' },
    { label: 'CPM', value: formatINR(values.cpm), icon: Receipt, description: 'Spend per 1,000 impressions' },
  ];
  return <><div className="page-heading"><div><div className="eyebrow">YOUR PERFORMANCE, AT A GLANCE</div><h1>Overview<span className="heading-dot">.</span></h1><p>From ad spend to orders. See the whole picture.</p></div><span className="period-label">{filtered.length} records</span></div><div className="kpi-grid">{cards.slice(0, 6).map(card => <KpiCard key={card.label} {...card}/>)}</div><PerformanceChart rows={filtered}/><div className="section-label"><h2>Audience & efficiency</h2><span>The signals behind your performance</span></div><div className="kpi-grid secondary">{cards.slice(6).map(card => <KpiCard key={card.label} {...card}/>)}</div><p className="footnote">Metrics use attributed ad data. CAC is cost per order, not verified new-customer acquisition. Profit excludes operating costs. Missing values display as —.</p></>;
}
