/**
 * English-first UI strings for The Seventh Field.
 * The existing Arabic game remains selectable; the scientific application
 * keeps its independent bilingual language setting.
 */
const UI_TEXT = Object.freeze({
  '.hud-badge': ['Soil-IQ · The Seventh Field', 'Soil-IQ · الأرض السابعة'],
  '#hud-objective-title': ['Chapter 0: A Season Unwritten', 'الفصل صفر: موسم لسه ما اتكتبش'],
  '#btn-earth-lens .label': ['Earth Lens', 'عدسة الأرض'],
  '#btn-notebook .label': ['Evidence', 'دفتر الأدلة'],
  '#btn-camera .label': ['Camera', 'استراتيجي'],
  '#btn-story-desk .label': ['Story mode', 'وضع القصة'],
  '.lens-label': ['View mode:', 'وضع الرؤية:'],
  '[data-lens="ground"]': ['🌱 Village Ground', '🌱 واقع القرية (Ground)'],
  '[data-lens="nasa"]': ['🛰️ NASA Source Context', '🛰️ رصد NASA الفضائي'],
  '[data-lens="future"]': ['🔮 Modelled Future', '🔮 محاكاة المستقبل (Modelled)'],
  '#prompt-text': ['Press E or tap to interact', 'اضغط للتفاعل'],
  '#dialogue-speaker': ['Uncle Hassan', 'عم حسن'],
  '#dialogue-text': ['Welcome to The Seventh Field.', 'يا أهلاً يا باشمهندسة ندى...'],
  '.notebook-header h2': ['📖 Evidence Notebook', '📖 دفتر الأدلة وسند القياسات (Evidence Notebook)'],
  '[data-nbtab="receipts"]': ['Mission Records', 'سندات الأدلة (Evidence Receipts)'],
  '[data-nbtab="water"]': ['Canal Water Ledger', 'ميزان المسقة (Mesqa Ledger)'],
  '[data-nbtab="provenance"]': ['Sources & Limits', 'المصادر والحدود العلمية'],
  '.provenance-content h3': ['Science & Source Limits', 'إخلاء المسؤولية العلمية والشفافية (Scientific Provenance)'],
  '.provenance-content p:nth-of-type(1)': [
    'NASA POWER: regional weather context, not a live field soil sensor.',
    'NASA POWER Sakha: بيانات إقليمية تاريخية، وليست رصدًا لحظيًا لحقل خاص.',
  ],
  '.provenance-content p:nth-of-type(2)': [
    'Canal solver: fictional water turns are computed by the shared allocation engine, not by the visual layer.',
    'Codex Water Solver: الحسابات تتم بدقة عبر خوارزمية allocateWater دون تكرار الحسابات بالواجهة.',
  ],
  '.provenance-content p:nth-of-type(3)': [
    'The Seventh Field: fictional story and water allocation; no observed field measurements, crop-rotation forecast, or field-ready irrigation prescription.',
    'The Seventh Field: حكاية ومحاكاة توزيع مياه افتراضيتان، دون قياسات حقلية أو تنبؤات موثقة للمحاصيل أو وصفة ري حقيقية.',
  ],
  '#rotation-bridge-title': ['Field Shift: Crop Rotation Decision Support', 'Field Shift: مقارنة دورات المحاصيل'],
  '#rotation-bridge-copy': [
    'Compare crop calendars in the separate scientific workspace using source-labelled NASA weather context, declared soil parameters and farmer priorities. The fictional game does not transfer farm data.',
    'قارن دورات المحاصيل داخل مساحة التحليل العلمي باستخدام سياق الطقس الموثق المصدر من NASA، وخصائص التربة المعلنة، وأولويات المزارع. اللعبة خيالية ولا تنقل بيانات مزرعة حقيقية.',
  ],
  '#open-rotation-workspace': ['Open Crop Rotation Workspace ↗', 'افتح مساحة مقارنة دورات المحاصيل ↗'],
  '.settings-header h2': ['⚙️ Display & Accessibility', '⚙️ إعدادات العرض والأداء'],
  '#select-quality option[value="balanced"]': ['Balanced', 'متوازن (Balanced 60fps)'],
  '#select-quality option[value="low"]': ['Low (older devices)', 'منخفض للأجهزة القديمة (Low 30fps)'],
  '#select-quality option[value="ultra"]': ['Ultra', 'فائق (Ultra Shadows & Bloom)'],
  '#select-lang option[value="en"]': ['English (default)', 'English (Official Subtitles)'],
  '#select-lang option[value="ar"]': ['العربية / Arabic', 'العربية (اللهجة المصرية + ترجمة فصحى)'],
  '#btn-touch-interact': ['Interact ⚡', 'تفاعل ⚡'],
  '#btn-touch-lens': ['Lens 🛰️', 'عدسة 🛰️'],
  '#btn-touch-book': ['Notebook 📖', 'دفتر 📖'],
  '#btn-touch-story': ['Story 📜', 'قصة 📜'],
});
const UI_TITLES = Object.freeze({
  '#btn-earth-lens': ['Earth Lens (1/2/3)', 'عدسة الأرض (1/2/3)'],
  '#btn-notebook': ['Evidence Notebook (N)', 'دفتر الأدلة (N)'],
  '#btn-camera': ['Switch camera (Tab)', 'تبديل الكاميرا (Tab)'],
  '#btn-story-desk': ['Accessible text-first story mode', 'مسار القصة النصي الميسّر'],
  '#btn-settings': ['Settings', 'الإعدادات'],
  '#btn-touch-interact': ['Interact', 'تفاعل'],
  '#btn-touch-lens': ['Earth Lens', 'العدسة'],
  '#btn-touch-book': ['Evidence Notebook', 'الدفتر'],
  '#btn-touch-story': ['Accessible story mode', 'وضع القصة الميسّر'],
});
const FORM_LABELS = Object.freeze({
  '#select-quality': ['Graphics quality:', 'جودة الرسوم (Graphics Preset):'],
  '#select-lang': ['Language / subtitles:', 'لغة الحوار والترجمة (Language):'],
  '#chk-reduced-motion': ['Reduced motion', 'تقليل الحركة (Reduced Motion)'],
});

export function localizeGameUi(container, language = 'en') {
  const index = language === 'ar' ? 1 : 0;
  const root = container.querySelector('#soliq-game-hud');
  if (!root) return;
  root.setAttribute('dir', index === 1 ? 'rtl' : 'ltr');
  for (const [selector, pair] of Object.entries(UI_TEXT)) {
    const target = root.querySelector(selector);
    if (target) target.textContent = pair[index];
  }
  for (const [selector, pair] of Object.entries(UI_TITLES)) {
    const target = root.querySelector(selector);
    if (target) target.setAttribute('title', pair[index]);
  }
  for (const [selector, pair] of Object.entries(FORM_LABELS)) {
    const input = root.querySelector(selector);
    const label = input?.closest('label');
    // Preserve the actual select/checkbox node and event listeners.
    const textNode = label && [...label.childNodes].find((node) => node.nodeType === 3 && node.textContent.trim());
    if (textNode) textNode.textContent = pair[index] + ' ';
  }
}
