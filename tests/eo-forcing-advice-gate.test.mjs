import test from "node:test";
import assert from "node:assert/strict";
import {loadPilotConfig,simulateSeasonWaterBalance} from "../science/index.js";

test("incomplete source days are diagnostic-only and cannot authorize advice",()=>{
  const pilot=loadPilotConfig("zankalon");
  const partial=simulateSeasonWaterBalance({
    crop:"wheat",sowingDate:"2026-03-01",harvestDate:"2026-03-03",
    soil:pilot.soil,waterManagement:pilot.waterManagement,
    dailyForcing:[{date:"2026-03-01",et0MmDay:4,precipMmDay:0,tMaxC:25},
      {date:"2026-03-02",et0MmDay:4,precipMmDay:0,tMaxC:25}]
  });
  assert.equal(partial.missingForcingDays,1);
  assert.equal(partial.modelDataStatus,"illustrative_incomplete_forcing");
  assert.equal(partial.canIssueFieldAdvice,false);
});
test("full supplied local data still do not automatically become calibrated field advice",()=>{
  const pilot=loadPilotConfig("zankalon");
  const result=simulateSeasonWaterBalance({
    crop:"wheat",sowingDate:"2026-03-01",harvestDate:"2026-03-01",
    soil:pilot.soil,waterManagement:pilot.waterManagement,
    dailyForcing:[{date:"2026-03-01",et0MmDay:4,precipMmDay:0,tMaxC:25}]
  });
  assert.equal(result.missingForcingDays,0);
  assert.equal(result.modelDataStatus,"calculated_from_supplied_inputs");
  assert.equal(result.canIssueFieldAdvice,false);
});
