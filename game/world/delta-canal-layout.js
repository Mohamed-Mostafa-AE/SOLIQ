/**
 * Art-only contour for the visually legible Egyptian mesqa channel.
 * Returns cross-section ribbons in world coordinates, not a water balance,
 * hydraulic depth model, an observed field survey or evidence product.
 * The time-sliced water solver remains the sole authority for deliveries.
 */
export function planVisibleCanalBanks(centerline) {
  if (!Array.isArray(centerline) || centerline.length < 2) {
    throw new RangeError('Canal bank art needs two or more centerline points');
  }
  if (centerline.some(point => !point || !['x', 'y', 'z'].every(key => Number.isFinite(point[key])))) {
    throw new TypeError('Canal bank art needs finite x/y/z coordinates');
  }

  const ribbon = strips => strips.map(([crossOffset, surfaceY]) =>
    centerline.map(({ x, z }) => ({ x, y: surfaceY, z: z + crossOffset })));

  return {
    nearBank: ribbon([[-3.6, 0.16], [-2.35, 0.68], [-1.75, 0.13]]),
    channelBed: ribbon([[-1.75, 0.14], [0, 0.12], [1.75, 0.14]]),
    farBank: ribbon([[1.75, 0.13], [2.35, 0.68], [3.6, 0.16]]),
  };
}

/**
 * Procedural architecture layout for an authentic Egyptian timber-and-stone canal footbridge.
 * Spans the mesqa channel to allow foot traffic between village paths and active crop fields.
 */
export function planCanalBridge(options = {}) {
  const crossingX = Number.isFinite(options.crossingX) ? options.crossingX : 16.0;
  const canalZ = Number.isFinite(options.canalZ) ? options.canalZ : 8.0;
  const width = Number.isFinite(options.width) ? options.width : 2.6;
  const span = Number.isFinite(options.span) ? options.span : 6.8;
  const deckHeight = Number.isFinite(options.deckHeight) ? options.deckHeight : 0.88;

  const numPlanks = Math.max(6, Math.round(span * 3));
  const planks = [];
  const startZ = canalZ - span / 2;
  const plankSpacing = span / numPlanks;

  for (let i = 0; i < numPlanks; i++) {
    planks.push({
      x: crossingX,
      y: deckHeight + 0.05,
      z: startZ + (i + 0.5) * plankSpacing,
      width,
      length: plankSpacing * 0.92,
      thickness: 0.08,
      rotationY: (i % 2 === 0 ? 0.015 : -0.012),
    });
  }

  const posts = [];
  for (const side of [-1, 1]) {
    const postX = crossingX + (side * (width / 2 - 0.08));
    for (let j = 0; j < 4; j++) {
      const pz = startZ + 0.3 + j * ((span - 0.6) / 3);
      posts.push({ x: postX, y: deckHeight + 0.48, z: pz, height: 0.95, radius: 0.05 });
    }
  }

  return {
    crossingX,
    canalZ,
    deck: {
      center: { x: crossingX, y: deckHeight, z: canalZ },
      width,
      length: span,
      thickness: 0.16,
    },
    planks,
    posts,
    rails: [
      { start: { x: crossingX - width / 2 + 0.08, y: deckHeight + 0.88, z: startZ }, end: { x: crossingX - width / 2 + 0.08, y: deckHeight + 0.88, z: startZ + span } },
      { start: { x: crossingX + width / 2 - 0.08, y: deckHeight + 0.88, z: startZ }, end: { x: crossingX + width / 2 - 0.08, y: deckHeight + 0.88, z: startZ + span } },
    ],
    abutments: [
      { x: crossingX, y: deckHeight * 0.45, z: startZ - 0.4, width: width + 0.6, height: deckHeight * 0.9, depth: 1.0 },
      { x: crossingX, y: deckHeight * 0.45, z: startZ + span + 0.4, width: width + 0.6, height: deckHeight * 0.9, depth: 1.0 },
    ],
  };
}
