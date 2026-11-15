# SOLIQ — مراجعة تسليم Gemini/Argon العلمي (#5)

**تاريخ المراجعة:** 15 نوفمبر 2026. **أساس الفحص:** الملفات الأصلية الثلاثة المرفوعة من المستخدم (Manifest + `.tar.gz` + `.patch`)؛ مراجعة الكود و11 اختبارًا أصليًا؛ مراجعة مصادر NASA الرسمية؛ وتجهيز حزمة الدمج الآمن واختبارات إضافية. **لم يحدث Push أو Merge على GitHub من هذه الحزمة.**

## 1. الاستلام والنتيجة

- الأرشيف يحتوي 20 عنصرًا (15 ملفًا و5 أدلة) بالإضافة إلى Manifest؛ الكود 4,801 سطر تقريبًا.
- تسليم فعلي: GPM IMERG V07 adapter, HLS optical adapter, NASA POWER normalizer, three pilot configs, crop library, rotation generator, daily water balance, EO orchestration, interval regret implementation and 11 tests. No application UI changes.
- الاختبارات الأصلية منفردة على Node.js 22: **11/11 PASS**. تستعمل بيانات سنوية مُنشأة داخل test fixture وليست قياسات حقلية أو Granules محملة من NASA.
- تحديث GitHub: Issue #5 موجودة، لكن لم يظهر Branch `work/eo-science` أو PR لها على GitHub وقت المراجعة؛ عمل Gemini كان في الأرشيف وليس remote.

## 2. أهم مشكلة: «11 PASS» ليس «NASA Online Connected»

1. `fetchGpmImergV07()` يبحث في CMR لكنه يحاول `dataResp.json()` على رابط NetCDF4 `.nc4`/OPeNDAP؛ هذا ليس قارئ NetCDF أو subset حقيقي، ولا يعالج bytes/georeferencing مع SHA/QA.
2. `fetchHlsOpticalSeries()` يحاول `cogResp.json()` على رابط GeoTIFF `.tif`، ولا يقرأ raster/pixel window حقيقيًا. CMR metadata لوحدها غير كافية لاستخراج NDVI ميداني.
3. `verifiedGranulePayload` و`verifiedHlsPayload` في الأصل يوسمان أي كائن test/fixture بأنه `status: ok`, `authenticated: true` من غير تحقق raw hash/download provenance. الاختبار الأصلي كان قادرًا على إنتاج `actionable_advisory` من 365 يومًا **مصطنعة للاختبار**. غير مقبول كنظام نصيحة حقلية.
4. كود المطر الأصلي يضيف `randomErrorMmDay=15%` تقديريًا عند غياب خطأ NASA ويخزنه كأنه الحقل الأصلي؛ الإصدار المعدل يتركه `null`.
5. سجلات المطر بدون unit أصلي كان يتم افتراض mm/day تلقائيًا؛ الإصدار المعدل يرفض ذلك.
6. الحساب اليومي عند missing forcing يجعل ET0 والمطر صفرًا **للاستمرار الحسابي**. هذا قد يولّد محاكاة عددية غير موثوقة حتى لو `missingForcingDays` مفصّلة؛ يجب ألا تكون قابلة لتوصية. تحتاج إصلاح كامل/تصفية قبل الربط الحي.
7. المحاكاة ما زالت تعتمد على قيم محاصيل وتربة وأرباح إيضاحية مشتقة من الأدبيات، لا معايرة حقلية مستقلة. لا يصح وصف أرقام الأمثلة كقياسات NASA/فلاح.
8. `package.json` بالأرشيف يستبدل مشروع SOLIQ الأصلي ويزيل scripts `benchmark` و`dev`؛ و`science/interval-regret.js` ينافس محرك القرار الحالي المدمج بالفعل من PR #2. لا يجب تطبيق `.patch` الأصلي باستخدام `git am` بلا فصل.
9. ملف Manifest يشرح الخطوات القديمة على فرع `feat/omni-earth-prototypes-20261115` الذي دُمج بالفعل في `main`. الهدف الآمن لفرع جديد اليوم هو أحدث `main` مع PR إليه.

## 3. الحزمة المعدّلة الآمنة

- حذف `package.json` المستبدل؛ الاحتفاظ بـ `package.json` من main (الذي يشغل `npm test`, `npm run benchmark`, `npm run dev`).
- الاحتفاظ بمحتوى محرك القرار الحالي `science/interval-regret.js` كما هو؛ تسمية المحرك المتفرّع الجديد `science/eo-interval-regret.js` مع تحديث استيرادات خط EO فقط؛ لا يفترض التكافؤ العلمي بين الاثنين.
- تحويل **جميع** بيانات الـpayload المحقونة دون إثبات المصدر إلى `unverified_payload`، ومنع نتيجة `actionable_advisory` المبنية على fixture.
- إيقاف الادعاء أن NetCDF/COG JSON: حالة واضحة `binary_decoder_required` مع بقاء حالة Auth failures مميزة. **لم يتم تنفيذ decoder أو live raster في هذه الجولة.**
- لا تعويض مصطنع لقيمة `randomError`، ولا افتراض Unit مطر بدون تسمية.
- إضافة **5 اختبارات عدائية** جديدة (payload مزعوم أنه NASA، وحدة المطر المجهولة، قارئات binary)، وتحديث اختبار واحد ليؤكد `comparison_only` للبيانات المحقونة.
- تشغيل النسخة المستقلة بعد الإصلاح: **16/16 PASS** على Node 22. لم يتم تشغيل اختبارات SOLIQ المدمجة مع GitHub main، لأن الوصول من بيئة البناء إلى GitHub عبر git محجوب (DNS).

## 4. ما المتبقي لمسار #5 لكي يصبح DONE فعلًا؟

- [ ] OAuth/Bearer Earthdata وإعداد EULAs بشكل خاص، لا تسريب token إلى واجهة المستخدم.
- [ ] كتالوج CMR -> روابط granule قابلة للتحقق -> قارئ NetCDF4/OPeNDAP أو COG range/window حقيقي -> checksum/raw provenance وGeo metadata -> quality & coverage.
- [ ] أول مثال **NASA فعلي** مدعوم بتاريخ/URI/Version/Units/QA/Hash محفوظ وموثق (IMERG وHLS، في حالة توفر المصادر والتصاريح).
- [ ] التعامل مع V07 Final cutoff **2025-09-30** عند البحث عن تواريخ 2026؛ V07 Late قد يغطيها مع ملاحظة الاستمرارية/المعايرة، أو V08 عند توافره، ولا يجوز خلطهما سرًا. المصدر: NASA GPM official (Apr 2026).
- [ ] لا تحوّل أيام MET المفقودة إلى صفر داخل نموذج يستخرج توصية؛ يحتاج موافقة صريحة على سيناريو تعويضي أو returning unavailable/comparison_only.
- [ ] تدقيق HLS native 30m Fmask وcloud/shadow/water، عوامل scale والـNoData، مقارنة polygon والمجال الزمني مع مستشعرات الحقيقة.
- [ ] توصيل مخرجات EO بـ APIs وإثبات وحدة المساحة والتحويلات وقيود التربة والماء وموافقة مرشد زراعي.
- [ ] فصل نتائج البحث النظري والمقارنة المشروطة عن `actionable_advisory` حتى يتم تحقق واقعي مناسب.

## 5. أوامر دمج آمنة — على Clone أحدث main من GitHub

```
git clone https://github.com/Mohamed-Mostafa-AE/SOLIQ.git
cd SOLIQ
git switch -c work/eo-science-reviewed
# ضع ملف EO_SCIENCE_MERGE_SAFE_20261115.patch داخل مسار المشروع
# تأكد أولاً أنه لا يتعارض مع كود زملائك:
git apply --check EO_SCIENCE_MERGE_SAFE_20261115.patch
# patch بصيغة git-format-patch لذلك يمكن إدخاله كـcommit:
git am --3way EO_SCIENCE_MERGE_SAFE_20261115.patch
npm test
npm run benchmark
git push -u origin work/eo-science-reviewed
# افتح Pull Request من الفرع الجديد إلى main وراجعه مع علمي البيانات والـBackend.
```

**لا تستخدم أوامر Manifest الأصلية التي تستبدل package.json أو interval-regret.js.** Patch المراجع يُضيف ملفات جديدة فقط ويحتفظ بالنسخ الأساسية. GitHub Push لم يتم من هذه الجلسة؛ لم أختبر اتصال Earthdata حيًا أيضًا.
