import test from "node:test";
import assert from "node:assert/strict";
import {
  parseNasaPowerDailyResponse, computeTieCorrectedMannKendall,
  validateImergPrecipitationSubset, screenOpticalReflectanceObservation,
  evaluateSarScenePairOrUnavailability, runDailyWaterBalanceBucket,
  evaluateIntervalRegretComparators, validateGameMissionEvidenceContract,
  createEvidenceManifestRecord
} from "../science/eo-science-review.mjs";

test("POWER null is not silently treated as zero",()=>{
 const r=parseNasaPowerDailyResponse({header:{time_standard:"UTC"},properties:{parameter:{T2M_MAX:{"20240101":null,"20240102":25}}}});
 assert.equal(r.series[0].value,null);assert.equal(r.valid_days,1);assert.equal(r.status,"PARSED_SOURCE_UNVERIFIED");
});
test("POWER missing UTC source declaration fails closed",()=>{
 assert.equal(parseNasaPowerDailyResponse({header:{},properties:{parameter:{T2M_MAX:{"20240101":20}}}}).status,"UNAVAILABLE");
});
test("Annual MK rejects duplicate years",()=>{
 assert.throws(()=>computeTieCorrectedMannKendall(Array.from({length:8},(_,i)=>({year:2000+Math.floor(i/2),x:i})),"x"),/unique/);
});
test("IMERG requires explicit native mm/day units",()=>{
 assert.equal(validateImergPrecipitationSubset([{date:"2025-01-01",precipitationCal:5}]).status,"UNAVAILABLE");
});
test("Unverified IMERG inputs remain unverified",()=>{
 assert.equal(validateImergPrecipitationSubset([{date:"2025-01-01",precipitationCal:5}],{sourceUnits:"mm/day"}).status,"PARSED_SOURCE_UNVERIFIED");
});
test("Optical reflectance without QA cannot be treated clear",()=>{
 assert.equal(screenOpticalReflectanceObservation({sensor:"HLS_V2",red_raw:1000,nir_raw:2000}).screening_label,"QA_NOT_SUPPLIED");
});
test("Two blank SAR scene objects are NOT a valid pair",()=>{
 assert.equal(evaluateSarScenePairOrUnavailability({},{}).status,"REJECTED_INCOMPATIBLE_PAIR");
});
test("SAR metadata compatibility still means unverified pixels",()=>{
 const s={band:"L",pass_direction:"ASCENDING",polarization:"HH",incidence_deg:37,product:"GCOV",scene_id:"A"};
 assert.equal(evaluateSarScenePairOrUnavailability(s,{...s,scene_id:"B"}).status,"METADATA_COMPATIBLE_PIXELS_UNVERIFIED");
});
test("Water model missing forcing cannot become invented zero rain",()=>{
 assert.throws(()=>runDailyWaterBalanceBucket({S_init_mm:30,S_max_mm:100,daily_forcings:[{day:1,Q_mm:0,I_eff_mm:0,ET0_mm:5,Kcb:.8,Ke:.2,Ks:1}]}),/comparison_only/);
});
test("Fully declared daily water balance closes",()=>{
 assert.equal(runDailyWaterBalanceBucket({S_init_mm:90,S_max_mm:100,daily_forcings:[{day:1,P_mm:30,Q_mm:0,I_eff_mm:0,ET0_mm:5,Kcb:.8,Ke:.2,Ks:1}]}).conservation_passed,true);
});
test("Invalid utility array shape or NaN is rejected",()=>{
 assert.throws(()=>evaluateIntervalRegretComparators({utilityMatrix:{A:[.4,.2],B:[NaN,.4]}}),/Invalid scenario/);
});
test("OBSERVED game evidence without source hash is blocked",()=>{
 assert.equal(validateGameMissionEvidenceContract({mission_id:"A",evidence_kind:"OBSERVED",ui_claims:["A"]}).valid,false);
});
test("Declared SIMULATED scenario without volume may be represented",()=>{
 assert.equal(validateGameMissionEvidenceContract({mission_id:"A",evidence_kind:"SIMULATED",ui_claims:["scenario"]}).valid,true);
});
test("LIVE evidence requires actual supplied raw bytes",()=>{
 assert.throws(()=>createEvidenceManifestRecord({delivery_state:"LIVE",evidence_kind:"OBSERVED"}),/raw source bytes/);
});

test("Caller cannot certify an IMERG fixture by setting sourceVerified flag",()=>{
 const r=validateImergPrecipitationSubset([{date:"2025-01-01",precipitationCal:10}],{sourceUnits:"mm/day",sourceVerified:true});
 assert.equal(r.status,"PARSED_SOURCE_UNVERIFIED");
});
test("SAR metadata checker rejects same scene and inconsistent processing product",()=>{
 const a={band:"L",pass_direction:"ASCENDING",polarization:"HH",incidence_deg:37,product:"GCOV",scene_id:"A"};
 assert.equal(evaluateSarScenePairOrUnavailability(a,a).status,"REJECTED_INCOMPATIBLE_PAIR");
 assert.equal(evaluateSarScenePairOrUnavailability(a,{...a,scene_id:"B",product:"SLC"}).status,"REJECTED_INCOMPATIBLE_PAIR");
});
