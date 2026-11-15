/**
 * SOLIQ: The Seventh Field - Main Game Orchestrator
 * Connects Babylon.js 3D world, rigged characters, real mesqa simulation,
 * Chapter 0 mission, Earth Lens, Time Echo, and responsive diegetic HUD.
 */

import { RenderSetup } from '../../game/render/engine-setup.js';
import { DeltaVillage } from '../../game/world/village.js';
import { CharacterSystem } from '../../game/world/characters.js';
import { PlayerController } from '../../game/world/controls.js';
import { DeltaAudioSynthesizer } from '../../game/world/audio.js';
import { VisualWaterEngine } from '../../game/world/water-simulation.js';
import { EarthLensSystem } from '../../game/world/earth-lens.js';
import { TimeEchoSystem } from '../../game/world/time-echo.js';
import { Chapter0Mission } from '../../game/mission/chapter0.js';
import { GameHUD } from '../../game/ui/hud.js';
import { sharedEvents } from '../../game/core/events.js';

class SeventhFieldGame {
  constructor() {
    this.canvas = document.getElementById('renderCanvas');
    this.uiContainer = document.getElementById('game-ui-container');
    this.loader = document.getElementById('game-loader');
    this.loaderBar = document.getElementById('loader-bar');
    this.btnStart = document.getElementById('btn-start-game');

    this.renderSetup = null;
    this.village = null;
    this.characters = null;
    this.playerController = null;
    this.audio = null;
    this.waterEngine = null;
    this.earthLens = null;
    this.timeEcho = null;
    this.mission = null;
    this.hud = null;

    this.isReady = false;
  }

  async init() {
    this._updateProgress(20, 'تهيئة محرك Babylon.js...');

    // 1. Initialize Render Setup & Scene
    this.renderSetup = new RenderSetup(this.canvas, { preset: 'balanced' });
    const { scene, shadowGenerator, cameras } = this.renderSetup;

    this._updateProgress(40, 'بناء قرية الدلتا والمسقة والمزارع...');

    // 2. Build 3D Delta Village Environment
    this.village = new DeltaVillage(scene, shadowGenerator);

    this._updateProgress(60, 'تجهيز الشخصيات البشرية وحركات الهيكل العظمي...');

    // 3. Rigged Characters (Nada, Uncle Hassan, Maryam)
    this.characters = new CharacterSystem(scene, shadowGenerator);

    this._updateProgress(75, 'توصيل الصوت الإجرائي ومحرك محاكاة المياه...');

    // 4. Procedural Audio & Water Simulation
    this.audio = new DeltaAudioSynthesizer();
    this.waterEngine = new VisualWaterEngine(scene, this.village, this.audio);

    // 5. Earth Lens & Time Echo Systems
    this.earthLens = new EarthLensSystem(scene, this.village);
    this.timeEcho = new TimeEchoSystem(scene, this.village);

    // 6. Chapter 0 Mission
    this.mission = new Chapter0Mission(this.village, this.characters, this.waterEngine, this.audio);

    this._updateProgress(90, 'تفعيل واجهة المستخدم والتحكم اللمسي...');

    // 7. Diegetic HUD & Event Wiring
    this._setupHUD();
    this._setupPlayerControls(cameras);

    this.isInitialized = true;
    this._updateProgress(100, 'اكتملت التهيئة بنجاح!');
    this._showStartButton();
  }

  _updateProgress(pct, statusText) {
    if (this.loaderBar) this.loaderBar.style.width = `${pct}%`;
  }

  _showStartButton() {
    if (this.btnStart) {
      this.btnStart.hidden = false;
      this.btnStart.addEventListener('click', () => {
        this.start();
      });
    } else {
      this.start();
    }
  }

  start() {
    if (this.loader) {
      this.loader.style.opacity = '0';
      this.loader.style.display = 'none';
    }

    if (this.audio) {
      this.audio.init();
      this.audio.resume();
    }

    if (this.renderSetup) {
      this.renderSetup.startRenderLoop((deltaTime) => {
        this.tick(deltaTime);
      });
    }

    this.isReady = true;

    if (this.hud) {
      this.hud.showTelemetryToast(
        'المية وصلت في المسقة!',
        'تحرك واستكشف القرية، وتحدث مع عم حسن ومريم قبل تشغيل طلمبة الري.',
        'observed'
      );
    }
  }

  _setupHUD() {
    this.hud = new GameHUD(this.uiContainer, {
      onInteractClick: () => {
        this.playerController?.triggerInteraction();
      },
      onLensChange: (mode) => {
        const res = this.earthLens.setMode(mode);
        if (mode === 'nasa') {
          this.hud.showTelemetryToast(
            'NASA POWER — الرصد غير متاح داخل اللعبة',
            'لم يتم تحميل سجل NASA موثق بالتاريخ وSHA256 لهذه الجلسة. ألوان المشهد توضيحية وليست صور أقمار صناعية.',
            'unavailable'
          );
        } else if (mode === 'future') {
          this.hud.showTelemetryToast(
            'محاكاة مستقبلية للدورة الزراعية',
            'SIMULATION — NOT SATELLITE OBSERVATION: تداخل فترات عدم اليقين (comparison_only)',
            'simulated'
          );
        }
      },
      onToggleNotebook: () => {
        this.hud.toggleNotebook();
      },
      onToggleCamera: () => {
        this.playerController?.toggleCameraMode();
      },
      onToggleMute: () => {
        return this.audio.toggleMute();
      },
      onQualityChange: (preset) => {
        this.renderSetup.setQuality(preset);
      },
      onJoystickMove: (dx, dy) => {
        this.playerController?.setVirtualJoystick(dx, dy);
      },
    });

    // Populate initial notebook receipts
    this.hud.updateNotebookReceipts(this.mission.notebookReceipts);

    // Listen for mission events
    sharedEvents.on('outcome_achieved', (data) => {
      this.hud.updateNotebookReceipts(this.mission.notebookReceipts);
      this.hud.updateWaterLedger(this.waterEngine.currentSimulation);
      this.hud.showTelemetryToast(
        data.titleAr,
        `تم تسجيل النتيجة في دفتر الأدلة برقم اعتماد مؤكد. عدالة Jain: ${(data.fairness * 100).toFixed(1)}%`,
        'simulated'
      );
    });
  }

  _setupPlayerControls(cameras) {
    this.playerController = new PlayerController(this.renderSetup.scene, this.characters.nada, cameras, {
      onInteract: (target) => {
        this._handleInteraction(target);
      },
      onPromptChange: (target) => {
        this.hud.showInteractionPrompt(target);
      },
      onLensChange: (mode) => {
        this.earthLens.setMode(mode);
      },
      onToggleNotebook: () => {
        this.hud.toggleNotebook();
      },
      onToggleMute: () => {
        this.audio.toggleMute();
      },
    });

    // Register all interactive targets in the village
    const targets = [
      { id: 'hassan', nameAr: 'عم حسن', nameEn: 'Uncle Hassan', position: this.characters.hassan.root.position },
      { id: 'maryam', nameAr: 'مريم', nameEn: 'Maryam', position: this.characters.maryam.root.position },
      { id: 'pumpStation', nameAr: 'طلمبة الديزل', nameEn: 'Diesel Pump', position: this.village.pump.group.position },
      ...this.village.gates.map((g) => ({ id: g.id, nameAr: g.nameAr, position: g.position })),
      { id: 'timeEcho', nameAr: 'الغيط السابع (صدى الزمن)', position: new BABYLON.Vector3(68, 0, 0) },
    ];

    this.playerController.setInteractables(targets);
  }

  _handleInteraction(target) {
    this.audio.playGateTurnSFX();
    const dialogue = this.mission.getDialogueForTarget(target);
    if (dialogue) {
      this.characters.setActorState('nada', 'talk');
      this.hud.showDialogue(dialogue);
    }
  }

  tick(deltaTime) {
    // 1. Update player locomotion and proximity
    this.playerController.update(deltaTime);

    // 2. Update character skeletal animations
    this.characters.updateAnimations(deltaTime);

    // 3. Update village mechanical elements (pump flywheel)
    this.village.tick(deltaTime);

    // 4. Update water simulation waves and height
    this.waterEngine.update(deltaTime);

    // 5. Check Time Echo field presence
    const inEcho = this.timeEcho.checkPlayerInside(this.characters.nada.root.position);
    this.timeEcho.update(deltaTime);

    if (inEcho && !this._inEchoPrevious) {
      this.hud.showTelemetryToast(
        'دخلت نطاق الأرض السابعة (صدى الزمن)',
        'استكشف مقارنة السيناريوهات المستقبلية واطلع على سجل عدم اليقين في الدفتر.',
        'simulated'
      );
    }
    this._inEchoPrevious = inEcho;
  }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  const game = new SeventhFieldGame();
  window.__seventhFieldGame = game;
  game.init().catch((err) => {
    console.error('[GameInit] Failed to load 3D scene:', err);
  });
});
