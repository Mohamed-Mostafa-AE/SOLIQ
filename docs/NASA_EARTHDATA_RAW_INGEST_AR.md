# SOLIQ — NASA HLS Raw Scientific Ingestion (Actual Source Data)

This repository upgrade includes **real NASA Earthdata download scripts**, not a synthetic scene fixture. NASA scientific data from NASA-led missions are generally open/CC0 unless a dataset carries other terms; cite the original product, collection, version, time, and NASA LP DAAC in reports. See https://science.data.nasa.gov/about/license and https://hls.gsfc.nasa.gov/data-access-and-tools/.

## What is and is not ready

- **NASA CMR search** works without a token on a networked computer and lists actual HLS granules.
- **HLS Red, NIR and Fmask raw GeoTIFF download** requires a *free NASA Earthdata Login user token*. The script downloads three matching files from a single real L30 or S30 scene, validates all source URLs are from NASA, rejects login-page bytes disguised as TIFF, computes SHA-256 and writes a provenance manifest.
- **Pixel NDVI analysis** requires separately installed `rasterio` and `numpy`. The analyzer verifies all SHA-256 hashes, pixel georeferencing, co-registration and HLS v2.0 Fmask cloud/shadow/snow/water/adjacency flags. It reports NDVI on a small sample around a **study point**, not a real farm footprint. The CSV/JSON outputs are not proof of yield, salinity or crop advice.
- No script can legally or reliably substitute an authentication token for a NASA archive that requires it. Do not paste the token into a chat or GitHub issue, and do not commit `.env`, raw satellite files, or downloaded signed links.

## Steps on Windows PowerShell

1. Create your own free account at https://urs.earthdata.nasa.gov/ and generate a user token on its profile. Authorize LP DAAC/Earthdata Cloud access if prompted.
2. Open a terminal **inside the SOLIQ repository at latest `main`** and enter the token into the current session without putting it in command history:

```powershell
$secret = Read-Host 'Earthdata user token' -AsSecureString
$env:EARTHDATA_TOKEN = [System.Net.NetworkCredential]::new('', $secret).Password
```

3. First check NASA catalogue for the Nile Delta *public study point* (not the user's exact farm location):

```powershell
python tools/nasa_hls_ingest.py --product L30 --lat 30.5806 --lon 31.4333 --start 2026-10-01 --end 2026-11-01 --catalog-only
```

4. Download a matching scene with actual, consistent separate bands:

```powershell
python tools/nasa_hls_ingest.py --product L30 --lat 30.5806 --lon 31.4333 --start 2026-10-01 --end 2026-11-01
```

The folder `data/nasa-hls-raw/<granule>/` will contain `B04.tif`, `B05.tif`, `Fmask.tif`, and `source_manifest.json`. For HLS S30, use `--product S30`, which downloads `B8A.tif` for NIR. If no triplet exists within the initial period, choose another recent window — do **not** use synthetic data as a NASA replacement.

5. To calculate one *actual QA-screened* vegetation index for the public study point:

```powershell
python -m pip install rasterio numpy
python tools/hls_point_ndvi.py data/nasa-hls-raw/<granule>/source_manifest.json --output hls_point_ndvi.json
Remove-Item Env:EARTHDATA_TOKEN
```

The output is a limited pixel sample, not a calibration or a study of an identified private farm. Review actual image footprint, cloud coverage, file versions and atmospheric corrections before interpreting it.

## Build/runtime constraints

`rasterio`, `h5py`, NetCDF/HDF5 and large raw files are **not assumed available inside Vercel's serverless runtime**. This is an *offline validated-ingestion pipeline* to generate reproducible NASA evidence. Only publish a compact, checked derivative and the nonsecret manifest in the app after expert review. This avoids 100 MB deploy limits, missing Python native libraries, and accidental disclosure of Earthdata credentials. Original NASA browse imagery on the site is for visual context only.

## Provenance minimum

Every result should identify `provider`, `product`, `version`, granule ID, sensing time, study-area coordinates, `rawSha256` for each band, mask policy, clear-land pixel count, local query and processing method. If a download or pixel QA fails, mark **UNAVAILABLE** instead of injecting modeled results.
