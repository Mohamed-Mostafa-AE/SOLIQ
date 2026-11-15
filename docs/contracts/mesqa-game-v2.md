# Time-sliced mesqa contract v1 (Seventh Field V3, issue #12)

`science/mesqa-window.js` exports pure `simulateWaterWindow(initialState, actions)`.
No renderer equations or guessed observations. Engine `mesqa-window-v1` uses
explicit piecewise-constant rates; this is allocation bookkeeping, not calibrated
canal hydraulics, crop growth, energy use or a savings claim.

Input (all fields mandatory unless marked optional):

```js
{
 mode: 'ROTATIONAL_ON_OFF', // or CONTINUOUS_IMPROVED, ON_DEMAND_IMPROVED, LOW_PRESSURE_CONDITIONAL
 provenance: {kind:'simulated', delivery:'unavailable', source:'authored scenario'},
 seed: 'chapter-0', // retained identity; no random incidents generated
 intervals: [{startHour:0,endHour:1,on:true,flowM3h:600}],
 pump: {maxFlowM3h:600, efficiency:0.8},
 storage: {initialM3:0, source:'no alternative storage'},
 farms: [ // exactly six distinct IDs, repeated structure
  {id:'F1',areaM2:1000,needMm:10,cropStage:'declared stage',maxFlowM3h:100,
   windows:[{startHour:0,endHour:1}]}
 ]
}
// actions: valve proposals are the coordinated schedule; no implicit pumping
[{type:'valve',farmId:'F1',startHour:0,endHour:1},
 {type:'pump',startHour:0.5,endHour:1,factor:0,reason:'maintenance',kind:'simulated'}]
```

Hours are elapsed from scenario start, not local civil timestamps. Intervals must
be contiguous and increasing; supply gaps must be explicit OFF intervals. Rates
are m3/hour; area m2, demand net root-zone depth mm. Net demand = mm*m2/1000;
gross diversion demand = net/efficiency; efficiency applies exactly once.
All finite nonnegative; efficiency (0,1]; null data throws `missing_data`, never
becomes zero. ON flow must be known; OFF requires flow=0. Continuous modes require
ON intervals (pump faults remain possible); low pressure uses explicit lower flow.
Per-farm windows and same-farm actions cannot overlap. Shared pump events cannot
overlap; factor is [0,1], reason failure/maintenance/degraded. Fictional events
must be simulated, and cannot be appended to an observed scenario.

Solver splits at every supply/window/action/event boundary and demand-exhaustion
instant. Active farms share gross capacity equally up to their individual rate
and remaining demand; spare capacity redistributes. Pumps draw from canal first,
then explicitly recorded initial storage. No automatic storage refill, rainfall,
runoff/drainage, evaporation or soil carry-over model is implied.

Result `WaterWindowResult`:

- `engineVersion`, `provenance`, `seed`, `decisionStatus:'comparison_only'`.
- `flowByTimestep`: start/endHour, canalAvailableM3h, pumpCapacityM3h,
  canalDivertedM3, storageDrawM3, deliveredM3 (=effectiveM3 here), lossM3,
  unusedM3, storageRemainingM3, residualM3, fields[] with grossM3/effectiveM3/flowM3h.
- `waterByField`: id, areaM2, demandM3 (net), deliveredM3 (net), unmetM3,
  fulfillment, npcResponse (`all_served`, `unmet_demand`, `no_demand`).
- `ledger`: canalAvailableM3, canalDivertedM3, initialStorageM3,
  finalStorageM3, effectiveM3, lossM3, unusedM3, residualM3.
- `fairness`: Jain index of positive-demand net fulfillment; null when all zero
  or no comparable demands. `outcome`: all_served / unmet_demand.
- `events`: water:arrived, window:closed, valve:proposed, pump:failed,
  pump:maintenance, irrigation:delivered. Events have hour and explicit source kind.

Animation uses fields[].flowM3h only: zero means no moving irrigation water.
Canal animation uses canalAvailableM3h separately: canal may flow while pump fails.
NPC lines are authored from npcResponse, not generated agronomic assertions.
Renderer may interpolate within a slice but must not invent positive flow at zero.

Global conservation: canal available + initial storage = effective delivery +
loss + unused canal water + final storage. Per-slice residual uses opening/closing
storage. Uniform loss is an explicit efficiency assumption, not measured runoff.

Backend bridge `lib/run-mesqa.js` reuses PR #11's store transactions, session owner
and checksum conventions. No new unauthenticated API. Its create/replay methods
are server-only; callers must retain existing signed-session/Origin/CSRF checks.
Snapshots contain full scenario/actions + engine version and are SHA256 pinned;
replay creates a new immutable ID and a run:replayed event, leaving original data
untouched. No geometry is introduced; future private location persistence still
requires API v1 consent. Production durable-provider acceptance remains BLOCKED.
Mesqa runs/snapshots use separate `mesqaRuns`/`mesqaSnapshots` namespaces in the
existing session document so evidence-summary API v1 replay/receipts retain their
original shape. Both namespaces are destroyed on existing session deletion/TTL.
The bridge is not yet a browser save endpoint; routing requires a separately
reviewed contract extension retaining API v1 session and CSRF enforcement.
Branch is stacked on PR #11 while that PR is pending; no backend reimplementation.
