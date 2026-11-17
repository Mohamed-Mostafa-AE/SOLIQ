/**
 * Authored procedural surface/detail textures for fictional Nile Delta village.
 * Not photographic field scans and not NASA-derived crop/soil observations.
 * Avoids featureless PBR color blocks and silhouette-less rectangular vegetation.
 */
export const SURFACE_PROVENANCE='original_procedural_illustrative_art';
const clamp=n=>Math.max(0,Math.min(255,Math.round(n)));
export function seededPixelNoise(x,y,seed=214){
  let z=(Math.imul((x|0)^seed,1597334677)+Math.imul((y|0)+seed,3812015801))|0;
  z^=z>>>13;z=Math.imul(z,1274126177);z^=z>>>16;
  return (z>>>0)/4294967295;
}
function createSurface(scene,name,{rgb,scale=1,size=512,seed=12}){
  const tex=new BABYLON.DynamicTexture(name,{width:size,height:size},scene,false);
  const ctx=tex.getContext();
  const im=ctx.createImageData(size,size);
  for(let y=0;y<size;y++){
    for(let x=0;x<size;x++){
      const local=seededPixelNoise(x,y,seed);
      const med=seededPixelNoise(x>>3,y>>3,seed*3);
      const coarse=seededPixelNoise(x>>6,y>>6,seed*11);
      const furrow=.5+.5*Math.sin((y/size)*Math.PI*24+coarse*2.5);
      const grit=(local-.5)*35+(med-.5)*24+(coarse-.5)*18+(furrow-.5)*9;
      const p=(y*size+x)*4;
      im.data[p]=clamp(rgb[0]+grit);
      im.data[p+1]=clamp(rgb[1]+grit*.94);
      im.data[p+2]=clamp(rgb[2]+grit*.80);
      im.data[p+3]=255;
    }
  }
  ctx.putImageData(im,0,0);
  // Small embedded clods and hoofprint-sized grains; game art, not real photos.
  let seedState=seed>>>0;
  function rnd(){seedState=(Math.imul(seedState,1664525)+1013904223)>>>0;return seedState/4294967296;}
  for(let i=0;i<210;i++){
    ctx.fillStyle=i%3?'rgba(23,16,10,.17)':'rgba(224,205,155,.12)';
    const x=rnd()*size,y=rnd()*size;
    const r=.5+rnd()*2.6;
    ctx.beginPath();ctx.ellipse(x,y,r,r*(.25+rnd()*.7),rnd()*Math.PI,0,Math.PI*2);ctx.fill();
  }
  tex.wrapU=BABYLON.Texture.WRAP_ADDRESSMODE;
  tex.wrapV=BABYLON.Texture.WRAP_ADDRESSMODE;
  tex.uScale=scale;tex.vScale=scale;
  tex.update();
  return tex;
}
export function applyDetailedSoil(village,{quality='balanced'}={}){
  if(!village?.scene||!village?.materials)return {textures:0};
  const scene=village.scene,sz=quality==='low'?256:512;
  const coarse=createSurface(scene,'DeltaAlluvialSoil_Original',{rgb:[118,92,65],scale:13,size:sz,seed:93});
  const path=createSurface(scene,'DeltaCanalFootpath_Original',{rgb:[151,124,92],scale:9,size:sz,seed:84});
  const wet=createSurface(scene,'DeltaWetSilt_Original',{rgb:[89,72,53],scale:8,size:sz,seed:19});
  for(const [mat,tex] of [[village.materials.soil,coarse],[village.materials.path,path],[village.materials.wetMud,wet]]){
    mat.albedoTexture=tex;
    mat.albedoColor=new BABYLON.Color3(.98,.98,.97);
    mat.roughness=.92;
  }
  const field=createSurface(scene,'DeltaCropBedLoam_Original',{rgb:[111,83,57],scale:4,size:sz,seed:77});
  const salineCrust=createSalineCrustTexture(scene,sz);
  const puddleMud=createPuddleMudTexture(scene,sz);
  const brickTex=createMudbrickTexture(scene,sz);
  const timberTex=createTimberPlankTexture(scene,sz);
  const zirTex=createTerracottaZirTexture(scene,Math.min(256,sz));

  village.textures = {
    soil: coarse,
    path,
    wetMud: wet,
    fieldLoam: field,
    salineCrust,
    puddleMud,
    brick: brickTex,
    timber: timberTex,
    zir: zirTex,
  };

  if (village.materials.brick) {
    village.materials.brick.albedoTexture = brickTex;
    village.materials.brick.roughness = 0.88;
  }
  if (village.materials.trunk) {
    village.materials.trunk.albedoTexture = timberTex;
    village.materials.trunk.roughness = 0.94;
  }

  for(const f of village.fields||[]){
    f.material.albedoTexture=field;
    f.material.albedoColor=new BABYLON.Color3(.98,.98,.97);
    f.material.roughness=.88;
    f._defaultAlbedoTexture = field;
    f._salineTexture = salineCrust;
    f._puddleTexture = puddleMud;
  }
  return {textures:4,extendedTextures:8,kind:SURFACE_PROVENANCE};
}

export function createSalineCrustTexture(scene, size = 512) {
  const tex = new BABYLON.DynamicTexture('DeltaSalineCrust_Original', { width: size, height: size }, scene, false);
  const ctx = tex.getContext();
  const im = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n1 = seededPixelNoise(x, y, 517);
      const n2 = seededPixelNoise(x >> 2, y >> 2, 733);
      const crust = Math.max(0, (n1 * 0.6 + n2 * 0.4) - 0.42) / 0.58;
      const baseR = 120 + crust * 85;
      const baseG = 96 + crust * 95;
      const baseB = 72 + crust * 105;
      const p = (y * size + x) * 4;
      im.data[p] = clamp(baseR);
      im.data[p + 1] = clamp(baseG);
      im.data[p + 2] = clamp(baseB);
      im.data[p + 3] = 255;
    }
  }
  ctx.putImageData(im, 0, 0);
  tex.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
  tex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
  tex.uScale = 6;
  tex.vScale = 6;
  tex.update();
  return tex;
}

export function createPuddleMudTexture(scene, size = 512) {
  const tex = new BABYLON.DynamicTexture('DeltaPuddleMud_Original', { width: size, height: size }, scene, false);
  const ctx = tex.getContext();
  const im = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n1 = seededPixelNoise(x, y, 821);
      const n2 = seededPixelNoise(x >> 3, y >> 3, 319);
      const puddle = n2 > 0.62 ? 0.35 : 0.0;
      const siltR = 54 + (n1 - 0.5) * 16 - puddle * 20;
      const siltG = 42 + (n1 - 0.5) * 14 - puddle * 14;
      const siltB = 30 + (n1 - 0.5) * 12 - puddle * 8;
      const p = (y * size + x) * 4;
      im.data[p] = clamp(siltR);
      im.data[p + 1] = clamp(siltG);
      im.data[p + 2] = clamp(siltB);
      im.data[p + 3] = 255;
    }
  }
  ctx.putImageData(im, 0, 0);
  tex.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
  tex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
  tex.uScale = 4;
  tex.vScale = 4;
  tex.update();
  return tex;
}

export function createMudbrickTexture(scene, size = 512) {
  const tex = new BABYLON.DynamicTexture('DeltaMudbrick_Original', { width: size, height: size }, scene, false);
  const ctx = tex.getContext();
  ctx.fillStyle = '#b36242';
  ctx.fillRect(0, 0, size, size);
  const brickH = 32, brickW = 64;
  ctx.fillStyle = '#8f4f34';
  ctx.strokeStyle = '#6f3c27';
  ctx.lineWidth = 3;
  for (let y = 0; y < size; y += brickH) {
    const row = Math.floor(y / brickH);
    const offsetX = (row % 2) * (brickW / 2);
    for (let x = -brickW; x < size + brickW; x += brickW) {
      ctx.strokeRect(x + offsetX, y, brickW, brickH);
    }
  }
  tex.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
  tex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
  tex.uScale = 3;
  tex.vScale = 3;
  tex.update();
  return tex;
}

export function createTimberPlankTexture(scene, size = 512) {
  const tex = new BABYLON.DynamicTexture('DeltaTimberPlank_Original', { width: size, height: size }, scene, false);
  const ctx = tex.getContext();
  ctx.fillStyle = '#563e2a';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = '#382618';
  ctx.lineWidth = 2;
  for (let y = 0; y < size; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }
  tex.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
  tex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
  tex.uScale = 2;
  tex.vScale = 2;
  tex.update();
  return tex;
}

export function createTerracottaZirTexture(scene, size = 256) {
  const tex = new BABYLON.DynamicTexture('DeltaZirTerracotta_Original', { width: size, height: size }, scene, false);
  const ctx = tex.getContext();
  ctx.fillStyle = '#a86644';
  ctx.fillRect(0, 0, size, size);
  // Porous stippling
  ctx.fillStyle = 'rgba(74, 38, 20, 0.22)';
  for (let i = 0; i < 400; i++) {
    const rx = Math.random() * size, ry = Math.random() * size;
    ctx.fillRect(rx, ry, 2, 2);
  }
  tex.update();
  return tex;
}
function drawBlade(ctx,x,y,w,h,angle,color){
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);
  ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,0);
  ctx.quadraticCurveTo(-w*.7,-h*.4,-w*.27,-h);
  ctx.quadraticCurveTo(w*.5,-h*.60,0,0);
  ctx.fill();ctx.restore();
}
export function makeCropCutoutTexture(scene,crop,state='healthy'){
  const tex=new BABYLON.DynamicTexture('DeltaBotanicalCutout_'+crop+'_'+state,{width:256,height:384},scene,true);
  const ctx=tex.getContext();ctx.clearRect(0,0,256,384);
  const isWilted = state === 'wilted' || state === 'stressed';
  const tone=isWilted
    ? (crop==='wheat'?'#968735':crop==='rice'?'#6b7832':crop==='corn'?'#636830':crop==='berseem'?'#5c6828':'#525c34')
    : (crop==='wheat'?'#b1a046':crop==='rice'?'#5c8a3c':crop==='corn'?'#467438':crop==='berseem'?'#4b8733':'#417d45');
  const bright=isWilted
    ? (crop==='wheat'?'#bfb060':crop==='rice'?'#949e4e':crop==='corn'?'#8f964a':crop==='berseem'?'#8a9c40':'#7c8f4d')
    : (crop==='wheat'?'#dac475':crop==='rice'?'#87a85b':crop==='corn'?'#76a653':crop==='berseem'?'#73ad52':'#6ba76b');
  const roots=[64,127,191];
  for(let k=0;k<roots.length;k++){
    const x=roots[k],top=crop==='berseem'?190:crop==='corn'?22:68;
    const stemTop = isWilted ? top + 28 : top + 16;
    ctx.lineWidth=crop==='corn'?7:3.6;ctx.strokeStyle=tone;
    ctx.beginPath();ctx.moveTo(x+4,382);ctx.quadraticCurveTo(x-7,210,x+3+(isWilted?(k%2?12:-12):0),stemTop);ctx.stroke();
    for(let j=0;j<5;j++){
      const y=335-j*48;
      const width=crop==='corn'?32:crop==='berseem'?18:21;
      const height=crop==='corn'?110:crop==='berseem'?49:88;
      const wobble=(k+j)%2?1:-1;
      const tilt = isWilted ? wobble * 0.85 : wobble * 0.50;
      drawBlade(ctx,x+3,y,width,height,tilt,j%2?bright:tone);
      drawBlade(ctx,x+3,y,width,height,-tilt*1.1,j%2?tone:bright);
    }
    if(crop==='wheat'||crop==='rice'){
      ctx.fillStyle=bright;
      for(let j=0;j<9;j++){
        const gy=(isWilted?top+24:top)+j*10;
        const gx=x+(j%2?5:-5)+(isWilted?8:0);
        ctx.beginPath();ctx.ellipse(gx,gy,4,7,(j%2?-1:1)*.35+(isWilted?0.4:0),0,Math.PI*2);ctx.fill();
      }
    }else if(crop==='berseem'||crop==='beans'){
      for(let j=0;j<3;j++){
        ctx.fillStyle=j%2?bright:tone;
        ctx.beginPath();ctx.ellipse(x+Math.sin(j*2.1)*11+(isWilted?6:0),(isWilted?top+22:top+6),9,13,.5*j+(isWilted?0.3:0),0,Math.PI*2);ctx.fill();
      }
    }
  }
  tex.hasAlpha=true;
  tex.update();
  return tex;
}
export function applyCropCutoutMaterial(mat,texture){
  mat.albedoTexture=texture;
  mat.albedoColor=new BABYLON.Color3(1,1,1);
  mat.useAlphaFromAlbedoTexture=true;
  mat.transparencyMode=BABYLON.PBRMaterial.PBRMATERIAL_ALPHATEST;
  mat.alphaCutOff=.38;
  mat.backFaceCulling=false;
  mat.metallic=0;
  mat.roughness=.82;
  return mat;
}

/**
 * Modulates field soil PBR appearance based on simulated irrigation delivery and soil salinity.
 * Does not claim to represent physical satellite spectrometry; visual gameplay feedback only.
 */
export function updateFieldSoilAppearance(field, hydrationRatio = 0.5, salinityRatio = 0.0) {
  if (!field?.material) return;
  const h = Math.max(0, Math.min(1, hydrationRatio));
  const s = Math.max(0, Math.min(1, salinityRatio));

  if (h > 0.65) {
    // Wet alluvial mud with puddle reflection
    if (field._puddleTexture) field.material.albedoTexture = field._puddleTexture;
    const wetR = 0.52 * (1 - h) + 0.16 * h;
    const wetG = 0.41 * (1 - h) + 0.12 * h;
    const wetB = 0.30 * (1 - h) + 0.08 * h;
    field.material.albedoColor.set(wetR, wetG, wetB);
    field.material.roughness = 0.88 * (1 - h) + 0.18 * h;
    field.material.metallic = 0.20 * h;
  } else if (h < 0.35 && s > 0.15) {
    // Dry saline crust efflorescence
    if (field._salineTexture) field.material.albedoTexture = field._salineTexture;
    const saltR = 0.52 * (1 - s) + 0.76 * s;
    const saltG = 0.41 * (1 - s) + 0.70 * s;
    const saltB = 0.30 * (1 - s) + 0.62 * s;
    field.material.albedoColor.set(saltR, saltG, saltB);
    field.material.roughness = 0.95;
    field.material.metallic = 0.0;
  } else {
    // Baseline cultivated alluvial loam
    if (field._defaultAlbedoTexture) field.material.albedoTexture = field._defaultAlbedoTexture;
    const midR = 0.52 * (1 - h) + 0.22 * h;
    const midG = 0.41 * (1 - h) + 0.17 * h;
    const midB = 0.30 * (1 - h) + 0.12 * h;
    field.material.albedoColor.set(midR, midG, midB);
    field.material.roughness = 0.88 * (1 - h) + 0.45 * h;
    field.material.metallic = 0.08 * h;
  }
}
