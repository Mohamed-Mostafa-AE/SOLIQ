/**
 * Chapter 5's fiction becomes visible in the Babylon village. These are
 * ceremonial story markers, NOT simulated water volumes or sensor-derived
 * crop states. The scientific decision engine remains completely untouched.
 */
export const COUNCIL_MARKER_IDS = Object.freeze(['share_turn', 'protect_cover', 'ask_for_records']);

export function deriveCouncilWorldMarkers(view) {
  const choices = view == null ? [] : view.choices;
  if (view != null && (!['turns','result'].includes(view.phase) ||
    !Array.isArray(choices) || choices.length > 3 ||
    !choices.every(id=>COUNCIL_MARKER_IDS.includes(id)) ||
    (view.phase==='result' && choices.length!==3))) {
    throw new TypeError('Invalid Chapter 5 fictional choice history');
  }
  return Object.freeze(COUNCIL_MARKER_IDS.map(id=>{
    const count = choices.filter(choice=>choice===id).length;
    return Object.freeze({id,count,visible:count>0,intensity:count?0.74+count*0.17:0,
      evidenceClass:'SIMULATED',isFieldMeasurement:false,observedWaterVolume:null});
  }));
}

const MARKER_SCENE_POSITIONS = Object.freeze([
  [-6.8, 0, 8], [-3.1, 0, 8], [0.6, 0, 8],
]);

/** Minimal original meshes; no GLB download, camera motion or network calls. */
export class CouncilWorldReactions {
  constructor(scene,{reducedMotion=false}={}) {
    if (!scene) throw new TypeError('Council story markers require a Babylon scene');
    this.scene=scene;
    this.reducedMotion=Boolean(reducedMotion);
    this.elapsed=0;
    this.materials=[];
    this.markers={};
    const palette=[
      [0.17,0.73,0.80],  // the tail-reach voice, not measured water
      [0.42,0.74,0.30],  // soil-cover work, not measured crop health
      [0.96,0.68,0.29],  // missing records logged, not acquired
    ];
    COUNCIL_MARKER_IDS.forEach((id,index)=>{
      const root=new BABYLON.TransformNode(`chapter5WorldStory_${id}`,scene);
      root.position.set(...MARKER_SCENE_POSITIONS[index]);
      const color=new BABYLON.Color3(...palette[index]);
      const mat=new BABYLON.StandardMaterial(`chapter5StoryMaterial_${id}`,scene);
      mat.diffuseColor=color;
      mat.emissiveColor=color.scale(0.38);
      this.materials.push(mat);

      const plinth=BABYLON.MeshBuilder.CreateCylinder(`chapter5StoryPlinth_${id}`,
        {height:0.22,diameter:0.88,tessellation:12},scene);
      plinth.parent=root;plinth.position.y=0.26;plinth.material=mat;
      const mast=BABYLON.MeshBuilder.CreateCylinder(`chapter5StoryPole_${id}`,
        {height:1.6,diameter:0.075,tessellation:7},scene);
      mast.parent=root;mast.position.y=1.13;mast.material=mat;
      const beacon=BABYLON.MeshBuilder.CreateSphere(`chapter5StoryBeacon_${id}`,
        {diameter:0.46,segments:10},scene);
      beacon.parent=root;beacon.position.y=2.06;beacon.material=mat;
      const halo=BABYLON.MeshBuilder.CreateTorus(`chapter5StoryHalo_${id}`,
        {diameter:0.75,thickness:0.055,tessellation:18},scene);
      halo.parent=root;halo.position.y=2.06;halo.material=mat;
      this.markers[id]={root,beacon,halo,count:0};
      root.setEnabled(false);
    });
    this.apply(null);
  }

  apply(view) {
    const frame=deriveCouncilWorldMarkers(view);
    for(const item of frame){
      const marker=this.markers[item.id];
      marker.count=item.count;
      marker.root.setEnabled(item.visible);
      if(item.visible){
        marker.beacon.scaling.set(item.intensity,item.intensity,item.intensity);
        marker.halo.scaling.set(item.intensity,item.intensity,item.intensity);
      }
    }
    this.frame=frame;
    return frame;
  }

  tick(seconds) {
    if (this.reducedMotion || !Number.isFinite(seconds) || seconds<=0) return;
    this.elapsed+=Math.min(seconds,0.08);
    for(const id of COUNCIL_MARKER_IDS){
      const marker=this.markers[id];
      if(marker.count>0){
        marker.halo.rotation.y=this.elapsed*0.45;
        marker.beacon.position.y=2.06+0.04*Math.sin(this.elapsed*1.8);
      }
    }
  }

  dispose() {
    for(const id of COUNCIL_MARKER_IDS)this.markers[id].root.dispose(false,true);
    this.materials.forEach(material=>material.dispose());
  }
}
