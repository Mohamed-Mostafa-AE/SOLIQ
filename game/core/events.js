/**
 * SOLIQ: The Seventh Field - Game Core Event Contracts & State
 * Standard interface bridging game-core state with the 3D rendering and NPC systems.
 */

export const EMOTIONS = Object.freeze({
  NEUTRAL: 'neutral',
  HOPEFUL: 'hopeful',
  CONCERNED: 'concerned',
  SATISFIED: 'satisfied',
  EXPLAINING: 'explaining',
  RELIEVED: 'relieved',
});

export const GESTURES = Object.freeze({
  IDLE: 'idle',
  GREET: 'greet',
  POINT: 'point',
  THINK: 'think',
  INSPECT: 'inspect',
  DISAGREE: 'disagree',
  CELEBRATE: 'celebrate',
});

export const LENS_MODES = Object.freeze({
  GROUND: 'ground',
  NASA_OBSERVED: 'nasa',
  MODELLED_FUTURE: 'future',
});

export const OUTCOMES = Object.freeze({
  NONE: 'none',
  EQUILIBRIUM: 'equilibrium',        // Outcome 1: Proportional balanced turns
  BOTTLENECK: 'bottleneck',          // Outcome 2: Simultaneous draw overloading pump
  DEFERRAL: 'deferral',              // Outcome 3: Water deficit + soil testing deferral
});

export class GameEventManager {
  constructor() {
    this._listeners = new Map();
  }

  on(eventName, callback) {
    if (!this._listeners.has(eventName)) {
      this._listeners.set(eventName, new Set());
    }
    this._listeners.get(eventName).add(callback);
    return () => this.off(eventName, callback);
  }

  off(eventName, callback) {
    if (this._listeners.has(eventName)) {
      this._listeners.get(eventName).delete(callback);
    }
  }

  emit(eventName, payload) {
    if (this._listeners.has(eventName)) {
      for (const cb of this._listeners.get(eventName)) {
        try {
          cb(payload);
        } catch (err) {
          console.error(`[GameEvent] Error in handler for ${eventName}:`, err);
        }
      }
    }
  }
}

export const sharedEvents = new GameEventManager();
