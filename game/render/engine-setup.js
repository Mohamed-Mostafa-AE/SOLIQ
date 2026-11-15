/**
 * SOLIQ: The Seventh Field - 3D Render Engine & Scene Setup
 * Powered by Babylon.js WebGL2 / WebGPU
 */

export class RenderSetup {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.options = {
      preset: options.preset || 'balanced',
      antialias: options.antialias !== false,
      adaptToDeviceRatio: true,
      ...options,
    };

    this.engine = null;
    this.scene = null;
    this.shadowGenerator = null;
    this.sunLight = null;
    this.ambientLight = null;
    this.cameras = {};
    this.activeCameraName = 'follow';
    this.glowLayer = null;
    this.quality = this.options.preset;

    this._initEngine();
  }

  _initEngine() {
    if (typeof BABYLON === 'undefined') {
      throw new Error('Babylon.js runtime not loaded');
    }

    // Initialize Babylon Engine with fallback protection
    this.engine = new BABYLON.Engine(this.canvas, this.options.antialias, {
      preserveDrawingBuffer: true,
      stencil: true,
      adaptToDeviceRatio: this.options.adaptToDeviceRatio,
      powerPreference: 'high-performance',
    });

    this.scene = new BABYLON.Scene(this.engine);
    this.scene.clearColor = new BABYLON.Color4(0.82, 0.89, 0.94, 1.0); // Nile Delta morning sky

    // Atmospheric Nile Delta dawn fog
    this.scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
    this.scene.fogColor = new BABYLON.Color3(0.85, 0.88, 0.91);
    this.scene.fogDensity = 0.002; // don't wash the village in a grey veil

    this.scene.collisionsEnabled = true;

    this._setupLights();
    this._setupCameras();
    this._setupGlowLayer();
    this.setQuality(this.quality);

    window.addEventListener('resize', this._onResize);
  }

  _onResize = () => {
    if (this.engine) {
      this.engine.resize();
    }
  };

  _setupLights() {
    // 1. Dawn sunlight (warm directional light with realistic low sun angle)
    this.sunLight = new BABYLON.DirectionalLight(
      'sunLight',
      new BABYLON.Vector3(-0.6, -0.7, 0.45).normalize(),
      this.scene
    );
    this.sunLight.position = new BABYLON.Vector3(50, 70, -40);
    this.sunLight.intensity = 1.32; // avoid washed-out, toy-like flat lighting
    this.sunLight.diffuse = new BABYLON.Color3(1.0, 0.92, 0.78); // Golden dawn
    this.sunLight.specular = new BABYLON.Color3(0.5, 0.45, 0.35);

    // 2. Hemispheric sky / ground ambient fill
    this.ambientLight = new BABYLON.HemisphericLight(
      'ambientLight',
      new BABYLON.Vector3(0, 1, 0),
      this.scene
    );
    this.ambientLight.intensity = 0.58; // keep material depth without losing readability
    this.ambientLight.diffuse = new BABYLON.Color3(0.72, 0.82, 0.92); // Sky tint
    this.ambientLight.groundColor = new BABYLON.Color3(0.38, 0.32, 0.22); // Nile silt reflection

    // 3. Shadow Generator
    this.shadowGenerator = new BABYLON.ShadowGenerator(1024, this.sunLight);
    this.shadowGenerator.usePoissonSampling = true;
    this.shadowGenerator.bias = 0.002;
    this.shadowGenerator.normalBias = 0.01;
    this.shadowGenerator.darkness = 0.48;
  }

  _setupCameras() {
    // Camera 1: Third-Person Follow Camera tracking protagonist
    const followCam = new BABYLON.ArcRotateCamera(
      'followCam',
      -Math.PI / 2,
      1.20, // lower, human-height view: foreground actor and canal are legible
      8.5,
      new BABYLON.Vector3(0, 1.5, 0),
      this.scene
    );
    followCam.lowerRadiusLimit = 4.0;
    followCam.upperRadiusLimit = 22.0;
    followCam.lowerBetaLimit = 0.2;
    followCam.upperBetaLimit = Math.PI / 2.15;
    followCam.wheelPrecision = 20;
    followCam.checkCollisions = true;
    followCam.collisionRadius = new BABYLON.Vector3(0.4, 0.4, 0.4);
    this.cameras.follow = followCam;

    // Camera 2: Tactical Isometric Arc Camera (Whole Village & 6 Fields)
    const isoCam = new BABYLON.ArcRotateCamera(
      'isoCam',
      -Math.PI / 3.5,
      Math.PI / 3.8,
      58.0,
      new BABYLON.Vector3(15, 0, 10),
      this.scene
    );
    isoCam.lowerRadiusLimit = 20.0;
    isoCam.upperRadiusLimit = 95.0;
    this.cameras.iso = isoCam;

    // Camera 3: Cinematic Dialogue Close-Up Camera
    const dialogueCam = new BABYLON.UniversalCamera(
      'dialogueCam',
      new BABYLON.Vector3(0, 1.6, 3),
      this.scene
    );
    dialogueCam.setTarget(new BABYLON.Vector3(0, 1.5, 0));
    this.cameras.dialogue = dialogueCam;

    // Default active camera
    this.setActiveCamera('follow');
  }

  _setupGlowLayer() {
    this.glowLayer = new BABYLON.GlowLayer('glow', this.scene, {
      mainTextureRatio: 0.5,
      blurKernelSize: 32,
    });
    this.glowLayer.intensity = 0.6;
  }

  setActiveCamera(cameraName) {
    if (!this.cameras[cameraName]) return;

    this.activeCameraName = cameraName;
    const targetCam = this.cameras[cameraName];
    this.scene.activeCamera = targetCam;
    targetCam.attachControl(this.canvas, true);

    // Detach other cameras
    for (const [name, cam] of Object.entries(this.cameras)) {
      if (name !== cameraName) {
        cam.detachControl();
      }
    }
  }

  setQuality(preset) {
    this.quality = preset;
    if (!this.engine || !this.scene) return;

    switch (preset) {
      case 'low':
        this.engine.setHardwareScalingLevel(1.35); // 0.74 resolution
        if (this.shadowGenerator) {
          this.shadowGenerator.getShadowMap().refreshRate = 0; // Freeze shadow updates
          this.shadowGenerator.usePoissonSampling = false;
        }
        if (this.glowLayer) this.glowLayer.isEnabled = false;
        this.scene.fogDensity = 0.002;
        break;

      case 'ultra':
        this.engine.setHardwareScalingLevel(0.9); // Slight supersample
        if (this.shadowGenerator) {
          this.shadowGenerator.getShadowMap().refreshRate = 1;
          this.shadowGenerator.mapSize = 2048;
          this.shadowGenerator.usePoissonSampling = true;
          this.shadowGenerator.useBlurCloseExponentialShadowMap = true;
        }
        if (this.glowLayer) {
          this.glowLayer.isEnabled = true;
          this.glowLayer.intensity = 0.8;
        }
        this.scene.fogDensity = 0.005;
        break;

      case 'balanced':
      default:
        this.engine.setHardwareScalingLevel(1.0);
        if (this.shadowGenerator) {
          this.shadowGenerator.getShadowMap().refreshRate = 1;
          this.shadowGenerator.mapSize = 1024;
          this.shadowGenerator.usePoissonSampling = true;
        }
        if (this.glowLayer) {
          this.glowLayer.isEnabled = true;
          this.glowLayer.intensity = 0.5;
        }
        this.scene.fogDensity = 0.004;
        break;
    }
  }

  startRenderLoop(customTick = null) {
    this.engine.runRenderLoop(() => {
      if (customTick) {
        customTick(this.engine.getDeltaTime() / 1000);
      }
      this.scene.render();
    });
  }

  stopRenderLoop() {
    if (this.engine) {
      this.engine.stopRenderLoop();
    }
  }

  dispose() {
    window.removeEventListener('resize', this._onResize);
    this.stopRenderLoop();
    if (this.scene) {
      this.scene.dispose();
      this.scene = null;
    }
    if (this.engine) {
      this.engine.dispose();
      this.engine = null;
    }
  }
}
