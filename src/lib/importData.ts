import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { detectMapping, fields, numericFields, type ColumnMapping, type ImportField } from './columnAliases';
import { isMissing, parseDate, parseNumber } from './parseValues';
import type { MetaAdsRow } from '../models/analytics';
export type Cell = string | number | boolean | Date | null;
export interface SheetData { name: string; cells: Cell[][] }
export interface ParsedFile { name: string; size: number; sheets: SheetData[] }
export interface DetectedSheet { headers: string[]; rows: Cell[][]; headerIndex: number; rowNumbers: number[]; mappings: ColumnMapping[] }
export interface ValidationIssue { level: 'ERROR' | 'WARNING' | 'INFO'; message: string; row?: number; field?: ImportField }
export function detectSheet(sheet: SheetData, headerOverride?: number): DetectedSheet {
 const candidates=sheet.cells.slice(0,30).map((cells,index)=>({index,score:cells.reduce<number>((score,cell,column)=>score+(detectMapping(String(cell??''),column).field?5:0)+(typeof cell==='string'&&!isMissing(cell)?1:0),0)}));
 const best=candidates.filter(c=>sheet.cells[c.index].some(cell=>!isMissing(cell))).sort((a,b)=>b.score-a.score||a.index-b.index)[0];
 const headerIndex=headerOverride??best?.index??0;
 const headers=(sheet.cells[headerIndex]??[]).map((cell,index)=>String(cell??'').trim()||`Unnamed column ${index+1}`);
 const populated=sheet.cells.slice(headerIndex+1).map((row,index)=>({row,number:headerIndex+index+2})).filter(({row})=>row.some(cell=>!isMissing(cell)));
 return {headers,rows:populated.map(x=>x.row),rowNumbers:populated.map(x=>x.number),headerIndex,mappings:headers.map(detectMapping)};
}
export async function parseFile(file: File): Promise<ParsedFile> {
 if(!/\.(csv|xlsx|xls)$/i.test(file.name))throw new Error('Choose a CSV, XLSX, or XLS file.');
 if(file.size>25*1024*1024)throw new Error('This browser importer supports files up to 25 MB. Split larger exports into smaller files.');
 if(!file.size)throw new Error('The selected file is empty.');
 if(/\.csv$/i.test(file.name)){
  const text=await file.text();
  const result=Papa.parse<string[]>(text,{skipEmptyLines:false});
  const errors=result.errors.filter(e=>e.code!=='UndetectableDelimiter');
  if(errors.length)throw new Error(`CSV could not be parsed: ${errors[0].message}`);
  return {name:file.name,size:file.size,sheets:[{name:'CSV',cells:result.data}]};
 }
 const workbook=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:true,cellNF:true});
 // Preserve formatted Excel percentage semantics without rounding financial cells.
 for (const name of workbook.SheetNames) {
  const ws=workbook.Sheets[name];
  for (const address of Object.keys(ws)) {
   if(address.startsWith('!'))continue;
   const cell=ws[address];
   if(cell.t==='n' && typeof cell.v==='number' && typeof cell.z==='string' && /(^|[^\\])%/.test(cell.z)){ cell.v *= 100; delete cell.w; }
  }
 }
 const sheets=workbook.SheetNames.map(name=>({name,cells:XLSX.utils.sheet_to_json<Cell[]>(workbook.Sheets[name],{header:1,defval:null,blankrows:true,raw:true})}));
 if(!sheets.length)throw new Error('The workbook contains no sheets.');
 return {name:file.name,size:file.size,sheets};
}
export function normalizeRows(detected: DetectedSheet, mappings: ColumnMapping[], sourceFile: string): { rows: MetaAdsRow[]; issues: ValidationIssue[] } {
 const issues: ValidationIssue[]=[];
 const mapped=mappings.filter(m=>m.field);
 const seen=new Set<ImportField>();
 for(const m of mapped){if(seen.has(m.field as ImportField))issues.push({level:'ERROR',message:`Multiple columns map to ${m.field}. Map one or ignore the others.`});seen.add(m.field as ImportField);}
 for(const field of ['campaignName','amountSpent','impressions'] as const){if(!seen.has(field))issues.push({level:field==='campaignName'?'ERROR':'WARNING',field,message:`No ${field==='amountSpent'?'amount spent':field==='campaignName'?'campaign name':'impressions'} column mapped.`});}
 if(!seen.has('adSetName'))issues.push({level:'WARNING',message:'No ad set name detected.'});
 if(!seen.has('dateStart'))issues.push({level:'WARNING',message:'No dates detected. Daily chart and date filters cannot include undated rows.'});
 if(!seen.has('purchases')&&!seen.has('purchaseValue'))issues.push({level:'INFO',message:'No purchase data exists in this export. Revenue, orders and ROAS may be unavailable.'});
 const rows=detected.rows.map((cells,index)=>{
  const record: Record<string,string|number|null>=Object.fromEntries(fields.map(field=>[field,null]));
  for(const {column,field} of mapped){
   const value=cells[column];
   const numeric=(numericFields as readonly string[]).includes(field);
   const date=field==='dateStart'||field==='dateStop';
   const parsed=numeric?parseNumber(value):date?parseDate(value):isMissing(value)?null:String(value).trim();
   record[field]=parsed;
   if(!isMissing(value)&&parsed===null)issues.push({level:'WARNING',row:detected.rowNumbers[index],field:field as ImportField,message:`Invalid ${date?'date':'number'} in ${field}; imported as unavailable.`});
   if(numeric&&typeof parsed==='number'&&parsed<0)issues.push({level:'ERROR',row:detected.rowNumbers[index],field:field as ImportField,message:`Negative ${field} is not supported. Correct the source or ignore this column.`});
  }
  const str=(field:string)=>typeof record[field]==='string'?record[field] as string:null;
  const num=(field:string)=>typeof record[field]==='number'?record[field] as number:null;
  if(seen.has('campaignName')&&!str('campaignName'))issues.push({level:'ERROR',row:detected.rowNumbers[index],field:'campaignName',message:'Campaign name is missing on this row.'});
  const start=str('dateStart'), stop=str('dateStop');
  if(start&&stop&&stop<start)issues.push({level:'ERROR',row:detected.rowNumbers[index],message:'Reporting end is before reporting start.'});
  return {...record,id:`import-${index}-${detected.rowNumbers[index]}`,sourceFile,date:str('dateStart'),campaignId:str('campaignId'),campaignName:str('campaignName'),adSetId:str('adSetId'),adSetName:str('adSetName'),adId:str('adId'),adName:str('adName'),product:str('product'),location:str('location'),spend:num('amountSpent'),revenue:num('purchaseValue'),orders:num('purchases'),impressions:num('impressions'),reach:num('reach'),outboundClicks:num('outboundClicks'),clicks:num('clicks'),costOfGoods:num('costOfGoods')} as MetaAdsRow;
 });
 if(!rows.length)issues.push({level:'ERROR',message:'No data rows detected below the selected header.'});
 if(rows.some(row=>row.dateStop&&row.date&&row.dateStop!==row.date))issues.push({level:'WARNING',message:'Multi-day reporting rows are included in totals but excluded from the daily chart; their daily distribution is unknown.'});
 if(seen.has('purchases')&&rows.every(row=>row.purchases==null))issues.push({level:'INFO',message:'The purchase column contains no available purchase values.'});
 return {rows,issues};
}
