/**
 * SOLIQ: The Seventh Field - Time Echo Mechanic
 * "ست غيطان، وسبع حكايات. الغيط السابع هو المستقبل اللي لسه ما اتزرعش."
 * Walking into the Seventh Field renders a transparent alternate-future projection
 * with side-by-side scientific ledger and conservative interval regret uncertainty certificate.
 */

export class TimeEchoSystem {
  constructor(scene, village) {
    this.scene = scene;
    this.village = village;
    this.isActive = false;

    // Field 7 bounds: center (68, 0.02, 0), width 18, depth 22
    this.bounds = {
      minX: 59,
      maxX: 77,
      minZ: -11,
      maxZ: 11,
    };

    this.echoMesh = null;
    this._buildEchoHologram();
  }

  _buildEchoHologram() {
    if (typeof BABYLON === 'undefined') return;
    // Holographic alternate-future vegetation volume
    this.echoMesh = BABYLON.MeshBuilder.CreateBox(
      'timeEchoVolume',
      { width: 17, height: 1.8, depth: 21 },
      this.scene
    );
    this.echoMesh.position.set(68, 0.9, 0);

    const echoMat = new BABYLON.StandardMaterial('echoMat', this.scene);
    echoMat.diffuseColor = new BABYLON.Color3(0.1, 0.8, 0.9);
    echoMat.emissiveColor = new BABYLON.Color3(0.05, 0.35, 0.45);
    echoMat.alpha = 0.0; // Hidden initially
    this.echoMesh.material = echoMat;
  }

  checkPlayerInside(playerPos) {
    const isInside =
      playerPos.x >= this.bounds.minX &&
      playerPos.x <= this.bounds.maxX &&
      playerPos.z >= this.bounds.minZ &&
      playerPos.z <= this.bounds.maxZ;

    if (isInside !== this.isActive) {
      this.isActive = isInside;
      this.setEchoActive(isInside);
    }

    return this.isActive;
  }

  setEchoActive(active) {
    this.isActive = active;
    if (this.echoMesh) {
      this.echoMesh.material.alpha = active ? 0.35 : 0.0;
    }
  }

  getScenarioComparison() {
    return {
      titleAr: 'صدى الزمن: مقارنة الغيط السابع',
      titleEn: 'Time Echo: The Seventh Field Comparative Futures',
      notice: 'SIMULATION — NOT SATELLITE OBSERVATION',
      evidenceStatus: 'SIMULATED',
      comparisonStatus: 'comparison_only',
      baseline: {
        id: 'A_monoculture',
        nameAr: 'السيناريو أ: زراعة أحادية مكثفة (قمح مكرر)',
        nameEn: 'Scenario A: Intensive Monoculture (Continuous Wheat)',
        waterDemand: 'غير محسوب / not calculated',
        soilNitrogenDeficit: 'غير محسوب / not calculated',
        canalWindowRisk: 'غير محدد — يتطلب تشغيل السيناريو',
      },
      alternative: {
        id: 'B_diversified',
        nameAr: 'السيناريو ب: دورة زراعية متوازنة (قمح ثم برسيم ثم بقوليات)',
        nameEn: 'Scenario B: Evidence-Aware Rotation (Wheat -> Berseem -> Legumes)',
        waterDemand: 'غير محسوب / not calculated',
        soilNitrogenDeficit: 'غير محسوب / not calculated',
        canalWindowRisk: 'غير محدد — يتطلب تشغيل السيناريو',
      },
      certificate: {
        method: 'Interval Regret Separation (FieldShift Paper §VI)',
        status: 'comparison_only',
        reasonAr: 'لا توجد فترات عدم يقين محسوبة لسيناريوهين فعليين — المقارنة توضيحية فقط وتستلزم بيانات واختبارات إضافية',
        reasonEn: 'No interval-regret certificate computed from two comparable scenario runs; evidence and local sampling still required',
        responsibleAction: 'طلب عينة تربة ميدانية بدل الاعتماد على التخمين',
      },
    };
  }

  update(deltaTime) {
    if (this.isActive && this.echoMesh) {
      // Gentle ethereal pulse
      const t = Date.now() / 1000;
      this.echoMesh.material.alpha = 0.28 + Math.sin(t * 3.0) * 0.08;
    }
  }
}
