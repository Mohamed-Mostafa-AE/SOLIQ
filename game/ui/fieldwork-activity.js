import {
  freshFieldworkState, fieldworkTarget, advanceFieldwork, chooseFieldworkCover,
} from '../core/fieldwork-quest.js';

const WORDS = {
  en: {
    title: 'FIELDWORK / HANDS-ON',
    badge: 'FICTIONAL FIELD · SIMULATED',
    tool: '1 / 3 · Pick up the soil probe by Nada',
    sample: '2 / 3 · Inspect the trial soil patch',
    cover: '3 / 3 · Choose how to protect the trial bed',
    done: 'Fieldwork complete · replay any time',
    toolHint: 'Walk to the amber marker and press E, or tap Interact.',
    sampleHint: 'Move to the next marker. This is a practice comparison, not a sensor reading.',
    coverHint: 'Walk to the trial bed, interact and decide between cover and bare soil.',
    doneHint: 'Your choice changed the visible trial bed. NASA data and real farm results were not inferred.',
    straw: 'Place straw cover',
    bare: 'Leave bare',
    replay: 'Replay fieldwork',
    picked: 'Soil probe equipped. Walk to the trial patch.',
    sampled: 'Soil appearance inspected. Moisture, salinity and fertility are unknown without ground tests.',
    choose: 'Choose a cover scenario. The outcomes are illustrations, not measured crop responses.',
    strawOutcome: 'SIMULATED: Surface cover is shown. It can protect exposed soil, but local water, pests, costs and crop fit still matter.',
    bareOutcome: 'SIMULATED: Bare soil remains exposed. No yield, water-saving or soil-health outcome is verified.',
  },
  ar: {
    title: 'شغل الغيط / تجربة عملية',
    badge: 'غيط خيالي · محاكاة',
    tool: '١ / ٣ · التقط مسبار التربة بجوار ندى',
    sample: '٢ / ٣ · افحص مساحة التربة التجريبية',
    cover: '٣ / ٣ · اختار طريقة حماية الأرض',
    done: 'خلصت المهمة · تقدر تعيدها',
    toolHint: 'امشِ عند العلامة البرتقالية واضغط E أو زر التفاعل.',
    sampleHint: 'روح للعلامة التالية. ده تدريب مش قراءة من مستشعر حقيقي.',
    coverHint: 'روح للحوض التجريبي، اتفاعل، وبعدها اختار غطاء أو تربة عارية.',
    doneHint: 'قرارك غيّر شكل الحوض. ما استنتجناش بيانات NASA أو نتائج أرض حقيقية.',
    straw: 'حط غطاء قش',
    bare: 'سيب الأرض عارية',
    replay: 'إعادة المهمة',
    picked: 'اتجهز مسبار التربة. اتجه للحوض التجريبي.',
    sampled: 'اتعاين شكل التربة. الرطوبة والملوحة والخصوبة غير معروفة من غير قياس أرضي.',
    choose: 'اختار سيناريو الغطاء. النتائج توضيحية، مش نمو محصول مقاس.',
    strawOutcome: 'محاكاة: ظهر غطاء التربة. ممكن يحمي السطح، لكن المياه والتكلفة والآفات والملاءمة لازم تتراجع.',
    bareOutcome: 'محاكاة: سطح التربة فضل مكشوف. مفيش نتائج إنتاج أو توفير مياه مؤكدة.',
  },
};

export class FieldworkActivity {
  constructor({scene, host, nada, hud, onProgress = () => {}, reducedMotion = false}) {
    this.scene = scene;
    this.host = host;
    this.nada = nada;
    this.hud = hud;
    this.onProgress = onProgress;
    this.reducedMotion = reducedMotion;
    this.lang = hud.lang === 'ar' ? 'ar' : 'en';
    this.state = freshFieldworkState();
    this.choiceOpen = false;
    this.lastOutcome = '';
    this.elapsed = 0;
    this.locations = {
      fieldwork_tool: new BABYLON.Vector3(-6, 0, 2.5),
      fieldwork_sample: new BABYLON.Vector3(-2, 0, -3),
      fieldwork_cover: new BABYLON.Vector3(5, 0, -14),
    };
    this.targets = {
      fieldwork_tool: {id: 'fieldwork_tool', nameEn: 'soil probe', nameAr: 'مسبار التربة', position: this.locations.fieldwork_tool},
      fieldwork_sample: {id: 'fieldwork_sample', nameEn: 'trial soil sample', nameAr: 'عينة التربة التجريبية', position: this.locations.fieldwork_sample},
      fieldwork_cover: {id: 'fieldwork_cover', nameEn: 'cover-crop practice bed', nameAr: 'حوض الغطاء التجريبي', position: this.locations.fieldwork_cover},
    };
    this._buildObjects();
    this._buildPanel();
    this._sync();
  }

  _buildObjects() {
    const markerMat = new BABYLON.StandardMaterial('fieldworkMarkerMat', this.scene);
    markerMat.diffuseColor = new BABYLON.Color3(1, 0.59, 0.13);
    markerMat.emissiveColor = new BABYLON.Color3(0.55, 0.22, 0.02);
    this.marker = BABYLON.MeshBuilder.CreateTorus('fieldworkObjectiveRing', {diameter: 1.2, thickness: 0.13, tessellation: 20}, this.scene);
    this.marker.material = markerMat;
    this.marker.rotation.x = Math.PI / 2;

    const toolMat = new BABYLON.StandardMaterial('fieldworkProbeMat', this.scene);
    toolMat.diffuseColor = new BABYLON.Color3(0.17, 0.67, 0.65);
    toolMat.emissiveColor = new BABYLON.Color3(0.02, 0.15, 0.13);
    this.probe = BABYLON.MeshBuilder.CreateCylinder('fieldworkSoilProbe', {height: 1.05, diameter: 0.10, tessellation: 10}, this.scene);
    this.probe.material = toolMat;

    const bareMat = new BABYLON.StandardMaterial('fieldworkBareMat', this.scene);
    bareMat.diffuseColor = new BABYLON.Color3(0.48, 0.30, 0.18);
    const strawMat = new BABYLON.StandardMaterial('fieldworkStrawMat', this.scene);
    strawMat.diffuseColor = new BABYLON.Color3(0.85, 0.72, 0.34);
    this.bareMat = bareMat;
    this.strawMat = strawMat;
    this.bed = BABYLON.MeshBuilder.CreateBox('fieldworkTrialBed', {width: 3, depth: 2, height: 0.12}, this.scene);
    this.bed.position.set(5, 0.16, -14);
    this.bed.material = bareMat;
    this.strawRows = [];
    for (let n = 0; n < 5; n++) {
      const row = BABYLON.MeshBuilder.CreateBox('fieldworkStrawRow' + n, {width: 2.65, depth: 0.16, height: 0.05}, this.scene);
      row.position.set(5, 0.26, -14.8 + n * 0.4);
      row.material = strawMat;
      this.strawRows.push(row);
    }
  }

  _buildPanel() {
    const panel = document.createElement('aside');
    panel.id = 'fieldwork-panel';
    panel.className = 'fieldwork-panel';
    panel.setAttribute('aria-label', 'Fieldwork interactive quest');
    panel.dir = this.lang === 'ar' ? 'rtl' : 'ltr';

    this.title = document.createElement('strong');
    this.title.className = 'fieldwork-title';
    this.badge = document.createElement('small');
    this.badge.className = 'fieldwork-evidence';
    this.objective = document.createElement('p');
    this.objective.className = 'fieldwork-objective';
    this.objective.setAttribute('aria-live', 'polite');
    this.hint = document.createElement('p');
    this.hint.className = 'fieldwork-hint';
    this.choiceBox = document.createElement('div');
    this.choiceBox.className = 'fieldwork-choices';
    this.choiceBox.hidden = true;
    this.strawButton = document.createElement('button');
    this.strawButton.type = 'button';
    this.strawButton.id = 'fieldwork-choice-straw';
    this.strawButton.addEventListener('click', () => this.choose('straw'));
    this.bareButton = document.createElement('button');
    this.bareButton.type = 'button';
    this.bareButton.id = 'fieldwork-choice-bare';
    this.bareButton.addEventListener('click', () => this.choose('bare'));
    this.choiceBox.append(this.strawButton, this.bareButton);
    this.outcome = document.createElement('p');
    this.outcome.className = 'fieldwork-outcome';
    this.outcome.setAttribute('role', 'status');
    this.replay = document.createElement('button');
    this.replay.id = 'fieldwork-replay';
    this.replay.className = 'fieldwork-replay';
    this.replay.type = 'button';
    this.replay.addEventListener('click', () => this.reset());
    panel.append(this.title, this.badge, this.objective, this.hint, this.choiceBox, this.outcome, this.replay);
    this.host.appendChild(panel);
    this.panel = panel;
  }

  getInteractables() {
    const id = fieldworkTarget(this.state);
    return id ? [this.targets[id]] : [];
  }

  handleInteraction(target) {
    if (!target || !Object.hasOwn(this.targets, target.id)) return false;
    const result = advanceFieldwork(this.state, target.id);
    if (!result.handled) return false;
    this.state = result.state;
    this.choiceOpen = result.event === 'choose_cover';
    this.lastOutcome = result.event;
    this._sync();
    this.onProgress();
    const words = WORDS[this.lang];
    const message = result.event === 'probe_collected' ? words.picked
      : result.event === 'soil_compared' ? words.sampled : words.choose;
    this.hud.showTelemetryToast(this.lang === 'ar' ? 'تجربة الحقل' : 'Hands-on fieldwork', message, 'simulated');
    if (this.choiceOpen) this.strawButton.focus();
    return true;
  }

  choose(choice) {
    if (!this.choiceOpen) return false;
    const result = chooseFieldworkCover(this.state, choice);
    if (!result.handled) return false;
    this.state = result.state;
    this.choiceOpen = false;
    this.lastOutcome = result.event;
    this._sync();
    this.onProgress();
    this.hud.showTelemetryToast(this.lang === 'ar' ? 'نتيجة الحوض التجريبي' : 'Practice bed result',
      WORDS[this.lang][choice === 'straw' ? 'strawOutcome' : 'bareOutcome'], 'simulated');
    this.replay.focus();
    return true;
  }

  setLanguage(language) {
    this.lang = language === 'ar' ? 'ar' : 'en';
    this._sync();
  }

  reset() {
    this.state = freshFieldworkState();
    this.choiceOpen = false;
    this.lastOutcome = '';
    this._sync();
    this.onProgress();
  }

  _sync() {
    const w = WORDS[this.lang];
    const stage = this.state.stage;
    this.panel.dir = this.lang === 'ar' ? 'rtl' : 'ltr';
    this.panel.dataset.stage = stage;
    this.title.textContent = w.title;
    this.badge.textContent = w.badge;
    this.objective.textContent = w[stage];
    this.hint.textContent = w[stage + 'Hint'];
    this.choiceBox.hidden = !this.choiceOpen;
    this.strawButton.textContent = w.straw;
    this.bareButton.textContent = w.bare;
    this.replay.textContent = w.replay;
    this.replay.hidden = stage !== 'done';
    this.outcome.textContent = stage === 'done'
      ? w[this.state.coverChoice === 'straw' ? 'strawOutcome' : 'bareOutcome']
      : this.lastOutcome === 'soil_compared' ? w.sampled : '';

    const id = fieldworkTarget(this.state);
    this.marker.setEnabled(Boolean(id));
    if (id) {
      this.marker.position.copyFrom(this.locations[id]);
      this.marker.position.y = 1.5;
    }
    this.probe.parent = this.state.hasProbe ? this.nada.root : null;
    if (this.state.hasProbe) this.probe.position.set(0.34, 0.65, 0.18);
    else this.probe.position.set(-6, 0.7, 2.5);
    this.bed.material = this.state.coverChoice === 'straw' ? this.strawMat : this.bareMat;
    this.strawRows.forEach(row => row.setEnabled(this.state.coverChoice === 'straw'));
  }

  tick(deltaTime) {
    if (!this.reducedMotion && this.marker.isEnabled()) {
      this.elapsed += deltaTime;
      this.marker.position.y = 1.5 + Math.sin(this.elapsed * 2.5) * 0.12;
    }
  }
}
