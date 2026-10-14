import type { MetaAdsRow } from '../models/analytics';
const key='biras-meta-dataset-v1';
export function saveDataset(rows: MetaAdsRow[], name: string | null) {
 try { localStorage.setItem(key,JSON.stringify({version:1,rows,name})); }
 catch { throw new Error('The dataset could not be saved in browser storage. Free storage space or import a smaller export. The active dataset has not been replaced.'); }
}
export function readDataset(): {rows:MetaAdsRow[];name:string|null} | null {
 try {
  const data=JSON.parse(localStorage.getItem(key)??'null');
  if(data?.version!==1||!Array.isArray(data.rows)||!(typeof data.name==='string'||data.name===null))return null;
  if(!data.rows.every((row:MetaAdsRow)=>typeof row.id==='string'&&(row.date===null||typeof row.date==='string')&&(row.spend===null||typeof row.spend==='number')))return null;
  return {rows:data.rows,name:data.name};
 }catch{return null;}
}
export function removeSavedDataset(){try{localStorage.removeItem(key);}catch{throw new Error('Browser storage could not be cleared.');}}
