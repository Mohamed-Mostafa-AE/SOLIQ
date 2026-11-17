/**
 * Soil-IQ: The Seventh Field - Main Game Orchestrator
 * Connects Babylon.js 3D world, rigged characters, fictional mesqa simulation,
 * Chapter 0 mission, Earth Lens, Time Echo, and responsive diegetic HUD.
 */

import { RenderSetup } from '../../game/render/engine-setup.js';
import { DeltaVillage } from '../../game/world/village.js';
import {installFieldVegetation,installVillageDetails} from '../../game/world/visual-polish.js';
import {applyDetailedSoil} from '../../game/world/delta-procedural-textures.js';
import {addCharacterDetails} from '../../game/world/character-detail.js';
import { CharacterSystem } from '../../game/world/characters.js';
import { PlayerController } from '../../game/world/controls.js';
import { DeltaAudioSynthesizer } from '../../game/world/audio.js';
import { VisualWaterEngine } from '../../game/world/water-simulation.js';
import { SeasonFeedbackEngine } from '../../game/world/season-feedback.js';
import { CouncilWorldReactions } from '../../game/world/council-world-reactions.js';
import { EarthLensSystem } from '../../game/world/earth-lens.js';
import { TimeEchoSystem } from '../../game/world/time-echo.js';
import { Chapter0Mission } from '../../game/mission/chapter0.js';
import { GameHUD } from '../../game/ui/hud.js';
import { FieldworkActivity } from '../../game/ui/fieldwork-activity.js';
import { WaterPracticeActivity } from '../../game/ui/water-practice.js';
import { AccessibleStoryDesk } from '../../game/ui/story-desk.js';
import { OpeningHook } from '../../game/ui/opening-hook.js';
import { CinematicDirector } from './cinematic-director.js';
import { mountChapterSequence } from './chapter-progression.js';
import {createNasaBrowseOverlay} from '../../game/ui/nasa-browse-overlay.js';
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
    this.seasonFeedback = null;
    this.councilWorldReactions = null;
    this.earthLens = null;
    this.timeEcho = null;
    this.mission = null;
    this.hud = null;
    this.fieldwork = null;
    this.waterPractice = null;
    this.storyDesk = null;
    this.openingHook = null;

    this.isReady = false;
    this.renderLoopStarted = false;
    this.previewFrames = 0;
    this.previewTimer = null;
  }

  async init() {
    this._updateProgress(20, 'تهيئة محرك Babylon.js...');

    // 1. Initialize Render Setup & Scene
    this.renderSetup = new RenderSetup(this.canvas, { preset: 'balanced' });
    const { scene, shadowGenerator, cameras } = this.renderSetup;

    this._updateProgress(40, 'بناء قرية الدلتا والمسقة والمزارع...');

    // 2. Build 3D Delta Village Environment
    this.village = new DeltaVillage(scene, shadowGenerator);
    this.visualArtReport = {
      realisticSurfaces: applyDetailedSoil(this.village,{quality:this.renderSetup.quality}),
      plants: installFieldVegetation(this.village, this.renderSetup.quality),
      details: installVillageDetails(this.village),
    };

    this._updateProgress(60, 'تجهيز الشخصيات البشرية وحركات الهيكل العظمي...');

    // 3. Rigged Characters (Nada, Uncle Hassan, Maryam)
    this.characters = new CharacterSystem(scene, shadowGenerator);
    this.visualArtReport.characters = addCharacterDetails(this.characters,{preset:this.renderSetup.quality});
    // Aim at the actual playable heroine before the first rendered frame.
    // Otherwise ArcRotateCamera's origin target shows empty soil rather than
    // the heroine and the planted canal edge, making the game feel lifeless.
    cameras.follow.setTarget(this.characters.nada.root.position.add(new BABYLON.Vector3(0.5, 1.55, 4.2)));
    // ArcRotateCamera.setTarget preserves eye position and therefore silently
    // expands the radius; restore the intended human-scale follow framing.
    // Frame Nada diagonally with the canal, crops and village behind her.
    // Looking straight along the path left most of the meaningful world out
    // of the first controllable view, even after the opening shot ended.
    cameras.follow.alpha = -2.05;
    cameras.follow.radius = 9.2;
    // A lower over-shoulder camera reveals the horizon and canal behind Nada;
    // the previous steep isometric angle showed mostly bare brown dirt.
    cameras.follow.beta = 1.23;

    this._updateProgress(75, 'توصيل الصوت الإجرائي ومحرك محاكاة المياه...');

    // 4. Procedural Audio & Water Simulation
    this.audio = new DeltaAudioSynthesizer();
    this.waterEngine = new VisualWaterEngine(scene, this.village, this.audio);
    this.seasonFeedback = new SeasonFeedbackEngine(this.village, this.waterEngine, {
      reducedMotion: this.renderSetup?.reducedMotion ?? false,
    });
    this.councilWorldReactions = new CouncilWorldReactions(scene, {
      reducedMotion: this.renderSetup?.reducedMotion ?? false,
    });
    this._lastCouncilTurnCount = 0;

    // 5. Earth Lens & Time Echo Systems
    this.earthLens = new EarthLensSystem(scene, this.village);
    this.timeEcho = new TimeEchoSystem(scene, this.village);

    // 6. Chapter 0 Mission
    this.mission = new Chapter0Mission(this.village, this.characters, this.waterEngine, this.audio);

    this._updateProgress(90, 'تفعيل واجهة المستخدم والتحكم اللمسي...');

    // 7. Diegetic HUD & Event Wiring
    this._setupHUD();
    this.chapterSequence = mountChapterSequence({
      host: this.uiContainer, chapter0: this.mission, language: this.hud.lang,
      onUnlocked: (text, chapter = 2) => this.hud.showTelemetryToast(
        this.hud.lang === 'ar' ? `الفصل ${chapter} جاهز` : `Chapter ${chapter} unlocked`,
        text, 'simulated',
      ),
      onChapter5Change: state => {
        this.councilWorldReactions.apply(state);
        const turns = state?.choices?.length ?? 0;
        if (turns > this._lastCouncilTurnCount) {
          const latest = state.choices.at(-1);
          const actor = latest === 'protect_cover' ? 'maryam'
            : latest === 'share_turn' ? 'hassan' : 'nada';
          // A temporary performance, not a claim that real canal flow changed.
          this.characters.setActorState(actor, 'talk');
          this.hud.showTelemetryToast(
            this.hud.lang === 'ar' ? 'أثر قرار القرية' : 'Village choice reflected',
            this.hud.lang === 'ar'
              ? 'علامة ثلاثية الأبعاد خيالية ظهرت في القرية؛ ليست قياسًا حقيقيًا.'
              : 'A fictional 3D story marker appeared in the village; no field data were measured.',
            'simulated',
          );
        }
        this._lastCouncilTurnCount = turns;
      },
    });
    this.nasaBrowseOverlay=createNasaBrowseOverlay(this.uiContainer);
    this.nasaBrowseOverlay.setLanguage(this.hud.lang);
    this._setupPlayerControls(cameras);
    this.cinematicDirector = new CinematicDirector(this.renderSetup, this.characters, this.playerController);

    this.isInitialized = true;
    // The intro needs live WebGL frames even before Start; a single draw may
    // lose its backbuffer before the translucent splash is composited. Cap
    // preview at 24fps, pause when hidden, and stop after a few frames when
    // reduced motion is requested. Never advance game/simulation time here.
    this.renderSetup.scene.render();
    this.previewFrames = 1;
    this.previewTimer = window.setInterval(() => {
      if (document.hidden || (this.renderSetup.reducedMotion && this.previewFrames >= 3)) return;
      this.renderSetup.scene.render();
      this.previewFrames += 1;
    }, 1000 / 24);
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
        this.openingHook?.open();
      });
    } else {
      this.start();
    }
  }

  start() {
    document.body.classList.remove('game-intro-active');
    if (this.previewTimer !== null) {
      window.clearInterval(this.previewTimer);
      this.previewTimer = null;
    }
    if (this.loader) {
      this.loader.style.opacity = '0';
      this.loader.style.display = 'none';
    }

    if (this.audio) {
      this.audio.init();
      this.audio.resume();
    }

    if (this.renderSetup && !this.renderLoopStarted) {
      this.renderSetup.startRenderLoop((deltaTime) => {
        this.tick(deltaTime);
      });
      this.renderLoopStarted = true;
    }

    this.isReady = true;

    if (this.hud) {
      this.hud.showTelemetryToast(
        this.hud.lang === 'en' ? 'The dawn council is gathering' : 'مجلس الفجر بيتجمع',
        this.hud.lang === 'en'
          ? 'A seventh field holds two possible seasons. Explore the fictional village, hear Hassan and Maryam, then test sustainable water choices. Story mode is available without 3D movement.'
          : 'الأرض السابعة بتعرض موسمين محتملين. استكشف القرية واسمع حسن ومريم، ثم جرب مفاضلات المياه والاستدامة. وضع القصة متاح بدون حركة ثلاثية الأبعاد.',
        'simulated'
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
        if(mode==='nasa')this.nasaBrowseOverlay?.show();
        else this.nasaBrowseOverlay?.hide();
        if (mode === 'nasa') {
          this.hud.showTelemetryToast(
            this.hud.lang === 'en' ? 'NASA POWER — source not loaded in game' : 'NASA POWER — الرصد غير متاح داخل اللعبة',
            this.hud.lang === 'en'
              ? 'No dated, SHA-256-receipted NASA POWER record is loaded for this game session. Scene colors are illustrations, not satellite measurements.'
              : 'لم يتم تحميل سجل NASA موثق بالتاريخ وSHA256 لهذه الجلسة. ألوان المشهد توضيحية وليست صور أقمار صناعية.',
            'unavailable'
          );
        } else if (mode === 'future') {
          this.hud.showTelemetryToast(
            this.hud.lang === 'en' ? 'Modelled future — scenario only' : 'محاكاة مستقبلية للدورة الزراعية',
            this.hud.lang === 'en'
              ? 'SIMULATION — NOT SATELLITE OBSERVATION: paired crop comparison is not verified (comparison_only).'
              : 'SIMULATION — NOT SATELLITE OBSERVATION: لا توجد مقارنة حسابية موثقة بعد (comparison_only)',
            'simulated'
          );
        }
      },
      onToggleNotebook: () => {
        this.hud.toggleNotebook();
      },
      onToggleStoryDesk: () => {
        this.storyDesk?.toggle();
      },
      onLanguageChange: (language) => {
        this.storyDesk?.setLanguage(language);
        this.openingHook?.setLanguage(language);
        this.nasaBrowseOverlay?.setLanguage(language);
        this.chapterSequence?.setLanguage(language);
        this.fieldwork?.setLanguage(language);
        this.waterPractice?.setLanguage(language);
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

    // The story companion calls the same mission and solver as 3D interactions.
    this.storyDesk = new AccessibleStoryDesk(this.uiContainer, this.mission, {
      onMissionChanged: () => {
        this.hud.updateNotebookReceipts(this.mission.notebookReceipts);
        this.hud.updateWaterLedger(this.waterEngine.currentSimulation);
        this.chapterSequence?.refresh();
      },
      onCheckpointRestored: () => {
        // Reapply only fictional scene effects. The Chapter 0 snapshot never
        // includes device location, NASA payloads or verified field evidence.
        this.mission.rehydrateWorldEffects();
        this.hud.updateNotebookReceipts(this.mission.notebookReceipts);
        this.hud.updateWaterLedger(this.waterEngine.currentSimulation);
        this.chapterSequence?.refresh();
      },
      onCheckpointReset: () => {
        // Rebuild the 3D world so previous gate, water and soil-material effects
        // cannot linger after deleting/resetting fictional progress.
        window.location.reload();
      },
    });
    this.storyDesk.setLanguage(this.hud.lang);
    this.openingHook = new OpeningHook(document.body, this.mission, {
      onPreview: (clue) => this.cinematicDirector?.preview(clue),
      onInvestigation: (clue) => {
        this.cinematicDirector?.choose(clue);
        this.storyDesk.refresh();
        const en = this.hud.lang === 'en';
        this.hud.showTelemetryToast(
          en ? (clue === 'water' ? 'Your first clue: the canal ledger' : 'Your first clue: the crop calendar')
            : (clue === 'water' ? 'أول خيط: دفتر المسقة' : 'أول خيط: تقويم المحاصيل'),
          en ? `Your first witness: ${clue === 'water' ? 'Hassan by Canal Gate 1' : 'Maryam by the soil-cover field'}. Follow the glowing marker or open Story Mode. Both crop plans remain untested.`
            : `أول شخصية هتقابلها: ${clue === 'water' ? 'حسن عند بوابة المسقة' : 'مريم عند غيط غطاء التربة'}. اتبع العلامة المضيئة أو افتح وضع القصة. الخطتان غير مختبرتين.`,
          'simulated'
        );
      },
    });
    this.openingHook.setLanguage(this.hud.lang);

    // Populate initial notebook receipts
    this.hud.updateNotebookReceipts(this.mission.notebookReceipts);

    // Listen for mission events
    sharedEvents.on('outcome_achieved', (data) => {
      this.hud.updateNotebookReceipts(this.mission.notebookReceipts);
      this.hud.updateWaterLedger(this.waterEngine.currentSimulation);
      this.chapterSequence?.refresh();
      if (this.seasonFeedback && this.waterEngine.currentSimulation) {
        this.seasonFeedback.applyIrrigationOutcome(this.waterEngine.currentSimulation);
      }
      const en = this.hud.lang === 'en';
      this.hud.showTelemetryToast(
        en ? 'Simulated irrigation decision recorded' : data.titleAr,
        data.fairness == null
          ? (en ? 'Decision deferred. No water was distributed and no fairness metric applies.' : 'تم تسجيل قرار افتراضي دون توزيع مياه؛ لا توجد عدالة توزيع محسوبة.')
          : (en ? `Fictional Jain fairness: ${(data.fairness * 100).toFixed(1)}%. Not field-calibrated.` : `نتيجة محاكاة مسجلة في الدفتر، مؤشر Jain: ${(data.fairness * 100).toFixed(1)}% (غير معاير ميدانيًا)`),
        'simulated'
      );
    });
    sharedEvents.on('mission_receipts_updated', () => {
      this.hud.updateNotebookReceipts(this.mission.notebookReceipts);
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
        if(mode==='nasa')this.nasaBrowseOverlay?.show();
        else this.nasaBrowseOverlay?.hide();
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
      ...this.village.gates.map((g) => ({ id: g.id, nameAr: g.nameAr, nameEn: g.nameEn || 'Canal Gate', position: g.position })),
      { id: 'timeEcho', nameAr: 'الغيط السابع (صدى الزمن)', nameEn: 'The Seventh Field (Time Echo)', position: new BABYLON.Vector3(68, 0, 0) },
    ];

    this.baseInteractables = targets;
    this.fieldwork = new FieldworkActivity({
      scene: this.renderSetup.scene,
      host: this.uiContainer,
      nada: this.characters.nada,
      hud: this.hud,
      reducedMotion: this.renderSetup.reducedMotion,
      onProgress: () => this._refreshInteractables(),
    });
    this.waterPractice = new WaterPracticeActivity({
      scene: this.renderSetup.scene,
      host: this.uiContainer,
      nada: this.characters.nada,
      hud: this.hud,
      reducedMotion: this.renderSetup.reducedMotion,
      onProgress: () => this._refreshInteractables(),
    });
    this._refreshInteractables();
  }

  _refreshInteractables() {
    this.playerController?.setInteractables([
      ...this.baseInteractables,
      ...(this.fieldwork?.getInteractables() || []),
      ...(this.waterPractice?.getInteractables() || []),
    ]);
  }

  _handleInteraction(target) {
    if (this.fieldwork?.handleInteraction(target)) return;
    if (this.waterPractice?.handleInteraction(target)) return;
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
    this.cinematicDirector?.tick(deltaTime);
    // Place the human protagonist in the foreground while keeping the
    // livelihood stakes (canal, sakia, crop fields) in the shot. Controls.js
    // recentres the follow target on movement; re-apply this composition after
    // its update so walking never silently returns to an empty soil closeup.
    if (!this.cinematicDirector?.active && !this.playerController.isCameraIso) {
      const p = this.characters.nada.root.position;
      this.renderSetup.cameras.follow.target.set(p.x + 0.5, p.y + 1.55, p.z + 4.2);
    }

    // 2. Update character skeletal animations
    this.characters.updateAnimations(deltaTime);

    // 3. Update village mechanical elements (pump flywheel)
    this.village.tick(deltaTime);
    this.fieldwork?.tick(deltaTime);
    this.waterPractice?.tick(deltaTime);

    // 4. Update water simulation waves and height
    this.waterEngine.update(deltaTime);

    // 4b. Environmental wind sway and seasonal feedback
    this.seasonFeedback?.tick(deltaTime);
    this.councilWorldReactions?.tick(deltaTime);

    // 5. Check Time Echo field presence
    const inEcho = this.timeEcho.checkPlayerInside(this.characters.nada.root.position);
    this.timeEcho.update(deltaTime);

    if (inEcho && !this._inEchoPrevious) {
      this.hud.showTelemetryToast(
        this.hud.lang === 'en' ? 'Entered The Seventh Field (Time Echo)' : 'دخلت نطاق الأرض السابعة (صدى الزمن)',
        this.hud.lang === 'en'
          ? 'Explore the fictional future scenarios. Review uncertainty in the evidence notebook.'
          : 'استكشف مقارنة السيناريوهات المستقبلية واطلع على سجل عدم اليقين في الدفتر.',
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
    const loadingMessage = document.querySelector('.loader-sub');
    if (loadingMessage) loadingMessage.textContent =
      '3D loading failed. The text-first story below still works without WebGL.';
  });
});
