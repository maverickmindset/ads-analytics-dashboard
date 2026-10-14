import { Construction } from 'lucide-react';
export function FoundationPage({ title }: { title: string }) {
  return <><div className="page-heading"><div><div className="eyebrow">WORKSPACE</div><h1>{title}<span className="heading-dot">.</span></h1><p>Your {title.toLowerCase()} workspace.</p></div></div><div className="empty-state"><Construction size={32}/><h2>Ready for the next layer</h2><p>This page is part of the application foundation. Detailed {title.toLowerCase()} analysis will be added in a future task.</p></div></>;
}
