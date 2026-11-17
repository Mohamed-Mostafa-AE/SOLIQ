/**
 * Authored, local-only routes for two original fictional villagers.
 * Tiny deterministic paths stay near the existing gate interactables; this is
 * character ambience, NOT farm observation, navigation AI or pathfinding.
 */
export const VILLAGER_PATROL_ROUTES = Object.freeze({
  hassan: Object.freeze([{x:4.5,z:9.8},{x:7.2,z:9.8},{x:5.8,z:10.5}].map(Object.freeze)),
  maryam: Object.freeze([{x:24.5,z:7.8},{x:22.0,z:7.8},{x:23.4,z:9.0}].map(Object.freeze)),
});

const WALK_SPEED = 0.85;
const DWELL_SECONDS = 0.8;
const ACTORS = Object.freeze(['hassan', 'maryam']);

export function createVillagePatrols() {
  return Object.fromEntries(ACTORS.map(id => [id, {
    position: {...VILLAGER_PATROL_ROUTES[id][0]},
    next: 1, hold: DWELL_SECONDS, heading: 0, motion: 'idle',
  }]));
}

/** One animation-frame advance, with a hard 50ms cap after background tabs. */
export function advanceVillagePatrols(state, deltaTime, {pauseIds = [], reducedMotion = false} = {}) {
  if (!Number.isFinite(deltaTime) || deltaTime < 0) throw new RangeError('Expected nonnegative finite frame time');
  const dt = Math.min(deltaTime, 0.05);
  const nextState = {};
  for (const id of ACTORS) {
    const actor = state[id];
    const route = VILLAGER_PATROL_ROUTES[id];
    if (reducedMotion || pauseIds.includes(id) || dt === 0) {
      nextState[id] = {...actor, motion:'idle'};
      continue;
    }
    if (actor.hold > 0) {
      nextState[id] = {...actor, hold:Math.max(0, actor.hold - dt), motion:'idle'};
      continue;
    }
    const goal = route[actor.next];
    const dx = goal.x - actor.position.x;
    const dz = goal.z - actor.position.z;
    const distance = Math.hypot(dx, dz);
    const movement = dt * WALK_SPEED;
    if (distance <= movement + 1e-9) {
      nextState[id] = {...actor, position:{...goal}, next:(actor.next+1)%route.length,
        hold:DWELL_SECONDS, motion:'idle'};
    } else {
      const share = movement / distance;
      nextState[id] = {...actor, position:{x:actor.position.x+dx*share,
        z:actor.position.z+dz*share}, heading:Math.atan2(dx,dz), motion:'walk'};
    }
  }
  return nextState;
}
