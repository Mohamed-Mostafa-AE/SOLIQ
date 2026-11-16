/**
 * SOLIQ: The Seventh Field - Seasonal Feedback & Visual Consequences Engine
 * Translates simulated water allocation decisions and crop rotation choices
 * into visible environmental feedback across the Nile Delta world.
 *
 * All metrics and visual states are SIMULATED and comparison_only;
 * this module never invents physical satellite telemetry or ground-truth soil scans.
 */

import { updateFieldSoilAppearance, makeCropCutoutTexture, applyCropCutoutMaterial } from './delta-procedural-textures.js';

export const SEASONAL_FEEDBACK_STATUS = 'Simulated visual feedback — not satellite observations';

export class SeasonFeedbackEngine {
  constructor(village, waterEngine, options = {}) {
    this.village = village;
    this.waterEngine = waterEngine;
    this.options = {
      reducedMotion: options.reducedMotion ?? false,
      windSpeed: options.windSpeed ?? 1.0,
      ...options,
    };

    this.windTime = 0.0;
    this.fieldStates = new Map();
    this.cropMaterials = new Map();

    this._initFieldStates();
  }

  _initFieldStates() {
    if (!this.village?.fields) return;
    this.village.fields.forEach((f, idx) => {
      this.fieldStates.set(f.id, {
        index: idx,
        crop: f.crop,
        hydration: f.hydration ?? 0.15,
        salinity: 0.05,
        delivered: 0,
        demand: f.demand ?? 30,
        shortfall: f.demand ?? 30,
        posture: 'normal', // 'wilted', 'stressed', 'normal', 'thriving'
        lastUpdatedTurn: 0,
      });
    });
  }

  setReducedMotion(enabled) {
    this.options.reducedMotion = Boolean(enabled);
  }

  /**
   * Apply simulated irrigation outcomes from the mesqa temporal solver.
   * Updates soil appearance, crop height/wilt, and furrow water traces.
   */
  applyIrrigationOutcome(simulationResult) {
    if (!simulationResult || !Array.isArray(simulationResult.delivered)) return null;

    const { delivered, shortfall } = simulationResult;
    const summary = [];

    this.village.fields.forEach((f, i) => {
      if (f.crop === 'future_echo') return;

      const amt = delivered[i] ?? 0;
      const sf = shortfall[i] ?? 0;
      const demand = f.demand || 30;
      const ratio = demand > 0 ? amt / demand : 0;

      // Estimate simulated salinity stress: prolonged dry shortfall increases surface efflorescence
      const state = this.fieldStates.get(f.id) || {};
      const newHydration = Math.max(0, Math.min(1, ratio));
      const newSalinity = newHydration < 0.3
        ? Math.min(1.0, (state.salinity || 0.1) + 0.35)
        : Math.max(0.0, (state.salinity || 0.1) - 0.25);

      state.hydration = newHydration;
      state.salinity = newSalinity;
      state.delivered = amt;
      state.shortfall = sf;

      // Determine visual posture
      let posture = 'normal';
      let healthScale = 1.0;
      if (newHydration >= 0.85) {
        posture = 'thriving';
        healthScale = 1.15;
      } else if (newHydration >= 0.45) {
        posture = 'normal';
        healthScale = 1.0;
      } else if (newHydration >= 0.2) {
        posture = 'stressed';
        healthScale = 0.88;
      } else {
        posture = 'wilted';
        healthScale = 0.76;
      }
      state.posture = posture;
      this.fieldStates.set(f.id, state);

      // 1. Update Soil PBR appearance
      this.village.updateFieldHydration(i, newHydration, newSalinity);

      // 2. Modulate crop height & posture
      if (f.thinCropMeshes) {
        f.thinCropMeshes.forEach(mesh => {
          if (mesh && mesh.scaling) {
            mesh.scaling.y = healthScale;
          }
        });
      }

      summary.push({
        id: f.id,
        crop: f.crop,
        delivered: amt,
        demand,
        ratio,
        salinityStress: newSalinity,
        posture,
        evidence: 'SIMULATED',
      });
    });

    return {
      status: SEASONAL_FEEDBACK_STATUS,
      fields: summary,
      evidenceClass: 'simulated',
      realMeasurementCertified: false,
    };
  }

  /**
   * Update subtle environmental wind sway on date palms and crops.
   * Scaled down or frozen when reduced-motion is active.
   */
  tick(deltaTime) {
    if (this.options.reducedMotion) return;

    this.windTime += deltaTime * this.options.windSpeed;
    const sway = Math.sin(this.windTime * 1.8) * 0.035;
    const frondSway = Math.cos(this.windTime * 2.2) * 0.045;

    // Sway palm trees gently
    if (Array.isArray(this.village?.palms)) {
      this.village.palms.forEach((palm, idx) => {
        const offset = idx * 0.45;
        if (palm.trunk) {
          palm.trunk.rotation.z = Math.sin(this.windTime * 1.5 + offset) * 0.018;
        }
        if (Array.isArray(palm.fronds)) {
          palm.fronds.forEach((frond, fIdx) => {
            frond.rotation.x = 0.45 + Math.sin(this.windTime * 2.5 + offset + fIdx) * 0.03;
          });
        }
      });
    }

    // Gentle wave ripple in canal water
    if (this.waterEngine?.waterMesh && this.waterEngine.isPumpActive) {
      const flow = this.waterEngine.flowVelocity || 0;
      this.waterEngine.waterMesh.rotation.y = Math.sin(this.windTime * 0.8) * 0.005 * flow;
    }
  }

  getFieldFeedback(fieldId) {
    return this.fieldStates.get(fieldId) || null;
  }

  getAllFieldFeedbacks() {
    return Array.from(this.fieldStates.values());
  }
}
