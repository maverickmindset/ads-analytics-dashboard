import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import type { MetaAdsRow } from '../../models/analytics';
import { formatINR, formatNumber, formatPercent } from '../../analytics/format';
const columns: ColumnDef<MetaAdsRow>[] = [
 {accessorKey:'date',header:'Date',cell:info=>String(info.getValue()??'—')},
 ...(['campaignName','adSetName','adName'] as const).map(key=>({accessorKey:key,header:key==='campaignName'?'Campaign':key==='adSetName'?'Ad Set':'Ad',cell:(info:{getValue:()=>unknown})=>String(info.getValue()??'—')})),
 ...(['spend','impressions','reach','outboundClicks','outboundCtr','cpc','cpm'] as const).map(key=>({accessorKey:key,header:({spend:'Spend',impressions:'Impressions',reach:'Reach',outboundClicks:'Outbound clicks',outboundCtr:'Outbound CTR',cpc:'CPC',cpm:'CPM'})[key],cell:(info:{getValue:()=>unknown})=>{const value=info.getValue() as number|null;return key==='outboundCtr'?formatPercent(value):['spend','cpc','cpm'].includes(key)?formatINR(value):formatNumber(value);}})),
];
export function PreviewTable({ rows }: { rows: MetaAdsRow[] }) {
 const table=useReactTable({data:rows.slice(0,30),columns,getCoreRowModel:getCoreRowModel()});
 return <><p className="import-description">Showing the first {Math.min(30,rows.length)} of {rows.length} normalized rows. Missing values remain —. Percentages are percentage points (1.25% → 1.25).</p><div className="table-scroll"><table className="import-table"><thead>{table.getHeaderGroups().map(group=><tr key={group.id}>{group.headers.map(header=><th key={header.id}>{flexRender(header.column.columnDef.header,header.getContext())}</th>)}</tr>)}</thead><tbody>{table.getRowModel().rows.map(row=><tr key={row.id}>{row.getVisibleCells().map(cell=><td key={cell.id}>{flexRender(cell.column.columnDef.cell,cell.getContext())}</td>)}</tr>)}</tbody></table></div></>;
}
