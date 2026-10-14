import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload, FileSpreadsheet, X, CheckCircle2, ArrowRight, Database } from 'lucide-react';
import { useAnalytics } from '../state/analytics';
import { detectSheet, normalizeRows, parseFile, type ParsedFile } from '../lib/importData';
import type { ColumnMapping } from '../lib/columnAliases';
import { MappingTable } from '../components/import/MappingTable';
import { PreviewTable } from '../components/import/PreviewTable';
const steps=['Upload','Detect Columns','Map Columns','Preview','Validate','Import Complete'];
export function DataManager() {
 const {datasetName,rows,isDemo,loadDataset,loadDemo,clearDataset}=useAnalytics();
 const [step,setStep]=useState(0),[file,setFile]=useState<ParsedFile|null>(null),[sheet,setSheet]=useState(0),[header,setHeader]=useState<number|undefined>(),[mappings,setMappings]=useState<ColumnMapping[]>([]);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[dragging,setDragging]=useState(false);
 const input=useRef<HTMLInputElement>(null),request=useRef(0);
 const detected=useMemo(()=>file?detectSheet(file.sheets[sheet],header):null,[file,sheet,header]);
 const normalized=useMemo(()=>detected&&file?normalizeRows(detected,mappings,file.name):null,[detected,mappings,file]);
 const errors=normalized?.issues.filter(issue=>issue.level==='ERROR')??[];
 function reset(){request.current++;setFile(null);setStep(0);setMappings([]);setHeader(undefined);setError('');setBusy(false);if(input.current)input.current.value='';}
 async function upload(files: FileList|null){
  if(!files?.length)return;
  if(files.length!==1){setError('Choose one export at a time.');return;}
  const token=++request.current;setBusy(true);setError('');
  try {const parsed=await parseFile(files[0]);if(token!==request.current)return;
   const selected=Math.max(0,parsed.sheets.findIndex(s=>s.cells.some(row=>row.some(cell=>cell!==null&&String(cell).trim()!==''))));
   setFile(parsed);setSheet(selected);setHeader(undefined);setMappings(detectSheet(parsed.sheets[selected]).mappings);setStep(1);
  }catch(e){if(token===request.current)setError(e instanceof Error?e.message:'Unable to read this file.');}
  finally{if(token===request.current)setBusy(false);if(input.current)input.current.value='';}
 }
 function selectSheet(index:number){if(!file)return;setSheet(index);setHeader(undefined);setMappings(detectSheet(file.sheets[index]).mappings);}
 function selectHeader(index:number){if(!file)return;setHeader(index);setMappings(detectSheet(file.sheets[sheet],index).mappings);}
 function action(fn:()=>void){try{fn();setError('');}catch(e){setError(e instanceof Error?e.message:'Operation failed.');}}
 function finish(){if(!normalized||errors.length||!file)return;action(()=>{loadDataset(normalized.rows,file.name);setStep(5);});}
 return <><div className="page-heading"><div><div className="eyebrow">YOUR DATA WORKSPACE</div><h1>Data Manager<span className="heading-dot">.</span></h1><p>Turn your Meta Ads export into a clear view of performance.</p></div></div>
 <section className="panel active-dataset"><Database size={20}/><div><strong>{datasetName??'No active dataset'}</strong><p>{rows.length} rows · {isDemo?'Synthetic demo data':'Stored locally in this browser'}</p></div><div className="button-row"><button className="outline" onClick={()=>action(loadDemo)}>Load demo</button><button className="outline" disabled={!rows.length} onClick={()=>action(clearDataset)}>Clear dataset</button></div></section>
 <ol className="import-steps" aria-label="Import progress">{steps.map((label,index)=><li key={label} aria-current={step===index?'step':undefined} className={step===index?'current':step>index?'done':''}><span>{step>index?'✓':index+1}</span>{label}</li>)}</ol>
 {error&&<div className="import-error" role="alert">{error}</div>}
 <section className="panel import-panel">
 <div className="panel-heading"><div><h2>{steps[step]}</h2><p>{step===5?'Your analytics now use the imported dataset.':'All processing happens in your browser. Files are never uploaded to a server.'}</p></div>{file&&step<5&&<button className="outline" onClick={reset}><X size={14}/> Remove file</button>}</div>
 {step===0&&<><div className={`upload-zone ${dragging?'dragging':''}`} onDragOver={event=>{event.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={event=>{event.preventDefault();setDragging(false);if(!busy)void upload(event.dataTransfer.files);}}><Upload size={36}/><h3>Drop your Meta Ads export here</h3><p>CSV, XLSX, XLS · up to 25 MB · one file at a time</p><button className="primary" disabled={busy} onClick={()=>input.current?.click()}>{busy?'Reading file…':'Choose File'}</button><input ref={input} type="file" accept=".csv,.xlsx,.xls" aria-label="Choose Meta Ads export" className="sr-only" onChange={event=>void upload(event.target.files)}/></div><p className="footnote">Export your report with campaign names, amount spent and impressions. Optional metrics can remain unavailable.</p></>}
 {file&&detected&&step>0&&step<5&&<div className="file-summary"><FileSpreadsheet size={21}/><strong>{file.name}</strong><span>{(file.size/1024).toFixed(1)} KB</span><span>{detected.rows.length} rows</span><span>{detected.headers.length} columns</span></div>}
 {step===1&&file&&detected&&<><div className="detect-controls">{file.sheets.length>1&&<label>Workbook sheet<select aria-label="Workbook sheet" value={sheet} onChange={event=>selectSheet(Number(event.target.value))}>{file.sheets.map((s,index)=><option key={index} value={index}>{s.name} · {detectSheet(s).rows.length} data rows</option>)}</select></label>}<label>Header row<select aria-label="Header row" value={detected.headerIndex} onChange={event=>selectHeader(Number(event.target.value))}>{file.sheets[sheet].cells.slice(0,30).map((cells,index)=><option key={index} value={index}>Row {index+1} · {cells.map(cell=>String(cell??'')).join(' / ').slice(0,100)||'Blank'}</option>)}</select></label></div><p className="import-description">Detected {detected.headers.length} columns on row {detected.headerIndex+1}. Confirm the header and sheet before mapping. You can override the detected header.</p><div className="detected-columns">{detected.headers.map((h,index)=><span key={index}>{h}</span>)}</div></>}
 {step===2&&detected&&<><p className="import-description">Review every mapping. Unknown columns are ignored. Map each target field only once.</p><MappingTable detected={detected} mappings={mappings} onChange={setMappings}/></>}
 {step===3&&normalized&&<PreviewTable rows={normalized.rows}/>}
 {step===4&&normalized&&<><div className="validation-summary">{(['ERROR','WARNING','INFO'] as const).map(level=><span key={level} className={level.toLowerCase()}>{normalized.issues.filter(issue=>issue.level===level).length} {level.toLowerCase()}s</span>)}</div>{normalized.issues.length===0&&<p className="validation-success"><CheckCircle2 size={18}/> All rows passed validation.</p>}<ul className="validation-list">{normalized.issues.slice(0,200).map((issue,index)=><li key={index}><span className={`severity ${issue.level.toLowerCase()}`}>{issue.level}</span><span>{issue.row&&`Source row ${issue.row}: `}{issue.message}</span></li>)}</ul>{normalized.issues.length>200&&<p className="import-description">Showing the first 200 of {normalized.issues.length} issues. All errors must be resolved before import.</p>}<p className="footnote">Errors block import. Warnings do not block import; invalid values are retained as unavailable. Import replaces the active dataset and saves it in this browser. Review warnings before continuing.</p></>}
 {step===5&&<div className="import-complete"><CheckCircle2 size={44}/><h2>Dataset imported</h2><p>{rows.length} rows from {datasetName}. The dashboard now uses your imported data, and it will remain available after a refresh in this browser.</p><Link className="primary" to="/">View Overview <ArrowRight size={16}/></Link><button className="outline" onClick={reset}>Import another file</button></div>}
 {step>0&&step<5&&<div className="import-actions"><button className="outline" onClick={()=>{setError('');setStep(step-1);}}>Back</button>{step===4?<button className="primary" disabled={errors.length>0||!normalized?.rows.length} onClick={finish}>Save & use dataset <ArrowRight size={16}/></button>:<button className="primary" disabled={!detected?.headers.length} onClick={()=>setStep(step+1)}>Continue to {steps[step+1]} <ArrowRight size={16}/></button>}</div>}
 </section></>;
}
