/**
 * Sustainability themes for a fictional six-field water turn.
 * These notes never assert measured SDG achievement or NASA/UN endorsement.
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
