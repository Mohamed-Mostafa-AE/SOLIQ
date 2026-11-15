#!/usr/bin/env python3
"""Download real HLS L30/S30 (B04, B05/B8A, Fmask) from NASA Earthdata.

NASA CMR discovery is public. Raw HLS requires your own Earthdata user token
in the EARTHDATA_TOKEN environment variable. Tokens are never printed or saved.
This program does NOT pretend to be field-calibrated or supply default fake pixels.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

CMR = 'https://cmr.earthdata.nasa.gov/search/granules.json'
PRODUCTS = {'L30': ('HLSL30', 'B05'), 'S30': ('HLSS30', 'B8A')}
BANDS = ('B04', 'NIR', 'Fmask')
MAX_BYTES_DEFAULT = 450 * 1024 * 1024


def nasa_host(url: str) -> bool:
    p = urllib.parse.urlsplit(url)
    host = (p.hostname or '').lower()
    return p.scheme == 'https' and (host == 'nasa.gov' or host.endswith('.nasa.gov'))


def valid_day(value: str) -> str:
    if not re.fullmatch(r'20\d\d-\d\d-\d\d', value):
        raise ValueError('Date must be YYYY-MM-DD')
    if datetime.fromisoformat(value).date().isoformat() != value:
        raise ValueError('Invalid date')
    return value


def cmr_url(product: str, lat: float, lon: float, start: str, end: str) -> str:
    if product not in PRODUCTS or not (-90 <= lat <= 90 and -180 <= lon <= 180):
        raise ValueError('Invalid product or study point')
    valid_day(start)
    valid_day(end)
    if start > end:
        raise ValueError('Start date after end date')
    from datetime import date
    if (date.fromisoformat(end) - date.fromisoformat(start)).days > 120:
        raise ValueError('Use a date range no longer than 120 days')
    query = urllib.parse.urlencode({
        'short_name': PRODUCTS[product][0], 'version': '2.0',
        'point': f'{lon:.6f},{lat:.6f}',
        'temporal': f'{start}T00:00:00Z,{end}T23:59:59Z',
        'page_size': '25', 'sort_key[]': '-start_date',
    })
    return f'{CMR}?{query}'


def cmr_entries(url: str):
    if not url.startswith(CMR + '?'):
        raise ValueError('NASA CMR only')
    req = urllib.request.Request(url, headers={'Accept': 'application/json', 'User-Agent':'SOLIQ-science-data-ingest/1.0'})
    with urllib.request.urlopen(req, timeout=30) as response:
        if response.status != 200:
            raise OSError(f'CMR status {response.status}')
        raw = response.read(3 * 1024 * 1024 + 1)
        if len(raw) > 3 * 1024 * 1024:
            raise OSError('CMR response too large')
        feed = json.loads(raw)['feed']
        if not isinstance(feed.get('entry'), list):
            raise ValueError('Unexpected NASA CMR feed')
        return feed['entry']


def granule_triplet(entry: dict, product: str):
    """Select only a matching official same-scene Red/NIR/Fmask trio."""
    if product not in PRODUCTS or not isinstance(entry, dict):
        raise ValueError('Invalid NASA CMR scene')
    nir = PRODUCTS[product][1]
    required = {'red': 'B04', 'nir': nir, 'fmask': 'Fmask'}
    links = [link.get('href') for link in entry.get('links', [])
             if isinstance(link, dict) and isinstance(link.get('href'), str)]
    selected = {}
    prefixes = set()
    for key, band in required.items():
        candidates = []
        for url in links:
            if not nasa_host(url):
                continue
            filename = urllib.parse.unquote(urllib.parse.urlsplit(url).path.rsplit('/', 1)[-1])
            if filename.lower().endswith('.tif') and filename.endswith(f'.{band}.tif'):
                candidates.append((filename, url))
        if len(candidates) != 1:
            return None
        filename, url = candidates[0]
        selected[key] = {'filename': filename, 'url': url}
        prefixes.add(filename[:-(len(band) + 5)])
    if len(prefixes) != 1 or not next(iter(prefixes)).startswith(f'HLS.{product}.'):
        return None
    return {'id': str(entry.get('id', '')), 'title': str(entry.get('title', '')),
            'time_start': entry.get('time_start'), 'prefix': next(iter(prefixes)),
            'bands': selected}


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def download_signed_nasa_file(url: str, dest: Path, token: str, max_bytes: int = MAX_BYTES_DEFAULT):
    if not nasa_host(url) or not token:
        raise ValueError('NASA HTTPS data URL and an Earthdata user token are required')
    opener = urllib.request.build_opener(NoRedirect)
    current = url
    # Bearer token is sent exclusively to NASA domains. NASA may grant a signed S3
    # redirect; on redirect, never forward credentials to the new origin.
    for hop in range(6):
        headers = {'User-Agent': 'SOLIQ-science-data-ingest/1.0'}
        if nasa_host(current):
            headers['Authorization'] = 'Bearer ' + token
        req = urllib.request.Request(current, headers=headers)
        try:
            stream = opener.open(req, timeout=80)
        except urllib.error.HTTPError as exc:
            if exc.code in (301, 302, 303, 307, 308):
                redirect = urllib.parse.urljoin(current, exc.headers.get('Location', ''))
                target = urllib.parse.urlsplit(redirect)
                host = (target.hostname or '').lower()
                if target.scheme != 'https' or not (
                    nasa_host(redirect) or host.endswith('.amazonaws.com') or
                    host.endswith('.cloudfront.net')
                ):
                    raise ValueError('Unsafe data download redirect') from exc
                current = redirect
                continue
            if exc.code in (401, 403):
                raise PermissionError('Earthdata authorization failed: check token and LP DAAC app authorization') from None
            raise
        with stream:
            size = 0
            digest = hashlib.sha256()
            dest.parent.mkdir(parents=True, exist_ok=True)
            fd, temporary = tempfile.mkstemp(dir=dest.parent, prefix='.nasa-', suffix='.part')
            try:
                with os.fdopen(fd, 'wb') as out:
                    prefix = b''
                    while True:
                        chunk = stream.read(1024 * 1024)
                        if not chunk:
                            break
                        size += len(chunk)
                        if size > max_bytes:
                            raise ValueError('NASA file exceeds configured max size')
                        if len(prefix) < 4:
                            prefix += chunk[:4 - len(prefix)]
                        out.write(chunk)
                        digest.update(chunk)
                if prefix not in (b'II*\x00', b'MM\x00*'):
                    raise ValueError('Downloaded content is not TIFF; refusing login page / wrong file')
                os.replace(temporary, dest)
                return {'sha256': digest.hexdigest(), 'size_bytes': size, 'filename': dest.name}
            finally:
                if os.path.exists(temporary):
                    os.unlink(temporary)
    raise OSError('Too many NASA Earthdata redirects')


def ingest(args):
    url = cmr_url(args.product, args.lat, args.lon, args.start, args.end)
    scenes = [g for item in cmr_entries(url) if (g := granule_triplet(item, args.product))]
    print(f'NASA CMR scenes with full 3-band set: {len(scenes)}')
    if not scenes:
        raise RuntimeError('No matching HLS three-band scene in this place/date range')
    found = scenes[0]
    print(f'NASA collection scene: {found["prefix"]} | {found["time_start"]}')
    if args.catalog_only:
        return found
    token = os.getenv('EARTHDATA_TOKEN', '').strip()
    if not token:
        raise PermissionError('Missing EARTHDATA_TOKEN. Generate your own free NASA Earthdata user token locally; never paste it into GitHub/ChatGPT.')
    output = Path(args.output).resolve() / re.sub(r'[^A-Za-z0-9_.-]', '_', found['prefix'])
    output.mkdir(parents=True, exist_ok=True)
    files = {}
    for role, item in found['bands'].items():
        dest = output / item['filename']
        print(f'Downloading genuine NASA {role} band: {dest.name}')
        receipt = download_signed_nasa_file(item['url'], dest, token, args.max_mb * 1024 * 1024)
        receipt['official_source'] = item['url']
        files[role] = receipt
    manifest = {
        'product': 'HLS' + args.product,
        'version': '2.0',
        'granule': found['prefix'],
        'cmr_granule_id': found['id'],
        'time_start': found['time_start'],
        'study_point': {'lat': args.lat, 'lon': args.lon, 'type': 'study_point_not_field_geometry'},
        'downloaded_at_utc': datetime.now(timezone.utc).isoformat(),
        'kind': 'authenticated_raw_data',
        'qa_status': 'NOT_YET_PIXEL_SCREENED',
        'crop_soil_calibration': 'UNAVAILABLE',
        'files': files,
        'cmr_catalogue_url': url,
        'provider': 'NASA LP DAAC / NASA Earthdata',
        'notice': 'Raw NASA source data with SHA-256, not an observed yield/soil salinity/field outcome',
    }
    (output / 'source_manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    print('HLS downloaded and SHA-256 recorded in', output / 'source_manifest.json')
    return manifest


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--product', choices=['L30', 'S30'], default='L30')
    parser.add_argument('--lat', type=float, default=30.5806, help='Study point latitude; NOT confirmed farm coordinates')
    parser.add_argument('--lon', type=float, default=31.4333, help='Study point longitude; NOT confirmed farm coordinates')
    parser.add_argument('--start', default='2026-10-01')
    parser.add_argument('--end', default='2026-11-01')
    parser.add_argument('--output', default='data/nasa-hls-raw', help='Local output; do NOT commit large raw files to git')
    parser.add_argument('--max-mb', type=int, default=450)
    parser.add_argument('--catalog-only', action='store_true', help='List one candidate without Earthdata token')
    args = parser.parse_args(argv)
    if args.max_mb < 1 or args.max_mb > 1500:
        parser.error('--max-mb must be between 1 and 1500')
    try:
        ingest(args)
        return 0
    except Exception as e:
        print(type(e).__name__ + ': ' + str(e), file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
