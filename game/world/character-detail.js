/**
 * Non-destructive character detail pass for the existing Babylon transform rigs.
 * These are original procedural meshes, not scanned people or GLB assets.
 * Preserve all body transform nodes so player/NPC motions still work.
 */
export const CHARACTER_ART_STATUS='Procedural detailed actors, not photoreal human scans';
const material=(scene,name,color)=>{
 const mat=new BABYLON.PBRMaterial(name,scene);
 mat.albedoColor=new BABYLON.Color3(...color);
 mat.roughness=.8;mat.metallic=0;
 return mat;
};
export function addCharacterDetails(characters,{preset='balanced'}={}){
 if(!characters?.scene)return {enhanced:0};
 if(preset==='low')return {enhanced:0,reason:'low performance preset'};
 const s=characters.scene;
 const seam=material(s,'villageClothingSeams',[.16,.15,.13]);
 const actors=[characters.nada,characters.hassan,characters.maryam].filter(Boolean);
 let count=0;
 for(const a of actors){
   const b=a.bones;
   if(!b?.chest||!b.head||!b.hips)continue;
   // Rounded jacket/robe volume replaces cuboid chest; remain bound to animated bones.
   const chest=s.getMeshByName(a.id+'_chestMesh');
   const pelvis=s.getMeshByName(a.id+'_hipsMesh');
   if(chest)chest.setEnabled(false);
   if(pelvis)pelvis.setEnabled(false);
   const garment=a.id==='nada'?characters.materials.nadaJacket:
       a.id==='hassan'?characters.materials.hassanRobe:characters.materials.maryamRobe;
   const torso=BABYLON.MeshBuilder.CreateSphere(a.id+'_sculptedTorso',{diameter:1,segments:24},s);
   torso.parent=b.chest;torso.position.y=-.08;torso.scaling.set(.23,.24,.16);torso.material=garment;
   if(characters.shadowGenerator)characters.shadowGenerator.addShadowCaster(torso);
   const waist=BABYLON.MeshBuilder.CreateCylinder(a.id+'_tailoredWaist',{
     diameterTop:.35,diameterBottom:a.id==='nada'?.4:.55,height:a.id==='nada'?.28:.7,tessellation:24},s);
   waist.parent=b.hips;waist.position.y=a.id==='nada'?-.08:-.22;waist.material=garment;
   if(characters.shadowGenerator)characters.shadowGenerator.addShadowCaster(waist);
   // Facial silhouette: nose and ears read clearly during close conversations.
   const skin=a.id==='nada'?characters.materials.skinNada:
     a.id==='hassan'?characters.materials.skinHassan:characters.materials.skinMaryam;
   const nose=BABYLON.MeshBuilder.CreateSphere(a.id+'_nose',{diameter:1,segments:12},s);
   nose.parent=b.head;nose.position.set(0,-.025,.13);nose.scaling.set(.027,.046,.035);nose.material=skin;
   for(const sign of [-1,1]){
     const ear=BABYLON.MeshBuilder.CreateSphere(a.id+'_ear_'+sign,{diameter:1,segments:12},s);
     ear.parent=b.head;ear.position.set(sign*.111,-.028,0);ear.scaling.set(.026,.05,.024);ear.material=skin;
     const brow=BABYLON.MeshBuilder.CreateBox(a.id+'_eyebrow_'+sign,
       {width:.063,height:.013,depth:.018},s);
     brow.parent=b.head;brow.position.set(sign*.052,.056,.12);brow.rotation.z=-sign*.12;brow.material=seam;
   }
   // Practical clothing: pocket patch and cuff details.
   if(a.id==='nada'){
     const pocket=BABYLON.MeshBuilder.CreateBox('nadaFieldJacketPocket',
       {width:.095,height:.11,depth:.015},s);
     pocket.parent=b.chest;pocket.position.set(.10,-.08,.158);pocket.material=characters.materials.nadaPants;
   }
   if(a.id==='maryam'){
     const scarfTrim=BABYLON.MeshBuilder.CreateTorus('maryamScarfTrim',
       {diameter:.29,thickness:.016,tessellation:24},s);
     scarfTrim.parent=b.head;scarfTrim.position.y=-.02;scarfTrim.rotation.x=Math.PI/2;
     scarfTrim.material=characters.materials.maryamScarf;
   }
   if(a.id==='hassan'){
     const collar=BABYLON.MeshBuilder.CreateTorus('hassanGalabeyaCollar',
       {diameter:.20,thickness:.018,tessellation:20},s);
     collar.parent=b.neck;collar.rotation.x=Math.PI/2;collar.material=seam;
   }
   count++;
 }
 return {enhanced:count,kind:CHARACTER_ART_STATUS};
}
