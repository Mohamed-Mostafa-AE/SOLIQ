/**
 * SOLIQ: The Seventh Field - Visual Water Simulation Engine
 * Consumes real time-sliced ON/OFF outputs from science/mesqa-window.js.
 * Animates dynamic canal water mesh, gate flows, and per-field soil wetness PBR transitions.
 */

import { runGameWaterWindow } from '../core/water-window-adapter.js';

export class VisualWaterEngine {
  constructor(scene, village, audio) {
    this.scene = scene;
    this.village = village;
    this.audio = audio;

    this.waterMesh = null;
    this.waterMaterial = null;
    this.waterLevel = -0.55; // Dry canal bed
    this.targetWaterLevel = -0.55;
    this.flowVelocity = 0.0;
    this.targetFlowVelocity = 0.0;
    this.waveTime = 0.0;

    // Simulation ledger state
    this.currentSimulation = null;
    this.isPumpActive = false;
    this.supply = 180; // Default canal supply volume
    this.policy = 'proportional';

    this._buildWaterMesh();
  }

  _buildWaterMesh() {
    // Water ribbon following canal curve
    const path = [
      new BABYLON.Vector3(-34, -0.2, 11.5),
      new BABYLON.Vector3(-15, -0.2, 9.8),
      new BABYLON.Vector3(5, -0.2, 8.8),
      new BABYLON.Vector3(25, -0.2, 6.8),
      new BABYLON.Vector3(45, -0.2, 5.8),
      new BABYLON.Vector3(64, -0.2, 3.8),
    ];

    this.waterMesh = BABYLON.MeshBuilder.CreateTube(
      'canalWater',
      {
        path,
        radius: 1.8,
        tessellation: 16,
        sideOrientation: BABYLON.Mesh.DOUBLESIDE,
      },
      this.scene
    );
    this.waterMesh.scaling.y = 0.12; // Flatten to water surface
    this.waterMesh.position.y = this.waterLevel;

    // Water Material with Nile Delta silt tint and Fresnel reflections
    this.waterMaterial = new BABYLON.PBRMaterial('canalWaterMat', this.scene);
    this.waterMaterial.albedoColor = new BABYLON.Color3(0.24, 0.38, 0.28); // Nile alluvial greenish-brown
    this.waterMaterial.roughness = 0.08;
    this.waterMaterial.metallic = 0.05;
    this.waterMaterial.alpha = 0.85;

    this.waterMesh.material = this.waterMaterial;
  }

  runSimulation(supply, demands, policy = 'proportional') {
    this.supply = supply;
    this.policy = policy;

    // The policy label belongs to the storyline; the source physics model never
    // invents a head/tail priority effect merely because a button was clicked.
    const result = runGameWaterWindow({
      supplyM3h: supply,
      demandsM3: demands,
      turnOn: true,
      pumpOn: this.isPumpActive,
      seed: `chapter0-${policy}-v1`,
    });
    this.currentSimulation = result;

    return result;
  }

  applySimulationToWorld(result) {
    if (!result) return;

    const { delivered, shortfall, deliveredTotal } = result;

    if (this.isPumpActive && result.ledger.canalDivertedM3 > 0) {
      this.targetWaterLevel = -0.16; // Normal operating canal depth
      this.targetFlowVelocity = Math.min(1.0, deliveredTotal / 150);
      this.audio.setWaterFlowSound(this.targetFlowVelocity);
    } else {
      this.targetWaterLevel = -0.52; // Dry bed
      this.targetFlowVelocity = 0.0;
      this.audio.setWaterFlowSound(0.0);
    }

    // Update each field's visual soil moisture based on delivered water vs demand
    result.delivered.forEach((amt, i) => {
      const demand = this.village.fields[i]?.demand ?? 0;
      const ratio = demand > 0 ? amt / demand : 0;
      this.village.updateFieldHydration(i, ratio);
      if (this.village.fields[i]) {
        this.village.fields[i].delivered = amt;
        this.village.fields[i].shortfall = shortfall[i];
      }
    });
  }

  setPumpState(active, overload = false) {
    this.isPumpActive = active;
    this.village.setPumpRunning(active);
    this.audio.setPumpSound(active, overload);

    if (!active) {
      this.currentSimulation = null;
      this.targetWaterLevel = -0.52;
      this.targetFlowVelocity = 0.0;
      this.audio.setWaterFlowSound(0.0);
      // Canal OFF does not erase soil moisture or add any irrigation.
      // Preserve already delivered soil moisture as its own state.
    }
  }

  update(deltaTime) {
    this.waveTime += deltaTime;

    // Smoothly interpolate water level
    this.waterLevel = BABYLON.Scalar.Lerp(this.waterLevel, this.targetWaterLevel, deltaTime * 2.5);
    this.flowVelocity = BABYLON.Scalar.Lerp(this.flowVelocity, this.targetFlowVelocity, deltaTime * 2.0);

    if (this.waterMesh) {
      this.waterMesh.position.y = this.waterLevel;

      // Surface wave ripple motion
      if (this.flowVelocity > 0.05) {
        const ripple = Math.sin(this.waveTime * 3.5) * 0.015 * this.flowVelocity;
        this.waterMesh.position.y += ripple;
      }
    }
  }
}
