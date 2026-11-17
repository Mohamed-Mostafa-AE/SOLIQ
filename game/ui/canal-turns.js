import {
  createCanalTurns, toggleCanalGate, runCanalTurn, resetCanalTurns,
  CANAL_GATE_IDS, CANAL_TURN_COUNT, CANAL_TURN_DEMANDS, CANAL_TURN_SUPPLY,
} from '../core/canal-turns.js';

const COPY = {
  en: {
    launch: 'Canal mission', title: 'OPERATE THE CANAL',
    intro: 'Two fictional one-hour turns. Open the intake and branch gates, then run the pump. Your choice changes six fields. Can every family receive a fair share?',
    badge: 'FICTIONAL WATER VOLUMES · SOLVER SIMULATION · NOT FIELD DATA',
    gate_head: 'Main intake', gate_hassan: 'Hassan branch · Fields 1–3',
    gate_maryam: 'Maryam branch · Fields 4–6',
    open: 'OPEN', closed: 'CLOSED', turn: 'Turn', supply: 'Available per turn',
    run: '▶ Run one-hour turn', replay: '↻ Try a different strategy',
    close: 'Close canal mission', missing: 'Open the main intake and at least one branch first.',
    result: 'One turn completed. Adjust the gates for the next turn; field soil visibly changes.',
    finished: 'Two turns complete. Compare covered needs and distribution balance, then replay.',
    coverage: 'Demand met', balance: 'Distribution balance', field: 'Field',
    empty: 'No water delivered yet. Use the gates below or walk to one and press E.',
    warning: 'This is a two-turn training puzzle with assumed demands, not canal hydraulics or a watering recommendation.',
  },
  ar: {
    launch: 'مهمة المسقاة', title: 'شَغِّل المسقاة بنفسك',
    intro: 'نوبتان خياليتان، كل واحدة ساعة. افتح المأخذ والبوابات الفرعية ثم شغّل الطلمبة. اختيارك يغيّر ستة حقول. هل تقدر توزع المياه بإنصاف؟',
    badge: 'كميات افتراضية · محاكاة بالمحرك · ليست قياسات حقلية',
    gate_head: 'المأخذ الرئيسي', gate_hassan: 'فرع حسن · الحقول ١–٣',
    gate_maryam: 'فرع مريم · الحقول ٤–٦',
    open: 'مفتوحة', closed: 'مغلقة', turn: 'النوبة', supply: 'المتاح لكل نوبة',
    run: '▶ شغّل نوبة ساعة', replay: '↻ جرّب استراتيجية تانية',
    close: 'اقفل مهمة المسقاة', missing: 'افتح المأخذ الرئيسي وبوابة فرعية واحدة على الأقل.',
    result: 'انتهت النوبة. غيّر البوابات للنوبة الجاية وشوف التربة بتتغير.',
    finished: 'خلصت النوبتان. قارن الاحتياجات الملباة وتوازن التوزيع، وجرب من جديد.',
    coverage: 'احتياجات تمت تلبيتها', balance: 'توازن التوزيع', field: 'الحقل',
    empty: 'لسه مفيش مياه اتوزعت. استخدم البوابات أو امشِ عند بوابة واضغط E.',
    warning: 'ده لغز تدريبي بنوبتين واحتياجات مفترضة، مش نموذج هيدروليكي لقناة حقيقية أو توصية ري.',
  },
};

/** UI and visible scene coupling; authoritative water arithmetic stays in the science solver. */
export class CanalTurnActivity {
  constructor({host, village, waterEngine, hud}) {
    this.host = host;
    this.village = village;
    this.waterEngine = waterEngine;
    this.hud = hud;
    this.lang = hud.lang === 'ar' ? 'ar' : 'en';
    this.state = createCanalTurns();
    this.ownsWaterVisuals = false;
    this.messageKey = 'empty';
    this._build();
    this._sync();
  }

  _build() {
    this.launch = document.createElement('button');
    this.launch.id = 'canal-turn-launch';
    this.launch.className = 'hud-tool-btn canal-turn-launch';
    this.launch.type = 'button';
    this.launch.setAttribute('aria-controls', 'canal-turn-panel');
    this.launch.setAttribute('aria-expanded', 'false');
    this.launch.addEventListener('click', () => this.open(!this.panel.hidden));
    const controls = this.host.querySelector('.hud-quick-tools');
    (controls || this.host).appendChild(this.launch);

    this.panel = document.createElement('section');
    this.panel.id = 'canal-turn-panel';
    this.panel.className = 'canal-turn-panel';
    this.panel.setAttribute('aria-label', 'Interactive fictional canal allocation challenge');
    this.panel.hidden = true;
    this.panel.innerHTML = `
      <div class="canal-turn-head"><strong class="canal-turn-title"></strong><button type="button" class="canal-turn-close" aria-label="Close canal mission">✕</button></div>
      <small class="canal-turn-badge"></small>
      <p class="canal-turn-intro"></p>
      <div class="canal-turn-stats"><span class="canal-turn-round"></span><span class="canal-turn-supply"></span></div>
      <div class="canal-turn-gates" role="group" aria-label="Fictional 3D canal gates"></div>
      <button type="button" class="canal-turn-run"></button>
      <p class="canal-turn-message" role="status" aria-live="polite"></p>
      <div class="canal-turn-result" aria-label="Six fictional field demand bars"></div>
      <p class="canal-turn-score" role="status"></p>
      <button type="button" class="canal-turn-replay"></button>
      <p class="canal-turn-warning"></p>`;
    this.host.appendChild(this.panel);
    this.nodes = Object.fromEntries([
      'title', 'badge', 'intro', 'round', 'supply', 'gates', 'run', 'message', 'result', 'score', 'replay', 'warning', 'close',
    ].map(name => [name, this.panel.querySelector(`.canal-turn-${name}`)]));
    this.nodes.close.addEventListener('click', () => this.open(true));
    this.nodes.run.addEventListener('click', () => this.runTurn());
    this.nodes.replay.addEventListener('click', () => this.reset());
    this.gateButtons = new Map();
    for (const id of CANAL_GATE_IDS) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.gate = id;
      button.addEventListener('click', () => this.toggleGate(id));
      this.nodes.gates.appendChild(button);
      this.gateButtons.set(id, button);
    }
  }

  open(shouldClose = false) {
    this.panel.hidden = shouldClose;
    this.launch.setAttribute('aria-expanded', String(!shouldClose));
    if (shouldClose) this.launch.focus();
    else this.nodes.close.focus();
  }

  handleInteraction(target) {
    if (!target || !CANAL_GATE_IDS.includes(target.id)) return false;
    if (this.state.complete) {
      this.open(false);
      return true;
    }
    this.toggleGate(target.id);
    this.open(false);
    return true;
  }

  toggleGate(id) {
    if (this.state.complete) return false;
    this.state = toggleCanalGate(this.state, id);
    this.village.setGateOpen(id, this.state.gates[id]);
    this._sync();
    return true;
  }

  runTurn() {
    const action = runCanalTurn(this.state);
    if (!action.acted) {
      this.messageKey = action.reason === 'complete' ? 'finished' : 'missing';
      this._sync();
      return false;
    }
    this.state = action.state;
    this.messageKey = this.state.complete ? 'finished' : 'result';
    this.waterEngine.setPumpState(true);
    this.ownsWaterVisuals = true;
    this.waterEngine.currentSimulation = action.result;
    this.waterEngine.applySimulationToWorld(action.result);
    this.state.delivered.forEach((amount, i) => {
      this.village.updateFieldHydration(i, amount / CANAL_TURN_DEMANDS[i]);
      // The visual water engine records this *turn* only. Keep each game's
      // field metadata coherent with the cumulative two-turn puzzle panel.
      if (this.village.fields[i]) {
        this.village.fields[i].delivered = amount;
        this.village.fields[i].shortfall = this.state.remaining[i];
      }
    });
    this._sync();
    this.hud.showTelemetryToast(
      this.lang === 'ar' ? 'نوبة المسقاة الخيالية' : 'Fictional canal turn',
      `${this.state.totalDelivered.toFixed(1)} m³ / ${CANAL_TURN_DEMANDS.reduce((s, n) => s + n, 0)} m³ · ${Math.round(this.state.balance * 100)}% ${COPY[this.lang].balance}. SIMULATED.`,
      'simulated',
    );
    return true;
  }

  reset() {
    this.state = resetCanalTurns();
    this.messageKey = 'empty';
    for (const id of CANAL_GATE_IDS) this.village.setGateOpen(id, false);
    if (this.ownsWaterVisuals) {
      this.waterEngine.setPumpState(false);
      CANAL_TURN_DEMANDS.forEach((demand, i) => {
        this.village.updateFieldHydration(i, 0);
        if (this.village.fields[i]) {
          this.village.fields[i].delivered = 0;
          this.village.fields[i].shortfall = demand;
        }
      });
    }
    this.ownsWaterVisuals = false;
    this._sync();
    return true;
  }

  setLanguage(lang) {
    this.lang = lang === 'ar' ? 'ar' : 'en';
    this._sync();
  }

  _sync() {
    const w = COPY[this.lang];
    this.panel.dir = this.lang === 'ar' ? 'rtl' : 'ltr';
    this.launch.innerHTML = `<span aria-hidden="true">🚰</span><span class="label"></span>`;
    this.launch.querySelector('.label').textContent = w.launch;
    this.launch.setAttribute('aria-label', w.launch);
    this.nodes.title.textContent = w.title;
    this.nodes.badge.textContent = w.badge;
    this.nodes.intro.textContent = w.intro;
    this.nodes.close.setAttribute('aria-label', w.close);
    this.nodes.round.textContent = `${w.turn} ${this.state.round} / ${CANAL_TURN_COUNT}`;
    this.nodes.supply.textContent = `${w.supply}: ${CANAL_TURN_SUPPLY} m³`;
    for (const [id, button] of this.gateButtons) {
      button.textContent = `${w[id]} · ${this.state.gates[id] ? w.open : w.closed}`;
      button.setAttribute('aria-pressed', String(this.state.gates[id]));
      button.disabled = this.state.complete;
    }
    this.nodes.run.textContent = w.run;
    this.nodes.run.disabled = this.state.complete;
    this.nodes.message.textContent = w[this.messageKey];
    this.nodes.replay.textContent = w.replay;
    this.nodes.replay.hidden = this.state.round === 0;
    this.nodes.warning.textContent = w.warning;
    this.nodes.score.textContent = `${w.coverage}: ${Math.round(this.state.coverage * 100)}% · ${w.balance}: ${Math.round(this.state.balance * 100)}%`;
    this.nodes.result.replaceChildren();
    this.state.delivered.forEach((amount, index) => {
      const row = document.createElement('div');
      row.className = 'canal-turn-field';
      const label = document.createElement('span');
      label.textContent = `${w.field} ${index + 1}: ${amount.toFixed(1)} / ${CANAL_TURN_DEMANDS[index]} m³`;
      const meter = document.createElement('progress');
      meter.max = CANAL_TURN_DEMANDS[index];
      meter.value = amount;
      meter.setAttribute('aria-label', label.textContent);
      row.append(label, meter);
      this.nodes.result.appendChild(row);
    });
  }
}
