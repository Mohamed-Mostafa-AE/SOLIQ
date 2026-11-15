/**
 * SOLIQ: The Seventh Field - Earth Lens Visualization
 * Toggles three scientific registers:
 * 1. Ground Reality (PBR village realism)
 * 2. Observed NASA (False-color NDVI / thermal overlay with dated telemetry)
 * 3. Modelled Future (Synthetic predictive contours with strict ethical labeling)
 */

export class EarthLensSystem {
  constructor(scene, village) {
    this.scene = scene;
    this.village = village;
    this.currentMode = 'ground'; // 'ground' | 'nasa' | 'future'

    // NASA POWER has a working data path elsewhere in SOLIQ, but THIS game session has
    // NOT loaded, verified or attributed a source receipt. No hardcoded values can be called observed.
    this.nasaTelemetry = {
      station: 'Sakha / Kafr El Sheikh (illustrative game scene)',
      source: 'NASA POWER — source receipt not loaded in game',
      t2m_avg: 'غير متاح / unavailable',
      t2m_max: 'غير متاح / unavailable',
      annual_rain: 'غير متاح / unavailable',
      sar_catalogue: 'ASF scene catalogue ≠ processed SAR pixels',
      coverage: 'No dated, checksum-verified source loaded for this game scene',
      dataClass: 'unavailable',
      rawSha256: null,
      reason: 'A verified NASA backend response must be injected before any observed overlay is shown',
    };

    this.futureTelemetry = {
      rotation: 'Wheat → Berseem/Clover → Maize (illustrative candidate)',
      modeledET: 'غير محسوب / not calculated',
      waterSavingPotential: 'غير محسوب / requires a second real scenario run',
      uncertaintyRange: 'غير محسوب / no interval bounds generated',
      certificateStatus: 'comparison_only',
      disclaimer: 'SIMULATION — NOT SATELLITE OBSERVATION',
      dataClass: 'simulated',
    };
  }

  setMode(mode) {
    this.currentMode = mode;

    switch (mode) {
      case 'nasa':
        this._applyNasaMode();
        break;
      case 'future':
        this._applyFutureMode();
        break;
      case 'ground':
      default:
        this._applyGroundMode();
        break;
    }

    return {
      mode: this.currentMode,
      telemetry: this.getTelemetry(),
    };
  }

  _applyGroundMode() {
    if (typeof BABYLON === 'undefined') return;
    // Normal PBR materials
    this.scene.clearColor = new BABYLON.Color4(0.82, 0.89, 0.94, 1.0);
    this.village.fields.forEach((f) => {
      f.material.albedoColor.set(0.55, 0.44, 0.32);
      f.crops.forEach((c) => {
        c.visibility = 1.0;
      });
    });
  }

  _applyNasaMode() {
    if (typeof BABYLON === 'undefined') return;
    // Neutral overlay only; DO NOT paint fake NDVI/temperature as NASA observed pixels.
    // When a verified, QA-screened HLS/IMERG raster is available, a source-bound renderer
    // may be added here and will explicitly expose date, native grid, masks and checksum.
    this.scene.clearColor = new BABYLON.Color4(0.24, 0.28, 0.33, 1.0);
  }

  _applyFutureMode() {
    if (typeof BABYLON === 'undefined') return;
    // Synthetic holographic contours
    this.scene.clearColor = new BABYLON.Color4(0.1, 0.18, 0.28, 1.0);
    this.village.fields.forEach((f, idx) => {
      // High-tech translucent cyan grid
      f.material.albedoColor.set(0.1, 0.65, 0.9);
      f.material.roughness = 0.2;
    });
  }

  getTelemetry() {
    if (this.currentMode === 'nasa') return this.nasaTelemetry;
    if (this.currentMode === 'future') return this.futureTelemetry;
    return null;
  }
}
