const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
const NASA_EARTH_TEXTURE = 'https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73967/world.200402.3x5400x2700.jpg';
const THREE_EARTH_FALLBACK = 'https://raw.githubusercontent.com/mrdoob/three.js/r160/examples/textures/planets/earth_atmos_2048.jpg';

function makeCloudTexture(THREE, mobile) {
  const canvas = document.createElement('canvas');
  canvas.width = mobile ? 1024 : 2048;
  canvas.height = canvas.width / 2;
  const context = canvas.getContext('2d');
  if (!context) return null;

  const width = canvas.width;
  const height = canvas.height;
  const image = context.createImageData(width, height);
  const fract = value => value - Math.floor(value);
  const smooth = value => value * value * (3 - 2 * value);

  const hash = (x, y) => {
    const value = Math.sin(x * 127.1 + y * 311.7 + 19.19) * 43758.5453123;
    return fract(value);
  };

  const noise = (u, v, columns, rows) => {
    const x = u * columns;
    const y = v * rows;
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = (x0 + 1) % columns;
    const y1 = Math.min(y0 + 1, rows);
    const sx = smooth(x - x0);
    const sy = smooth(y - y0);
    const a = hash(x0, y0) * (1 - sx) + hash(x1, y0) * sx;
    const b = hash(x0, y1) * (1 - sx) + hash(x1, y1) * sx;
    return a * (1 - sy) + b * sy;
  };

  const smoothstep = (edgeA, edgeB, value) => {
    const t = Math.max(0, Math.min(1, (value - edgeA) / (edgeB - edgeA)));
    return t * t * (3 - 2 * t);
  };

  for (let y = 0; y < height; y += 1) {
    const v = y / (height - 1);
    for (let x = 0; x < width; x += 1) {
      const u = x / width;
      const broad = noise(u, v, 7, 4);
      const medium = noise(u, v, 15, 8);
      const fine = noise(u, v, 31, 16);
      const detail = noise(u, v, 63, 32);
      const field = broad * .48 + medium * .28 + fine * .16 + detail * .08;
      const coverage = smoothstep(.465, .615, field);
      const alpha = Math.round(coverage * 168);
      const offset = (y * width + x) * 4;
      image.data[offset] = 244;
      image.data[offset + 1] = 249;
      image.data[offset + 2] = 250;
      image.data[offset + 3] = alpha;
    }
  }

  context.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = Math.min(4, 8);
  return texture;
}

function makeStars(THREE, count, extent, seedStart) {
  let seed = seedStart;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = (random() * 2 - 1) * extent;
    positions[index * 3 + 1] = (random() * 2 - 1) * extent * .72;
    positions[index * 3 + 2] = -1.6 - random() * 4;
    const tone = random();
    const color = tone < .22 ? new THREE.Color(0x9ac7db) : tone < .42 ? new THREE.Color(0xe6bd9c) : new THREE.Color(0xe6e9f5);
    const intensity = .3 + random() * .65;
    colors[index * 3] = color.r * intensity;
    colors[index * 3 + 1] = color.g * intensity;
    colors[index * 3 + 2] = color.b * intensity;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    size: .018, sizeAttenuation: true, vertexColors: true,
    transparent: true, opacity: .6, depthWrite: false, blending: THREE.AdditiveBlending
  });
  const stars = new THREE.Points(geometry, material);
  stars.frustumCulled = false;
  return stars;
}

function makeSatellite(THREE) {
  const satellite = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({ color: 0xd9b37a, metalness: .72, roughness: .38 });
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(.14, .14, .17),
    new THREE.MeshStandardMaterial({ color: 0xc7c7bd, metalness: .66, roughness: .42 })
  );
  satellite.add(body);

  const panelMaterial = new THREE.MeshStandardMaterial({
    color: 0x173e63, metalness: .44, roughness: .35,
    emissive: 0x071b35, emissiveIntensity: .3
  });
  const panelFrame = new THREE.MeshStandardMaterial({ color: 0xb4a78a, metalness: .68, roughness: .4 });
  for (const side of [-1, 1]) {
    const wing = new THREE.Group();
    wing.position.x = side * .27;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(.39, .018, .22), panelFrame);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(.365, .012, .195), panelMaterial);
    panel.position.y = .012;
    wing.add(frame, panel);
    for (let i = 1; i < 5; i += 1) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(.006, .006, .19), gold);
      line.position.set(-.18 + i * .073, .02, 0);
      wing.add(line);
    }
    satellite.add(wing);
  }

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(.009, .009, .23, 8), gold);
  mast.position.set(0, .16, 0);
  satellite.add(mast);
  const dish = new THREE.Mesh(
    new THREE.SphereGeometry(.075, 20, 12, 0, Math.PI * 2, 0, Math.PI * .5),
    new THREE.MeshStandardMaterial({ color: 0xd7d2c7, metalness: .42, roughness: .36, side: THREE.DoubleSide })
  );
  dish.position.set(0, .27, 0);
  dish.rotation.x = Math.PI;
  satellite.add(dish);

  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(.025, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0xbbe9d0 })
  );
  beacon.position.set(0, -.08, .09);
  satellite.add(beacon);
  return satellite;
}

function makeOrbit(THREE, radiusX, radiusY, color = 0x8db9b5, opacity = .42) {
  const points = [];
  for (let i = 0; i < 320; i += 1) {
    const angle = (i / 320) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * radiusX, Math.sin(angle) * radiusY, 0));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
  return new THREE.LineLoop(geometry, material);
}

export async function mountEarthScene({ canvas, rail, story, status }) {
  if (!canvas || !rail || !story) return () => {};
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = window.matchMedia('(max-width: 760px)').matches;
  let THREE;
  try {
    THREE = await import(THREE_URL);
  } catch {
    if (status) status.textContent = '3D library unavailable · showing the Earth fallback';
    return () => {};
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas, alpha: true, antialias: !mobile,
      powerPreference: 'high-performance', premultipliedAlpha: true
    });
  } catch {
    if (status) status.textContent = 'WebGL unavailable · showing the Earth fallback';
    return () => {};
  }

  let cleanedUp = false;
  let visible = true;
  let frameId = 0;
  let lastFrame = 0;
  let width = 0;
  let height = 0;
  let elapsed = 0;
  let easedScrollProgress = 0;
  let currentDragX = 0;
  let currentDragY = 0;
  let targetDragX = 0;
  let targetDragY = 0;
  let dragPointer = null;
  let lastPointerX = 0;
  let lastPointerY = 0;
  const disposable = [];

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.15 : 1.55));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = false;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(37, 1, .05, 100);
  camera.position.set(.08, .04, 4.8);
  camera.lookAt(0, 0, 0);

  const hemisphere = new THREE.HemisphereLight(0xc9e3ec, 0x07120f, .48);
  scene.add(hemisphere);
  const sun = new THREE.DirectionalLight(0xffe4c3, 2.2);
  sun.position.set(-3.1, 2.3, 5.2);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x5b94b0, .16);
  fill.position.set(3, -.8, -3);
  scene.add(fill);

  const stars = makeStars(THREE, mobile ? 300 : 660, 7.2, 721);
  scene.add(stars);

  const system = new THREE.Group();
  scene.add(system);
  const earthTilt = new THREE.Group();
  earthTilt.rotation.z = THREE.MathUtils.degToRad(-23.4);
  system.add(earthTilt);

  const textureLoader = new THREE.TextureLoader();
  textureLoader.setCrossOrigin('anonymous');
  const sphereGeometry = new THREE.SphereGeometry(1, mobile ? 112 : 176, mobile ? 72 : 112);
  const fallbackMaterial = new THREE.MeshStandardMaterial({
    color: 0x1b6579, roughness: .92, metalness: 0
  });
  const earth = new THREE.Mesh(sphereGeometry, fallbackMaterial);
  earthTilt.add(earth);
  const surfaceMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .94, metalness: 0 });
  let surfaceReady = false;
  let earthTexture = null;

  const useSurface = (texture, source) => {
    if (cleanedUp) { texture.dispose(); return; }
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), mobile ? 4 : 12);
    surfaceMaterial.map = texture;
    surfaceMaterial.color.set(source === 'NASA Blue Marble' ? 0xffffff : 0xb9ceda);
    surfaceMaterial.needsUpdate = true;
    earth.material = surfaceMaterial;
    earthTexture = texture;
    disposable.push(texture);
    surfaceReady = true;
    if (status) status.textContent = source + ' surface · illustrative satellite orbit · drag to rotate';
  };

  textureLoader.load(
    NASA_EARTH_TEXTURE,
    texture => useSurface(texture, 'NASA Blue Marble'),
    undefined,
    () => {
      if (cleanedUp || surfaceReady) return;
      textureLoader.load(
        THREE_EARTH_FALLBACK,
        texture => useSurface(texture, 'Earth surface atlas'),
        undefined,
        () => {
          if (!cleanedUp && status) status.textContent = 'Earth texture unavailable · procedural globe active';
        }
      );
    }
  );

  // A softly animated, procedural cloud mask adds depth without pretending to be live weather.
  const cloudGroup = new THREE.Group();
  earthTilt.add(cloudGroup);
  const cloudTexture = makeCloudTexture(THREE, mobile);
  if (cloudTexture) disposable.push(cloudTexture);
  const cloudGeometry = new THREE.SphereGeometry(1.012, mobile ? 88 : 128, mobile ? 56 : 88);
  const cloudMaterial = new THREE.MeshBasicMaterial({
    color: 0xf3f7f6,
    map: cloudTexture || null,
    transparent: true,
    opacity: cloudTexture ? .72 : .1,
    depthWrite: false,
    side: THREE.FrontSide
  });
  const cloudShell = new THREE.Mesh(cloudGeometry, cloudMaterial);
  cloudShell.renderOrder = 2;
  cloudGroup.add(cloudShell);

  const atmosphereMaterial = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(vViewPosition);
        float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);
        float alpha = rim * 0.28;
        vec3 atmosphere = vec3(0.25, 0.68, 0.76);
        gl_FragColor = vec4(atmosphere, alpha);
      }
    `
  });
  const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.035, 96, 64), atmosphereMaterial);
  atmosphere.renderOrder = 3;
  earthTilt.add(atmosphere);

  const orbitGroup = new THREE.Group();
  orbitGroup.rotation.set(.76, .12, -.28);
  system.add(orbitGroup);
  const orbitX = 1.55;
  const orbitY = 1.18;
  orbitGroup.add(makeOrbit(THREE, orbitX, orbitY));

  const satellite = makeSatellite(THREE);
  orbitGroup.add(satellite);

  const scanOrbit = new THREE.Mesh(
    new THREE.TorusGeometry(1.085, .004, 6, 180),
    new THREE.MeshBasicMaterial({ color: 0x88c6c1, transparent: true, opacity: .26 })
  );
  scanOrbit.rotation.x = Math.PI / 2.2;
  earthTilt.add(scanOrbit);

  const resize = () => {
    const bounds = rail.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.floor(bounds.width));
    const nextHeight = Math.max(1, Math.floor(bounds.height));
    if (nextWidth === width && nextHeight === height) return;
    width = nextWidth;
    height = nextHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (reducedMotion) renderer.render(scene, camera);
  };

  const updateScrollProgress = () => {
    const bounds = story.getBoundingClientRect();
    const scrollableDistance = Math.max(story.offsetHeight - window.innerHeight, 1);
    const progress = THREE.MathUtils.clamp(-bounds.top / scrollableDistance, 0, 1);
    rail.style.setProperty('--earth-scroll-progress', progress.toFixed(4));
  };

  const pointerDown = event => {
    if (reducedMotion) return;
    dragPointer = event.pointerId;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    canvas.setPointerCapture?.(event.pointerId);
  };
  const pointerMove = event => {
    if (dragPointer !== event.pointerId) return;
    const dx = (event.clientX - lastPointerX) / Math.max(width, 1);
    const dy = (event.clientY - lastPointerY) / Math.max(height, 1);
    targetDragY += dx * 4.4;
    targetDragX = THREE.MathUtils.clamp(targetDragX + dy * 3.2, -.8, .8);
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
  };
  const pointerUp = event => {
    if (dragPointer !== event.pointerId) return;
    dragPointer = null;
    canvas.releasePointerCapture?.(event.pointerId);
  };
  canvas.addEventListener('pointerdown', pointerDown);
  canvas.addEventListener('pointermove', pointerMove);
  canvas.addEventListener('pointerup', pointerUp);
  canvas.addEventListener('pointercancel', pointerUp);

  const render = now => {
    frameId = 0;
    if (cleanedUp || !visible || document.hidden) return;
    if (!reducedMotion && now - lastFrame < (mobile ? 30 : 16)) {
      frameId = requestAnimationFrame(render);
      return;
    }
    const delta = lastFrame ? Math.min(Math.max((now - lastFrame) / 1000, 0), .05) : 1 / 60;
    lastFrame = now;

    const targetProgress = reducedMotion ? 0 : THREE.MathUtils.clamp(
      Number.parseFloat(rail.style.getPropertyValue('--earth-scroll-progress') || '0') || 0, 0, 1
    );
    easedScrollProgress += (targetProgress - easedScrollProgress) * (1 - Math.exp(-7.5 * delta));
    if (!reducedMotion) elapsed += delta;
    const time = reducedMotion ? 0 : elapsed;

    currentDragX += (targetDragX - currentDragX) * (1 - Math.exp(-8 * delta));
    currentDragY += (targetDragY - currentDragY) * (1 - Math.exp(-8 * delta));

    system.position.set(.08, Math.sin(time * .55) * .025, 0);
    system.rotation.y = currentDragY + time * .025 + easedScrollProgress * .7;
    system.rotation.x = currentDragX;
    earthTilt.rotation.y = time * .075 + easedScrollProgress * THREE.MathUtils.degToRad(16);
    earthTilt.rotation.x = .08 + easedScrollProgress * THREE.MathUtils.degToRad(7);
    earthTilt.rotation.z = -easedScrollProgress * THREE.MathUtils.degToRad(6);
    cloudGroup.rotation.y = -time * .012 + easedScrollProgress * .055;
    scanOrbit.rotation.z = time * .045;
    orbitGroup.rotation.y = .12 + Math.sin(time * .16) * .05;
    const angle = (reducedMotion ? .85 : time * .42 + .85) + easedScrollProgress * .95;
    satellite.position.set(Math.cos(angle) * orbitX, Math.sin(angle) * orbitY, Math.sin(angle * 1.1) * .12);
    satellite.rotation.z = angle + Math.PI / 2;
    satellite.rotation.y = -.2 + Math.sin(time * .7) * .04;

    // The camera backs away and the globe twists as the reader progresses through
    // the story, echoing the Mars Society site's persistent planetary scroll scene.
    camera.position.set(.08, .04, 4.75 + easedScrollProgress * 1.75);
    camera.lookAt(system.position.x, system.position.y, 0);

    try {
      renderer.render(scene, camera);
    } catch {
      if (status) status.textContent = '3D rendering stopped · use the text sections below';
      if (frameId) cancelAnimationFrame(frameId);
      return;
    }
    if (!reducedMotion) frameId = requestAnimationFrame(render);
  };

  const visibilityChange = () => {
    if (document.hidden) {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
    } else if (visible && !reducedMotion && !frameId) {
      lastFrame = 0;
      frameId = requestAnimationFrame(render);
    } else if (visible && reducedMotion) {
      renderer.render(scene, camera);
    }
  };
  document.addEventListener('visibilitychange', visibilityChange);

  const intersectionObserver = new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting);
    if (visible && !document.hidden && !reducedMotion && !frameId) {
      lastFrame = 0;
      frameId = requestAnimationFrame(render);
    }
    if (!visible && frameId) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    }
  }, { rootMargin: '140px' });
  intersectionObserver.observe(canvas);

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(rail);
  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  window.addEventListener('resize', updateScrollProgress, { passive: true });

  resize();
  updateScrollProgress();
  if (status && !surfaceReady) status.textContent = 'Loading NASA Blue Marble surface and cloud layer…';
  if (!reducedMotion) frameId = requestAnimationFrame(render);
  else renderer.render(scene, camera);

  return () => {
    cleanedUp = true;
    if (frameId) cancelAnimationFrame(frameId);
    document.removeEventListener('visibilitychange', visibilityChange);
    window.removeEventListener('scroll', updateScrollProgress);
    window.removeEventListener('resize', updateScrollProgress);
    canvas.removeEventListener('pointerdown', pointerDown);
    canvas.removeEventListener('pointermove', pointerMove);
    canvas.removeEventListener('pointerup', pointerUp);
    canvas.removeEventListener('pointercancel', pointerUp);
    intersectionObserver.disconnect();
    resizeObserver.disconnect();
    rail.style.removeProperty('--earth-scroll-progress');
    scene.traverse(object => {
      if (object.isMesh || object.isLineLoop || object.isPoints) {
        object.geometry?.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach(material => material?.dispose());
      }
    });
    disposable.forEach(texture => texture.dispose());
    renderer.dispose();
  };
}
