import type { LucideIcon } from 'lucide-react';
interface Props { label: string; value: string; icon: LucideIcon; description: string; featured?: boolean }
export function KpiCard({ label, value, icon: Icon, description, featured }: Props) {
  return <article className={`kpi-card ${featured ? 'featured' : ''}`}><div className="kpi-heading"><span>{label}</span><Icon size={17}/></div><div className="kpi-value">{value}</div><p>{description}</p></article>;
}
