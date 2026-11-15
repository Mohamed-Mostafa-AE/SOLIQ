/**
 * SOLIQ: The Seventh Field - 3D Character Controller & Inputs
 * Responsive desktop (WASD/Mouse) + Mobile Virtual Analog Joystick controls.
 * Proximity interaction detector and dual-mode camera tracker.
 */

export class PlayerController {
  constructor(scene, nadaActor, cameras, uiCallbacks = {}) {
    this.scene = scene;
    this.nada = nadaActor;
    this.cameras = cameras; // { follow, iso, dialogue }
    this.uiCallbacks = uiCallbacks;

    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false,
      interact: false,
    };

    this.virtualJoystick = {
      active: false,
      x: 0,
      y: 0,
    };

    this.interactableTargets = [];
    this.nearestTarget = null;
    this.isCameraIso = false;
    this.inputEnabled = true;

    this._setupDesktopInputs();
  }

  setInteractables(targets) {
    this.interactableTargets = targets;
  }

  _setupDesktopInputs() {
    window.addEventListener('keydown', (e) => {
      if (!this.inputEnabled) return;
      const k = e.code;
      if (k === 'KeyW' || k === 'ArrowUp') this.keys.forward = true;
      if (k === 'KeyS' || k === 'ArrowDown') this.keys.backward = true;
      if (k === 'KeyA' || k === 'ArrowLeft') this.keys.left = true;
      if (k === 'KeyD' || k === 'ArrowRight') this.keys.right = true;
      if (k === 'ShiftLeft' || k === 'ShiftRight') this.keys.sprint = true;

      if (k === 'KeyE' || k === 'Space') {
        e.preventDefault();
        this.triggerInteraction();
      }

      if (k === 'Tab') {
        e.preventDefault();
        this.toggleCameraMode();
      }

      if (k === 'Digit1') this.uiCallbacks.onLensChange?.('ground');
      if (k === 'Digit2') this.uiCallbacks.onLensChange?.('nasa');
      if (k === 'Digit3') this.uiCallbacks.onLensChange?.('future');
      if (k === 'KeyN') this.uiCallbacks.onToggleNotebook?.();
      if (k === 'KeyM') this.uiCallbacks.onToggleMute?.();
    });

    window.addEventListener('keyup', (e) => {
      const k = e.code;
      if (k === 'KeyW' || k === 'ArrowUp') this.keys.forward = false;
      if (k === 'KeyS' || k === 'ArrowDown') this.keys.backward = false;
      if (k === 'KeyA' || k === 'ArrowLeft') this.keys.left = false;
      if (k === 'KeyD' || k === 'ArrowRight') this.keys.right = false;
      if (k === 'ShiftLeft' || k === 'ShiftRight') this.keys.sprint = false;
    });
  }

  setVirtualJoystick(dx, dy) {
    this.virtualJoystick.active = Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05;
    this.virtualJoystick.x = dx;
    this.virtualJoystick.y = dy;
  }

  toggleCameraMode() {
    this.isCameraIso = !this.isCameraIso;
    const activeCam = this.isCameraIso ? this.cameras.iso : this.cameras.follow;
    this.scene.activeCamera = activeCam;
    activeCam.attachControl(this.scene.getEngine().getRenderingCanvas(), true);
    if (this.uiCallbacks.onCameraModeChange) {
      this.uiCallbacks.onCameraModeChange(this.isCameraIso ? 'iso' : 'follow');
    }
  }

  triggerInteraction() {
    if (this.nearestTarget && this.uiCallbacks.onInteract) {
      this.nada.state = 'interact';
      setTimeout(() => {
        if (this.nada.state === 'interact') this.nada.state = 'idle';
      }, 600);
      this.uiCallbacks.onInteract(this.nearestTarget);
    }
  }

  update(deltaTime) {
    if (!this.nada || !this.inputEnabled) return;

    // 1. Calculate input vector
    let moveX = 0;
    let moveZ = 0;

    if (this.virtualJoystick.active) {
      moveX = this.virtualJoystick.x;
      moveZ = -this.virtualJoystick.y; // Inverted for screen coordinates
    } else {
      if (this.keys.forward) moveZ += 1;
      if (this.keys.backward) moveZ -= 1;
      if (this.keys.left) moveX -= 1;
      if (this.keys.right) moveX += 1;
    }

    const inputMag = Math.sqrt(moveX * moveX + moveZ * moveZ);

    if (inputMag > 0.08) {
      // Normalize
      const normX = moveX / Math.max(1, inputMag);
      const normZ = moveZ / Math.max(1, inputMag);

      // Camera relative direction
      const cam = this.scene.activeCamera;
      const camForward = cam.getForwardRay().direction;
      camForward.y = 0;
      camForward.normalize();

      const camRight = new BABYLON.Vector3(camForward.z, 0, -camForward.x);

      const worldDir = camForward.scale(normZ).add(camRight.scale(normX));
      worldDir.y = 0;
      worldDir.normalize();

      const speed = this.keys.sprint ? this.nada.runSpeed : this.nada.moveSpeed;
      const moveStep = worldDir.scale(speed * deltaTime);

      // Smooth rotate Nada towards direction
      const targetAngle = Math.atan2(worldDir.x, worldDir.z);
      this.nada.root.rotation.y = BABYLON.Scalar.LerpAngle(this.nada.root.rotation.y, targetAngle, 0.2);

      // Apply movement with boundary clamping
      const newPos = this.nada.root.position.add(moveStep);
      newPos.x = Math.max(-32, Math.min(78, newPos.x));
      newPos.z = Math.max(-32, Math.min(32, newPos.z));
      newPos.y = 0.0; // Ground clamped
      this.nada.root.position.copyFrom(newPos);

      // Update follow camera target position
      if (this.cameras.follow) {
        this.cameras.follow.target.copyFrom(this.nada.root.position).addInPlace(new BABYLON.Vector3(0, 1.4, 0));
      }

      this.nada.state = this.keys.sprint ? 'run' : 'walk';
    } else {
      if (this.nada.state !== 'interact' && this.nada.state !== 'talk') {
        this.nada.state = 'idle';
      }
    }

    // 2. Proximity Detection with interactable targets
    this._checkProximity();
  }

  _checkProximity() {
    let closest = null;
    let minDist = 3.6; // Maximum interact distance

    const nadaPos = this.nada.root.position;

    for (const t of this.interactableTargets) {
      const pos = t.position || (t.group && t.group.position);
      if (!pos) continue;

      const d = BABYLON.Vector3.Distance(nadaPos, pos);
      if (d < minDist) {
        minDist = d;
        closest = t;
      }
    }

    if (closest !== this.nearestTarget) {
      this.nearestTarget = closest;
      if (this.uiCallbacks.onPromptChange) {
        this.uiCallbacks.onPromptChange(closest);
      }
    }
  }
}
