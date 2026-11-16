/**
 * Original, illustrated 3D Nile Delta set dressing for The Seventh Field.
 *
 * This is deliberately a fictional, educational scene. Its sakia, farmyards,
 * canals and animated plants are NOT satellite measurements or field evidence.
 * The science/water solver remains the sole owner of numerical irrigation.
 */
export const DELTA_SCENIC_EVIDENCE = 'SIMULATED — original fictional Delta game art';

export function scenicQualityBudget({ preset = 'balanced', hardwareScale = 1 } = {}) {
  const low = preset === 'low' || hardwareScale >= 1.25;
  const high = !low && preset === 'ultra';
  return {
    preset: low ? 'low' : high ? 'ultra' : 'balanced',
    wheelSpokes: low ? 8 : 12,
    roofDetails: low ? 2 : high ? 7 : 4,
    hayBales: low ? 6 : high ? 18 : 12,
    birdCount: low ? 0 : high ? 8 : 5,
    butterflyCount: low ? 0 : high ? 14 : 8,
  };
}

export function planWaterwheel({ x = 0, y = 2.35, z = 11.9, radius = 1.7, spokes = 12 } = {}) {
  const n = Math.max(6, Math.min(24, Math.floor(spokes)));
  return {
    center: { x, y, z }, radius,
    ribs: Array.from({ length: n }, (_, i) => {
      const angle = (i * Math.PI * 2) / n;
      return {
        angle,
        tip: { x: radius * Math.cos(angle), y: radius * Math.sin(angle) },
        bucket: { x: (radius + .09) * Math.cos(angle), y: (radius + .09) * Math.sin(angle) },
      };
    }),
  };
}

export function planVillageYards() {
  return [
    { x: -25, z: -22, width: 10, depth: 8, accent: 'blue' },
    { x: -10, z: -25, width: 8, depth: 7, accent: 'blue' },
    { x: -32, z: 24, width: 9, depth: 8, accent: 'clay' },
  ];
}

export function scenicCanalCenterZ(x) {
  const anchors=[[-35,12],[-15,10],[5,9],[25,7],[45,6],[65,4]];
  const clamped=Math.max(anchors[0][0],Math.min(anchors.at(-1)[0],x));
  for(let i=0;i<anchors.length-1;i++){
    const a=anchors[i],b=anchors[i+1];
    if(clamped<=b[0])return a[1]+(clamped-a[0])/(b[0]-a[0])*(b[1]-a[1]);
  }
  return anchors.at(-1)[1];
}

function material(scene, name, color, opts = {}) {
  const mat = new BABYLON.StandardMaterial(name, scene);
  mat.diffuseColor = new BABYLON.Color3(...color);
  mat.specularColor = new BABYLON.Color3(...(opts.specular || [0.035, 0.028, 0.016]));
  if (opts.emissive) mat.emissiveColor = new BABYLON.Color3(...opts.emissive);
  mat.backFaceCulling = !opts.doubleSided;
  return mat;
}

function meshBox(scene, name, dim, pos, mat, parent, rotationY = 0) {
  const m = BABYLON.MeshBuilder.CreateBox(name, dim, scene);
  m.position.set(...pos);
  m.material = mat;
  m.isPickable = false;
  m.receiveShadows = true;
  if (parent) m.parent = parent;
  if (rotationY) m.rotation.y = rotationY;
  return m;
}

function cylinder(scene, name, dim, pos, mat, parent) {
  const m = BABYLON.MeshBuilder.CreateCylinder(name, dim, scene);
  m.position.set(...pos);
  m.material = mat;
  m.isPickable = false;
  if (parent) m.parent = parent;
  return m;
}

function seedRandom(seed) {
  let n = seed >>> 0;
  return () => ((n = (Math.imul(n, 1664525) + 1013904223) >>> 0) / 4294967296);
}

/**
 * Physically situated scene ornaments. Everything in this layer is cosmetic;
 * no farm economics, water allocation or scene interaction target is changed.
 */
export class DeltaEnvironmentLayer {
  constructor(village, options = {}) {
    this.village = village;
    this.scene = village.scene;
    const hardwareScale = this.scene.getEngine?.()?.getHardwareScalingLevel?.() || 1;
    this.budget = scenicQualityBudget({ hardwareScale, ...options });
    this.materials = this._makeMaterials();
    this.windTime = 0;
    this.irrigationActive = false;
    this.wheel = null;
    this.birds = [];
    this.butterflies = [];
    this.animatedCanvas = [];
    this.ambientCanalMaterial = null;
    this._createWaterwheel();
    this._createFarmyardFacades();
    this._createVillageLife();
    this._createCanalDetail();
    this._createFieldDetail();
    this._createNearCanalNursery();
  }

  _makeMaterials() {
    const s = this.scene;
    return {
      reed: material(s, 'scenicReed',[.37,.43,.19],{ doubleSided: true }),
      straw: material(s, 'scenicStraw',[.79,.62,.29]),
      sand: material(s, 'scenicSand',[.63,.47,.29]),
      terracotta: material(s, 'scenicTerracotta',[.59,.26,.17]),
      limestone: material(s, 'scenicLimestone',[.77,.67,.49]),
      deepTeal: material(s, 'scenicDeepTeal',[.085,.27,.30]),
      brightBlue: material(s, 'scenicPaintedBlue',[.13,.48,.58]),
      thread: material(s, 'scenicThread',[.29,.21,.15]),
      chalk: material(s, 'scenicChalk',[.85,.80,.64],{ doubleSided: true }),
      riverBird: material(s, 'scenicBird',[.12,.17,.20],{ doubleSided: true }),
      butterfly: material(s, 'scenicButterfly',[.97,.73,.23],{ doubleSided: true }),
      lantern: material(s, 'scenicLantern',[.91,.57,.17],{ emissive: [.15,.09,.02] }),
    };
  }

  _createWaterwheel() {
    const scene = this.scene, mat = this.materials;
    const plan = planWaterwheel({ spokes: this.budget.wheelSpokes });
    const anchor = new BABYLON.TransformNode('DeltaSakiaWaterLift', scene);
    anchor.position.set(plan.center.x, plan.center.y, plan.center.z);
    // Historic water-lift structure: visual cultural reference, not a real
    // pump or live-measurement device. Its modest motion is player feedback.
    for (const side of [-1,1]) {
      const support = meshBox(scene,`sakiaSupport${side}`,
        { width:.23,height:3.9,depth:.29 },
        [plan.center.x + side * 1.14,1.98,plan.center.z-.12],
        mat.limestone,null);
      support.rotation.z = side * -.26;
    }
    meshBox(scene,'sakiaFoundation',
      {width:3.7,height:.35,depth:1.45},
      [plan.center.x,.21,plan.center.z-.08],mat.sand);
    const rotating = new BABYLON.TransformNode('DeltaSakiaRotatingAssembly', scene);
    rotating.parent = anchor;
    for (const offset of [-.16,.16]) {
      const rim = BABYLON.MeshBuilder.CreateTorus(`sakiaRim${offset}`,
        {diameter:plan.radius*2,thickness:.115,tessellation:44},scene);
      rim.rotation.x = Math.PI/2;
      rim.position.z = offset;
      rim.material = mat.thread;
      rim.parent = rotating;
      rim.isPickable=false;
    }
    plan.ribs.forEach((rib,i)=> {
      const spoke = BABYLON.MeshBuilder.CreateTube(`sakiaSpoke${i}`,
        {path:[new BABYLON.Vector3(0,0,0),new BABYLON.Vector3(rib.tip.x,rib.tip.y,0)],radius:.046,tessellation:6}, scene);
      spoke.material=mat.thread;
      spoke.parent=rotating;
      spoke.isPickable=false;
      const bucket=cylinder(scene,`sakiaClayBucket${i}`,
        {diameterTop:.21,diameterBottom:.12,height:.34,tessellation:8},
        [rib.bucket.x,rib.bucket.y,.20],mat.terracotta,rotating);
      bucket.rotation.z=rib.angle-Math.PI/2;
    });
    const hub=cylinder(scene,'sakiaAxleHub',
      {diameter:.47,height:.51,tessellation:18},[0,0,0],mat.limestone,rotating);
    hub.rotation.x=Math.PI/2;
    const axle=cylinder(scene,'sakiaAxle',
      {diameter:.21,height:2.4,tessellation:14},[0,0,0],mat.thread,rotating);
    axle.rotation.x=Math.PI/2;
    this.wheel=rotating;
  }

  _createFarmyardFacades() {
    const m=this.materials,scene=this.scene;
    planVillageYards().forEach((h,i)=> {
      const front=h.z+h.depth/2+.17;
      // A plaster frame, original blue doorway, clay steps and a rooftop
      // parapet turn generic box houses into recognizable rural dwellings.
      meshBox(scene,`scenicDoorframe${i}`,
        {width:2.0,height:2.65,depth:.22},[h.x,1.325,front],m.limestone);
      meshBox(scene,`scenicBlueGate${i}`,
        {width:1.57,height:2.22,depth:.29},[h.x,1.11,front+.13],m.deepTeal);
      for(const side of [-1,1]) {
        meshBox(scene,`scenicGateShutter${i}_${side}`,
          {width:.04,height:2.03,depth:.34},[h.x+side*.49,1.11,front+.29],m.brightBlue);
        meshBox(scene,`scenicWindowFrame${i}_${side}`,
          {width:1.43,height:1.43,depth:.18},
          [h.x+side*h.width*.29,2.38,front],m.limestone);
        for(let bar=0;bar<3;bar++){
          meshBox(scene,`scenicWindowLattice${i}_${side}_${bar}`,
            {width:.075,height:1.12,depth:.29},
            [h.x+side*h.width*.29+(bar-1)*.35,2.38,front+.12],m.deepTeal);
        }
      }
      meshBox(scene,`scenicDoorStep${i}`,
        {width:2.35,height:.22,depth:.86},[h.x,.12,front+.58],m.sand);
      meshBox(scene,`scenicBrickCornice${i}`,
        {width:h.width+.4,height:.18,depth:h.depth+.4},[h.x,4.55-.3*(i===1),h.z],m.terracotta);
      // A real roof parapet has low vertical walls rather than a floating slab.
      const roofY=[4.5,4.0,4.2][i]+.41;
      for(const side of [-1,1]){
        meshBox(scene,`scenicParapetSide${i}_${side}`,
          {width:.26,height:.83,depth:h.depth+.56},
          [h.x+side*(h.width/2+.18),roofY,h.z],m.limestone);
        meshBox(scene,`scenicParapetEnd${i}_${side}`,
          {width:h.width+.54,height:.83,depth:.26},
          [h.x,roofY,h.z+side*(h.depth/2+.18)],m.limestone);
      }
      // Painted shallow relief panels (no copied sign/logo/text assets).
      meshBox(scene,`scenicOchrePlaque${i}`,
        {width:1.65,height:.34,depth:.1},[h.x,3.48,front+.14],m.straw);
    });
  }

  _createVillageLife() {
    const scene=this.scene,m=this.materials;
    const rng=seedRandom(0xd371a);
    // Earthen courtyard grain storage, basket baskets and haystacks.
    const hayPrototype=BABYLON.MeshBuilder.CreateCylinder('scenicHayBalePrototype',
      {diameter:1,height:.78,tessellation:10},scene);
    hayPrototype.material=m.straw;
    hayPrototype.isPickable=false;
    const matrixBuffer=new Float32Array(this.budget.hayBales*16);
    for(let i=0;i<this.budget.hayBales;i++){
      const nearHouse=i%3,house=planVillageYards()[nearHouse];
      const position=new BABYLON.Vector3(house.x-4.1+rng()*7.8,.44,house.z+house.depth/2+2.3+rng()*3.1);
      const scale=new BABYLON.Vector3(.53+rng()*.29,.48+rng()*.32,.53+rng()*.32);
      BABYLON.Matrix.Compose(scale,BABYLON.Quaternion.RotationYawPitchRoll(rng()*Math.PI,0,0),position)
        .copyToArray(matrixBuffer,i*16);
    }
    hayPrototype.thinInstanceSetBuffer('matrix',matrixBuffer,16,true);

    // Soft woven shade strips bridge the courtyards; sway is switched off by
    // reduced-motion preference, and no visual cue is necessary to play.
    const clothColors=[m.chalk,m.brightBlue,m.terracotta];
    for(let n=0;n<3;n++){
      const house=planVillageYards()[n];
      const z=house.z+house.depth/2+4.9;
      const line=BABYLON.MeshBuilder.CreateTube(`scenicLaundryLine${n}`,
        {path:[new BABYLON.Vector3(house.x-2.7,3.15,z),new BABYLON.Vector3(house.x+2.7,3.15,z)],radius:.018},scene);
      line.material=m.thread;
      line.isPickable=false;
      for(let i=0;i<this.budget.roofDetails;i++){
        const cloth=BABYLON.MeshBuilder.CreatePlane(`scenicHangingFabric${n}_${i}`,
          {width:.64,height:1.08,sideOrientation:BABYLON.Mesh.DOUBLESIDE},scene);
        cloth.position.set(house.x-2.35+i*(4.7/Math.max(1,this.budget.roofDetails)),2.59,z);
        cloth.material=clothColors[(n+i)%clothColors.length];
        cloth.isPickable=false;
        this.animatedCanvas.push({mesh:cloth,phase:rng()*Math.PI*2});
      }
    }

    // Warm low lanterns along the village route. Decorative, not a hazard.
    const lamps=[[-24,-14],[-10,-10],[5,-7],[27,-3]];
    lamps.forEach(([x,z],i)=>{
      cylinder(scene,`scenicLanternPost${i}`,{diameter:.11,height:3.1,tessellation:8},[x,1.55,z],m.deepTeal);
      const shade=BABYLON.MeshBuilder.CreateCylinder(`scenicLanternShade${i}`,
        {diameterTop:.24,diameterBottom:.6,height:.4,tessellation:8},scene);
      shade.position.set(x,3.17,z);shade.material=m.deepTeal;shade.isPickable=false;
      const flame=BABYLON.MeshBuilder.CreateSphere(`scenicLanternGlow${i}`,
        {diameter:.19,segments:8},scene);
      flame.position.set(x,2.87,z);flame.material=m.lantern;flame.isPickable=false;
    });
  }

  _createCanalDetail() {
    const scene=this.scene,m=this.materials;
    // The mesqa remains a recognizable waterway even when the diesel pump is
    // OFF: still water in a shared canal is not an assertion of delivered
    // irrigation. The separate solver controls every allocation/outcome.
    // The still-water ribbon is decorative scenery, not a hydrology gauge.
    const waterMat=material(scene,'scenicMesqaStillWater',[.12,.37,.42],{
      specular:[.43,.53,.49],doubleSided:true,
    });
    waterMat.alpha=.78;
    // Draw a tiny deterministic, original ripple texture rather than flat
    // cyan paint. Gracefully fall back to solid diffuse on headless renderers.
    if(typeof document!=='undefined' && typeof BABYLON.DynamicTexture==='function'){
      try {
        const size=this.budget.preset==='low'?128:256;
        const tex=new BABYLON.DynamicTexture('scenicMesqaRippleTexture',
          {width:size,height:size/2},scene,false);
        const ctx=tex.getContext(),im=ctx.createImageData(size,size/2);
        const random=seedRandom(0x517ab);
        for(let y=0;y<size/2;y++)for(let x=0;x<size;x++){
          const wave=Math.sin(x*.11+y*.23)+Math.sin(x*.047-y*.25)*.55;
          const reflection=Math.max(0,Math.sin(x*.17+y*.075)-.52)*23;
          const grain=(random()-.5)*12;
          const p=(y*size+x)*4;
          im.data[p]=Math.round(48+wave*5+grain+reflection*.78);
          im.data[p+1]=Math.round(122+wave*8+grain+reflection);
          im.data[p+2]=Math.round(123+wave*8+grain+reflection*1.05);
          im.data[p+3]=255;
        }
        ctx.putImageData(im,0,0);
        tex.wrapU=BABYLON.Texture.WRAP_ADDRESSMODE;
        tex.wrapV=BABYLON.Texture.WRAP_ADDRESSMODE;
        tex.uScale=3;tex.vScale=2;
        tex.update();
        waterMat.diffuseTexture=tex;
        waterMat.diffuseColor=new BABYLON.Color3(.70,.78,.79);
      } catch (_) { /* Canvas-disabled fallback keeps gameplay alive. */ }
    }
    this.ambientCanalMaterial=waterMat;
    const upper=[],lower=[];
    for(let i=0;i<=35;i++){
      const x=-34.7+i*2.82,z=scenicCanalCenterZ(x);
      upper.push(new BABYLON.Vector3(x,.13,z-1.52));
      lower.push(new BABYLON.Vector3(x,.13,z+1.52));
    }
    const water=BABYLON.MeshBuilder.CreateRibbon('scenicMesqaStillWater',{
      pathArray:[upper,lower],sideOrientation:BABYLON.Mesh.DOUBLESIDE},scene);
    water.material=waterMat;water.isPickable=false;water.receiveShadows=false;

    // Thin-instanced bank sedges create readable organic near-field foliage,
    // replacing the previous uninterrupted beige ground in human camera view.
    const plantCount=this.budget.preset==='low'?130:this.budget.preset==='ultra'?570:360;
    const rng=seedRandom(0x5e71ed);
    for(const side of [0,Math.PI/2]){
      const reed=BABYLON.MeshBuilder.CreatePlane(`scenicBankSedges${side}`,
        {width:.18,height:1,sideOrientation:BABYLON.Mesh.DOUBLESIDE},scene);
      reed.material=m.reed;
      reed.isPickable=false;
      reed.alwaysSelectAsActiveMesh=true;
      const transforms=new Float32Array(plantCount*16);
      for(let i=0;i<plantCount;i++){
        const x=-27+rng()*87,bankSign=i%2===0?1:-1;
        const z=scenicCanalCenterZ(x)+bankSign*(2.55+rng()*1.9);
        const height=.48+rng()*1.05,width=.55+rng()*.8;
        const scaling=new BABYLON.Vector3(width,height,1);
        const rotation=BABYLON.Quaternion.RotationYawPitchRoll(side+rng()*.28,0,(rng()-.5)*.18);
        BABYLON.Matrix.Compose(scaling,rotation,new BABYLON.Vector3(x,height/2+.1,z))
          .copyToArray(transforms,i*16);
      }
      reed.thinInstanceSetBuffer('matrix',transforms,16,true);
    }

    // Segmented stone edging on the near bank gives a visible horizontal
    // silhouette from the follow camera without blocking gates or bridges.
    for(let i=0;i<34;i++){
      const x=-30+i*2.35;
      const z=13.65-(x+30)*.095;
      const stone=meshBox(scene,`scenicCanalLimestone${i}`,
        {width:2.24,height:.24,depth:.42},[x,.20,z],i%4===0?m.sand:m.limestone);
      stone.rotation.y=-.09;
    }
    // Historically plausible woven reed fences delineate the irrigation
    // footpath; no extra collision blockers or gameplay obstructions.
    const fencePosts=[[-5.0,15.4],[-2.2,15.0],[.6,14.7],[3.4,14.4]];
    fencePosts.forEach(([x,z],i)=>{
      cylinder(scene,`scenicFencingPost${i}`,{diameter:.10,height:1.25,tessellation:7},[x,.62,z],m.thread);
    });
    for(let line=0;line<3;line++){
      const a=fencePosts[0],b=fencePosts.at(-1),y=.37+line*.3;
      const fence=BABYLON.MeshBuilder.CreateTube(`scenicReedFence${line}`,
        {path:[new BABYLON.Vector3(a[0],y,a[1]),new BABYLON.Vector3(b[0],y,b[1])],radius:.045,tessellation:6},scene);
      fence.material=m.reed;fence.isPickable=false;
    }
    // Bridge balustrade capstones are distinct from the load-bearing bridge
    // and preserve player interaction at the existing gate markers.
    const crossX=16,z=8;
    for(const side of [-1,1]) {
      meshBox(scene,`scenicBridgeLintel${side}`,
        {width:.34,height:.16,depth:6.62},[crossX+side*1.12,1.53,z],m.limestone);
    }
  }

  _createFieldDetail() {
    const scene=this.scene,m=this.materials;
    // Water rill geometry is deliberately only a raised marker beside each
    // crop plot. It never turns blue or implies a measured irrigation level.
    (this.village.fields||[]).filter(f=>f.crop!=='future_echo').forEach((f,i)=>{
      for(const side of [-1,1]){
        meshBox(scene,`scenicFieldBerm${i}_${side}`,
          {width:.34,height:.29,depth:f.depth+.48},
          [f.center.x+side*(f.width/2+.1),.17,f.center.z],m.sand);
      }
      const labelPlate=meshBox(scene,`scenicFieldFlag${i}`,
        {width:.56,height:.35,depth:.08},
        [f.center.x-f.width/2+.66,1.05,f.center.z-f.depth/2+.72],
        i%2?m.deepTeal:m.terracotta);
      labelPlate.rotation.y=Math.PI/7;
      cylinder(scene,`scenicFieldFlagPost${i}`,
        {diameter:.05,height:1.2,tessellation:6},
        [labelPlate.position.x,.6,labelPlate.position.z],m.thread);
    });
    // Bird silhouettes and butterflies add a subtle sense of inhabited
    // landscape; they are disabled entirely on the low-power preset.
    const rng=seedRandom(20261116);
    for(let i=0;i<this.budget.birdCount;i++){
      const b=new BABYLON.TransformNode(`scenicSkyBird${i}`,scene);
      b.position.set(-18+i*4.4,9.5+rng()*4,10+rng()*19);
      for(const wing of [-1,1]){
        const plane=BABYLON.MeshBuilder.CreatePlane(`scenicBirdWing${i}_${wing}`,
          {width:.65,height:.23,sideOrientation:BABYLON.Mesh.DOUBLESIDE},scene);
        plane.parent=b;plane.position.x=wing*.3;
        plane.rotation.z=wing*.22;plane.material=m.riverBird;plane.isPickable=false;
      }
      this.birds.push({mesh:b,baseX:b.position.x,phase:rng()*6.28});
    }
    for(let i=0;i<this.budget.butterflyCount;i++){
      const flower=new BABYLON.TransformNode(`scenicButterfly${i}`,scene);
      const x=-7+i*1.25,z=15+rng()*3;
      flower.position.set(x,.85+rng()*.4,z);
      for(const side of [-1,1]){
        const wing=BABYLON.MeshBuilder.CreatePlane(`scenicButterflyWing${i}_${side}`,
          {width:.17,height:.23,sideOrientation:BABYLON.Mesh.DOUBLESIDE},scene);
        wing.parent=flower;wing.position.x=side*.085;
        wing.rotation.y=side*.45;wing.material=m.butterfly;wing.isPickable=false;
      }
      this.butterflies.push({mesh:flower,baseY:flower.position.y,phase:rng()*6.28});
    }
  }

  _createNearCanalNursery() {
    // The first follow-camera shot was previously 55–60% empty dirt.
    // A compact, reachable demonstration nursery on the canal footpath gives
    // an organic foreground while leaving Nada's route and all real six fields
    // unchanged. It is NOT a modelled farm parcel or a crop recommendation.
    const scene=this.scene,m=this.materials;
    const x=-8.8,z=5.15,width=6.3,depth=3.5;
    const soil=material(scene,'scenicNurseryLoam',[.27,.20,.13]);
    const greenery=material(scene,'scenicNurseryClover',[.18,.48,.18]);
    const shoots=material(scene,'scenicNurseryYoungLeaves',[.34,.61,.20]);
    const patch=BABYLON.MeshBuilder.CreateGround('scenicCanalNurseryPlot',
      {width,height:depth,subdivisions:2},scene);
    patch.position.set(x,.17,z);
    patch.material=soil;patch.isPickable=false;patch.receiveShadows=true;
    for(const side of [-1,1]){
      meshBox(scene,`scenicNurseryBermLong${side}`,
        {width:width+.4,height:.24,depth:.26},
        [x,.20,z+side*(depth/2+.08)],m.sand);
      meshBox(scene,`scenicNurseryBermShort${side}`,
        {width:.26,height:.24,depth:depth+.4},
        [x+side*(width/2+.08),.20,z],m.sand);
    }
    const rng=seedRandom(0xa51c),density=this.budget.preset==='low'?11:17;
    for(const [kind,mat,angle] of [[0,greenery,0],[1,shoots,Math.PI/2]]){
      // Low-poly leaf masses are true volumetric ellipsoids, drawn with two
      // thin-instance calls rather than hundreds of heavy individual meshes.
      const leaf=BABYLON.MeshBuilder.CreateSphere(`scenicNurseryLeafMass${kind}`,
        {diameter:1,segments:6},scene);
      leaf.material=mat;leaf.isPickable=false;leaf.alwaysSelectAsActiveMesh=true;
      const buffer=new Float32Array(density*7*16);
      for(let row=0;row<7;row++)for(let i=0;i<density;i++){
        const h=.22+rng()*.20;
        const position=new BABYLON.Vector3(
          x-width*.45+(i+.5)*width*.90/density+(rng()-.5)*.08,
          .28+h*.48,
          z-depth*.43+(row+.5)*depth*.86/7+(rng()-.5)*.08,
        );
        const scale=new BABYLON.Vector3(.13+rng()*.05,h,.07+rng()*.05);
        BABYLON.Matrix.Compose(scale,
          BABYLON.Quaternion.RotationYawPitchRoll(angle+(rng()-.5)*.35,0,.13),position)
          .copyToArray(buffer,(row*density+i)*16);
      }
      leaf.thinInstanceSetBuffer('matrix',buffer,16,true);
    }
    const waterPot=cylinder(scene,'scenicNurseryWaterPitcher',
      {diameterTop:.31,diameterBottom:.55,height:.73,tessellation:14},
      [x-width/2-.53,.37,z-depth/2+.3],m.terracotta);
    waterPot.rotation.z=-.06;
  }

  setIrrigationActive(active) {
    // Water animation is illustrative feedback to the fiction; real numeric
    // allocation remains in game/core/water-window-adapter.js.
    this.irrigationActive=Boolean(active);
    if(this.ambientCanalMaterial){
      // A simulated pumping turn changes only the artistic sheen, not water
      // level or any quantity. The solver's canal mesh remains independent.
      this.ambientCanalMaterial.diffuseColor=this.irrigationActive
        ? new BABYLON.Color3(.13,.48,.54)
        : new BABYLON.Color3(.12,.37,.42);
    }
  }

  tick(deltaTime) {
    const prefersReduced=typeof window !== 'undefined' && Boolean(
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ||
      window.__seventhFieldGame?.renderSetup?.reducedMotion
    );
    if(prefersReduced)return;
    const dt=Math.max(0,Math.min(.05,Number(deltaTime)||0));
    this.windTime+=dt;
    if(this.wheel && this.irrigationActive)this.wheel.rotation.z+=dt*.30;
    for(const item of this.birds){
      item.mesh.position.x=item.baseX+Math.sin(this.windTime*.20+item.phase)*2.1;
      item.mesh.rotation.y=Math.sin(this.windTime*.35+item.phase)*.16;
    }
    for(const item of this.butterflies){
      item.mesh.position.y=item.baseY+Math.sin(this.windTime*2.4+item.phase)*.12;
      item.mesh.rotation.y=Math.sin(this.windTime*5+item.phase)*.27;
    }
    for(const item of this.animatedCanvas){
      item.mesh.rotation.y=Math.sin(this.windTime*.65+item.phase)*.12;
    }
  }
}
