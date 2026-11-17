import {
  newWaterPractice, waterPracticeTarget, interactWaterPractice, chooseWaterPractice,
} from '../core/water-practice.js';

const COPY = {
  en: {
    title: 'CANAL TOOLKIT / OPTIONAL MISSION',
    label: 'FICTIONAL PRACTICE · SIMULATED',
    pickup: 'Find the blue watering can near the pump and press E.',
    bed: 'Can equipped. Walk to the glowing practice planter and interact.',
    decision: 'Try a visual watering demonstration or wait for real measurements?',
    done: 'Practice complete — no field water balance was calculated.',
    chooseWater: 'Illustrate watering', chooseDefer: 'Wait for evidence',
    outcomeWater: 'SIMULATED: The blue droplets are an animation only. Water supplied, crop response, yield and irrigation need have not been measured.',
    outcomeDefer: 'UNAVAILABLE: A real field water decision needs soil observations, crop needs and an agreed canal schedule. Nothing was applied.',
    replay: 'Replay toolkit', collected: 'Watering can equipped. Find the practice planter.',
    reached: 'Choose a practice action. This does not operate the real or simulated canal solver.',
  },
  ar: {
    title: 'شنطة أدوات المسقة / مهمة إضافية',
    label: 'تجربة خيالية · محاكاة',
    pickup: 'دور على رشاش الميه الأزرق جنب الطلمبة واضغط E.',
    bed: 'معاك الرشاش. روح للحوض المضيء واضغط تفاعل.',
    decision: 'تجرب حركة رش شكلية ولا تستنى قياسات من الأرض؟',
    done: 'انتهت التجربة — مفيش ميزان مياه حقيقي اتحسب.',
    chooseWater: 'جرّب حركة الرش', chooseDefer: 'استنى الدليل',
    outcomeWater: 'محاكاة: النقط الزرقا حركة توضيحية فقط. مفيش كميات مياه أو إنتاج أو احتياج ري اتقاس.',
    outcomeDefer: 'البيانات غير متاحة: قرار الري الحقيقي محتاج قياسات أرض ومحصول وجدول مسقة متفق عليه. لم يُنفّذ ري.',
    replay: 'أعد تجربة الرشاش', collected: 'اتجهز الرشاش. روح للحوض التدريبي.',
    reached: 'اختار إجراء تجريبي. ده لا يشغّل محرك المسقة أو توزيع المياه.',
  },
};

/** Self-contained, opt-in 3D tool loop; cannot write to the science or storage layer. */
export class WaterPracticeActivity {
  constructor({scene, host, nada, hud, onProgress = () => {}, reducedMotion = false}) {
    this.scene = scene;
    this.host = host;
    this.nada = nada;
    this.hud = hud;
    this.onProgress = onProgress;
    this.reducedMotion = reducedMotion;
    this.lang = hud.lang === 'ar' ? 'ar' : 'en';
    this.state = newWaterPractice();
    this.elapsed = 0;
    this.locations = {
      practice_can: new BABYLON.Vector3(-11, 0, 2),
      practice_bed: new BABYLON.Vector3(-9, 0, -9),
    };
    this.targets = {
      practice_can: {id: 'practice_can', nameEn: 'watering can · optional tool', nameAr: 'رشاش مياه · أداة إضافية', position: this.locations.practice_can},
      practice_bed: {id: 'practice_bed', nameEn: 'practice planter', nameAr: 'حوض التدريب', position: this.locations.practice_bed},
    };
    this._makeMeshes();
    this._makePanel();
    this._sync();
  }

  _makeMeshes() {
    const metal = new BABYLON.StandardMaterial('practiceCanBlue', this.scene);
    metal.diffuseColor = new BABYLON.Color3(.11, .53, .73);
    metal.emissiveColor = new BABYLON.Color3(.015, .07, .11);
    const aqua = new BABYLON.StandardMaterial('practiceWaterIllustration', this.scene);
    aqua.diffuseColor = new BABYLON.Color3(.25, .72, .93);
    aqua.emissiveColor = new BABYLON.Color3(.04, .17, .24);
    aqua.alpha = .68;
    const soil = new BABYLON.StandardMaterial('practicePlanterSoil', this.scene);
    soil.diffuseColor = new BABYLON.Color3(.44, .32, .21);
    const amber = new BABYLON.StandardMaterial('practiceMarkerAmber', this.scene);
    amber.diffuseColor = new BABYLON.Color3(1, .65, .14);
    amber.emissiveColor = new BABYLON.Color3(.4, .19, .03);

    this.can = new BABYLON.TransformNode('practiceWateringCanTool', this.scene);
    this.can.position.set(-11, .68, 2);
    const body = BABYLON.MeshBuilder.CreateCylinder('practiceCanBody', {height: .57, diameterTop: .42, diameterBottom: .48, tessellation: 16}, this.scene);
    body.material = metal; body.parent = this.can;
    const handle = BABYLON.MeshBuilder.CreateTorus('practiceCanHandle', {diameter: .43, thickness: .075, tessellation: 16}, this.scene);
    handle.material = metal; handle.parent = this.can; handle.position.set(-.34, .15, 0); handle.rotation.z = Math.PI / 2;
    const spout = BABYLON.MeshBuilder.CreateCylinder('practiceCanSpout', {height: .48, diameter: .085, tessellation: 10}, this.scene);
    spout.material = metal; spout.parent = this.can; spout.position.set(.4, .13, 0); spout.rotation.z = -1.04;

    this.bed = BABYLON.MeshBuilder.CreateBox('practiceWaterPlanter', {width: 2.2, depth: 1.65, height: .17}, this.scene);
    this.bed.position.set(-9, .16, -9); this.bed.material = soil;
    this.marker = BABYLON.MeshBuilder.CreateTorus('practiceWaterObjectiveRing', {diameter: 1.35, thickness: .12, tessellation: 20}, this.scene);
    this.marker.material = amber; this.marker.rotation.x = Math.PI / 2;
    this.droplets = Array.from({length: 7}, (_, index) => {
      const drop = BABYLON.MeshBuilder.CreateSphere(`practiceWaterDrop${index}`, {diameter: .11, segments: 8}, this.scene);
      drop.material = aqua;
      drop.setEnabled(false);
      return drop;
    });
  }

  _makePanel() {
    this.panel = document.createElement('aside');
    this.panel.id = 'water-practice-panel';
    this.panel.className = 'water-practice-panel';
    this.panel.setAttribute('aria-label', 'Optional watering-can practice quest');
    this.panel.hidden = true;
    const title = document.createElement('strong'); title.className = 'water-practice-title';
    const label = document.createElement('small'); label.className = 'water-practice-evidence';
    const status = document.createElement('p'); status.className = 'water-practice-status'; status.setAttribute('aria-live', 'polite');
    const outcome = document.createElement('p'); outcome.className = 'water-practice-outcome'; outcome.setAttribute('role', 'status');
    const actions = document.createElement('div'); actions.className = 'water-practice-actions';
    const waterButton = document.createElement('button'); waterButton.type = 'button'; waterButton.id = 'water-practice-illustrate';
    const deferButton = document.createElement('button'); deferButton.type = 'button'; deferButton.id = 'water-practice-defer';
    waterButton.addEventListener('click', () => this.choose('illustrate_watering'));
    deferButton.addEventListener('click', () => this.choose('defer'));
    actions.append(waterButton, deferButton);
    const replay = document.createElement('button'); replay.type = 'button'; replay.id = 'water-practice-replay';
    replay.className = 'water-practice-replay'; replay.addEventListener('click', () => this.reset());
    this.panel.append(title, label, status, actions, outcome, replay);
    this.host.appendChild(this.panel);
    Object.assign(this, {title, label, status, outcome, actions, waterButton, deferButton, replay});
  }

  getInteractables() {
    const id = waterPracticeTarget(this.state);
    return id ? [this.targets[id]] : [];
  }

  handleInteraction(target) {
    if (!target || !Object.hasOwn(this.targets, target.id)) return false;
    const result = interactWaterPractice(this.state, target.id);
    if (!result.handled) return false;
    this.state = result.state;
    this._sync();
    this.onProgress();
    this.hud.showTelemetryToast(
      this.lang === 'ar' ? 'مهمة الرشاش' : 'Watering-can practice',
      COPY[this.lang][result.event === 'can_collected' ? 'collected' : 'reached'], 'simulated',
    );
    if (result.event === 'choose_action') this.waterButton.focus();
    return true;
  }

  choose(action) {
    const result = chooseWaterPractice(this.state, action);
    if (!result.handled) return false;
    this.state = result.state;
    this._sync();
    this.onProgress();
    this.hud.showTelemetryToast(
      this.lang === 'ar' ? 'نتيجة التجربة' : 'Practice outcome',
      COPY[this.lang][action === 'illustrate_watering' ? 'outcomeWater' : 'outcomeDefer'],
      action === 'defer' ? 'unavailable' : 'simulated',
    );
    this.replay.focus();
    return true;
  }

  reset() {
    this.state = newWaterPractice();
    this.elapsed = 0;
    this._sync();
    this.onProgress();
  }

  setLanguage(language) {
    this.lang = language === 'ar' ? 'ar' : 'en';
    this._sync();
  }

  _sync() {
    const words = COPY[this.lang];
    const {stage, action, hasCan} = this.state;
    this.panel.hidden = stage === 'pickup';
    this.panel.dir = this.lang === 'ar' ? 'rtl' : 'ltr';
    this.panel.dataset.stage = stage;
    this.title.textContent = words.title;
    this.label.textContent = words.label;
    this.status.textContent = words[stage];
    this.actions.hidden = stage !== 'decision';
    this.waterButton.textContent = words.chooseWater;
    this.deferButton.textContent = words.chooseDefer;
    this.outcome.textContent = stage === 'done' ? words[action === 'illustrate_watering' ? 'outcomeWater' : 'outcomeDefer'] : '';
    this.replay.textContent = words.replay;
    this.replay.hidden = stage !== 'done';
    this.can.parent = hasCan ? this.nada.root : null;
    this.can.position.set(...(hasCan ? [.42, .72, .18] : [-11, .68, 2]));
    this.can.rotation.set(0, 0, 0);
    const targetId = waterPracticeTarget(this.state);
    this.marker.setEnabled(Boolean(targetId));
    if (targetId) {
      this.marker.position.copyFrom(this.locations[targetId]);
      this.marker.position.y = 1.35;
    }
    this.droplets.forEach(drop => drop.setEnabled(action === 'illustrate_watering'));
  }

  tick(deltaTime) {
    if (this.reducedMotion) return;
    this.elapsed += Math.min(.1, Math.max(0, deltaTime));
    if (this.marker.isEnabled()) this.marker.position.y = 1.35 + Math.sin(this.elapsed * 2.7) * .11;
    if (this.state.action !== 'illustrate_watering') return;
    for (let i = 0; i < this.droplets.length; i++) {
      const phase = (this.elapsed * 1.4 + i / this.droplets.length) % 1;
      this.droplets[i].position.set(-9.75 + i * .24, .3 + (1 - phase) * 1.55, -9 + Math.sin(i) * .26);
    }
    this.can.rotation.z = Math.sin(this.elapsed * 3) * .09;
  }
}
