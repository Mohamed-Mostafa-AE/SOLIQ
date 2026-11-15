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
  for(const f of village.fields||[]){
    f.material.albedoTexture=field;
    f.material.albedoColor=new BABYLON.Color3(.98,.98,.97);
    f.material.roughness=.88;
  }
  return {textures:4,kind:SURFACE_PROVENANCE};
}
function drawBlade(ctx,x,y,w,h,angle,color){
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);
  ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,0);
  ctx.quadraticCurveTo(-w*.7,-h*.4,-w*.27,-h);
  ctx.quadraticCurveTo(w*.5,-h*.60,0,0);
  ctx.fill();ctx.restore();
}
export function makeCropCutoutTexture(scene,crop){
  const tex=new BABYLON.DynamicTexture('DeltaBotanicalCutout_'+crop,{width:256,height:384},scene,true);
  const ctx=tex.getContext();ctx.clearRect(0,0,256,384);
  const tone=crop==='wheat'?'#b1a046':crop==='rice'?'#5c8a3c':crop==='corn'?'#467438':crop==='berseem'?'#4b8733':'#417d45';
  const bright=crop==='wheat'?'#dac475':crop==='rice'?'#87a85b':crop==='corn'?'#76a653':crop==='berseem'?'#73ad52':'#6ba76b';
  const roots=[64,127,191];
  for(let k=0;k<roots.length;k++){
    const x=roots[k],top=crop==='berseem'?190:crop==='corn'?22:68;
    ctx.lineWidth=crop==='corn'?7:3.6;ctx.strokeStyle=tone;
    ctx.beginPath();ctx.moveTo(x+4,382);ctx.quadraticCurveTo(x-7,210,x+3,top+16);ctx.stroke();
    for(let j=0;j<5;j++){
      const y=335-j*48;
      const width=crop==='corn'?32:crop==='berseem'?18:21;
      const height=crop==='corn'?110:crop==='berseem'?49:88;
      const wobble=(k+j)%2?1:-1;
      drawBlade(ctx,x+3,y,width,height,wobble*.50,j%2?bright:tone);
      drawBlade(ctx,x+3,y,width,height,-wobble*.55,j%2?tone:bright);
    }
    if(crop==='wheat'||crop==='rice'){
      ctx.fillStyle=bright;
      for(let j=0;j<9;j++){const gy=top+j*10;ctx.beginPath();ctx.ellipse(x+(j%2?5:-5),gy,4,7,(j%2?-1:1)*.35,0,Math.PI*2);ctx.fill();}
    }else if(crop==='berseem'||crop==='beans'){
      for(let j=0;j<3;j++){
        ctx.fillStyle=j%2?bright:tone;
        ctx.beginPath();ctx.ellipse(x+Math.sin(j*2.1)*11,top+6,9,13,.5*j,0,Math.PI*2);ctx.fill();
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
