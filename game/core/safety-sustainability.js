/**
 * The Seventh Field — fictional learning safeguards and SDG context.
 * These checks are game progress, NOT a physical pump safety certification.
 * No real-world agricultural, electrical or worker-safety approval is produced.
 */
export const SAFETY_CHECKS = Object.freeze([
  Object.freeze({
    id: 'pumpInspected',
    titleEn: 'Review pump and electrical hazards',
    titleAr: 'مراجعة مخاطر الطلمبة والكهرباء',
    lessonEn: 'Do not operate damaged or uninspected equipment. Stop and ask a qualified operator to inspect it.',
    lessonAr: 'لا تشغّل معدات تالفة أو غير مفحوصة. أوقف التشغيل واطلب فحص مختص.',
  }),
  Object.freeze({
    id: 'canalAccessSecured',
    titleEn: 'Keep workers away from unsafe canal edges',
    titleAr: 'إبعاد العاملين عن حواف القناة غير الآمنة',
    lessonEn: 'Keep people clear of moving gates, open water and unstable banks; never enter a canal for this mission.',
    lessonAr: 'ابتعد عن البوابات المتحركة والمياه المفتوحة والحواف غير المستقرة، ولا تدخل القناة.',
  }),
  Object.freeze({
    id: 'heatPrecautionsReviewed',
    titleEn: 'Plan for outdoor heat exposure',
    titleAr: 'مراجعة احتياطات العمل في الحر',
    lessonEn: 'Check for heat risk and plan shade, water, breaks and local safety advice before outdoor work.',
    lessonAr: 'راجع مخاطر الحر ووفر الظل والماء والراحة واستشر تعليمات السلامة المحلية.',
  }),
]);

const VALID_IDS = new Set(SAFETY_CHECKS.map((step) => step.id));

export function assessPumpReadiness(flags = {}) {
  const missing = SAFETY_CHECKS.filter((step) => flags[step.id] !== true);
  return {
    readyForFictionalMission: missing.length === 0,
    missing,
    completed: SAFETY_CHECKS.length - missing.length,
    total: SAFETY_CHECKS.length,
    evidenceClass: 'simulated_training',
    realWorldApproval: false,
  };
}

export function completeSafetyCheck(flags = {}, id) {
  if (!VALID_IDS.has(id)) throw new RangeError('Unknown safety training check');
  return { ...flags, [id]: true };
}

/**
 * SDG links are educational themes, not measured impact or UN endorsement.
 * Irrigation metrics must originate in the existing temporal water solver.
 */
export function sustainabilityLesson(outcome, result = null) {
  if (!['equilibrium', 'bottleneck', 'deferral'].includes(outcome)) {
    throw new RangeError('Unknown game outcome');
  }
  const themes = Object.freeze(['SDG 2: Sustainable agriculture', 'SDG 6: Water management', 'SDG 12: Responsible resource use', 'SDG 13: Climate resilience']);
  const lessons = {
    equilibrium: {
      en: 'Coordinated allocation is a community trade-off. Inspect the simulated delivery, shortages and fairness; the numbers do not prove real water savings.',
      ar: 'التوزيع المنسق مفاضلة مجتمعية. راجع المياه والعجز والعدالة المحاكاة؛ الأرقام لا تثبت توفير مياه حقيقيًا.',
    },
    bottleneck: {
      en: 'Limited supply exposes a water-access trade-off. Consider shared schedules and capacity constraints rather than promising every field enough water.',
      ar: 'سعة الإمداد المحدودة تكشف مفاضلة في الحصول على المياه. راجع الأدوار والقيود بدل الوعد بوصول مياه كافية للجميع.',
    },
    deferral: {
      en: 'Pausing to seek field evidence can be responsible. This scenario makes no claim that water, energy or yield changed.',
      ar: 'تأجيل القرار لطلب دليل حقلي قد يكون مسؤولًا. لا يدعي السيناريو تغير المياه أو الطاقة أو الإنتاج.',
    },
  };
  const measured = result && Number.isFinite(result.deliveredTotal) && Number.isFinite(result.fairness)
    ? { simulatedDeliveredM3: result.deliveredTotal, simulatedJainFairness: result.fairness }
    : null;
  return Object.freeze({
    outcome,
    themes,
    titleEn: 'Sustainability trade-offs — simulated learning',
    titleAr: 'مفاضلات الاستدامة — تعلم بمحاكاة',
    textEn: lessons[outcome].en,
    textAr: lessons[outcome].ar,
    evidenceClass: 'simulated',
    realWorldImpactVerified: false,
    metrics: measured,
  });
}
