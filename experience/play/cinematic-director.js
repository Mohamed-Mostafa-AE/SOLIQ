/**
 * Three real in-engine shots for Chapter 0. The camera reveals the actual
 * Babylon scene, not a prerendered promise or an unrelated video.
 *
 * The dialogue camera is only borrowed while the modal owns input. On exit
 * the original follow camera and movement controller are restored.
 */
export class CinematicDirector {
  constructor(renderSetup, characters, controller) {
    this.renderSetup = renderSetup;
    this.characters = characters;
    this.controller = controller;
    this.active = false;
    this.shot = 'overview';
    this.seconds = 0;
    this.selectedClue = null;
    this._makeMarker();
  }

  _makeMarker() {
    const scene = this.renderSetup.scene;
    this.marker = BABYLON.MeshBuilder.CreateTorus('chapter0WitnessBeacon', {
      diameter: 1.15, thickness: 0.055, tessellation: 32,
    }, scene);
    const material = new BABYLON.StandardMaterial('chapter0WitnessBeaconMat', scene);
    material.diffuseColor = BABYLON.Color3.FromHexString('#edbd6d');
    material.emissiveColor = BABYLON.Color3.FromHexString('#c8964a');
    material.alpha = 0.87;
    this.marker.material = material;
    this.marker.isPickable = false;
    this.marker.isVisible = false;
  }

  _actorFor(clue) {
    return clue === 'water' ? this.characters.hassan
      : clue === 'soil' ? this.characters.maryam : null;
  }

  _shotFor(clue) {
    const actor = this._actorFor(clue);
    if (actor?.root) {
      const target = actor.root.position.add(new BABYLON.Vector3(0, 1.55, 0));
      const offset = clue === 'soil'
        ? new BABYLON.Vector3(-5.6, 3.0, 7.4)
        : new BABYLON.Vector3(-4.8, 2.8, 7.8);
      return { target, position: target.add(offset) };
    }
    const villageCenter = this.characters.nada.root.position.add(new BABYLON.Vector3(6, 0, 5));
    return {
      target: villageCenter.add(new BABYLON.Vector3(0, 1.3, 0)),
      position: villageCenter.add(new BABYLON.Vector3(-12, 9.1, 18)),
    };
  }

  preview(clue) {
    if (clue === 'exit') {
      this.exit();
      return;
    }
    this.shot = ['overview', 'water', 'soil'].includes(clue) ? clue : 'overview';
    this.seconds = 0;
    if (!this.active) {
      this.active = true;
      this.controller.inputEnabled = false;
      // Inert canvas, but do not retain a controller listening to pointer
      // input while a modal occupies the accessibility tree.
      this.renderSetup.setActiveCamera('dialogue');
      const initialShot = this._shotFor(this.shot);
      this.renderSetup.cameras.dialogue.position.copyFrom(initialShot.position);
      this.renderSetup.cameras.dialogue.setTarget(initialShot.target);
    }
    const shot = this._shotFor(this.shot);
    if (this.renderSetup.reducedMotion || document.body.classList.contains('reduced-motion')) {
      this.renderSetup.cameras.dialogue.position.copyFrom(shot.position);
      this.renderSetup.cameras.dialogue.setTarget(shot.target);
    }
    this._updateMarker();
  }

  _updateMarker() {
    const actor = this._actorFor(this.active ? this.shot : this.selectedClue);
    this.marker.isVisible = Boolean(actor);
    if (!actor) return;
    this.marker.position.copyFrom(actor.root.position);
    this.marker.position.y += 2.65;
    this.marker.material.emissiveColor = this.shot === 'soil' || this.selectedClue === 'soil'
      ? BABYLON.Color3.FromHexString('#dba35d') : BABYLON.Color3.FromHexString('#65c9d1');
  }

  choose(clue) {
    this.selectedClue = ['water', 'soil'].includes(clue) ? clue : null;
    this._updateMarker();
  }

  tick(dt) {
    if (this.marker.isVisible) {
      const pulse = Math.min(0.05, Math.max(0, Number.isFinite(dt) ? dt : 0));
      this.seconds += pulse;
      const reduced = this.renderSetup.reducedMotion || document.body.classList.contains('reduced-motion');
      const scale = reduced ? 1 : 1 + Math.sin(this.seconds * 2.8) * 0.08;
      this.marker.scaling.set(scale, 1, scale);
    }
    if (!this.active) return;
    const camera = this.renderSetup.cameras.dialogue;
    const shot = this._shotFor(this.shot);
    const reduced = this.renderSetup.reducedMotion || document.body.classList.contains('reduced-motion');
    const blend = reduced ? 1 : 1 - Math.exp(-Math.max(0, dt) * 3.8);
    camera.position.copyFrom(BABYLON.Vector3.Lerp(camera.position, shot.position, blend));
    // setTarget computes the camera's proper orientation, including while
    // a pointer-hover changes which 3D witness is being previewed.
    camera.setTarget(shot.target);
  }

  exit() {
    if (!this.active) return;
    this.active = false;
    this.renderSetup.setActiveCamera('follow');
    this.controller.inputEnabled = true;
    this._updateMarker();
  }

  dispose() {
    this.exit();
    this.marker.material?.dispose();
    this.marker.dispose();
  }
}
