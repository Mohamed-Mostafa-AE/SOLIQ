# SOLIQ Earth Observations & Scientific Models — Evidence Manifest & Pull Request Spec (`work/eo-science`)

* **Repository:** [Mohamed-Mostafa-AE/SOLIQ](https://github.com/Mohamed-Mostafa-AE/SOLIQ)
* **Base Branch:** [feat/omni-earth-prototypes-20261115](https://www.google.com/search?q=https://github.com/Mohamed-Mostafa-AE/SOLIQ/tree/feat/omni-earth-prototypes-20261115)
* **Feature Branch:** `work/eo-science`
* **Task Reference:** [Issue #5 — NASA Earth Observations + Scientific Models](https://github.com/Mohamed-Mostafa-AE/SOLIQ/issues/5)
* **Scope Restriction Compliance:** Touches **only** `adapters/`, `science/`, `configs/pilots/`, and scientific tests (`tests/eo-science.test.js`). Zero modifications to shared UI or API files.
* **Calibration Disclaimer:** All crop coefficients ($K_c$), rooting depths ($Z_r$), soil hydraulic properties ($\theta_{FC}, \theta_{WP}, \theta_{sat}, K_{sat}$), and salinity thresholds are parameterized from peer-reviewed literature and FAO-56 tables. **This implementation does not claim independent field-level agronomic calibration without human field verification.**

## 1. File Inventory & Verification Matrix

| File Path | Requirement Covered | Key Scientific & Engineering Capabilities | Verification Status |
| :--- | :--- | :--- | :--- |
| `adapters/gpm-imerg.js` | **Req #1:** GPM IMERG V07 Connector | Queries NASA CMR (`GPM_3IMERGDF` / `GPM_3IMERGDL` / `GPM_3IMERGHH` V07), validates units (`mm/day` vs `mm/hr`), applies V07 unbiased daily conversion ($\text{mean}(\text{valid half-hourly rates}) \times 24$), checks `precipitation_cnt` ($\ge 36/48$), verifies $0.1^\circ$ spatial & temporal coverage, and enforces strict non-synthetic honesty when Earthdata Login (`EARTHDATA_TOKEN`) is missing. | Verified (`PASS` in `tests/eo-science.test.js`) |
| `adapters/hls-optical.js` | **Req #2:** HLS Landsat/Sentinel-2 Connector | Ingests `HLSL30.v2.0` (`B04`, `B05`) and `HLSS30.v2.0` (`B04`, `B8A`), applies scale factor `0.0001`, decodes 8-bit `Fmask` (bits 0–5 cloud/shadow/adjacent/snow/water + bits 6–7 high aerosol exclusion), computes `NDVI`, `NIRv`, and Salinity Index `SI5`, and verifies clear-pixel spatial ($\ge 50\%$) and temporal revisit coverage. | Verified (`PASS` in `tests/eo-science.test.js`) |
| `adapters/nasa-power.js` | **Req #3:** NASA POWER Reuse & Normalizer | Delegates directly to existing NASA POWER connector when injected (`existingConnector`), filters `-999`/`-99` sentinels, validates agroclimatology units (`T2M`, `PRECTOTCORR`, `ALLSKY_SFC_SW_DWN`, `RH2M`, `WS2M`), and computes reference evapotranspiration ($ET_0$) via FAO-56 Penman-Monteith. | Verified (`PASS` in `tests/eo-science.test.js`) |
| `configs/pilots/zankalon.json` | **Req #4:** Zankalon Referenced Pilot Config | Parameterizes Zankalon Water Requirements Research Station (Zagazig, Sharkia, $30.5833^\circ\text{N}, 31.4333^\circ\text{E}$, tile `36RUV`): clay loam/alluvial clay ($\theta_{FC}=0.41, \theta_{WP}=0.21, \theta_{sat}=0.50, \text{CN}=84$), Bahr Mowais canal constraints, uncertainty bounds, and peer-reviewed citations. | Verified (`PASS` in `tests/eo-science.test.js`) |
| `configs/pilots/kafr-el-sheikh.json` & `configs/pilots/west-minya.json` | **Req #4:** Independent Multi-Region Support | Independent regional pilot configurations for North Delta saline clay (`kafr-el-sheikh.json`, $EC_e=5.2\text{ dS/m}$) and Middle Egypt calcareous sandy loam (`west-minya.json`, $\theta_{FC}=0.19, \theta_{WP}=0.08$, groundwater quota $1050\text{ mm}$). | Verified (`PASS` in `tests/eo-science.test.js`) |
| `science/crop-library.js` | **Req #4:** Crop Calendars & $K_c$ Library | Defines 10 crops/states (`wheat`, `berseem_clover`, `faba_bean`, `sugar_beet`, `paddy_rice`, `grain_maize`, `grain_sorghum`, `soybean`, `short_season_cowpea`, `bare_fallow`) with 4-stage FAO-56 $K_{c,\text{ini}}, K_{c,\text{mid}}, K_{c,\text{end}}$, dynamic rooting depth $Z_r(t)$, Maas-Hoffman salinity tolerance, N carry-over, and bounded HLS NDVI assimilation. | Verified (`PASS` in `tests/eo-science.test.js`) |
| `science/rotation-generator.js` | **Req #5:** Current + 2 Feasible Rotations | Generates the farmer's current baseline rotation plus 2 feasible alternative rotations (`alternative_1`: $C_3 \to C_4$ water/thermal shift + cowpea cover shield; `alternative_2`: halotolerant/legume bio-recovery) verified against water quota, salinity, and botanical pest-break constraints. | Verified (`PASS` in `tests/eo-science.test.js`) |
| `science/water-balance.js` | **Req #6:** Daily Water Balance & Season Carry-Over | Computes daily $ET_{c,\text{pot}}$, water/salinity stress $K_s$, $ET_{c,\text{act}}$, USDA-SCS Curve Number surface runoff ($RO$), deep percolation/drainage ($DP$), soil storage, root-zone depletion $D_r(t)$, and multi-season carry-over of soil moisture, salinity ($EC_e$), nitrogen ($\text{kg N/ha}$), and pest host history. | Verified (`PASS` in `tests/eo-science.test.js`) |
| `science/interval-regret.js` & `science/eo-pipeline.js` | **Req #7:** Interval Regret & `comparison_only` Mode | Propagates documented uncertainty bounds ($\sigma_{ET_0}=\pm 10\%, \sigma_{K_c}=\pm 8\%, \sigma_{\text{IMERG}}=\pm 18\%, \sigma_{\text{NDVI}}=\pm 0.04, \sigma_{\text{soil}}=\pm 12\%$) into strategy utility intervals $[L_i, U_i]$, computes minimax interval regret, and strictly enforces `comparison_only` when coverage is insufficient or Earthdata auth is blocked. | Verified (`PASS` in `tests/eo-science.test.js`) |
| `tests/eo-science.test.js` | **Req #8:** Scientific & Edge-Case Test Suite | 11 automated tests covering unit conversions, bitwise `Fmask`, missing forcing days, `-999` sentinels, mass conservation, multi-region independence, Earthdata `401`/`auth_required` honesty, and `comparison_only` fallback. | `11/11 PASS` (`node --test`) |

## 2. Earthdata Authentication & Network Diagnostics Log

In compliance with Requirement #1, #2, and the strict honesty policy:
* **NASA GES DISC (`GPM_3IMERGDF` / `GPM_3IMERGDL` V07)** and **NASA LPCLOUD (`HLSL30.v2.0` / `HLSS30.v2.0`)** require a valid NASA Earthdata Login Bearer token (`EARTHDATA_TOKEN`) with approved Data Access EULAs to stream or subset NetCDF4 / Cloud Optimized GeoTIFF (COG) granules.
* Furthermore, outbound internet access is disabled inside the isolated execution container (`sandbox_internet_access` restriction).
* When invoked without `EARTHDATA_TOKEN` or without outbound network access, `fetchGpmImergV07` and `fetchHlsOpticalSeries` return:
  * `status: 'auth_required'` or `status: 'network_blocked_or_offline'`
  * `syntheticFallbackUsed: false`
  * Detailed `diagnostics` recording the exact CMR query URL and failure reason.
  * Upstream `evaluateIntervalRegret` automatically sets `decisionMode: 'comparison_only'` and `recommendedStrategyId: null` whenever satellite streams are blocked or fall below minimum coverage thresholds (`minMetCoverageRatio: 0.85`, `minImergCoverageRatio: 0.80`, `minHlsClearSceneRatio: 0.35`).

## 3. Authoritative Scientific & NASA Dataset References

1. **GPM IMERG V07 Dataset & Algorithm:**
   * [NASA Earthdata Catalog — GPM IMERG V07 (`GPM_3IMERGDE` / `GPM_3IMERGDF` / `GPM_3IMERGHH`)](https://www.earthdata.nasa.gov/data/catalog/ges-disc-gpm-3imergde-07)
   * [NASA Openscapes — Earthdata Discovery & Subsetting for `GPM_3IMERGDF` V07 (`C2723754864-GES_DISC`, DOI: `10.5067/GPM/IMERGDF/DAY/07`)](https://nasa-openscapes.github.io/2023-Cloud-Workshop-AGU/tutorials/Earthdata_Search_Discovery_earthaccess.html)
   * [NASA Openscapes — IMERG V07 Variables (`precipitation` in `mm/day`, `precipitation_cnt`, `randomError`)](https://nasa-openscapes.github.io/2023-Cloud-Workshop-AGU/tutorials/Earthdata_Subset_and_Plot.html)
   * [IMERG V07 Technical Summary — Half-Hourly `mm/hr` vs Daily Unbiased Mean Rate $\times 24$ & V07 Final Cutoff Notice](https://data4researchers.kr/en/datasets/imerg/)
2. **HLS Landsat/Sentinel-2 v2.0 Surface Reflectance & Fmask QA:**
   * [NASA Earthdata LPCLOUD — HLS Sentinel-2 MSI Surface Reflectance Daily Global 30m v2.0 (`HLSS30.v2.0`, DOI: `10.5067/HLS/HLSS30.002`)](https://www.earthdata.nasa.gov/data/catalog/lpcloud-hlss30-2.0)
   * [NASA Earthdata LPCLOUD — HLS Landsat OLI Surface Reflectance Daily Global 30m v2.0 (`HLSL30.v2.0`, DOI: `10.5067/HLS/HLSL30.002`)](https://www.earthdata.nasa.gov/data/catalog/lpcloud-hlsl30-2.0)
   * [NASA HLS Algorithms & Fmask 8-Bit QA Band Specification (Bits 1–5 Cloud/Shadow/Adjacency/Water & Bits 6–7 Aerosol)](https://hls.gsfc.nasa.gov/algorithms/)
   * [LP DAAC Harmonized Landsat Sentinel-2 (HLS) Product User Guide V2.0 (Scale Factor `0.0001`, Fill `-9999`)](https://lpdaac.usgs.gov/documents/1698/HLS_User_Guide_V2.pdf)
3. **Zankalon (Sharkia) Benchmark, Nile Delta Soil Hydraulics & FAO-56 Crop Water Balance:**
   * [Ayyad, S., Karimi, P., Ribbe, L., & Becker, M. (2024). *Potential Improvements in Crop Production in Egypt and Implications for Future Water and Land Demand: The Zankalon Region Benchmark Case Study*. International Journal of Plant Production.](https://www.researchgate.net/publication/381726159_Potential_Improvements_in_Crop_Production_in_Egypt_and_Implications_for_Future_Water_and_Land_Demand)
   * [Abd El Baki, H. M., Fujimaki, H., et al. (2021). *An Evaluation of a New Scheme for Determination of Irrigation Depths in the Egyptian Nile Delta (Zankalon, Sharkia hydraulic & solute parameters)*. Water, 13(16), 2181.](https://www.mdpi.com/2073-4441/13/16/2181)
   * [Allen, R. G., Pereira, L. S., Raes, D., & Smith, M. (1998). *Crop Evapotranspiration: Guidelines for Computing Crop Water Requirements*. FAO Irrigation and Drainage Paper No. 56.](http://www.climasouth.eu/sites/default/files/FAO%2056.pdf)
   * [Nile Delta Eddy Covariance Consortium (2017). *Crop evapotranspiration in the Nile Delta under different irrigation methods (rice, maize, cotton, sugar beet, berseem, wheat, fava beans)*.](https://www.researchgate.net/publication/317550284_Crop_evapotranspiration_in_the_Nile_Delta_under_different_irrigation_methods)
   * [El-Agha, D. E., Molden, D., & Ghanem, A. M. (2011). *Performance assessment of irrigation water management in old lands of the Nile delta of Egypt (Meet Yazid & Sakha, Kafr El-Sheikh)*.](https://www.researchgate.net/publication/257574280_Performance_assessment_of_irrigation_water_management_in_old_lands_of_the_Nile_delta_of_Egypt)
   * [Frontiers in Sustainable Food Systems (2026). *Regenerative benefits of legume–wheat intercropping systems on calcareous soils in El-Minia Governorate, Middle Egypt*.](https://www.frontiersin.org/journals/sustainable-food-systems/articles/10.3389/fsufs.2026.1923296/full)

## 4. Git Branch (`work/eo-science`) & Pull Request Sync Instructions

A complete Git repository on branch `work/eo-science` (with a clean `.patch` / `.bundle` archive) has been prepared. Because the sandbox environment has no outbound internet access to push directly to `github.com`, apply the bundle or patch directly onto your local clone of `https://github.com/Mohamed-Mostafa-AE/SOLIQ` using:

```bash
git fetch origin feat/omni-earth-prototypes-20261115
git checkout -b work/eo-science origin/feat/omni-earth-prototypes-20261115
git am < soliq-work-eo-science.patch
npm test
git push -u origin work/eo-science
gh pr create --base feat/omni-earth-prototypes-20261115 --head work/eo-science \
  --title "feat(eo-science): NASA IMERG V07, HLS v2.0, Zankalon FAO-56 water balance & interval regret (#5)" \
  --body-file EVIDENCE_MANIFEST.md
```
