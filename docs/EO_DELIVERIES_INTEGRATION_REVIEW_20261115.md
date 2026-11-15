# SOLIQ EO Science Deliveries — PR #17 Follow-Up Fixes (`#issuecomment-6897616390`)

- **Pull Request:** [PR #17 — Review Gemini EO-science deliveries: NASA safety guards, crop model and Seventh Field evidence](https://github.com/Mohamed-Mostafa-AE/SOLIQ/pull/17)
- **Review Comment Addressed:** [`#issuecomment-6897616390`](https://github.com/Mohamed-Mostafa-AE/SOLIQ/pull/17#issuecomment-6897616390)
- **Dedicated Child Branch:** `work/pr17-real-hdf5-hls-band-join` (targeting `review/eo-science-gemini-deliveries-20261115` in [PR #17](https://github.com/Mohamed-Mostafa-AE/SOLIQ/pull/17))
- **Related Issues:** [Issue #5 (`[GEMINI] Implement real IMERG/HLS evidence pipelines and locally bounded crop-science inputs`)](https://github.com/Mohamed-Mostafa-AE/SOLIQ/issues/5) and [Issue #6 (`[CODEX-2] Implement bounded real SAR acquisition, pair validation and safe change demo`)](https://github.com/Mohamed-Mostafa-AE/SOLIQ/issues/6)

## 1. Exact Fixes Addressing Review Comment `#issuecomment-6897616390`

1. **Replaced Custom `"IMNC"` Layout with Genuine NetCDF-4/HDF5 (`h5py`/`netCDF4`), Unidata NetCDF-3 (`CDF\x01`/`CDF\x02`), and NASA GES DISC OPeNDAP Subsetting (`adapters/imerg-netcdf4-reader.js`):**
   - Completely removed the custom `"IMNC"` binary layout and added an explicit negative guard rejecting any buffer containing `"IMNC"` (`reason: 'rejected_legacy_custom_imnc_header_not_real_hdf5'`).
   - Added `decodeViaPythonScientificBridge` which uses Python's `h5py` (such as `h5py 3.15.1` on the review host) or `netCDF4` to read real HDF5 groups (`/`, `/Grid`), datasets (`precipitation`, `precipitationCal`, `precipitationQualityIndex`, `qa`, `randomError`), chunks/deflate filters, and attributes (`units`, `Units`, `_FillValue`, `CodeMissingValue`).
   - Added a pure-JS Unidata NetCDF-3 (`CDF\x01` / `CDF\x02` RFC specification) binary parser (`parseNetCdf3BinaryBuffer`) that decodes standard NetCDF files produced by NASA GES DISC OPeNDAP `.nc` subsetting and Python `scipy.io.netcdf_file`.
   - Added `buildImergOpendapSubsetUrl` to construct official NASA GES DISC OPeNDAP constraint queries (`?precipitation[0:1:0][lonIdx:1:lonIdx][latIdx:1:latIdx],precipitationQualityIndex[...]`) for the target `0.1° x 0.1°` cell (`30.55°N, 31.45°E` for Zankalon).
2. **Replaced Single Interleaved `.tif` with Separate 3-Band HLS COG Assembly (`B04.tif` + `B05.tif`/`B8A.tif` + `Fmask.tif` in `adapters/hls-geotiff-reader.js` & `adapters/hls-optical.js`):**
   - Per [NASA HLS Data Products (`HLSL30` & `HLSS30`)](https://hls.gsfc.nasa.gov/data-products/), `decodeHlsGeoTiffBinary` now **rejects any single `.tif` file** (`status: 'incomplete_hls_band_triplet'`) and requires the three separate single-band COGs (`redCogBytes`, `nirCogBytes`, `fmaskCogBytes`) for the same granule.
   - Validates HLS asset nomenclature (`parseHlsAssetNomenclature` for `HLS.<L30|S30>.T<MGRS>.<YYYYDDD>T<HHMMSS>.v2.0.<Band>.tif`), enforcing `B04` for Red, `B05` for `HLSL30` NIR (or `B8A`/`B08` for `HLSS30` NIR), and 8-bit `Fmask` for QA.
   - Enforces identical granule ID, MGRS tile, acquisition date, raster dimensions, `30m` pixel scale, `EPSG:32636` CRS, and UTM upper-left tiepoint `(ulEastingM, ulNorthingM)` across all three separate GeoTIFFs before masking clouds/shadows and computing pixel-wise `NDVI`.
3. **Eliminated `authenticatedLiveTransport` Provenance Spoofing (`adapters/backend-registry.js`, `adapters/gpm-imerg.js`, `adapters/hls-optical.js`):**
   - Removed `options.authenticatedLiveTransport` from `createBackendEvidenceAdapters(options)` and added a security guard that throws on `strictRejectSpoofFlags: true` when spoofing flags are passed.
   - Any injected local byte fixture (`imergRawBytes`, `hlsBandTriplet`, `nasaPowerRawBytes`) or custom mock `fetchImpl` (`fetchImpl !== globalThis.fetch`) is strictly constrained to `delivery: 'cached'`, `kind: 'assumed'`, and `status: 'unverified_payload'` (`authenticated: false`).

## 2. Exact Status Breakdown (`DONE` vs. `BLOCKED`)

| Requirement | Status | Verification Evidence / Exact Blocker Reason |
| --- | --- | --- |
| **1. Genuine HDF5/NetCDF4 (`h5py`) & OPeNDAP NetCDF-3 reader** | **DONE** | `adapters/imerg-netcdf4-reader.js` rejects legacy `"IMNC"`, decodes real `scipy.io.netcdf_file` `CDF\x01` files in pure JS, and decodes real `h5py 3.15.1` HDF5 datasets (`precipitation` + `precipitationQualityIndex`/`qa`) via Python `h5py` bridge. |
| **2. Separate 3-band HLS COG joiner (`B04` + `B05`/`B8A` + `Fmask`)** | **DONE** | `adapters/hls-geotiff-reader.js` rejects single `.tif` files and verifies band nomenclature, MGRS tile, acquisition date, and 30m UTM tiepoint alignment across the 3 separate band COGs. |
| **3. Prevent `authenticatedLiveTransport` / fixture spoofing** | **DONE** | `adapters/backend-registry.js` and EO adapters never allow caller booleans, injected buffers, or mocked `fetchImpl` functions to produce `observed` or `live`. |
| **4. Live Earthdata IMERG & HLS Granule Download** | **BLOCKED (Retained `UNAVAILABLE`)** | Outbound internet is disabled in the build container and `EARTHDATA_TOKEN` is not stored in the repository; live calls return `delivery: 'unavailable'`, `rawSha256: null`, `qa.usable: false` with `BLOCKED_EARTHDATA_TOKEN_MISSING` / `BLOCKED_OUTBOUND_NETWORK_UNAVAILABLE`. No synthetic data is substituted. |
| **5. Preserve all prior PR #17 safety guards & `ASSUMED` crop/soil status** | **DONE** | All 33 EO/science tests (`eo-security-audit.test.js`, `eo-forcing-advice-gate.test.mjs`, `eo-science-review.test.mjs`, `eo-science.test.js`, `eo-pr17-completion.test.mjs`) pass (`33/33 pass`). |
| **6. Separate review branch targeting PR #17 (without touching release files)** | **DONE** | Committed on dedicated child branch `work/pr17-real-hdf5-hls-band-join` touching only the PR #17 EO/science scope (`adapters/**`, `science/**`, `configs/pilots/**`, `tests/**`, `docs/EO_DELIVERIES_INTEGRATION_REVIEW_20261115.md`). |
| **7. Overall Issue #5 & Issue #6 Completion Gate** | **BLOCKED (Do Not Close Yet)** | Retain [Issue #5](https://github.com/Mohamed-Mostafa-AE/SOLIQ/issues/5) and [Issue #6](https://github.com/Mohamed-Mostafa-AE/SOLIQ/issues/6) open until live authenticated Earthdata granules (`GPM_3IMERGDF.07`, `HLSL30.v2.0` 3-band COGs, and ASF SAR pairs) are fetched on an internet-connected host with `EARTHDATA_TOKEN`. |
