#!/usr/bin/env python3
"""QA-screen one small public study-point sample from downloaded NASA HLS scene.

Scientific scope: reflectance-derived NDVI within a local window only. NOT farm
boundary analysis, crop validation, land productivity, salinity or irrigation diagnosis.
Requires separately installed rasterio and numpy; never fabricate pixel data.
"""
import argparse
import hashlib
import json
from pathlib import Path


def file_hash(path):
    h = hashlib.sha256()
    with path.open('rb') as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def analyze(manifest_file, output_file=None, radius=5):
    import numpy as np
    import rasterio
    from rasterio.windows import Window
    from rasterio.warp import transform
    manifest_path = Path(manifest_file).resolve()
    record = json.loads(manifest_path.read_text(encoding='utf-8'))
    if record.get('kind') != 'authenticated_raw_data' or not all(k in record.get('files', {}) for k in ('red','nir','fmask')):
        raise ValueError('Requires a complete authenticated HLS band-triplet receipt')
    files = {}
    for kind, file_entry in record['files'].items():
        filename = file_entry['filename']
        if Path(filename).name != filename:
            raise ValueError('Invalid manifest filename')
        path = manifest_path.parent / filename
        if not path.is_file() or file_hash(path) != file_entry['sha256']:
            raise ValueError(f'Missing or checksum mismatch for {kind} original NASA raster')
        files[kind] = path
    lat = record['study_point']['lat']
    lon = record['study_point']['lon']
    with rasterio.open(files['red']) as red, rasterio.open(files['nir']) as nir, rasterio.open(files['fmask']) as fmask:
        if not red.crs or red.crs != nir.crs or red.crs != fmask.crs or red.transform != nir.transform or red.transform != fmask.transform or red.shape != nir.shape or red.shape != fmask.shape:
            raise ValueError('HLS red/nir/Fmask must be precisely co-registered')
        x, y = transform('EPSG:4326', red.crs, [lon], [lat])
        row, col = red.index(x[0], y[0])
        if not (0 <= col < red.width and 0 <= row < red.height):
            raise ValueError('Study point outside NASA HLS scene footprint')
        r0, c0 = max(0,row-radius), max(0,col-radius)
        r1, c1 = min(red.height,row+radius+1), min(red.width,col+radius+1)
        w = Window(c0,r0,c1-c0,r1-r0)
        rv = red.read(1, window=w).astype('float64')
        nv = nir.read(1, window=w).astype('float64')
        fv = fmask.read(1, window=w).astype('uint8')
        # HLS version 2.0 Fmask: bits 0-5 cirrus, cloud, adjacent,
        # shadow, snow, water; bits 6-7 aerosol (3 high). Fill=255.
        qa = (fv != 255) & ((fv & 0b00111111) == 0) & (((fv >> 6) & 3) != 3)
        valid = qa & np.isfinite(rv) & np.isfinite(nv) & (rv != -9999) & (nv != -9999)
        # DN to reflectance: 0.0001; exclude nonphysical / zero denominator.
        r = rv * 0.0001
        n = nv * 0.0001
        valid &= (r >= 0) & (n >= 0) & (r <= 1) & (n <= 1) & ((r+n)>0)
        values = ((n-r)/(n+r+1e-12))[valid]
        if len(values) < 1:
            return {'status':'UNAVAILABLE', 'reason':'No clear, co-registered, valid-land pixels in study window', 'sample_size':0,
                    'evidence_kind':'raw_HLS_observations_QA_filtered', 'not_calibrated':True}
        result = {'status':'available_QA_screened', 'evidence_kind':'raw_HLS_observations_QA_filtered',
                  'granule':record['granule'], 'study_point':record['study_point'], 'sample_window_px':[int(w.width),int(w.height)],
                  'clear_land_pixels':int(len(values)), 'total_pixels':int(rv.size),
                  'valid_fraction':float(len(values)/rv.size),
                  'ndvi_median':float(np.median(values)), 'ndvi_mean':float(np.mean(values)),
                  'ndvi_min':float(np.min(values)), 'ndvi_max':float(np.max(values)),
                  'raw_sha256_by_band':{key:item['sha256'] for key,item in record['files'].items()},
                  'source':'NASA HLS v2.0 L30/S30 from LP DAAC',
                  'agronomic_conclusion':'None; pixel-scale vegetation index only, not actual soil chemistry, yield, or farm prescription',
                  'not_calibrated':True}
    if output_file:
        Path(output_file).write_text(json.dumps(result,indent=2),encoding='utf-8')
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('manifest', help='Source manifest from nasa_hls_ingest.py')
    parser.add_argument('--radius',type=int,default=5,help='Pixel radius around the public study point')
    parser.add_argument('--output',default='hls_point_ndvi.json')
    args=parser.parse_args()
    if not 1<=args.radius<=50:parser.error('Radius must be 1..50')
    print(json.dumps(analyze(args.manifest,args.output,args.radius),indent=2,ensure_ascii=False))

if __name__=='__main__':main()
