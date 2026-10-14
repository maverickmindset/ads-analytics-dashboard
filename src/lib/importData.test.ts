import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { detectMapping } from './columnAliases';
import { parseDate, parseNumber } from './parseValues';
import { detectSheet, normalizeRows, parseFile } from './importData';
describe('Meta export parsing',()=>{
 it('parses INR, percentage points and missing values safely',()=>{
  for(const value of ['₹1,246.10','1,246.10','₹ 1,246.10'])expect(parseNumber(value)).toBe(1246.1);
  expect(parseNumber('0.42%')).toBe(.42);expect(parseNumber('0')).toBe(0);
  for(const value of ['—','-','N/A','Not available','',null,'invalid','Infinity',NaN])expect(parseNumber(value)).toBeNull();
 });
 it('parses calendar dates without UTC shifts',()=>{
  for(const date of ['2026-10-10','10/10/2026','Oct 10, 2026'])expect(parseDate(date)).toBe('2026-10-10');
  expect(parseDate('03/10/2026')).toBe('2026-10-03');expect(parseDate('2026-02-30')).toBeNull();
 });
 it('maps conservative aliases and normalized punctuation',()=>{
  expect(detectMapping('campaignName',0).confidence).toBe('Exact');
  expect(detectMapping(' amount SPENT (inr) ',0).field).toBe('amountSpent');
  expect(detectMapping('Outbound CTR (click-through rate)',0).field).toBe('outboundCtr');
  expect(detectMapping('Amount.spent.INR',0).field).toBe('amountSpent');
  expect(detectMapping('Spend forecast',0).field).toBe('');
 });
 it('finds headers after metadata, preserves zero, and connects legacy KPI fields',()=>{
  const detected=detectSheet({name:'test',cells:[[],['Meta export'],['Reporting starts','Campaign name','Amount spent (INR)','Impressions','Purchases','Purchase conversion value'],['2026-10-10','Test','₹1,246.10','2000','0','—']]});
  expect(detected.headerIndex).toBe(2);expect(detected.rowNumbers).toEqual([4]);
  const result=normalizeRows(detected,detected.mappings,'test.csv');
  expect(result.rows[0]).toMatchObject({date:'2026-10-10',dateStart:'2026-10-10',campaignName:'Test',amountSpent:1246.1,spend:1246.1,orders:0,revenue:null,purchaseValue:null,frequency:null,sourceFile:'test.csv'});
  expect(result.issues.filter(i=>i.level==='ERROR')).toHaveLength(0);
 });
 it('reports duplicate mappings, missing campaign, invalid values and reversed dates',()=>{
  const detected=detectSheet({name:'test',cells:[['Campaign name','Spend','Amount spent','Reporting starts','Reporting ends','Impressions'],['','-1','bad','2026-10-10','2026-10-09','oops']]});
  const result=normalizeRows(detected,detected.mappings,'bad.csv');
  expect(result.issues.some(i=>i.message.includes('Multiple columns'))).toBe(true);
  expect(result.issues.some(i=>i.message.includes('Campaign name is missing'))).toBe(true);
  expect(result.issues.some(i=>i.message.includes('before reporting start'))).toBe(true);
  expect(result.issues.some(i=>i.level==='WARNING'&&i.row===2)).toBe(true);
  expect(result.rows[0].impressions).toBeNull();
 });
 it('parses quoted CSV with blank preamble and rejects malformed CSV',async()=>{
  const file=new File(['\n\nCampaign name,Amount spent,Impressions\n"Biryani, local","1,246.10",1000'], 'ads.csv');
  const parsed=await parseFile(file);const detected=detectSheet(parsed.sheets[0]);
  expect(detected.rows).toHaveLength(1);expect(detected.rows[0][0]).toBe('Biryani, local');
  await expect(parseFile(new File(['Campaign name,Spend\n"broken'], 'bad.csv'))).rejects.toThrow();
 });
 for(const bookType of ['xlsx','xls'] as const)it(`reads ${bookType} sheets and formatted percentages`,async()=>{
  const workbook=XLSX.utils.book_new();XLSX.utils.book_append_sheet(workbook,XLSX.utils.aoa_to_sheet([]),'Empty');
  const sheet=XLSX.utils.aoa_to_sheet([['Campaign name','Amount spent','Impressions','Outbound CTR (click-through rate)'],['Excel campaign',1246.1,1000,.0125]]);sheet.D2.z='0.00%';XLSX.utils.book_append_sheet(workbook,sheet,'Ads');
  const buffer=XLSX.write(workbook,{type:'array',bookType});
  const parsed=await parseFile(new File([buffer],`ads.${bookType}`));
  expect(parsed.sheets.map(s=>s.name)).toEqual(['Empty','Ads']);
  const detected=detectSheet(parsed.sheets[1]);expect(normalizeRows(detected,detected.mappings,parsed.name).rows[0].outboundCtr).toBe(1.25);
 });
});
