/**
 * SOLIQ: The Seventh Field - 3D Nile Delta Village Environment
 * Rich Egyptian Delta village: organic farmland, realistic canal, diesel pump, crops, farmhouses.
 */

import { planVisibleCanalBanks } from './delta-canal-layout.js';

export class DeltaVillage {
  constructor(scene, shadowGenerator) {
    this.scene = scene;
    this.shadowGenerator = shadowGenerator;
    this.fields = [];
    this.gates = [];
    this.pump = null;
    this.crops = [];
    this.smokeParticles = null;
    this.seventhFieldBoundary = null;

    this.materials = {};
    this._initMaterials();
    this._buildTerrain();
    this._buildCanal();
    this._buildPumpStation();
    this._buildSluiceGates();
    this._buildFieldsAndCrops();
    this._buildFarmhouses();
    this._buildVegetation();
    this._buildProps();
    this._buildSeventhFieldMarker();
  }

  _initMaterials() {
    const s = this.scene;

    // 1. Dry Nile silt / topsoil
    const soilMat = new BABYLON.PBRMaterial('soilMat', s);
    soilMat.albedoColor = new BABYLON.Color3(0.55, 0.44, 0.32); // Alluvial brown
    soilMat.roughness = 0.92;
    soilMat.metallic = 0.0;
    this.materials.soil = soilMat;

    // 2. Wet saturated mud (irrigated state)
    const wetMudMat = new BABYLON.PBRMaterial('wetMudMat', s);
    wetMudMat.albedoColor = new BABYLON.Color3(0.22, 0.17, 0.12); // Dark rich silt
    wetMudMat.roughness = 0.28;
    wetMudMat.metallic = 0.12;
    this.materials.wetMud = wetMudMat;

    // 3. Earthen dirt paths
    const pathMat = new BABYLON.PBRMaterial('pathMat', s);
    pathMat.albedoColor = new BABYLON.Color3(0.68, 0.58, 0.45);
    pathMat.roughness = 0.88;
    this.materials.path = pathMat;

    // 4. Mudbrick & red-brick Egyptian village house material
    const brickMat = new BABYLON.PBRMaterial('brickMat', s);
    brickMat.albedoColor = new BABYLON.Color3(0.72, 0.42, 0.32); // Red-ochre brick
    brickMat.roughness = 0.85;
    this.materials.brick = brickMat;

    const plasterMat = new BABYLON.PBRMaterial('plasterMat', s);
    plasterMat.albedoColor = new BABYLON.Color3(0.82, 0.76, 0.65); // Mud plaster
    plasterMat.roughness = 0.9;
    this.materials.plaster = plasterMat;

    // 5. Weathered cast iron & steel (Pump, pipes, gate gears)
    const ironMat = new BABYLON.PBRMaterial('ironMat', s);
    ironMat.albedoColor = new BABYLON.Color3(0.25, 0.26, 0.28);
    ironMat.metallic = 0.85;
    ironMat.roughness = 0.45;
    this.materials.iron = ironMat;

    // 6. Egyptian Palm frond green
    const palmMat = new BABYLON.PBRMaterial('palmMat', s);
    palmMat.albedoColor = new BABYLON.Color3(0.25, 0.48, 0.18);
    palmMat.roughness = 0.6;
    this.materials.palm = palmMat;

    // 7. Palm trunk bark
    const trunkMat = new BABYLON.PBRMaterial('trunkMat', s);
    trunkMat.albedoColor = new BABYLON.Color3(0.38, 0.29, 0.22);
    trunkMat.roughness = 0.95;
    this.materials.trunk = trunkMat;

    // 8. Crop materials
    const wheatMat = new BABYLON.PBRMaterial('wheatMat', s);
    wheatMat.albedoColor = new BABYLON.Color3(0.75, 0.65, 0.28); // Golden ripe
    this.materials.wheat = wheatMat;

    const berseemMat = new BABYLON.PBRMaterial('berseemMat', s);
    berseemMat.albedoColor = new BABYLON.Color3(0.18, 0.62, 0.25); // Lush clover
    this.materials.berseem = berseemMat;

    const riceMat = new BABYLON.PBRMaterial('riceMat', s);
    riceMat.albedoColor = new BABYLON.Color3(0.35, 0.72, 0.22);
    this.materials.rice = riceMat;

    const cornMat = new BABYLON.PBRMaterial('cornMat', s);
    cornMat.albedoColor = new BABYLON.Color3(0.42, 0.65, 0.2);
    this.materials.corn = cornMat;

    const beanMat = new BABYLON.PBRMaterial('beanMat', s);
    beanMat.albedoColor = new BABYLON.Color3(0.22, 0.52, 0.3);
    this.materials.beans = beanMat;
  }

  _buildTerrain() {
    // Large village terrain (approx 200m x 160m)
    const ground = BABYLON.MeshBuilder.CreateGroundFromHeightMap(
      'deltaGround',
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAG0lEQVR42mNkYPj/n4EAYCIkwAQkGRmROAC3uAbfQdK/rAAAAABJRU5ErkJggg==',
      {
        width: 180,
        height: 140,
        subdivisions: 40,
        minHeight: 0,
        maxHeight: 1.2,
      },
      this.scene
    );
    ground.position.set(20, 0, 10);
    ground.material = this.materials.soil;
    ground.receiveShadows = true;
    ground.checkCollisions = true;

    // Add village path overlay
    const path = BABYLON.MeshBuilder.CreateRibbon(
      'villagePath',
      {
        pathArray: [
          [
            new BABYLON.Vector3(-30, 0.05, -15),
            new BABYLON.Vector3(0, 0.05, -10),
            new BABYLON.Vector3(25, 0.05, -5),
            new BABYLON.Vector3(55, 0.05, 0),
          ],
          [
            new BABYLON.Vector3(-30, 0.05, -11),
            new BABYLON.Vector3(0, 0.05, -6),
            new BABYLON.Vector3(25, 0.05, -1),
            new BABYLON.Vector3(55, 0.05, 4),
          ],
        ],
        closeArray: false,
        closePath: false,
      },
      this.scene
    );
    path.material = this.materials.path;
    path.receiveShadows = true;
  }

  _buildCanal() {
    // The Mesqa (Nile canal): Curving water channel traversing the farmland
    const canalPoints = [
      new BABYLON.Vector3(-35, -0.6, 12),
      new BABYLON.Vector3(-15, -0.6, 10),
      new BABYLON.Vector3(5, -0.6, 9),
      new BABYLON.Vector3(25, -0.6, 7),
      new BABYLON.Vector3(45, -0.6, 6),
      new BABYLON.Vector3(65, -0.6, 4),
    ];

    // Canal bed & bank masonry
    const canalBed = BABYLON.MeshBuilder.CreateTube(
      'canalBed',
      {
        path: canalPoints,
        radius: 2.2,
        sideOrientation: BABYLON.Mesh.BACKSIDE,
        cap: BABYLON.Mesh.CAP_ALL,
      },
      this.scene
    );
    canalBed.scaling.y = 0.45;
    canalBed.position.y = -0.2;
    canalBed.material = this.materials.wetMud;
    canalBed.receiveShadows = true;

    // The first playable camera review revealed that the below-ground tube
    // disappears behind the flat terrain. Add bank contours and a visible
    // wet-silt bed at ground level: this makes the canal identifiable even
    // before an irrigation turn, without altering the water solver or
    // pretending an OFF pump means that the real canal has disappeared.
    const bankRibbons = planVisibleCanalBanks(canalPoints);
    for (const [name, strips] of Object.entries(bankRibbons)) {
      const mesh = BABYLON.MeshBuilder.CreateRibbon(
        `visible${name[0].toUpperCase()}${name.slice(1)}`,
        {
          pathArray: strips.map(strip => strip.map(point =>
            new BABYLON.Vector3(point.x, point.y, point.z))),
          sideOrientation: BABYLON.Mesh.DOUBLESIDE,
        },
        this.scene
      );
      mesh.material = name === 'channelBed' ? this.materials.wetMud : this.materials.path;
      mesh.receiveShadows = true;
    }

    // Stone retaining wall near the pump station
    const stoneWall = BABYLON.MeshBuilder.CreateBox(
      'stoneWall',
      { width: 8, height: 1.6, depth: 0.8 },
      this.scene
    );
    stoneWall.position.set(-20, 0.2, 7.5);
    stoneWall.material = this.materials.brick;
    stoneWall.checkCollisions = true;
    if (this.shadowGenerator) this.shadowGenerator.addShadowCaster(stoneWall);
  }

  _buildPumpStation() {
    // Lister single-cylinder diesel irrigation pump station
    const pumpGroup = new BABYLON.TransformNode('pumpStation', this.scene);
    pumpGroup.position.set(-20, 0.0, 5.0);

    // Concrete base
    const base = BABYLON.MeshBuilder.CreateBox('pumpBase', { width: 3.5, height: 0.4, depth: 2.5 }, this.scene);
    base.position.y = 0.2;
    base.parent = pumpGroup;
    base.material = this.materials.plaster;
    base.checkCollisions = true;

    // Diesel Engine Body
    const engineBlock = BABYLON.MeshBuilder.CreateBox('engineBlock', { width: 1.6, height: 1.3, depth: 1.1 }, this.scene);
    engineBlock.position.set(0, 1.0, 0);
    engineBlock.parent = pumpGroup;
    engineBlock.material = this.materials.iron;
    if (this.shadowGenerator) this.shadowGenerator.addShadowCaster(engineBlock);

    // Heavy Cast-Iron Flywheel
    const flywheel = BABYLON.MeshBuilder.CreateCylinder('flywheel', { diameter: 1.4, height: 0.25, tessellation: 24 }, this.scene);
    flywheel.rotation.z = Math.PI / 2;
    flywheel.position.set(-0.9, 0.9, 0);
    flywheel.parent = pumpGroup;
    flywheel.material = this.materials.iron;

    // Water Pump Volute Casing
    const pumpCasing = BABYLON.MeshBuilder.CreateCylinder('pumpCasing', { diameter: 1.0, height: 0.7, tessellation: 20 }, this.scene);
    pumpCasing.position.set(0.9, 0.8, 0);
    pumpCasing.parent = pumpGroup;
    pumpCasing.material = this.materials.iron;

    // Intake Suction Pipe extending into the canal
    const intakePipe = BABYLON.MeshBuilder.CreateTube('intakePipe', {
      path: [
        new BABYLON.Vector3(0.9, 0.8, 0),
        new BABYLON.Vector3(0.9, 0.8, 2.5),
        new BABYLON.Vector3(0.9, -0.4, 4.5),
      ],
      radius: 0.22,
    }, this.scene);
    intakePipe.parent = pumpGroup;
    intakePipe.material = this.materials.iron;

    // Exhaust Pipe & Muffler
    const exhaust = BABYLON.MeshBuilder.CreateCylinder('exhaust', { diameter: 0.12, height: 1.8 }, this.scene);
    exhaust.position.set(-0.2, 2.0, -0.3);
    exhaust.parent = pumpGroup;
    exhaust.material = this.materials.iron;

    // Pressure Gauge
    const gauge = BABYLON.MeshBuilder.CreateCylinder('pressureGauge', { diameter: 0.3, height: 0.08 }, this.scene);
    gauge.rotation.x = Math.PI / 2;
    gauge.position.set(0.9, 1.5, 0.3);
    gauge.parent = pumpGroup;
    const gaugeMat = new BABYLON.PBRMaterial('gaugeMat', this.scene);
    gaugeMat.albedoColor = new BABYLON.Color3(0.95, 0.95, 0.9);
    gauge.material = gaugeMat;

    // Interactive Trigger Zone mesh
    const trigger = BABYLON.MeshBuilder.CreateCylinder('pumpTrigger', { diameter: 3.8, height: 0.2 }, this.scene);
    trigger.position.set(0, 0.1, 0);
    trigger.parent = pumpGroup;
    trigger.visibility = 0.0;
    trigger.isPickable = true;

    // Smoke Particle System
    this.smokeParticles = new BABYLON.ParticleSystem('pumpSmoke', 100, this.scene);
    this.smokeParticles.particleTexture = new BABYLON.Texture(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAZklEQVR42mNgwA/EGAgD8hgGE4BqZBiw5R+6wQy4DFj3f/Z/1Bg7BhvgN4D5f9Z/7BhsgN8g5v/p/zFikAHG//4gO4gB//8z/N/1H6qDEf+h6mHyxGkAv8HM/83/8RvgA+g4wMAAAHRXgB/6VfNTAAAAAElFTkSuQmCC',
      this.scene
    );
    this.smokeParticles.emitter = exhaust;
    this.smokeParticles.minEmitBox = new BABYLON.Vector3(0, 0.9, 0);
    this.smokeParticles.maxEmitBox = new BABYLON.Vector3(0, 0.9, 0);
    this.smokeParticles.color1 = new BABYLON.Color4(0.3, 0.3, 0.3, 0.7);
    this.smokeParticles.color2 = new BABYLON.Color4(0.6, 0.6, 0.6, 0.2);
    this.smokeParticles.colorDead = new BABYLON.Color4(0.8, 0.8, 0.8, 0.0);
    this.smokeParticles.minSize = 0.2;
    this.smokeParticles.maxSize = 0.6;
    this.smokeParticles.minLifeTime = 0.5;
    this.smokeParticles.maxLifeTime = 1.2;
    this.smokeParticles.emitRate = 0; // Off by default
    this.smokeParticles.gravity = new BABYLON.Vector3(0.5, 2.0, 0);
    this.smokeParticles.start();

    this.pump = {
      group: pumpGroup,
      flywheel,
      running: false,
      pressure: 0,
      smoke: this.smokeParticles,
    };
  }

  _buildSluiceGates() {
    // 3 Interactive Sluice Gates along the canal
    const gateConfigs = [
      { id: 'gate_head', nameAr: 'بوابة المأخذ الرئيسي', pos: new BABYLON.Vector3(-14, 0, 9.8) },
      { id: 'gate_hassan', nameAr: 'بوابة غيط عم حسن', pos: new BABYLON.Vector3(6, 0, 8.8) },
      { id: 'gate_maryam', nameAr: 'بوابة غيط مريم', pos: new BABYLON.Vector3(26, 0, 6.8) },
    ];

    gateConfigs.forEach((cfg, idx) => {
      const gateGroup = new BABYLON.TransformNode(cfg.id, this.scene);
      gateGroup.position.copyFrom(cfg.pos);

      // Frame posts
      const postL = BABYLON.MeshBuilder.CreateBox('postL', { width: 0.3, height: 2.2, depth: 0.3 }, this.scene);
      postL.position.set(-1.1, 0.8, 0);
      postL.parent = gateGroup;
      postL.material = this.materials.iron;

      const postR = BABYLON.MeshBuilder.CreateBox('postR', { width: 0.3, height: 2.2, depth: 0.3 }, this.scene);
      postR.position.set(1.1, 0.8, 0);
      postR.parent = gateGroup;
      postR.material = this.materials.iron;

      const topBar = BABYLON.MeshBuilder.CreateBox('topBar', { width: 2.5, height: 0.25, depth: 0.35 }, this.scene);
      topBar.position.set(0, 1.8, 0);
      topBar.parent = gateGroup;
      topBar.material = this.materials.iron;

      // Sliding Sluice Plate (raises when open)
      const plate = BABYLON.MeshBuilder.CreateBox('plate', { width: 1.9, height: 1.4, depth: 0.1 }, this.scene);
      plate.position.set(0, 0.4, 0);
      plate.parent = gateGroup;
      plate.material = this.materials.iron;

      // Turn Wheel Spindle on top
      const wheel = BABYLON.MeshBuilder.CreateTorus('wheel', { diameter: 0.65, thickness: 0.08, tessellation: 20 }, this.scene);
      wheel.position.set(0, 2.1, 0);
      wheel.rotation.x = Math.PI / 2;
      wheel.parent = gateGroup;
      wheel.material = this.materials.iron;

      this.gates.push({
        id: cfg.id,
        nameAr: cfg.nameAr,
        group: gateGroup,
        plate,
        wheel,
        isOpen: false,
        openRatio: 0,
        position: cfg.pos,
      });
    });
  }

  _buildFieldsAndCrops() {
    // 6 Factual Egyptian Farm Plots + 7th Field Echo
    const fieldDefs = [
      {
        id: 'f1',
        titleAr: 'الغيط الأول: قمح عم حسن',
        titleEn: "Field 1: Hassan's Wheat",
        center: new BABYLON.Vector3(5, 0.02, 22),
        width: 18,
        depth: 20,
        crop: 'wheat',
        demand: 35,
      },
      {
        id: 'f2',
        titleAr: 'الغيط الثاني: برسيم مريم',
        titleEn: "Field 2: Maryam's Berseem",
        center: new BABYLON.Vector3(26, 0.02, 20),
        width: 18,
        depth: 18,
        crop: 'berseem',
        demand: 45,
      },
      {
        id: 'f3',
        titleAr: 'الغيط الثالث: أحواض الأرز',
        titleEn: 'Field 3: Rice Paddy',
        center: new BABYLON.Vector3(47, 0.02, 18),
        width: 18,
        depth: 18,
        crop: 'rice',
        demand: 60,
      },
      {
        id: 'f4',
        titleAr: 'الغيط الرابع: ذرة شامية',
        titleEn: 'Field 4: Maize Plot',
        center: new BABYLON.Vector3(5, 0.02, -24),
        width: 18,
        depth: 18,
        crop: 'corn',
        demand: 40,
      },
      {
        id: 'f5',
        titleAr: 'الغيط الخامس: فول بلدي',
        titleEn: 'Field 5: Fava Beans',
        center: new BABYLON.Vector3(26, 0.02, -22),
        width: 18,
        depth: 18,
        crop: 'beans',
        demand: 25,
      },
      {
        id: 'f6',
        titleAr: 'الغيط السادس: بستان وخضار',
        titleEn: 'Field 6: Orchard & Veg',
        center: new BABYLON.Vector3(47, 0.02, -20),
        width: 18,
        depth: 18,
        crop: 'wheat',
        demand: 30,
      },
      {
        id: 'f7',
        titleAr: 'الأرض السابعة: صدى الزمن',
        titleEn: 'The Seventh Field: Time Echo',
        center: new BABYLON.Vector3(68, 0.02, 0),
        width: 18,
        depth: 22,
        crop: 'future_echo',
        demand: 0,
      },
    ];

    fieldDefs.forEach((def) => {
      // 1. Soil plot plane with individual material instance for wetness modulation
      const plot = BABYLON.MeshBuilder.CreateGround(
        `plot_${def.id}`,
        { width: def.width, height: def.depth },
        this.scene
      );
      plot.position.copyFrom(def.center);
      plot.receiveShadows = true;

      const plotMat = new BABYLON.PBRMaterial(`plotMat_${def.id}`, this.scene);
      plotMat.albedoColor = new BABYLON.Color3(0.55, 0.44, 0.32);
      plotMat.roughness = 0.92;
      plot.material = plotMat;

      // 2. Crop furrow rows
      const cropInstances = [];
      const numRows = 7;
      for (let r = 0; r < numRows; r++) {
        const rowZ = def.center.z - def.depth / 2 + (def.depth / (numRows + 1)) * (r + 1);
        const rowMesh = BABYLON.MeshBuilder.CreateBox(
          `cropRow_${def.id}_${r}`,
          { width: def.width - 2, height: 0.65, depth: 0.45 },
          this.scene
        );
        rowMesh.position.set(def.center.x, 0.32, rowZ);
        rowMesh.material = this.materials[def.crop] || this.materials.wheat;
        if (this.shadowGenerator) this.shadowGenerator.addShadowCaster(rowMesh);
        cropInstances.push(rowMesh);
      }

      this.fields.push({
        ...def,
        mesh: plot,
        material: plotMat,
        crops: cropInstances,
        hydration: 0.1, // 0.0 (bone dry) to 1.0 (fully saturated)
        delivered: 0,
        shortfall: def.demand,
      });
    });
  }

  _buildFarmhouses() {
    // Authentic Egyptian Nile Delta mudbrick/red-brick farm dwellings
    const houses = [
      { pos: new BABYLON.Vector3(-25, 0, -22), w: 10, h: 4.5, d: 8, rotY: 0.2 },
      { pos: new BABYLON.Vector3(-10, 0, -25), w: 8, h: 4.0, d: 7, rotY: -0.1 },
      { pos: new BABYLON.Vector3(-32, 0, 24), w: 9, h: 4.2, d: 8, rotY: 0.3 },
    ];

    houses.forEach((h, i) => {
      const house = BABYLON.MeshBuilder.CreateBox(`house_${i}`, { width: h.w, height: h.h, depth: h.d }, this.scene);
      house.position.set(h.pos.x, h.h / 2, h.pos.z);
      house.rotation.y = h.rotY;
      house.material = this.materials.brick;
      house.checkCollisions = true;
      if (this.shadowGenerator) this.shadowGenerator.addShadowCaster(house);

      // Flat concrete roof with reed pergola
      const roof = BABYLON.MeshBuilder.CreateBox(`roof_${i}`, { width: h.w + 0.6, height: 0.3, depth: h.d + 0.6 }, this.scene);
      roof.position.set(h.pos.x, h.h + 0.15, h.pos.z);
      roof.material = this.materials.plaster;

      // Wooden door
      const door = BABYLON.MeshBuilder.CreateBox(`door_${i}`, { width: 1.4, height: 2.2, depth: 0.2 }, this.scene);
      door.position.set(h.pos.x, 1.1, h.pos.z + h.d / 2 + 0.05);
      door.material = this.materials.trunk;
    });
  }

  _buildVegetation() {
    // Authentic Nile Delta Date Palms (نخل بلدي)
    const palmPositions = [
      new BABYLON.Vector3(-18, 0, 16),
      new BABYLON.Vector3(-5, 0, 14),
      new BABYLON.Vector3(15, 0, 13),
      new BABYLON.Vector3(38, 0, 11),
      new BABYLON.Vector3(-12, 0, -12),
      new BABYLON.Vector3(22, 0, -8),
      new BABYLON.Vector3(62, 0, -14),
    ];

    palmPositions.forEach((pos, idx) => {
      const palmGroup = new BABYLON.TransformNode(`palm_${idx}`, this.scene);
      palmGroup.position.copyFrom(pos);

      // Curved trunk
      const trunk = BABYLON.MeshBuilder.CreateCylinder(`trunk_${idx}`, {
        diameterTop: 0.35,
        diameterBottom: 0.6,
        height: 7.5,
        tessellation: 12,
      }, this.scene);
      trunk.position.y = 3.75;
      trunk.rotation.z = (Math.random() - 0.5) * 0.12;
      trunk.parent = palmGroup;
      trunk.material = this.materials.trunk;
      trunk.checkCollisions = true;
      if (this.shadowGenerator) this.shadowGenerator.addShadowCaster(trunk);

      // Palm frond canopy (8 radially arranged fronds)
      for (let f = 0; f < 8; f++) {
        const frond = BABYLON.MeshBuilder.CreateBox(`frond_${idx}_${f}`, { width: 0.45, height: 0.08, depth: 3.8 }, this.scene);
        frond.parent = palmGroup;
        frond.position.set(0, 7.3, 0);
        frond.rotation.y = (f * Math.PI) / 4;
        frond.rotation.x = 0.45;
        frond.material = this.materials.palm;
        if (this.shadowGenerator) this.shadowGenerator.addShadowCaster(frond);
      }
    });

    // Repeatable reed silhouettes along the raised mesqa bank. These are
    // decorative proxy plants, not remotely sensed crop cover or a claim
    // about the real field's species distribution. Keep counts modest for WebGL.
    const reedClumps = [
      [-22, 8.3], [-16, 7.8], [-10, 7.3], [-5, 6.9], [0, 6.6],
      [6, 6.1], [12, 5.6], [18, 5.1], [26, 4.4],
    ];
    reedClumps.forEach(([x, z], group) => {
      for (let stem = 0; stem < 3; stem++) {
        const height = 0.85 + 0.18 * stem;
        const stalk = BABYLON.MeshBuilder.CreateCylinder(`canalReed_${group}_${stem}`,
          { diameterTop: 0.018, diameterBottom: 0.075, height, tessellation: 6 }, this.scene);
        stalk.position.set(x + stem * 0.19 - 0.18, 0.58 + height / 2, z + stem * 0.13);
        stalk.rotation.z = (stem - 1) * 0.12;
        stalk.material = this.materials.palm;
        const seed = BABYLON.MeshBuilder.CreateSphere(`canalReedHead_${group}_${stem}`,
          { diameter: 1, segments: 8 }, this.scene);
        seed.position.set(stalk.position.x, stalk.position.y + height / 2, stalk.position.z);
        seed.scaling.set(0.055, 0.12, 0.055);
        seed.material = this.materials.wheat;
      }
    });
  }

  _buildProps() {
    // Agricultural tools and equipment
    // 1. Traditional wooden farm cart
    const cart = BABYLON.MeshBuilder.CreateBox('farmCart', { width: 2.2, height: 0.8, depth: 1.4 }, this.scene);
    cart.position.set(-14, 0.6, -14);
    cart.material = this.materials.trunk;
    if (this.shadowGenerator) this.shadowGenerator.addShadowCaster(cart);

    // 2. Diesel fuel canisters
    const can = BABYLON.MeshBuilder.CreateCylinder('dieselCan', { diameter: 0.4, height: 0.6 }, this.scene);
    can.position.set(-18.5, 0.3, 4.0);
    const canMat = new BABYLON.PBRMaterial('canMat', this.scene);
    canMat.albedoColor = new BABYLON.Color3(0.8, 0.2, 0.15); // Red jerrycan
    can.material = canMat;

    // 3. Egyptian Hoe (الفأس - Fass) propped near Uncle Hassan's gate
    const fassHandle = BABYLON.MeshBuilder.CreateCylinder('fassHandle', { diameter: 0.06, height: 1.4 }, this.scene);
    fassHandle.position.set(5.2, 0.7, 9.6);
    fassHandle.rotation.z = 0.25;
    fassHandle.material = this.materials.trunk;
  }

  _buildSeventhFieldMarker() {
    // Ethereal glowing boundary corner beacons for Field 7 (The Seventh Field)
    const corners = [
      new BABYLON.Vector3(59, 0, -11),
      new BABYLON.Vector3(77, 0, -11),
      new BABYLON.Vector3(77, 0, 11),
      new BABYLON.Vector3(59, 0, 11),
    ];

    const beaconMat = new BABYLON.StandardMaterial('beaconMat', this.scene);
    beaconMat.emissiveColor = new BABYLON.Color3(0.2, 0.7, 0.9); // Cyan ethereal pulse
    beaconMat.diffuseColor = new BABYLON.Color3(0.1, 0.4, 0.6);

    corners.forEach((c, i) => {
      const beacon = BABYLON.MeshBuilder.CreateCylinder(`beacon_${i}`, { diameter: 0.3, height: 1.8 }, this.scene);
      beacon.position.set(c.x, 0.9, c.z);
      beacon.material = beaconMat;
    });

    // Holographic ground boundary line
    const borderPoints = [...corners, corners[0]];
    this.seventhFieldBoundary = BABYLON.MeshBuilder.CreateLines('echoBorder', { points: borderPoints }, this.scene);
    this.seventhFieldBoundary.color = new BABYLON.Color3(0.3, 0.8, 1.0);
  }

  setPumpRunning(isRunning) {
    if (!this.pump) return;
    this.pump.running = isRunning;
    if (this.smokeParticles) {
      this.smokeParticles.emitRate = isRunning ? 25 : 0;
    }
  }

  setGateOpen(gateId, isOpen) {
    const gate = this.gates.find((g) => g.id === gateId);
    if (!gate) return;
    gate.isOpen = isOpen;
    // Animate gate plate up/down
    const targetY = isOpen ? 1.4 : 0.4;
    gate.plate.position.y = targetY;
    gate.wheel.rotation.y += Math.PI * 2;
  }

  updateFieldHydration(fieldIndex, hydrationRatio) {
    if (fieldIndex < 0 || fieldIndex >= this.fields.length) return;
    const f = this.fields[fieldIndex];
    f.hydration = Math.max(0, Math.min(1, hydrationRatio));

    // Modulate soil PBR material from dry silt to wet saturated mud
    // Dry: albedo (0.55, 0.44, 0.32), roughness 0.92
    // Wet: albedo (0.22, 0.17, 0.12), roughness 0.25, metallic 0.15
    const r = f.hydration;
    const albedoR = 0.55 * (1 - r) + 0.22 * r;
    const albedoG = 0.44 * (1 - r) + 0.17 * r;
    const albedoB = 0.32 * (1 - r) + 0.12 * r;
    f.material.albedoColor.set(albedoR, albedoG, albedoB);
    f.material.roughness = 0.92 * (1 - r) + 0.25 * r;
    f.material.metallic = 0.15 * r;

    // Perk up crops slightly when irrigated
    f.crops.forEach((cropMesh) => {
      cropMesh.scaling.y = 1.0 + 0.12 * r;
    });
  }

  tick(deltaTime) {
    // Animate flywheel when pump is running
    if (this.pump && this.pump.running && this.pump.flywheel) {
      this.pump.flywheel.rotation.x += deltaTime * 18.0;
    }
  }
}
