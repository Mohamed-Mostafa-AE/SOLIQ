import importlib.util
import pathlib
import unittest

MODULE_PATH = pathlib.Path(__file__).resolve().parents[1] / 'tools' / 'nasa_hls_ingest.py'
spec=importlib.util.spec_from_file_location('nasa_hls_ingest',MODULE_PATH)
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

class TestNasaHlsIngest(unittest.TestCase):
    def test_nasa_url_limit(self):
        link=mod.cmr_url('L30',30.5806,31.4333,'2026-10-01','2026-11-01')
        self.assertTrue(link.startswith(mod.CMR+'?'))
        self.assertIn('HLSL30',link)
        with self.assertRaises(ValueError):mod.cmr_url('WRONG',30.58,31.43,'2026-10-01','2026-11-01')
        with self.assertRaises(ValueError):mod.cmr_url('L30',30.58,31.43,'2026-10-01','2027-11-01')
    def test_same_scene_triplet(self):
        granule='HLS.L30.T36RUV.2026304T081921.v2.0'
        item={'id':'G1','links':[{'href':f'https://data.lpdaac.earthdatacloud.nasa.gov/lp-prod-protected/HLSL30.020/{granule}/{granule}.{b}.tif'} for b in ('B04','B05','Fmask')]}
        trio=mod.granule_triplet(item,'L30')
        self.assertEqual(trio['prefix'],granule)
        self.assertEqual(len(trio['bands']),3)
        item['links'].pop()
        self.assertIsNone(mod.granule_triplet(item,'L30'))
    def test_reject_non_nasa_initial(self):
        self.assertFalse(mod.nasa_host('http://data.lpdaac.earthdatacloud.nasa.gov/file'))
        self.assertFalse(mod.nasa_host('https://nasa.gov.attacker.com/file'))
        self.assertTrue(mod.nasa_host('https://data.lpdaac.earthdatacloud.nasa.gov/file'))
        with self.assertRaises(ValueError):mod.download_signed_nasa_file('https://other.test',pathlib.Path('/tmp/a'),'xxx')

if __name__=='__main__':unittest.main()
