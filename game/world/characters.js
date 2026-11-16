/**
 * Soil-IQ: The Seventh Field - original procedural character pipeline.
 * Playable Nada and fictional Delta residents Hassan and Maryam use linked
 * transform joints, NOT imported GLB meshes or smooth-skinned skeletal rigs.
 * These restrained low-poly silhouettes are a performance-safe interim asset.
 */

export class CharacterSystem {
  constructor(scene, shadowGenerator) {
    this.scene = scene;
    this.shadowGenerator = shadowGenerator;
    this.nada = null;
    this.hassan = null;
    this.maryam = null;
    this.reducedMotion = Boolean(
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    );

    this.materials = {};
    this._initMaterials();
    this._createNada();
    this._createHassan();
    this._createMaryam();
  }

  _initMaterials() {
    const s = this.scene;

    // Skin tones
    const skinNada = new BABYLON.PBRMaterial('skinNada', s);
    skinNada.albedoColor = new BABYLON.Color3(0.82, 0.65, 0.52); // Warm Egyptian skin tone
    skinNada.roughness = 0.55;
    this.materials.skinNada = skinNada;

    const skinHassan = new BABYLON.PBRMaterial('skinHassan', s);
    skinHassan.albedoColor = new BABYLON.Color3(0.72, 0.54, 0.42); // Weathered Delta skin tone
    skinHassan.roughness = 0.75;
    this.materials.skinHassan = skinHassan;

    const skinMaryam = new BABYLON.PBRMaterial('skinMaryam', s);
    skinMaryam.albedoColor = new BABYLON.Color3(0.79, 0.61, 0.48);
    skinMaryam.roughness = 0.58;
    this.materials.skinMaryam = skinMaryam;

    // Clothing materials
    // Nada's field jacket
    const nadaJacket = new BABYLON.PBRMaterial('nadaJacket', s);
    nadaJacket.albedoColor = new BABYLON.Color3(0.18, 0.42, 0.35); // Nile Delta field olive/teal
    nadaJacket.roughness = 0.7;
    this.materials.nadaJacket = nadaJacket;

    // Nada's trousers & boots
    const nadaPants = new BABYLON.PBRMaterial('nadaPants', s);
    nadaPants.albedoColor = new BABYLON.Color3(0.32, 0.29, 0.25); // Khaki work pants
    nadaPants.roughness = 0.8;
    this.materials.nadaPants = nadaPants;

    const nadaBoots = new BABYLON.PBRMaterial('nadaBoots', s);
    nadaBoots.albedoColor = new BABYLON.Color3(0.15, 0.12, 0.1);
    nadaBoots.roughness = 0.6;
    this.materials.nadaBoots = nadaBoots;

    // Hassan's Galabeya (Traditional striped Egyptian farmer robe)
    const hassanRobe = new BABYLON.PBRMaterial('hassanRobe', s);
    hassanRobe.albedoColor = new BABYLON.Color3(0.68, 0.68, 0.72); // Light blue-grey striped galabeya
    hassanRobe.roughness = 0.85;
    this.materials.hassanRobe = hassanRobe;

    const hassanCap = new BABYLON.PBRMaterial('hassanCap', s);
    hassanCap.albedoColor = new BABYLON.Color3(0.92, 0.92, 0.88); // White taqeyya
    hassanCap.roughness = 0.9;
    this.materials.hassanCap = hassanCap;

    // Maryam's Galabeya & headscarf
    const maryamRobe = new BABYLON.PBRMaterial('maryamRobe', s);
    maryamRobe.albedoColor = new BABYLON.Color3(0.25, 0.28, 0.42); // Indigo rural dress
    maryamRobe.roughness = 0.8;
    this.materials.maryamRobe = maryamRobe;

    const maryamScarf = new BABYLON.PBRMaterial('maryamScarf', s);
    maryamScarf.albedoColor = new BABYLON.Color3(0.72, 0.35, 0.3); // Terracotta patterned scarf
    maryamScarf.roughness = 0.75;
    this.materials.maryamScarf = maryamScarf;

    // Common hair & eyes
    const darkHair = new BABYLON.PBRMaterial('darkHair', s);
    darkHair.albedoColor = new BABYLON.Color3(0.08, 0.06, 0.05);
    darkHair.roughness = 0.5;
    this.materials.darkHair = darkHair;

    const greyBeard = new BABYLON.PBRMaterial('greyBeard', s);
    greyBeard.albedoColor = new BABYLON.Color3(0.78, 0.78, 0.78);
    greyBeard.roughness = 0.9;
    this.materials.greyBeard = greyBeard;

    const eyeMat = new BABYLON.PBRMaterial('eyeMat', s);
    eyeMat.albedoColor = new BABYLON.Color3(0.2, 0.15, 0.1);
    eyeMat.roughness = 0.15;
    this.materials.eyes = eyeMat;
  }

  _createRiggedHuman(id, skinMat, clothesMat, height = 1.72) {
    const root = new BABYLON.TransformNode(`${id}_root`, this.scene);

    // Joint hierarchy using TransformNodes (no claim of mesh skinning).
    const hips = new BABYLON.TransformNode(`${id}_Hips`, this.scene);
    hips.parent = root;
    hips.position.y = height * 0.54;

    const spine = new BABYLON.TransformNode(`${id}_Spine`, this.scene);
    spine.parent = hips;
    spine.position.y = height * 0.16;

    const chest = new BABYLON.TransformNode(`${id}_Chest`, this.scene);
    chest.parent = spine;
    chest.position.y = height * 0.14;

    const neck = new BABYLON.TransformNode(`${id}_Neck`, this.scene);
    neck.parent = chest;
    neck.position.y = height * 0.08;

    const head = new BABYLON.TransformNode(`${id}_Head`, this.scene);
    head.parent = neck;
    head.position.y = height * 0.08;

    // Left Arm
    const leftShoulder = new BABYLON.TransformNode(`${id}_LeftShoulder`, this.scene);
    leftShoulder.parent = chest;
    leftShoulder.position.set(-0.2, height * 0.04, 0);

    const leftArm = new BABYLON.TransformNode(`${id}_LeftArm`, this.scene);
    leftArm.parent = leftShoulder;
    leftArm.position.set(-0.12, 0, 0);

    const leftForearm = new BABYLON.TransformNode(`${id}_LeftForearm`, this.scene);
    leftForearm.parent = leftArm;
    leftForearm.position.set(0, -0.28, 0);

    const leftHand = new BABYLON.TransformNode(`${id}_LeftHand`, this.scene);
    leftHand.parent = leftForearm;
    leftHand.position.set(0, -0.24, 0);

    // Right Arm
    const rightShoulder = new BABYLON.TransformNode(`${id}_RightShoulder`, this.scene);
    rightShoulder.parent = chest;
    rightShoulder.position.set(0.2, height * 0.04, 0);

    const rightArm = new BABYLON.TransformNode(`${id}_RightArm`, this.scene);
    rightArm.parent = rightShoulder;
    rightArm.position.set(0.12, 0, 0);

    const rightForearm = new BABYLON.TransformNode(`${id}_RightForearm`, this.scene);
    rightForearm.parent = rightArm;
    rightForearm.position.set(0, -0.28, 0);

    const rightHand = new BABYLON.TransformNode(`${id}_RightHand`, this.scene);
    rightHand.parent = rightForearm;
    rightHand.position.set(0, -0.24, 0);

    // Left Leg
    const leftThigh = new BABYLON.TransformNode(`${id}_LeftThigh`, this.scene);
    leftThigh.parent = hips;
    leftThigh.position.set(-0.12, -0.05, 0);

    const leftShin = new BABYLON.TransformNode(`${id}_LeftShin`, this.scene);
    leftShin.parent = leftThigh;
    leftShin.position.set(0, -0.42, 0);

    const leftFoot = new BABYLON.TransformNode(`${id}_LeftFoot`, this.scene);
    leftFoot.parent = leftShin;
    leftFoot.position.set(0, -0.42, 0.06);

    // Right Leg
    const rightThigh = new BABYLON.TransformNode(`${id}_RightThigh`, this.scene);
    rightThigh.parent = hips;
    rightThigh.position.set(0.12, -0.05, 0);

    const rightShin = new BABYLON.TransformNode(`${id}_RightShin`, this.scene);
    rightShin.parent = rightThigh;
    rightShin.position.set(0, -0.42, 0);

    const rightFoot = new BABYLON.TransformNode(`${id}_RightFoot`, this.scene);
    rightFoot.parent = rightShin;
    rightFoot.position.set(0, -0.42, 0.06);

    // Anatomical Meshes parented to respective bone joints
    // Head mesh
    const headMesh = BABYLON.MeshBuilder.CreateSphere(`${id}_headMesh`, { diameterX: 0.22, diameterY: 0.26, diameterZ: 0.24, segments: 16 }, this.scene);
    headMesh.parent = head;
    headMesh.material = skinMat;
    if (this.shadowGenerator) this.shadowGenerator.addShadowCaster(headMesh);

    // Torso / Chest mesh
    const chestMesh = BABYLON.MeshBuilder.CreateBox(`${id}_chestMesh`, { width: 0.38, height: 0.3, depth: 0.24 }, this.scene);
    chestMesh.parent = chest;
    chestMesh.position.y = -0.05;
    chestMesh.material = clothesMat;
    if (this.shadowGenerator) this.shadowGenerator.addShadowCaster(chestMesh);

    // Pelvis mesh
    const hipsMesh = BABYLON.MeshBuilder.CreateBox(`${id}_hipsMesh`, { width: 0.34, height: 0.22, depth: 0.22 }, this.scene);
    hipsMesh.parent = hips;
    hipsMesh.material = clothesMat;

    // Distinct Delta clothing silhouettes are part of the inexpensive base
    // meshes. Parenting to the low-detail body pieces means the higher-quality
    // sculpted-character pass can disable both without overlapping geometry.
    if (id === 'hassan' || id === 'maryam') {
      const hem = BABYLON.MeshBuilder.CreateCylinder(
        id === 'hassan' ? 'hassanGalabeyaHem' : 'maryamDressHem',
        { diameterTop: 0.34, diameterBottom: id === 'hassan' ? 0.55 : 0.62,
          height: 0.55, tessellation: 10 }, this.scene
      );
      hem.parent = hipsMesh;
      hem.position.y = -0.26;
      hem.material = clothesMat;
    } else if (id === 'nada') {
      const jacketHem = BABYLON.MeshBuilder.CreateBox(
        'nadaJacketHem', { width: 0.39, height: 0.16, depth: 0.26 }, this.scene
      );
      jacketHem.parent = chestMesh;
      jacketHem.position.y = -0.23;
      jacketHem.material = clothesMat;
    }

    // Limb Meshes
    const limbMat = clothesMat;
    const makeLimb = (name, parent, len, radius) => {
      const m = BABYLON.MeshBuilder.CreateCylinder(name, { diameter: radius * 2, height: len, tessellation: 12 }, this.scene);
      m.position.y = -len / 2;
      m.parent = parent;
      m.material = limbMat;
      if (this.shadowGenerator) this.shadowGenerator.addShadowCaster(m);
      return m;
    };

    makeLimb(`${id}_lArmMesh`, leftArm, 0.28, 0.06);
    makeLimb(`${id}_lForearmMesh`, leftForearm, 0.24, 0.05);
    makeLimb(`${id}_rArmMesh`, rightArm, 0.28, 0.06);
    makeLimb(`${id}_rForearmMesh`, rightForearm, 0.24, 0.05);

    makeLimb(`${id}_lThighMesh`, leftThigh, 0.42, 0.09);
    makeLimb(`${id}_lShinMesh`, leftShin, 0.42, 0.075);
    makeLimb(`${id}_rThighMesh`, rightThigh, 0.42, 0.09);
    makeLimb(`${id}_rShinMesh`, rightShin, 0.42, 0.075);

    // Eyes
    const leftEye = BABYLON.MeshBuilder.CreateSphere(`${id}_lEye`, { diameter: 0.045, segments: 8 }, this.scene);
    leftEye.parent = head;
    leftEye.position.set(-0.05, 0.02, 0.11);
    leftEye.material = this.materials.eyes;

    const rightEye = BABYLON.MeshBuilder.CreateSphere(`${id}_rEye`, { diameter: 0.045, segments: 8 }, this.scene);
    rightEye.parent = head;
    rightEye.position.set(0.05, 0.02, 0.11);
    rightEye.material = this.materials.eyes;

    return {
      root,
      bones: {
        hips,
        spine,
        chest,
        neck,
        head,
        leftArm,
        leftForearm,
        leftHand,
        rightArm,
        rightForearm,
        rightHand,
        leftThigh,
        leftShin,
        leftFoot,
        rightThigh,
        rightShin,
        rightFoot,
      },
      headMesh,
      eyes: [leftEye, rightEye],
      height,
      animTime: 0,
      state: 'idle', // 'idle' | 'walk' | 'run' | 'interact' | 'talk'
    };
  }

  _createNada() {
    // Playable Female Protagonist Nada (1.68m)
    const actor = this._createRiggedHuman('nada', this.materials.skinNada, this.materials.nadaJacket, 1.68);
    // Begin near the canal, palms, Hassan and planted fields. The older pump-lane
    // spawn framed bare soil and oversized machinery, undermining the story's
    // focus on the village and the next season. Pump remains walkable nearby.
    actor.root.position.set(-4, 0.0, 3.0);
    actor.root.rotation.y = 0.4;

    // Ponytail & scarf
    const scarf = BABYLON.MeshBuilder.CreateBox('nadaScarf', { width: 0.24, height: 0.08, depth: 0.26 }, this.scene);
    scarf.parent = actor.bones.head;
    scarf.position.set(0, 0.11, 0);
    scarf.material = this.materials.nadaJacket;

    const ponytail = BABYLON.MeshBuilder.CreateCylinder('ponytail', { diameterTop: 0.05, diameterBottom: 0.02, height: 0.24 }, this.scene);
    ponytail.parent = actor.bones.head;
    ponytail.position.set(0, -0.05, -0.15);
    ponytail.rotation.x = -0.4;
    ponytail.material = this.materials.darkHair;

    // Tablet on hip
    const tablet = BABYLON.MeshBuilder.CreateBox('nadaTablet', { width: 0.2, height: 0.14, depth: 0.03 }, this.scene);
    tablet.parent = actor.bones.hips;
    tablet.position.set(0.22, 0, 0.05);
    tablet.rotation.z = -0.2;
    const tabMat = new BABYLON.PBRMaterial('tabMat', this.scene);
    tabMat.albedoColor = new BABYLON.Color3(0.1, 0.15, 0.2);
    tablet.material = tabMat;

    this.nada = {
      ...actor,
      id: 'nada',
      nameAr: 'ندى',
      nameEn: 'Nada',
      role: 'Protagonist Agricultural Engineer',
      moveSpeed: 4.8,
      runSpeed: 8.2,
      velocity: new BABYLON.Vector3(0, 0, 0),
    };
  }

  _createHassan() {
    // Elder Farmer Hassan (1.74m) - Standing near Gate 1
    const actor = this._createRiggedHuman('hassan', this.materials.skinHassan, this.materials.hassanRobe, 1.74);
    actor.root.position.set(4.5, 0.0, 9.8);
    actor.root.rotation.y = -Math.PI / 2;

    // White skullcap (taqeyya)
    const cap = BABYLON.MeshBuilder.CreateCylinder('hassanCap', { diameter: 0.24, height: 0.08 }, this.scene);
    cap.parent = actor.bones.head;
    cap.position.y = 0.12;
    cap.material = this.materials.hassanCap;

    // Grey beard
    const beard = BABYLON.MeshBuilder.CreateSphere('hassanBeard', { diameterX: 0.18, diameterY: 0.16, diameterZ: 0.14 }, this.scene);
    beard.parent = actor.bones.head;
    beard.position.set(0, -0.09, 0.07);
    beard.material = this.materials.greyBeard;

    // Wooden walking stick / cane in left hand
    const cane = BABYLON.MeshBuilder.CreateCylinder('hassanCane', { diameter: 0.04, height: 1.15 }, this.scene);
    cane.parent = actor.bones.leftHand;
    cane.position.set(0, -0.4, 0);
    cane.material = this.materials.trunk;

    this.hassan = {
      ...actor,
      id: 'hassan',
      nameAr: 'عم حسن',
      nameEn: 'Uncle Hassan',
      role: 'Elder Farmer (Field 1 Wheat)',
      emotion: 'hopeful',
      interactRange: 3.5,
    };
  }

  _createMaryam() {
    // Capable Farmer Maryam (1.66m) - Standing near Gate 2
    const actor = this._createRiggedHuman('maryam', this.materials.skinMaryam, this.materials.maryamRobe, 1.66);
    actor.root.position.set(24.5, 0.0, 7.8);
    actor.root.rotation.y = -Math.PI / 2.2;

    // Headscarf (Tarha)
    const scarf = BABYLON.MeshBuilder.CreateSphere('maryamScarf', { diameterX: 0.28, diameterY: 0.32, diameterZ: 0.28 }, this.scene);
    scarf.parent = actor.bones.head;
    scarf.position.set(0, 0.04, -0.02);
    scarf.material = this.materials.maryamScarf;

    // One folded cloth tail distinguishes Maryam's original rural headscarf
    // from a rigid helmet while adding only one small low-poly mesh.
    const scarfTail = BABYLON.MeshBuilder.CreateCylinder('maryamScarfTail', {
      diameterTop: 0.075, diameterBottom: 0.12, height: 0.31, tessellation: 8,
    }, this.scene);
    scarfTail.parent = actor.bones.head;
    scarfTail.position.set(0.08, -0.15, -0.12);
    scarfTail.rotation.z = -0.2;
    scarfTail.material = this.materials.maryamScarf;

    // Irrigation schedule ledger in hands
    const clipboard = BABYLON.MeshBuilder.CreateBox('maryamBoard', { width: 0.22, height: 0.28, depth: 0.02 }, this.scene);
    clipboard.parent = actor.bones.rightHand;
    clipboard.position.set(0, -0.15, 0.1);
    clipboard.rotation.x = Math.PI / 3;
    const clipMat = new BABYLON.PBRMaterial('clipMat', this.scene);
    clipMat.albedoColor = new BABYLON.Color3(0.85, 0.85, 0.8);
    clipboard.material = clipMat;

    this.maryam = {
      ...actor,
      id: 'maryam',
      nameAr: 'مريم',
      nameEn: 'Maryam',
      role: 'Cooperative Farmer (Field 2 Berseem)',
      emotion: 'neutral',
      interactRange: 3.5,
    };
  }

  updateAnimations(deltaTime) {
    const actors = [this.nada, this.hassan, this.maryam].filter(Boolean);
    // A suspended tab must not jump the pose on resume or amplify animations.
    const frame = Number.isFinite(deltaTime) ? Math.max(0, Math.min(deltaTime, 0.05)) : 0;
    // The in-game accessibility toggle also sets this body class; honor it
    // without requiring HUD code to know about character joint internals.
    const reduceMotionNow = this.reducedMotion || Boolean(
      typeof document !== 'undefined' && document.body?.classList?.contains('reduced-motion')
    );

    for (const a of actors) {
      a.animTime += frame;
      const t = a.animTime;
      const b = a.bones;

      // Fully reset transient poses before applying the current state. Without
      // this, an interaction freezes Nada's forearm or the run hip bob in idle.
      b.hips.position.y = a.height * 0.54;
      b.spine.rotation.x = 0;
      b.spine.rotation.z = 0;
      b.head.rotation.x = 0;
      b.head.rotation.y = 0;
      b.chest.rotation.x = 0;
      b.leftThigh.rotation.x = 0;
      b.rightThigh.rotation.x = 0;
      b.leftShin.rotation.x = 0;
      b.rightShin.rotation.x = 0;
      b.leftArm.rotation.x = 0;
      b.rightArm.rotation.x = 0;
      b.leftForearm.rotation.x = 0;
      b.rightForearm.rotation.x = 0;

      // Captions/text UI convey interactions; no limb or camera motion is
      // required to understand them when reduced-motion is requested.
      if (reduceMotionNow) continue;

      // 1. Idle breathing (all actors have subtle natural chest & head motion)
      const breath = Math.sin(t * 2.2) * 0.03;
      b.chest.rotation.x = breath;
      b.head.rotation.x = -breath * 0.5;

      if (a.state === 'walk' || a.state === 'run') {
        // Dynamic Locomotion Cycle
        const freq = a.state === 'run' ? 9.0 : 6.0;
        const ampLeg = a.state === 'run' ? 0.65 : 0.45;
        const ampArm = a.state === 'run' ? 0.55 : 0.35;

        const legCycle = Math.sin(t * freq);
        b.leftThigh.rotation.x = legCycle * ampLeg;
        b.rightThigh.rotation.x = -legCycle * ampLeg;

        // Knee bend on back swing
        b.leftShin.rotation.x = legCycle > 0 ? legCycle * ampLeg * 0.8 : 0;
        b.rightShin.rotation.x = legCycle < 0 ? -legCycle * ampLeg * 0.8 : 0;

        // Counter-arm swing
        b.leftArm.rotation.x = -legCycle * ampArm;
        b.rightArm.rotation.x = legCycle * ampArm;

        // Subtle hip bob
        b.hips.position.y = a.height * 0.54 + Math.abs(Math.sin(t * freq)) * 0.04;
      } else if (a.state === 'interact') {
        // Reaching out right hand to interact
        b.rightArm.rotation.x = -Math.PI / 2.8;
        b.rightForearm.rotation.x = -Math.PI / 4;
        b.spine.rotation.x = 0.15;
      } else if (a.state === 'talk') {
        // Expressive conversational gestures
        const gestureL = Math.sin(t * 3.5) * 0.25;
        const gestureR = Math.cos(t * 3.0) * 0.28;
        b.leftArm.rotation.x = -0.3 + gestureL;
        b.rightArm.rotation.x = -0.4 + gestureR;
        b.head.rotation.y = Math.sin(t * 1.8) * 0.12;
      } else {
        // Idle pose rest
        b.leftThigh.rotation.x = 0;
        b.rightThigh.rotation.x = 0;
        b.leftShin.rotation.x = 0;
        b.rightShin.rotation.x = 0;
        b.leftArm.rotation.x = 0.08;
        b.rightArm.rotation.x = 0.08;

        if (a.id === 'hassan') {
          // Hassan leaning slightly on his walking stick
          b.spine.rotation.z = -0.06;
          b.leftArm.rotation.x = -0.25;
        } else if (a.id === 'maryam') {
          // Maryam holding clipboard with both hands
          b.leftArm.rotation.x = -0.4;
          b.rightArm.rotation.x = -0.45;
        }
      }
    }
  }

  setReducedMotion(enabled) {
    this.reducedMotion = Boolean(enabled);
  }

  setActorState(actorId, state) {
    const actor = { nada: this.nada, hassan: this.hassan, maryam: this.maryam }[actorId];
    if (actor) {
      actor.state = state;
    }
  }

  setActorEmotion(actorId, emotion) {
    const actor = { nada: this.nada, hassan: this.hassan, maryam: this.maryam }[actorId];
    if (actor) {
      actor.emotion = emotion;
    }
  }
}
