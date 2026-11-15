/**
 * Local field-measurement evidence intake for SOLIQ, not a field-validated model.
 * No farm coordinates or personal data sent to any server; CSV is parsed locally.
 * Compare measured vs simulated SAME-UNIT soil water depth only. No yield/salinity
 * predictions or crop coefficients are inferred from this diagnostic.
 */
export const REQUIRED_FIELD_COLUMNS=Object.freeze([
 'date','plot_id','observed_root_water_mm','modeled_root_water_mm','source'
]);
export const CALIBRATION_STATUS=Object.freeze({
 INVALID:'blocked_invalid_measurements',
 INSUFFICIENT:'needs_field_validation',
 REVIEW:'research_diagnostic_unverified',
});
const number=x=>{
 if(typeof x!=='string'||!x.trim()||!Number.isFinite(Number(x)))throw new TypeError('Measurement value missing/not numeric');
 const n=Number(x);
 if(n<0||n>1000)throw new RangeError('Root-zone water depth must be 0..1000 mm');
 return n;
};
function date(x){
 if(typeof x!=='string'||!/^20\d{2}-\d{2}-\d{2}$/.test(x))throw new TypeError('Invalid date');
 const d=new Date(x+'T00:00:00Z');
 if(Number.isNaN(d.getTime())||d.toISOString().slice(0,10)!==x)throw new TypeError('Invalid calendar date');
 return x;
}
function parseRow(line){
 const values=line.split(',').map(x=>x.trim());
 if(values.some(x=>x.includes('"')))throw new TypeError('Quoted CSV unsupported: use simple comma-separated measurements');
 return values;
}
export function parseFieldMeasurementsCsv(content){
 if(typeof content!=='string'||content.length>60000)throw new TypeError('CSV must be plain text <=60KB');
 const lines=content.replace(/\r\n/g,'\n').trim().split('\n').filter(Boolean);
 if(lines.length<2||lines.length>502)throw new TypeError('CSV needs 1..500 data rows');
 const headers=parseRow(lines[0].replace(/^\uFEFF/,''));
 if(headers.length!==5||headers.some((x,i)=>x!==REQUIRED_FIELD_COLUMNS[i]))throw new TypeError('Columns must be exactly '+REQUIRED_FIELD_COLUMNS.join(','));
 const seen=new Set();
 return lines.slice(1).map((line,i)=>{
  const columns=parseRow(line);
  if(columns.length!==5)throw new TypeError('Five columns required on row '+(i+2));
  const [day,plotId,measured,modeled,source]=columns;
  date(day);
  if(!/^[A-Za-z0-9_-]{1,30}$/.test(plotId))throw new TypeError('Invalid anonymous plot ID');
  if(!['volumetric_sensor_converted_mm','soil_sample_estimate_mm','manual_field_ledger_mm'].includes(source))throw new TypeError('Unknown measurement source');
  const key=day+'|'+plotId;
  if(seen.has(key))throw new TypeError('Duplicate plot/date row');
  seen.add(key);
  return {date:day,plotId,observedMm:number(measured),modeledMm:number(modeled),
   source,evidenceKind:'user_supplied_unverified'};
 });
}
export function evaluateCalibrationReadiness(rows){
 if(!Array.isArray(rows)||rows.length===0)throw new TypeError('Measurements required');
 const plots=new Set(rows.map(r=>r.plotId));
 const days=new Set(rows.map(r=>r.date));
 const residuals=rows.map(r=>{
  if(!Number.isFinite(r.observedMm)||!Number.isFinite(r.modeledMm)||r.observedMm<0||r.modeledMm<0||r.observedMm>1000||r.modeledMm>1000)throw new TypeError('Invalid units or values');
  return r.modeledMm-r.observedMm;
 });
 const n=residuals.length;
 const bias=residuals.reduce((a,b)=>a+b,0)/n;
 const mae=residuals.reduce((a,b)=>a+Math.abs(b),0)/n;
 const rmse=Math.sqrt(residuals.reduce((a,b)=>a+b*b,0)/n);
 const independentDays=days.size;
 const readiness=n>=8&&independentDays>=4&&plots.size>=2?CALIBRATION_STATUS.REVIEW:CALIBRATION_STATUS.INSUFFICIENT;
 return {
  records:n,plots:plots.size,days:independentDays,
  metrics:{biasMm:bias,maeMm:mae,rmseMm:rmse},
  units:'mm root-zone water depth',
  validationStatus:readiness,
  sourceClass:'user_supplied_unverified',
  fieldCalibrated:false, // independent lab/plot replication and agronomy review still required
  correctiveCoefficient:null,
  cropYieldValidation:false,
  saltChemistryValidation:false,
  limitations:[
    'Root-zone moisture converted to millimeters requires known soil depth and volumetric basis.',
    'No independent sampling audit, measurement uncertainty, farm boundaries or paired irrigation/meteorological source receipts.',
    'Error diagnostics alone do not establish calibration, robust generalization or any irrigation saving.',
    'Do not use these numbers to certify crop rotation, soil salinity, yield or medical safety.'
  ],
 };
}
