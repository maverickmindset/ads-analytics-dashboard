export const textFields = ['dateStart','dateStop','campaignId','campaignName','adSetId','adSetName','adId','adName','objective','status','resultType','platform','placement','age','gender','country','region','campaignType','funnelStage','product','location'] as const;
export const numericFields = ['amountSpent','impressions','reach','frequency','linkClicks','clicks','outboundClicks','ctr','linkCtr','outboundCtr','cpc','outboundCpc','cpm','results','costPerResult','messagingConversations','costPerMessagingConversation','landingPageViews','costPerLandingPageView','leads','costPerLead','purchases','purchaseValue','purchaseRoas','videoViews','video25','video50','video75','video95','engagement','postEngagement','costOfGoods'] as const;
export type ImportField = typeof textFields[number] | typeof numericFields[number];
export const fields: ImportField[] = [...textFields, ...numericFields];
export const fieldLabel = (field: string) => field.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
export const columnAliases: Partial<Record<ImportField, string[]>> = {
 dateStart:['Reporting starts','Date','Start date'],dateStop:['Reporting ends','End date'],
 campaignId:['Campaign ID'],campaignName:['Campaign name'],adSetId:['Ad set ID'],adSetName:['Ad set name'],adId:['Ad ID'],adName:['Ad name'],
 amountSpent:['Amount spent','Amount spent (INR)','Spend'],clicks:['Clicks (all)'],linkClicks:['Link clicks'],outboundClicks:['Outbound clicks'],
 ctr:['CTR (all)'],linkCtr:['CTR (link click-through rate)'],outboundCtr:['Outbound CTR (click-through rate)'],
 cpc:['CPC (all)','Cost per link click'],outboundCpc:['Cost per outbound click'],cpm:['CPM (cost per 1,000 impressions)'],
 results:['Results'],resultType:['Result type'],costPerResult:['Cost per result'],
 messagingConversations:['Messaging conversations started','New messaging connections'],costPerMessagingConversation:['Cost per messaging conversation started'],
 landingPageViews:['Landing page views'],costPerLandingPageView:['Cost per landing page view'],leads:['Leads'],costPerLead:['Cost per lead'],
 purchases:['Purchases','Website purchases'],purchaseValue:['Purchase conversion value','Purchases conversion value','Website purchases conversion value','Revenue'],purchaseRoas:['Purchase ROAS (return on ad spend)'],
 videoViews:['Video plays','3-second video plays'],video25:['Video plays at 25%'],video50:['Video plays at 50%'],video75:['Video plays at 75%'],video95:['Video plays at 95%'],
 engagement:['Engagement'],postEngagement:['Post engagements'],platform:['Publisher platform'],status:['Delivery','Campaign delivery','Ad delivery'],
};
export type Confidence = 'Exact' | 'Case-insensitive' | 'Trimmed' | 'Alias' | 'Normalized' | 'Manual' | 'Unmapped';
export interface ColumnMapping { column: number; field: ImportField | ''; confidence: Confidence }
const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
export function detectMapping(header: string, column: number): ColumnMapping {
 const canonical = fields.flatMap(field => [{field, name:field}, {field, name:fieldLabel(field)}]);
 const stages: [Confidence, (name: string) => boolean][] = [['Exact',n=>n===header],['Case-insensitive',n=>n.toLowerCase()===header.toLowerCase()],['Trimmed',n=>n.trim()===header.trim()]];
 for (const [confidence, matches] of stages) { const hit=canonical.find(x=>matches(x.name));if(hit)return {column,field:hit.field,confidence}; }
 const aliases=fields.flatMap(field=>(columnAliases[field]??[]).map(name=>({field,name})));
 const alias=aliases.find(x=>x.name.toLowerCase().trim()===header.toLowerCase().trim());
 if(alias)return {column,field:alias.field,confidence:'Alias'};
 const hit=[...canonical,...aliases].find(x=>normalize(x.name)===normalize(header));
 return {column,field:hit?.field??'',confidence:hit?'Normalized':'Unmapped'};
}
