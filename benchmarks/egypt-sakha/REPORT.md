# Soil-IQ: Sakha / Kafr El Sheikh benchmark

Run: 2026-11-15T12:35:43.489Z. Commit: local; see GitHub run.

**Scope:** Real NASA point-data and software benchmark; not a field-validation study. Approximate study-area point 31.083333 N, 30.933333 E. Coordinates follow the experimental-site description in https://doi.org/10.3389/fpls.2023.1165113. FAO documents agricultural water-productivity activity in Kafr El Sheikh: https://www.fao.org/egypt/news/detail/A-high-level-visit-to-identify-the-progress-of-Enhancing-Water-Productivity-in-Agriculture-project-in-Kafr-El-Sheikh-/en

## Real NASA weather

| Metric | Result |
|---|---:|
| Coverage | 2026-01-01 to 2026-11-12 |
| Valid 2026 daily records | 316 |
| Precipitation accumulation | 48.14 mm |
| Maximum temperature at least 35 C | 112 days |
| Mean daily maximum temperature | 30.77 C |
| Same-period 2016–2025 precipitation median | 90.77 mm |
| Complete historical records | 3,653 days |

## Independent numerical checks

Raw date coverage, units, time standard and aggregates agree with the application. All 15 full-year strategy/member runs preserve the observed prefix, storage bounds and the irrigation budget. Maximum independently calculated daily closure: 1.4211e-14 mm; annual closure: 5.3646e-13 mm. These residuals measure bookkeeping, not field accuracy.

## Illustrative calendars under shared assumptions

Capacity 150 mm, initial storage 75 mm, annual effective irrigation budget 300 mm, runoff fraction 0.1; all assumed. All local crop and soil checks remain unknown. Calendar R0 is a demo baseline, not a measured Sakha rotation.

| Calendar | Median modeled unmet demand (mm) | P10–P90 across five historical members (mm) | Planned crop days |
|---|---:|---:|---:|
| R0 | 1161.51 | 1127.03–1163.65 | 303 |
| R1 | 950.87 | 916.43–953.01 | 304 |
| R2 | 985.67 | 953.89–987.81 | 303 |

Full month-by-month calendars and coefficients are in summary.json. No crop is recommended: unknown feasibility withholds the preference order. Flooded rice, salinity and groundwater interactions require different, validated models; the unsupported-domain guard passed.

## Chronological weather holdouts

Four target years, 2022–2025, each trained only on earlier years from 2016. Same calendar-date cutoff as 2026; remaining-period weather is held out. This is retrospective, with only four folds.

| Predictor | Remaining-period rainfall MAE (mm) | Heat-day MAE (days) |
|---|---:|---:|
| Five analog years | 20.32 | 0.00 |
| All prior years, median climatology | 15.29 | 0.00 |

Analog rainfall predictions are WORSE than climatology in this test. No predictive advantage is demonstrated.

## Evidence and limits

NASA POWER is regional gridded weather, not a field sensor. The cited Sakha study reports both saline and non-saline sites; its old soil values were not imported as current farm measurements. There is no independent 2026 weather station or soil/irrigation record in this benchmark, so field accuracy and crop outcomes cannot be established. Scenario quantiles are not calibrated probabilities. English and Arabic deterministic adviser reports use the same evidence hash; actual neural retrieval is tested separately in GitHub browser checks.

Evidence SHA-256: 589871c0de1730ed174b9735eec5e28806165858d388a5a797faf061b389c727. Raw responses, request URLs, units, timestamps and checksums are retained in this folder. No synthetic weather is substituted.
