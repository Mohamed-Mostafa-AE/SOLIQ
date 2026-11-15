# Team material review and challenge coverage

Reviewed 15 November 2026 against the supplied Drive folder:
https://drive.google.com/drive/folders/1FRiY8i4lowgE231zLgbsA7mzGQHh0PvI

## Material received

The root folder contains 26 files: requirements, implementation contracts/tasks, two documentation archives, a research PDF, resource registers and the two annual data files. Relevant archive listings were inspected. No application implementation or raw daily NASA response was found in those documentation archives. Historical documents are proposals and audits, not evidence of deployed features. The initial public download of `SOLIQ_RECOMPUTE_AUDIT.py` returned HTML. The connected Drive source subsequently provided the actual 2,722-byte Python file; it was read as source rather than executed against its machine-specific paths. An independent recalculation was used for this review.

The 160-row CSV and telemetry JSON contain four 40-year series, 1985–2024: Zankalon, Sidi Ghazi, Mallawi and Diamond Valley. They do not contain 2025 or 2026 daily weather. The CSV and JSON agree internally, but a status string such as `LIVE_NASA_POWER_API_40YR` does not establish provenance. Exact API requests, raw responses, units, source versions and aggregation definitions remain missing from these files. Annual extreme-temperature values must not be relabeled mean annual temperature; annual precipitation values must not be treated as annual accumulation without documented units and aggregation.

## Independent arithmetic check

`data/team-review-summary.json` records file hashes and an independent recalculation on the rounded supplied series using tie-corrected, continuity-corrected Mann–Kendall and the median of all pairwise slopes for Sen's slope. It reproduces the earlier audit. For example, Sidi Ghazi root wetness has recalculated two-sided p ≈ 0.03156, compared with stored p = 0.184. Neither number establishes a validated climate trend: serial correlation, rounding, aggregation and source lineage still need review. No supplied annual value is used as daily forcing or independently verified ground truth in the app.

Site salinity, groundwater depth, ESP, CEC and canal capacity remain unverified local metadata. Saved gypsum, WBGT, profitability thresholds and fairness results are not adopted as farmer recommendations. A named location is not a verified farm polygon or evidence of consent from the named benchmark participant.

## What changed in the application

- The four study coordinates are available as labeled starting locations. Selecting one retrieves fresh NASA POWER weather and clears prior local suitability declarations. Site soil and canal values are not auto-populated as measurements.
- The 2026 form accepts all 36 monthly crop entries for the current calendar and two alternatives. It preserves a shared weather horizon, soil state and irrigation policy. The main workspace passes its edited calendars into this form. Repeated alternatives are flagged as needing a distinct calendar.
- Soil input records origin, source, date and optional effective depth, field capacity and wilting point. Whole-soil volumetric percentages transform to available-water depth as `(FC − PWP) / 100 × depth_cm × 10`. These are user-declared or survey estimates until independently verified. Values outside the model domain are rejected.
- Soil hydraulic parameters describe one effective layer, not a calibrated multi-horizon root model. The transformation does not establish soil health or crop rooting depth. No extra coarse-fragment correction is applied to whole-soil volumetric values.
- Unsupported flooded, saline or groundwater-affected settings block the quantitative outlook. Unconfirmed model suitability blocks preference ordering. The model does not currently represent snow storage, salinity transport, groundwater or crop-specific root development.
- Seed, equipment/labour, market/on-farm use and local species/season review are declared separately for each option. Unknown declarations block the conditional order; a refusal excludes that option from the order. Baseline metrics remain visible for comparison, including when the baseline needs review. Numerical counterfactuals do not establish feasibility.
- Water, fewer planned fallow days and crop-family diversity are alternative ordering criteria. Physical results remain visible and unchanged by priority. No aggregate score is labeled a soil-health index or certainty of a best crop.
- Each strategy has six explanation fields: why, evidence, possible soil benefits, missing information, risks and expert checks. Calendar-based fallow windows and observed-weather rainfall overlap are computed; they are not confirmed bare soil, erosion, or residue cover. Legume and cover-crop benefits remain sourced qualitative mechanisms.
- A map chooser supports selecting and confirming an analysis point, device geolocation on demand, accuracy display, correction and permission-denial/timeout fallback. Coordinates are not stored persistently by the new picker. Leaflet/OpenStreetMap provide a basemap, not agricultural imagery. Field polygon analysis is not implemented.
- The live NASA benchmark includes Cairo and the team-declared Nevada study point. This checks data retrieval and arithmetic across contrasting locations; it does not validate agronomic transfer.

## Coverage against the challenge

| Challenge element | Current evidence | Remaining work |
|---|---|---|
| NASA weather and changing conditions | Real POWER daily retrieval; dated 2026 coverage; historical weather scenarios and exposure counts | Independent station checks; prospective/weather evaluation beyond the retrospective hindcast |
| Local soils | Traceable declared hydraulic inputs and explicit parameter conversion | Verified lab/survey records, multi-horizon/root calibration and omitted-process models |
| Current rotation and two alternatives | Three editable annual calendars; feasibility declarations and shared forcing | Region-specific crop/cultivar calendars and true multi-year sequence validation |
| Farmer priorities and practical constraints | Separate hard declarations and transparent ordering criteria | Farmer interviews, crop-specific feasibility records, dated local market data |
| Soil protection and nutrients | Fallow-window/rainfall overlap and sourced legume/cover/family mechanisms | Vegetation/residue validation, measured soil outcomes; nitrogen/carbon models only if calibrated |
| Spatial visualization | Confirmed point selection and study locations | Verified field polygons, actual quality-screened Landsat/HLS/IMERG/SMAP/ECOSTRESS adapters as justified |
| Explanation and uncertainty | Six-part cards, historical scenario ranges, evidence export | Calibrated uncertainty, geographic/chronological holdouts and independent agronomic review |
| International access | English/Arabic; editable context; two-country adapter check | Locally validated configurations and user testing across regions |

A long optional resource list does not require integrating every product. The next scientific priority is a defensible pilot with local crop/soil evidence plus quality-screened vegetation and rainfall context where these resolve a decision. Games and additional language-model providers cannot replace that evaluation. The app is not declared a complete validated agricultural advisory system.

## References used for the new mechanisms

- FAO, Soil and Water: https://www.fao.org/4/r4082e/r4082e03.htm
- FAO, Sustainable crop rotations: https://www.fao.org/4/v9926e/v9926e06.htm
- FAO, Soil organic cover: https://www.fao.org/conservation-agriculture/in-practice/soil-organic-cover/en
- Leaflet 1.9.4: https://leafletjs.com/examples-v1/quick-start/
- OpenStreetMap tile policy: https://operations.osmfoundation.org/policies/tiles/
