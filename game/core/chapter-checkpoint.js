/**
 * Optional, explicit local-only checkpoint for the fictional Chapter 0 story.
 * Never auto-saves or auto-resumes. This intentionally excludes location,
 * NASA raw evidence and session tokens by using Chapter0Mission's strict
 * versioned snapshot contract rather than the application state tree.
 */
export const CHAPTER0_CHECKPOINT_KEY = 'soil-iq:seventh-field:chapter0:v1';
const MAX_CHECKPOINT_CHARS = 350_000;

export class Chapter0Checkpoint {
  constructor(mission, { storageProvider = () => window.localStorage } = {}) {
    if (!mission || typeof mission.getSerializableState !== 'function' ||
        typeof mission.restoreState !== 'function') {
      throw new TypeError('Chapter 0 mission must support safe versioned snapshots');
    }
    this.mission = mission;
    this.storageProvider = storageProvider;
    this.initialSnapshot = mission.getSerializableState();
    // Intentionally no storage query here; only a user's button action may
    // read, save or delete data in the browser profile.
  }

  _storage() {
    const storage = this.storageProvider();
    if (!storage || typeof storage.getItem !== 'function' ||
        typeof storage.setItem !== 'function' ||
        typeof storage.removeItem !== 'function') {
      throw new TypeError('Local browser storage unavailable');
    }
    return storage;
  }

  save() {
    let bytes;
    try {
      const snapshot = this.mission.getSerializableState();
      bytes = JSON.stringify(snapshot);
      if (bytes.length > MAX_CHECKPOINT_CHARS) return { ok: false, reason: 'invalid_checkpoint' };
    } catch {
      return { ok: false, reason: 'invalid_checkpoint' };
    }
    try {
      this._storage().setItem(CHAPTER0_CHECKPOINT_KEY, bytes);
      return { ok: true };
    } catch {
      return { ok: false, reason: 'storage_unavailable' };
    }
  }

  resume() {
    let raw;
    try {
      raw = this._storage().getItem(CHAPTER0_CHECKPOINT_KEY);
    } catch {
      return { ok: false, reason: 'storage_unavailable' };
    }
    if (raw == null) return { ok: false, reason: 'not_found' };
    if (typeof raw !== 'string' || raw.length > MAX_CHECKPOINT_CHARS) {
      return { ok: false, reason: 'invalid_checkpoint' };
    }
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { ok: false, reason: 'invalid_checkpoint' };
    }
    if (parsed?.version !== 1) return { ok: false, reason: 'unsupported_version' };
    try {
      this.mission.restoreState(parsed);
      return { ok: true };
    } catch {
      return { ok: false, reason: 'invalid_checkpoint' };
    }
  }

  reset() {
    try {
      this._storage().removeItem(CHAPTER0_CHECKPOINT_KEY);
    } catch {
      return { ok: false, reason: 'storage_unavailable' };
    }
    this.mission.restoreState(this.initialSnapshot);
    return { ok: true };
  }
}
