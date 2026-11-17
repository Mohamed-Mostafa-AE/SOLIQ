/**
 * The Seventh Field chapter-one narrative beats.
 * Fictional motivations and dialogue never fabricate crop-model outcomes.
 */
export function getSeasonStoryBeat(flags = {}, activeOutcome = 'none') {
  const heard = Number(flags.talkedToHassan === true) + Number(flags.talkedToMaryam === true);
  const futureQuestion = flags.questionedFuture === true;
  const consequenceEn = flags.evidenceRequested
    ? 'You asked for NASA evidence; open the separate scientific workspace before treating either crop plan as tested.'
    : flags.inspectedSoil && flags.soilCoverChoice === 'living_cover'
      ? 'Your soil check and Maryam’s living-cover pledge unlock a fourth, explicitly assumed council experiment.'
      : flags.cooperationRiskFlag
        ? 'Your water-turn negotiations revealed unresolved cooperation risk; limited capacity cannot prove real head-to-tail pressure.'
        : '';
  const consequenceAr = flags.evidenceRequested
    ? 'طلبتي دليل NASA؛ افتحي أداة المحاصيل العلمية قبل اعتبار أي تقويم مختبرًا.'
    : flags.inspectedSoil && flags.soilCoverChoice === 'living_cover'
      ? 'فحص التربة واتفاق الغطاء الحي مع مريم فتحا تجربة رابعة افتراضية في المجلس.'
      : flags.cooperationRiskFlag
        ? 'مفاوضات الأدوار كشفت مخاطر تعاون غير محسومة؛ السعة المحدودة لا تثبت ضغط المياه في آخر المسقة.'
        : '';
  if (['equilibrium', 'bottleneck', 'deferral'].includes(activeOutcome)) {
    return Object.freeze({
      stage: 'decision-recorded', heard, futureQuestion,
      titleEn: 'The water turn has consequences — the season is still unwritten',
      titleAr: 'قرار المياه اتسجل — لكن الموسم لسه ما اتكتبش',
      textEn: `Compare the fictional water ledger and community trade-offs. ${consequenceEn} No real crop-rotation winner is known until you inspect NASA weather context, soil assumptions and farmer priorities in the scientific workspace.`,
      textAr: `راجع حسابات المياه الافتراضية ومفاضلات المجتمع. ${consequenceAr} لا يوجد محصول أو دورة فائزة على أرض الواقع قبل مراجعة طقس NASA وافتراضات التربة وأولويات الفلاح في الأداة العلمية.`,
      sourceType: 'simulated',
    });
  }
  if (futureQuestion) {
    return Object.freeze({
      stage: 'mystery', heard, futureQuestion,
      titleEn: 'A seventh field, two possible seasons',
      titleAr: 'الأرض السابعة — موسمان محتملان',
      textEn: 'The old ledger poses a question: longer soil cover or a less water-demanding crop calendar? This is a story hypothesis, not a verified comparison. Talk to the village before deciding.',
      textAr: 'الدفتر القديم بيطرح سؤال: غطاء تربة أطول ولا دورة أقل طلبًا للمياه؟ ده سؤال قصة، مش مقارنة مثبتة. اسمع وجهات نظر أهل القرية قبل القرار.',
      sourceType: 'simulated',
    });
  }
  if (flags.firstClue && heard === 0) {
    const water = flags.firstClue === 'water';
    return Object.freeze({
      stage: 'thread', heard, futureQuestion,
      titleEn: water ? 'Follow the water — who receives the last turn?' : 'Follow the soil — what survives the dry season?',
      titleAr: water ? 'اتبع المياه: مين هيوصله آخر دور؟' : 'اتبع التربة: إيه اللي هيحميها في الموسم الجاف؟',
      textEn: water
        ? 'Your first clue is the old canal schedule. Ask Hassan what a fair turn means, then hear Maryam. The two crop plans are UNTESTED; neither promises a harvest.'
        : 'Your first clue is a torn crop calendar with different soil-cover periods. Ask Maryam what matters next season, then hear Hassan. The two plans are UNTESTED; neither promises a harvest.',
      textAr: water
        ? 'أول خيط جدول المياه القديم. اسأل حسن عن عدالة الدور ثم اسمع مريم. الخطتان افتراضيتان ومفيش ضمان للمحصول.'
        : 'أول خيط تقويم محاصيل ممزق وفترات مختلفة للغطاء النباتي. اسأل مريم ثم حسن. الخطتان افتراضيتان ومفيش ضمان للمحصول.',
      sourceType: 'simulated',
    });
  }
  if (heard === 2) {
    return Object.freeze({
      stage: 'council', heard, futureQuestion,
      titleEn: 'Two families heard. Now weigh the trade-offs.',
      titleAr: 'سمعت العيلتين — حان وقت الموازنة',
      textEn: `Hassan values reliable turns. Maryam cares about soil cover and tomorrow. ${consequenceEn} At the canal council, run a transparent allocation experiment or defer for field evidence. No choice produces a guaranteed harvest.`,
      textAr: `حسن محتاج انتظام الدور، ومريم شايفة قيمة الغطاء النباتي والموسم الجاي. ${consequenceAr} في مجلس المسقة جرّب توزيعًا افتراضيًا أو أجّل لحين دليل حقلي. مفيش اختيار بيضمن محصول.`,
      sourceType: 'simulated',
    });
  }
  return Object.freeze({
    stage: heard === 1 ? 'investigation' : 'arrival', heard, futureQuestion,
    titleEn: heard === 1 ? 'One voice is not the whole village' : 'The Seventh Field: A season not yet lived',
    titleAr: heard === 1 ? 'رأي واحد مش رأي القرية كلها' : 'الأرض السابعة: موسم لسه ما حصلش',
    textEn: 'At dawn, Nada finds two conflicting crop calendars in an old canal ledger. Six families must share one turn, and no one agrees which future is kinder to the land. Meet Hassan and Maryam, investigate the mystery, then choose a simulated water turn.',
    textAr: 'مع الفجر تلاقي ندى تقويمين مختلفين للمحاصيل في دفتر المسقة. ست عائلات بتشارك دور مياه واحد، ومحدش متفق أي مستقبل أنسب للأرض. قابل حسن ومريم وافحص اللغز وبعدها جرّب قرار مياه افتراضي.',
    sourceType: 'simulated',
  });
}
