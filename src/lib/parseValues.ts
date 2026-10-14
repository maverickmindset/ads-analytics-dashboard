import { format, isValid, parse } from 'date-fns';
export const isMissing = (value: unknown) => value == null || /^(?:\s*|—|-|n\/?a|not available|null)$/i.test(String(value).trim());
/** Percentages use percentage points: 1.25% is stored as 1.25. */
export function parseNumber(value: unknown): number | null {
 if(isMissing(value))return null;
 if(typeof value==='number')return Number.isFinite(value)?value:null;
 const cleaned=String(value).trim().replace(/[₹,%\s]/g,'');
 if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(cleaned))return null;
 const result=Number(cleaned);return Number.isFinite(result)?result:null;
}
/** Slash dates are day/month/year. Date-only strings never pass through UTC. */
export function parseDate(value: unknown): string | null {
 if(isMissing(value))return null;
 if(value instanceof Date)return isValid(value)?format(value,'yyyy-MM-dd'):null;
 // Excel's 1900 date system, with its leap-year compatibility offset.
 if(typeof value==='number' && value>0 && value<100000){const date=new Date(1899,11,30);date.setDate(date.getDate()+Math.floor(value));return format(date,'yyyy-MM-dd');}
 for(const pattern of ['yyyy-MM-dd','d/M/yyyy','d-M-yyyy','MMM d, yyyy','MMMM d, yyyy','M/d/yyyy']){
 const date=parse(String(value).trim(),pattern,new Date(2000,0,1));if(isValid(date))return format(date,'yyyy-MM-dd');
 }
 return null;
}
