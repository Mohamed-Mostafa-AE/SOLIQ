/**
 * The Seventh Field | Delta world visual upgrade.
 * Original procedural artwork, not real satellite imagery or a photogrammetry scan.
 * Thin instances keep the detailed six-field vegetation economical on mobile.
 */
import {makeCropCutoutTexture,applyCropCutoutMaterial} from './delta-procedural-textures.js';
export const VISUAL_ART_STATUS = 'Original procedural game art — fictional Nile Delta village';
export const CROP_VISUALS = Object.freeze({
  wheat: {height: .82, width: .095, color: [0.70, 0.60, 0.27], density: 23},
  berseem: {height: .34, width: .18, color: [0.21, 0.54, 0.17], density: 28},
  rice: {height: .65, width: .075, color: [0.36, 0.63, 0.20], density: 27},
  corn: {height: 1.28, width: .19, color: [0.28, 0.50, 0.14], density: 17},
  beans: {height: .61, width: .19, color: [0.23, 0.45, 0.21], density: 18},
});
export function seededJitter(seed) {
  let x = seed >>> 0;
  return () => {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    return x / 4294967296;
  };
}
export function plantTransforms(field, quality='balanced') {
  if (!field || !Number.isFinite(field.width) || !Number.isFinite(field.depth)) return [];
  if (field.crop === 'future_echo') return [];
  const spec = CROP_VISUALS[field.crop] || CROP_VISUALS.wheat;
  const densityScale = quality === 'low' ? .28 : quality === 'ultra' ? 1.35 : 1;
  const count = Math.max(5, Math.round(spec.density * densityScale));
  const seed = ((Math.round(field.center.x*1000)*1103515245) ^ (Math.round(field.center.z*1000)*2654435761))>>>0;
  const rand = seededJitter(seed);
  const plants=[];
  // Align with the existing seven furrow rows, keeping clear irrigation lanes.
  for(let row=0;row<7;row++) {
    const z=field.center.z-field.depth/2+field.depth*(row+1)/8;
    for(let i=0;i<count;i++){
      const x=field.center.x-field.width*.46+field.width*.92*(i+.5)/count;
      const jitter=.13+spec.width*.6;
      plants.push({
        x:x+(rand()-.5)*jitter,
        y:field.center.y+spec.height*.47,
        z:z+(rand()-.5)*jitter,
        height:spec.height*(.72+.5*rand()),
        width:spec.width*(.7+.55*rand()),
        rotation:rand()*Math.PI,
      });
    }
  }
  return plants;
}
const pbr=(scene,name,albedo,roughness=0.88)=>{
  const m=new BABYLON.PBRMaterial(name,scene);
  m.albedoColor=new BABYLON.Color3(...albedo);
  m.metallic=0;
  m.roughness=roughness;
  m.backFaceCulling=false;
  return m;
};
function instanceMatrices(plants,turn=0){
  const result=new Float32Array(plants.length*16);
  const v=new BABYLON.Vector3(1,1,1);
  plants.forEach((p,i)=>{
    v.set(p.width,p.height,1);
    const q=BABYLON.Quaternion.RotationYawPitchRoll(p.rotation+turn,0,0);
    BABYLON.Matrix.Compose(v,q,new BABYLON.Vector3(p.x,p.y,p.z)).copyToArray(result,i*16);
  });
  return result;
}
/** Draw thousands of crops with 2 crosses per plant and ~12 draw calls, no giant mesh spam. */
export function installFieldVegetation(village,quality='balanced'){
  if(!village?.scene || !Array.isArray(village.fields))return {plots:0,plants:0,drawMeshes:0};
  const scene=village.scene;
  const materials={};
  let count=0, meshes=0, plots=0;
  for(const f of village.fields){
    if(f.crop==='future_echo')continue;
    const spec=CROP_VISUALS[f.crop]||CROP_VISUALS.wheat;
    const plants=plantTransforms(f,quality);
    if(!plants.length)continue;
    if(!materials[f.crop])materials[f.crop]=pbr(scene,'deltaPlantMat_'+f.crop,spec.color,.76);
    const mat=materials[f.crop];
    if(!mat.albedoTexture)applyCropCutoutMaterial(mat,makeCropCutoutTexture(scene,f.crop));
    const angles=[0,Math.PI/2];
    for(let side=0;side<2;side++){
      const mesh=BABYLON.MeshBuilder.CreatePlane('liveCrop_'+f.id+'_'+side,
        {width:1,height:1,sideOrientation:BABYLON.Mesh.DOUBLESIDE},scene);
      mesh.material=mat;
      mesh.position.y=0; // transforms are in absolute village coordinates
      mesh.thinInstanceSetBuffer('matrix',instanceMatrices(plants,angles[side]),16,true);
      mesh.isPickable=false;
      mesh.alwaysSelectAsActiveMesh=true;
      meshes++;
    }
    // Old crop-row boxes become believable low soil ridges, not huge green rectangular "plants".
    const ridgeMat=pbr(scene,'ridge_'+f.id,[.38,.30,.22],.96);
    (f.crops||[]).forEach(row=>{
      row.material=ridgeMat;
      row.scaling.y=.16;
      row.position.y=.05;
      row.receiveShadows=true;
    });
    count+=plants.length;plots++;
  }
  return {plots,plants:count,drawMeshes:meshes,quality,kind:VISUAL_ART_STATUS};
}
/** Original small-scale architectural details, kept in one low-cost layer. */
export function installVillageDetails(village){
  const scene=village?.scene;
  if(!scene)return {details:0};
  const stone=pbr(scene,'deltaStone',['.54','.49','.39'].map(Number),.96);
  const brass=pbr(scene,'villageOchre',[.75,.49,.21],.78);
  const timber=pbr(scene,'villageWeatheredTimber',[.33,.23,.16],.95);
  let details=0;
  const rand=seededJitter(0x5e71e);
  // Irrigation bunds edge each plot: clear human-scale field boundaries.
  village.fields.filter(f=>f.crop!=='future_echo').forEach((f,i)=>{
    for(const direction of [-1,1]){
      const bund=BABYLON.MeshBuilder.CreateBox('earthBund_'+i+'_'+direction,
         {width:f.width+.7,height:.19,depth:.31},scene);
      bund.position.set(f.center.x,.11,f.center.z+direction*f.depth/2);
      bund.material=stone;bund.receiveShadows=true;
      details++;
    }
  });
  // Small irregular scattered pebbles on paths, not on protected crops.
  const pebble=BABYLON.MeshBuilder.CreateSphere('pathPebblePrototype',{diameter:1,segments:5},scene);
  pebble.material=stone;pebble.isPickable=false;
  const transforms=new Float32Array(135*16);
  for(let i=0;i<135;i++){
    const x=-29+rand()*84,z=-13+(x+30)*.17+(rand()-.5)*3;
    const sx=.025+rand()*.07,sz=.025+rand()*.09;
    BABYLON.Matrix.Compose(new BABYLON.Vector3(sx,.03,sz),
      BABYLON.Quaternion.RotationYawPitchRoll(rand()*Math.PI,0,0),
      new BABYLON.Vector3(x,.08,z)).copyToArray(transforms,i*16);
  }
  pebble.thinInstanceSetBuffer('matrix',transforms,16,true);details++;
  // Local manual gate signage: illustrative label, not a claim about a real village.
  const sign=BABYLON.MeshBuilder.CreateBox('villageMesqaSign',{width:2.4,height:.62,depth:.08},scene);
  sign.position.set(-21,2.5,3.45);sign.material=timber;details++;
  for(const x of [-21.95,-20.05]){
    const post=BABYLON.MeshBuilder.CreateCylinder('signPost',{diameter:.07,height:2.6,tessellation:8},scene);
    post.position.set(x,1.3,3.45);post.material=timber;details++;
  }
  // Metal water-level staff with evenly spaced markings at the intake.
  const waterGauge=BABYLON.MeshBuilder.CreateBox('intakeWaterGauge',{width:.08,height:1.6,depth:.08},scene);
  waterGauge.position.set(-18.1,.48,8.3);waterGauge.material=brass;details++;
  return {details,kind:VISUAL_ART_STATUS};
}
