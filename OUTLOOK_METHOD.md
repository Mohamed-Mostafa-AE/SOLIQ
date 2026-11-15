# 2026 outlook: evidence and interpretation

The farmer supplies coordinates, available soil-water capacity, initial water and an annual effective irrigation limit. Dates, source requests, NASA metadata, model assumptions, selected historical years and a SHA-256 evidence ID accompany the export. The landing page starts at a clearly labeled Cairo example.

## Computation

1. Request `T2M_MIN`, `T2M_MAX` and `PRECTOTCORR` in UTC from the NASA POWER daily point API. Confirm °C and mm/day units, ordered daily coverage and physical value ranges. Fetch 2026 to a documented three-day publication offset and complete 2016–2025 histories. Recent GEOS-IT values can be revised with MERRA-2.
2. Compute each year's feature vector over the last 60 matching month-days: mean minimum air temperature, mean maximum air temperature and `log(1 + sum(rain))`. Standardize each component by historical population standard deviation, floored at 1 °C for temperatures and 0.1 for log-rain. Select five nearest years by Euclidean distance, breaking ties by year. This is a small nearest-neighbour statistical model, not a trained crop-growth model.
3. Each ensemble member preserves every retrieved 2026 daily value. After the cutoff, map one selected historical year's weather by month-day to 2026. Simulate the existing sequence and two alternatives with the existing transparent water engine. Initial storage and the irrigation budget are carried across the cutoff; they are not reset at the projection boundary.
4. Report empirical linear-interpolated P10/P50/P90 across five members for annual demand, unmet ET demand, irrigation and final storage. Daily curves show pointwise storage percentiles, not a single jointly median trajectory. The interval omits uncertainty in soil, calendars, crop coefficients, irrigation rules and model structure. Values outside these ranges remain possible.
5. Retrospectively hold out each historical year and forecast its remaining-period rain and heat counts from the others, using the same month-day cutoff. Compare median predictions with the historical-median baseline using MAE. The target year is excluded, but other folds may use later years; this is not prospective or rolling-origin validation. Leap-day handling and the small sample can affect comparability.

The current water model uses monthly constant Kc and a fixed-depth bucket with a simplified storage stress response. It does not simulate crop establishment, daily phenology, cultivar suitability, nitrogen, disease, salinity, waterlogging, carbon, actual vegetation cover, yield or profit. Fewer planned crop days can reduce modeled water demand while sacrificing production; the model does not evaluate that sacrifice.

## Language models

Kimi Pro and DeepSeek receive only server-computed evidence and declared numeric inputs. They are asked to explain evidence, caveats and local checks in English or Arabic. Their agreement is not validation and they do not add new numerical predictions. Model identity and the evidence ID accompany responses. Their text is unverified generated interpretation; the downloaded model outputs remain the source for numerical comparisons.

## Sources

- NASA POWER daily API: https://power.larc.nasa.gov/docs/services/api/temporal/daily/
- NASA POWER latency and grid guidance: https://power.larc.nasa.gov/docs/faqs/data/ and https://power.larc.nasa.gov/docs/services/
- NASA meteorological sources and revisions: https://power.larc.nasa.gov/docs/methodology/data/sources_meteorology/
- FAO-56 Hargreaves estimate and crop coefficients: https://www.fao.org/4/x0490e/x0490e07.htm and https://www.fao.org/4/x0490e/x0490e0b.htm
- Vercel compatible API: https://vercel.com/docs/ai-gateway/sdks-and-apis/openai-chat-completions
- Live model catalog: https://ai-gateway.vercel.sh/v1/models
