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
