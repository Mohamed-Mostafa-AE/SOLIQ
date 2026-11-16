// Original, self-contained Egyptian Delta diorama for the Soil-IQ welcome page.
// All farm positions, water conditions and vegetation here are illustrative.
// No satellite pixel, forecast or real farmer's field is represented.
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export const DIORAMA_STATES = Object.freeze({
  water: Object.freeze({ water: '#278e9b', soil: '#b79a60', cover: '#688b35', label: 'A shared canal turn · simulated' }),
  soil: Object.freeze({ water: '#397d87', soil: '#86794e', cover: '#91b45a', label: 'Living ground cover · assumed' }),
  evidence: Object.freeze({ water: '#527986', soil: '#a3a397', cover: '#6d8073', label: 'Missing field evidence · illustrative' }),
});

export function resolveDioramaState(value) {
  return Object.hasOwn(DIORAMA_STATES, value) ? DIORAMA_STATES[value] : DIORAMA_STATES.water;
}

// Narrow bent fronds with a central stem; a single lightweight instanced mesh
// draws entire planted fields without a mesh per leaf or external art assets.
function makeCropGeometry(THREE) {
  const positions=[];
  const indices=[];
  for(let side=0;side<6;side++){
    const a=side*Math.PI/3;
    const s=.76+(side%3)*.13;
    const cos=Math.cos(a),sin=Math.sin(a);
    const offset=positions.length/3;
    for(const [rad,height,width] of [[.0,.07,.022],[.105,.23,.075],[.225,.42*s,.054],[.30,.45*s,0]]){
      const x=cos*rad,z=sin*rad;
      const tangentX=-sin*width,tangentZ=cos*width;
      positions.push(x-tangentX,height,z-tangentZ,x+tangentX,height,z+tangentZ);
    }
    for(let segment=0;segment<3;segment++){
      const i=offset+segment*2;
      indices.push(i,i+1,i+2,i+1,i+3,i+2);
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export async function mountDeltaDiorama(host) {
  if (!host) return () => {};
  const canvas = host.querySelector('#delta-diorama-canvas');
  if (!canvas) return () => {};
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const narrowScreen = window.matchMedia('(max-width: 760px)');
  const disposables = [];
  const on = (target, event, handler, options) => {
    target.addEventListener(event, handler, options);
    disposables.push(() => target.removeEventListener(event, handler, options));
  };
  let THREE;
  let renderer;
  let scene;
  let camera;
  let initialized = false;
  let disposed = false;
  let frame = 0;
  let visible = false;
  let lastTime = 0;
  let currentMode = host.dataset.mode || 'water';
  let water;
  let ripples;
  let fieldCover;
  let fieldSoil;
  let scanner;
  let sunGlow;
  let hoverX = 0;
  let hoverY = 0;
  let orbitX = 0;
  const animated = [];
  const mobile = () => narrowScreen.matches;

  const request = () => {
    if (!disposed && initialized && visible && !document.hidden && !frame) {
      frame = requestAnimationFrame(render);
    }
  };
  function render(now = 0) {
    frame = 0;
    if (disposed || !visible || !renderer || !scene || !camera) return;
    const dt = lastTime ? Math.min((now - lastTime) / 1000, .05) : 0;
    lastTime = now;
    if (!reduceMotion.matches) {
      const t = now * .001;
      for (const item of animated) item.rotation.y = Math.sin(t * item.userData.speed + item.userData.phase) * item.userData.amplitude;
      if (ripples) ripples.position.z = (t * .32) % 1.7 - .85;
      if (sunGlow) sunGlow.scale.setScalar(1 + Math.sin(t * .48) * .035);
      if (scanner?.visible) scanner.rotation.z = t * .19;
      hoverX += (orbitX - hoverX) * Math.min(dt * 2, .1);
    }
    camera.position.x = 13.8 + hoverX * .85;
    camera.position.y = mobile() ? 14.2 : 12.7;
    camera.position.z = (mobile() ? 19.7 : 17.3) + hoverY * .75;
    camera.lookAt(0, -.15, 0);
    renderer.render(scene, camera);
    if (!host.dataset.dioramaRendered && renderer.info.render.triangles > 0) {
      host.dataset.dioramaRendered = 'true';
      host.dataset.dioramaDrawCalls = String(renderer.info.render.calls);
      host.dataset.dioramaTriangles = String(renderer.info.render.triangles);
    }
    if (!reduceMotion.matches) request();
  }

  function applyMode() {
    currentMode = host.dataset.mode || 'water';
    const state = resolveDioramaState(currentMode);
    if (!initialized) return;
    water.material.color.set(state.water);
    water.material.emissive.set(currentMode === 'water' ? '#174f5a' : '#112f3c');
    fieldCover.material.color.set(state.cover);
    fieldSoil.material.color.set(state.soil);
    scanner.visible = currentMode === 'evidence';
    host.dataset.dioramaState = state.label;
    request();
  }

  async function build() {
    if (initialized || disposed) return;
    try {
      THREE = await import(THREE_URL);
      if (disposed) return;
      renderer = new THREE.WebGLRenderer({canvas, antialias: !mobile(), alpha: true, powerPreference: 'low-power'});
    } catch {
      host.dataset.dioramaFallback = 'true';
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile() ? 1.15 : 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.22;
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = false;
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xa9bcaa, .014);
    camera = new THREE.PerspectiveCamera(mobile() ? 46 : 38, 1, .1, 100);
    scene.add(new THREE.HemisphereLight(0xffecc4, 0x3a4d3b, 2.55));
    const key = new THREE.DirectionalLight(0xffd09a, 3.4);
    key.position.set(-8, 14, -12);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x85e4d6, 1.2);
    rim.position.set(9, 4, 6);
    scene.add(rim);

    const mat = (color, roughness = .89, metalness = 0) => new THREE.MeshStandardMaterial({color, roughness, metalness});
    const sand = mat('#a78e63');
    fieldSoil = new THREE.Mesh(new THREE.BoxGeometry(21, .5, 15.7), sand);
    fieldSoil.position.y = -.35;
    fieldSoil.rotation.y = -.045;
    scene.add(fieldSoil);
    const embankmentMat = mat('#d5b786');
    const wetBank = mat('#5e7753');
    const waterMaterial = new THREE.MeshPhysicalMaterial({color:'#278e9b', metalness:.14, roughness:.25, transparent:true, opacity:.9, emissive:'#174f5a', emissiveIntensity:.28, clearcoat:.75, clearcoatRoughness:.16});
    water = new THREE.Mesh(new THREE.BoxGeometry(3.28,.15,16.9),waterMaterial);
    // Recess the canal below the surrounding planted beds, never flood them.
    water.position.set(0,-.065,0);
    scene.add(water);
    for (const side of [-1,1]) {
      const sideBank = new THREE.Mesh(new THREE.BoxGeometry(.62,.32,16.3),embankmentMat);
      sideBank.position.set(side*2.03,.01,0);
      scene.add(sideBank);
      const wetEdge = new THREE.Mesh(new THREE.BoxGeometry(.22,.09,16.3),wetBank);
      wetEdge.position.set(side*1.73,.17,0);
      scene.add(wetEdge);
    }
    const rippleGeo = new THREE.BoxGeometry(2.7,.017,.038);
    const rippleMat = new THREE.MeshBasicMaterial({color:0xc3f6de, transparent:true, opacity:.37, depthWrite:false});
    ripples = new THREE.Group();
    for (let n=0;n<17;n++) {
      const line = new THREE.Mesh(rippleGeo,rippleMat);
      line.position.set(Math.sin(n*2.3)*.25,.018,(n-8)*1.2);
      line.scale.x = .2 + (n%4)*.19;
      ripples.add(line);
    }
    scene.add(ripples);

    // Six parcels: three on either bank. The six households and greenery are
    // original symbolic composition, not cadastral boundaries or observations.
    const plotBorder = mat('#d7bf88');
    const parcelSoil = mat('#6d603f');
    fieldCover = new THREE.Mesh(new THREE.BoxGeometry(1,.1,1),new THREE.MeshStandardMaterial({color:'#688b35',roughness:.86,side:THREE.DoubleSide}));
    const cropMaterial = fieldCover.material;
    fieldCover.visible = false; // material handle for all instanced crop leaves
    scene.add(fieldCover);
    const cropGeom = makeCropGeometry(THREE);
    const cropCountPerPlot = mobile() ? 75 : 135;
    const total = cropCountPerPlot * 6;
    const leaves = new THREE.InstancedMesh(cropGeom,cropMaterial,total);
    const dummy = new THREE.Object3D();
    let cropIndex = 0;
    for (const side of [-1,1]) {
      for (let plot=0;plot<3;plot++) {
        const px=side*5.72;
        const pz=-4.65+plot*4.58;
        const bed=new THREE.Mesh(new THREE.BoxGeometry(5.5,.15,3.63),parcelSoil);
        bed.position.set(px,-.028,pz);
        scene.add(bed);
        const border=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(5.63,.18,3.74)),new THREE.LineBasicMaterial({color:'#dec99a',transparent:true,opacity:.65}));
        border.position.copy(bed.position);
        scene.add(border);
        const rows=mobile()?5:7;
        const cols=Math.floor(cropCountPerPlot/rows);
        for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) {
          dummy.position.set(px-2.43+r*(4.86/(rows-1)),.19,pz-1.52+c*(3.05/(cols-1)));
          dummy.rotation.set(0,(r+c)*.47,0);
          dummy.scale.setScalar(.75+.32*((r*7+c*11)%5)/4);
          dummy.updateMatrix();
          leaves.setMatrixAt(cropIndex++,dummy.matrix);
        }
        const canalTurn = new THREE.Mesh(new THREE.BoxGeometry(.95,.12,.22),mat('#bbb28a'));
        canalTurn.position.set(side*2.48,.18,pz);
        scene.add(canalTurn);
      }
    }
    leaves.count=cropIndex;
    leaves.instanceMatrix.needsUpdate=true;
    leaves.frustumCulled=false;
    scene.add(leaves);

    // The arched canal bridge and manual gate are recognizable Delta anchors.
    const limestone=mat('#d3b894');
    const stoneDark=mat('#857158');
    const railMat=mat('#74664d',.62,.18);
    const bridge=new THREE.Mesh(new THREE.BoxGeometry(6.2,.28,1.35),limestone);
    bridge.position.set(0,.84,3.17);
    scene.add(bridge);
    for(const side of [-1,1]){
      const abutment=new THREE.Mesh(new THREE.BoxGeometry(.86,.85,1.8),stoneDark);
      abutment.position.set(side*2.7,.38,3.17);scene.add(abutment);
      const rail=new THREE.Mesh(new THREE.BoxGeometry(6.15,.13,.09),railMat);
      rail.position.set(0,1.2,3.17+side*.56);scene.add(rail);
      for(let p=-2.8;p<=2.81;p+=.7){
        const post=new THREE.Mesh(new THREE.CylinderGeometry(.045,.052,.5,6),railMat);
        post.position.set(p,1,3.17+side*.56);scene.add(post);
      }
    }
    for(const side of [-1,1]){
      const pylon=new THREE.Mesh(new THREE.BoxGeometry(.39,2.18,.45),limestone);
      pylon.position.set(side*1.82,1.03,-2.55);scene.add(pylon);
    }
    const gateTop=new THREE.Mesh(new THREE.BoxGeometry(4.14,.3,.55),limestone);
    gateTop.position.set(0,2.08,-2.55);scene.add(gateTop);
    const gateMesh=new THREE.Mesh(new THREE.BoxGeometry(3.18,.88,.15),mat('#43605a',.58,.38));
    gateMesh.position.set(0,.49,-2.55);scene.add(gateMesh);
    for(let x=-1.38;x<1.5;x+=.35){
      const bar=new THREE.Mesh(new THREE.BoxGeometry(.055,.86,.19),railMat);
      bar.position.set(x,.49,-2.44);scene.add(bar);
    }
    const gateWheel=new THREE.Mesh(new THREE.TorusGeometry(.32,.035,8,28),railMat);
    gateWheel.position.set(0,2.45,-2.55);scene.add(gateWheel);

    // Flat-roof mudbrick homes, small doors and shaded terrace parapets.
    const brick=mat('#cda77d');
    const brickShade=mat('#9c7358');
    const door=mat('#334d46');
    const roof=mat('#e8cba2');
    for(let i=0;i<7;i++){
      const side=i%2?-1:1;
      const x=side*(8.7+(i%3)*.27);
      const z=-6.6+i*1.83;
      const w=1.45+(i%2)*.48;
      const h=1.27+(i%3)*.3;
      const house=new THREE.Mesh(new THREE.BoxGeometry(w,h,1.3),i%3===0?brickShade:brick);
      house.position.set(x,h/2,z);scene.add(house);
      const cap=new THREE.Mesh(new THREE.BoxGeometry(w+.24,.16,1.52),roof);
      cap.position.set(x,h+.05,z);scene.add(cap);
      const opening=new THREE.Mesh(new THREE.PlaneGeometry(.34,.73),door);
      opening.position.set(x-side*(w/2+.014),.39,z-.16);
      opening.rotation.y=side*Math.PI/2;
      scene.add(opening);
      const windowFrame=new THREE.Mesh(new THREE.BoxGeometry(.24,.31,.015),door);
      windowFrame.position.set(x,.72,z+.663);scene.add(windowFrame);
    }

    // Recognizable silhouettes: multi-trunk palms with alternating fronds.
    const palmWood=mat('#705840');
    const palmGreen=mat('#2d6747',.87);
    const palmLight=mat('#68945a',.87);
    function palm(x,z,s=1){
      const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.09*s,.17*s,2.8*s,8),palmWood);
      trunk.position.set(x,1.36*s,z);
      trunk.rotation.z=.05*(x>0?-1:1);
      scene.add(trunk);
      for(let n=0;n<9;n++){
        const group=new THREE.Group();
        group.position.set(x,2.71*s,z);
        group.rotation.y=(n/9)*Math.PI*2;
        const leaf=new THREE.Mesh(new THREE.ConeGeometry(.18*s,1.8*s,5),n%2?palmGreen:palmLight);
        leaf.rotation.z=Math.PI/2 + .34;
        leaf.position.set(.8*s,-.22*s,0);
        group.add(leaf);
        group.userData={speed:.46+(n%3)*.09,phase:n*.9,amplitude:.018};
        animated.push(group);
        scene.add(group);
      }
      const crown=new THREE.Mesh(new THREE.SphereGeometry(.21*s,9,7),palmWood);
      crown.position.set(x,2.74*s,z);scene.add(crown);
    }
    palm(-7.9,-4.95,1.18);
    palm(7.95,-1.45,.98);
    palm(-8.35,5.35,.87);
    palm(8.24,5.6,1.06);

    // Evidence mode's rings are conceptual prompts, never measurements.
    scanner=new THREE.Group();
    const scanMaterial=new THREE.MeshBasicMaterial({color:0xa7e1cd,transparent:true,opacity:.57,depthWrite:false});
    for(let j=0;j<4;j++){
      const ring=new THREE.Mesh(new THREE.TorusGeometry(1.3+j*.56,.016,6,90),scanMaterial);
      ring.rotation.x=-Math.PI/2;
      ring.position.set(-4.7,.28,-.8);
      scanner.add(ring);
    }
    scanner.visible=false;
    scene.add(scanner);
    const glowMaterial=new THREE.MeshBasicMaterial({color:0xffd4a1, transparent:true,opacity:.13,depthWrite:false});
    sunGlow=new THREE.Mesh(new THREE.SphereGeometry(1.7,16,12),glowMaterial);
    sunGlow.position.set(-8.5,8,-14);
    scene.add(sunGlow);

    function resize() {
      if (!renderer || !camera) return;
      const rect=host.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1,mobile()?1.15:1.5));
      renderer.setSize(rect.width,rect.height,false);
      camera.aspect=rect.width/rect.height;
      camera.fov=mobile()?47:38;
      camera.updateProjectionMatrix();
      request();
    }
    initialized=true;
    resize();
    applyMode();
    host.dataset.dioramaReady='true';
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    disposables.push(() => observer.disconnect());
    on(host,'pointermove',e=>{
      if(reduceMotion.matches) return;
      const rect=host.getBoundingClientRect();
      orbitX=((e.clientX-rect.left)/rect.width-.5)*1.4;
      hoverY=((e.clientY-rect.top)/rect.height-.5)*.7;
    },{passive:true});
    on(host,'pointerleave',()=>{orbitX=0;hoverY=0;},{passive:true});
    on(window,'resize',resize,{passive:true});
    on(document,'visibilitychange',request);
    on(reduceMotion,'change',()=>{if(reduceMotion.matches&&frame)cancelAnimationFrame(frame);frame=0;request();});
    request();
  }

  // Lazy scene setup: the main evidence-first interface still renders without 3D.
  const watch = new MutationObserver(applyMode);
  watch.observe(host,{attributes:true,attributeFilter:['data-mode']});
  disposables.push(()=>watch.disconnect());
  const intersection=new IntersectionObserver(entries=>{
    visible=entries[0]?.isIntersecting??false;
    if(visible){void build().then(request);} else if(frame){cancelAnimationFrame(frame);frame=0;}
  },{rootMargin:'200px 0px 200px 0px'});
  intersection.observe(host);
  disposables.push(()=>intersection.disconnect());
  return ()=>{
    disposed=true;
    if(frame)cancelAnimationFrame(frame);
    for(const end of disposables)end();
    if(scene){
      scene.traverse(child=>{
        child.geometry?.dispose?.();
        const materials=Array.isArray(child.material)?child.material:[child.material];
        for(const material of materials)material?.dispose?.();
      });
    }
    renderer?.dispose();
  };
}
