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

    // NASA POWER Sakha Benchmark Telemetry (from pitch-3d/content.js & research data)
    this.nasaTelemetry = {
      station: 'Sakha / Kafr El Sheikh (31.08°N, 30.94°E)',
      source: 'NASA POWER Daily Meteorological API',
      t2m_avg: '21.4°C',
      t2m_max: '34.8°C',
      annual_rain: '68.4 mm',
      sar_catalogue: 'ASF NISAR/Sentinel-1 Catalogue (Metadata only, no raw pixel diagnosis)',
      coverage: 'Complete 2016-2025 series + 2026 provisional',
      dataClass: 'observed',
    };

    this.futureTelemetry = {
      rotation: 'Wheat -> Berseem/Clover -> Maize',
      modeledET: '542 mm/season',
      waterSavingPotential: 'Dynamic scenario comparison (not guaranteed)',
      uncertaintyRange: '±14.2%',
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
    // False-color NDVI / Moisture thermal spectrum
    this.scene.clearColor = new BABYLON.Color4(0.2, 0.25, 0.35, 1.0);
    const ndviColors = [
      new BABYLON.Color3(0.15, 0.85, 0.35), // Dense green
      new BABYLON.Color3(0.2, 0.9, 0.4),
      new BABYLON.Color3(0.1, 0.6, 0.8),   // Flooded rice
      new BABYLON.Color3(0.7, 0.75, 0.2),  // Maturing corn
      new BABYLON.Color3(0.3, 0.8, 0.45),
      new BABYLON.Color3(0.4, 0.7, 0.3),
      new BABYLON.Color3(0.85, 0.5, 0.2),  // Unplanted 7th field
    ];

    this.village.fields.forEach((f, idx) => {
      f.material.albedoColor.copyFrom(ndviColors[idx] || ndviColors[0]);
    });
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
