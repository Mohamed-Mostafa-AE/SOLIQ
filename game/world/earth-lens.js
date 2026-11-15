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
    // Keep the Nile Delta land, water and crop rendering intact in every mode.
    // Science comparisons appear as subtle geometric guides instead of repainting
    // the entire village with fake cyan "satellite"/future fields.
    this.futureGuides = this._buildFutureGuides();

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

  _buildFutureGuides() {
    if (typeof BABYLON === 'undefined' || !this.village?.fields) return [];
    const guides = [];
    for (const field of this.village.fields) {
      if (field.crop === 'future_echo') continue;
      const {x,z}=field.center,halfW=field.width/2,halfD=field.depth/2;
      // Thin straw-gold perimeter lines, not a fake satellite raster.
      const points=[
        new BABYLON.Vector3(x-halfW,.23,z-halfD),
        new BABYLON.Vector3(x+halfW,.23,z-halfD),
        new BABYLON.Vector3(x+halfW,.23,z+halfD),
        new BABYLON.Vector3(x-halfW,.23,z+halfD),
        new BABYLON.Vector3(x-halfW,.23,z-halfD),
      ];
      const guide=BABYLON.MeshBuilder.CreateLines('scenarioBoundary_'+field.id,{points},this.scene);
      guide.color=new BABYLON.Color3(.82,.69,.39);
      guide.alpha=.65;
      guide.isPickable=false;
      guide.setEnabled(false);
      guides.push(guide);
    }
    return guides;
  }

  _applyGroundMode() {
    // No fake recoloring: original soil shading and real crop meshes remain.
    this._setGuides(false);
    this.scene.clearColor=new BABYLON.Color4(.82,.89,.94,1);
  }

  _applyNasaMode() {
    // Real NASA browse image appears in a separately labeled overlay. Do not
    // invent imagery by tinting the ground or assigning arbitrary NDVI colors.
    this._setGuides(false);
    this.scene.clearColor=new BABYLON.Color4(.82,.89,.94,1);
  }

  _applyFutureMode() {
    // The future is a distinct, non-validated hypothetical overlay:
    // outline six existing fields but preserve physical landscape colors.
    this._setGuides(true);
    this.scene.clearColor=new BABYLON.Color4(.82,.89,.94,1);
  }

  _setGuides(active) {
    this.futureGuides.forEach(g=>g.setEnabled(active));
  }

  getTelemetry() {
    if (this.currentMode === 'nasa') return this.nasaTelemetry;
    if (this.currentMode === 'future') return this.futureTelemetry;
    return null;
  }
}
