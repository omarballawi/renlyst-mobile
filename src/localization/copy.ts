import type { AppLanguage } from './LocaleProvider';

const arabicCopy: Record<string, string> = {
  'Profiles in your next mix': 'الملفات في مجموعتك التالية',
  'Real profiles. Real saved facts. Five short prompts.':
    'ملفات حقيقية. حقائق محفوظة. خمسة أسئلة قصيرة.',
  'Remove key': 'حذف المفتاح',
  'Your answer is still here.': 'إجابتك ما زالت هنا.',
  'Renlyst could not save this review. Retry without leaving the session.':
    'تعذّر على رينليست حفظ هذه المراجعة. حاول مجدداً من دون مغادرة الجلسة.',
  'Try saving answer again': 'حاول حفظ الإجابة مجدداً',
  'The key will be deleted from protected device storage. Provider features can be configured again later.':
    'سيُحذف المفتاح من التخزين المحمي على الجهاز. يمكنك إعداد ميزات المزوّد مجدداً لاحقاً.',
  'The protected key could not be removed. Nothing else was changed.':
    'تعذّر حذف المفتاح المحمي. لم يتغير أي شيء آخر.',
  'NOT SAVED': 'غير محفوظ',
  'Enter a replacement key': 'أدخل مفتاحاً بديلاً',
  'Removing…': 'جارٍ الحذف…',
  'DEVICE ONLY': 'على الجهاز فقط',
  MANAGEMENT: 'التدبير',
  'No mechanism is saved yet.': 'لم تُحفظ آلية العمل بعد.',
  'Package preview · tap Brands & packages for every image':
    'معاينة العبوة · اضغط «العلامات والعبوات» لعرض كل الصور',
  'Protected settings did not open.': 'تعذّر فتح الإعدادات المحمية.',
  'Renlyst could not read iOS protected storage. Your saved keys were not changed.':
    'تعذّر على رينليست قراءة التخزين المحمي في iOS. لم تتغير مفاتيحك المحفوظة.',
  'Try protected settings again': 'حاول فتح الإعدادات المحمية مجددًا',
  'RENLYST RECOVERY': 'استعادة رينليست',
  'Let’s get you back to learning.': 'لنُعدك إلى التعلّم.',
  'Renlyst hit an unexpected interface error. Your library, images, and private learning records were not included in the diagnostic report.':
    'واجه رينليست خطأً غير متوقع في الواجهة. لم تُدرج مكتبتك أو صورك أو سجلات تعلّمك الخاصة في تقرير التشخيص.',
  'Try again': 'حاول مرة أخرى',
  'Return home': 'العودة إلى الرئيسية',
  'Copy diagnostics': 'نسخ التشخيص',
  'Diagnostics copied': 'تم نسخ التشخيص',
  'Report a bug': 'الإبلاغ عن خطأ',
  Today: 'اليوم',
  Library: 'المكتبة',
  Practice: 'التدريب',
  Training: 'التدريب الميداني',
  You: 'أنت',
  Back: 'رجوع',
  Close: 'إغلاق',
  Cancel: 'إلغاء',
  Edit: 'تعديل',
  Save: 'حفظ',
  Delete: 'حذف',
  Add: 'إضافة',
  Search: 'بحث',
  Settings: 'الإعدادات',
  Optional: 'اختياري',
  '(optional)': '(اختياري)',
  'Quick label': 'وصف سريع',
  'Package identity': 'هوية العبوة',
  'Optional details improve source matching and override generated guesses.':
    'التفاصيل الاختيارية تحسّن مطابقة المصدر وتتقدّم على التخمينات المولّدة.',
  'Comma-separated brands': 'علامات تجارية مفصولة بفواصل',
  'CHAPTER / SYSTEM': 'الفصل / الجهاز',
  Route: 'طريق الإعطاء',
  Manufacturer: 'الشركة المصنّعة',
  Country: 'البلد',
  'e.g. furosemide': 'مثال: Furosemide',
  'e.g. Lasix': 'مثال: Lasix',
  'Strength, e.g. 40 mg': 'التركيز، مثال: 40 mg',
  'Form, e.g. tablet': 'الشكل، مثال: قرص',
  'e.g. Loop diuretic': 'مثال: Loop diuretic',
  'e.g. 40 mg': 'مثال: 40 mg',
  'e.g. tablet': 'مثال: قرص',
  'e.g. oral': 'مثال: فموي',
  'Active ingredient or brand': 'المادة الفعالة أو العلامة التجارية',
  'Required before save': 'مطلوب قبل الحفظ',
  'Example: Furosemide': 'مثال: Furosemide',
  'Identity text only—never patient details': 'نص هوية العبوة فقط — لا تدخل بيانات المريض',
  'Ingredient, brand, Arabic, shelf…': 'المادة، العلامة، العربية، الرف…',
  'Drug, class, system, note, Arabic…': 'الدواء، الفئة، الجهاز، الملاحظة، العربية…',
  'Measured weight': 'الوزن المقاس',
  'One per line': 'عنصر واحد في كل سطر',
  'One question per line': 'سؤال واحد في كل سطر',
  'A specific next action': 'خطوة تالية محددة',
  'No patient details': 'من دون أي بيانات للمريض',
  Unknown: 'غير معروف',
  Other: 'أخرى',
  All: 'الكل',
  Due: 'مستحق',
  'Needs attention': 'يحتاج إلى اهتمام',
  'No photo': 'بلا صورة',
  Name: 'الاسم',
  Recent: 'الأحدث',
  'Due first': 'المستحق أولاً',
  'Weakest first': 'الأضعف أولاً',
  Profiles: 'الملفات',
  Brands: 'العلامات التجارية',
  Mastered: 'متقن',
  Reviews: 'المراجعات',
  Shifts: 'المناوبات',
  Encounters: 'الحالات التعليمية',
  Reports: 'التقارير',
  Images: 'الصور',
  'Make today stick.': 'ثبّت معلومة اليوم.',
  'One useful step now beats a crowded study plan later.':
    'خطوة مفيدة الآن أفضل من خطة دراسة مزدحمة لاحقاً.',
  Renlyst: 'رينليست',
  "TODAY'S FOCUS": 'تركيز اليوم',
  'Add one drug': 'أضف دواءً واحداً',
  'Start with a package you saw today.': 'ابدأ بعبوة رأيتها اليوم.',
  'One five-question session. Nothing else.': 'جلسة واحدة من خمسة أسئلة. لا شيء آخر.',
  'Practice weak drugs': 'راجع الأدوية الضعيفة',
  'Strengthen the checks that need attention.': 'قوِّ نقاط المعرفة التي تحتاج إلى مراجعة.',
  'Finish shift reflection': 'أكمل تأمل المناوبة',
  'Capture what you learned before leaving.': 'سجّل ما تعلمته قبل المغادرة.',
  "Add today's drug": 'أضف دواء اليوم',
  'Keep your library connected to the shelf.': 'أبقِ مكتبتك مرتبطة بما تراه على الرف.',
  'Your next useful review': 'مراجعتك المفيدة التالية',
  'Continue building mastery': 'واصل بناء الإتقان',
  'Seven-day rhythm': 'إيقاع سبعة أيام',
  'Consistency without streak pressure.': 'استمرارية بلا ضغط السلسلة.',
  'Your knowledge path': 'مسار معرفتك',
  'Real mastery, ordered by need.': 'إتقان حقيقي مرتب حسب الحاجة.',
  'Recently handled': 'آخر ما راجعته',
  'Return to the evidence while the shelf context is fresh.':
    'عُد إلى الدليل ما دام سياق الرف حاضراً.',
  'Your first package starts the path': 'أول عبوة تبدأ المسار',
  'Capture first package': 'التقط أول عبوة',
  'Drug library': 'مكتبة الأدوية',
  'Your evidence': 'أدلتك',
  'Search ingredients, brands, uses, Arabic notes, and shelf locations.':
    'ابحث في المواد الفعالة والعلامات والاستعمالات والملاحظات العربية ومواقع الرفوف.',
  'Work the shelf': 'تعلّم من الرف',
  'Map, compare, and turn gaps into capture quests': 'اربط وقارن وحوّل الفجوات إلى مهام التقاط.',
  SHOW: 'إظهار',
  SORT: 'ترتيب',
  'No profiles match this view': 'لا توجد ملفات تطابق هذا العرض',
  'No drug profiles yet': 'لا توجد ملفات أدوية بعد',
  'Five questions.': 'خمسة أسئلة.',
  'Active recall': 'الاستدعاء النشط',
  'Every session is short enough to start and focused enough to matter.':
    'كل جلسة قصيرة بما يكفي لتبدأ، ومركّزة بما يكفي لتفيد.',
  'DAILY REFRESH': 'المراجعة اليومية',
  'TODAY COMPLETE': 'اكتمل اليوم',
  'Let Renlyst choose the useful five.': 'دع رينليست يختار الأسئلة الخمسة المفيدة.',
  'Start Smart Session': 'ابدأ الجلسة الذكية',
  'Learning tools': 'أدوات التعلّم',
  'Daily Refresh': 'المراجعة اليومية',
  'Mistake Vault': 'سجل الأخطاء',
  'Offline five': 'خمسة أسئلة بلا إنترنت',
  'Choose a mode': 'اختر نمطاً',
  'Each mode still produces exactly five questions.': 'كل نمط ينتج خمسة أسئلة بالضبط.',
  'Scientific → Trade': 'العلمي ← التجاري',
  'Trade → Scientific': 'التجاري ← العلمي',
  'Class → Examples': 'الفئة ← أمثلة',
  'Drug → Use': 'الدواء ← الاستعمال',
  'Drug → Warning': 'الدواء ← التحذير',
  'Image Quiz': 'اختبار الصور',
  Counseling: 'الإرشاد الدوائي',
  'Weak Drugs': 'الأدوية الضعيفة',
  'Due Review': 'المراجعة المستحقة',
  'System Practice': 'تدريب حسب الجهاز',
  'Case Practice': 'تدريب الحالات',
  'Practice rhythm': 'إيقاع التدريب',
  'Your record': 'سجلك',
  'Learning, protected.': 'تعلّمك محفوظ.',
  'LOCAL LEARNING RECORD': 'سجل التعلّم المحلي',
  'Data & recovery': 'البيانات والاستعادة',
  'Library & data': 'المكتبة والبيانات',
  'Daily shift': 'المناوبة اليومية',
  'Training reports': 'تقارير التدريب',
  'Quick search': 'البحث السريع',
  'Providers & protected keys': 'المزوّدون والمفاتيح المحمية',
  'Backup & Data': 'النسخ الاحتياطي والبيانات',
  'About & safety': 'حول التطبيق والسلامة',
  'INSTALLED BUILD': 'الإصدار المثبّت',
  'Crash-fixed capture release · com.renlyst.app.next':
    'إصدار مُصحّح لالتقاط العبوات · com.renlyst.app.next',
  'Photo-first Gemini preview · com.renlyst.app.next':
    'إصدار Gemini يبدأ بالصورة · com.renlyst.app.next',
  'Learning reminders': 'تذكيرات التعلّم',
  'Show weak-drug reminders': 'إظهار تذكيرات الأدوية الضعيفة',
  Feedback: 'التغذية الراجعة',
  'Haptic feedback': 'الاهتزاز اللمسي',
  'Use light vibrations for capture, answers, completion, backup, and warnings.':
    'استخدم اهتزازات خفيفة عند الالتقاط والإجابة والإكمال والنسخ الاحتياطي والتحذيرات.',
  'Light sounds': 'أصوات خفيفة',
  'Play subtle local sounds for success, answers, and session completion.':
    'شغّل أصواتًا محلية هادئة للنجاح والإجابات وإكمال الجلسة.',
  'Appearance & language': 'المظهر واللغة',
  Theme: 'السمة',
  System: 'النظام',
  Light: 'فاتح',
  Dark: 'داكن',
  Language: 'اللغة',
  English: 'الإنجليزية',
  'Educational use': 'للاستخدام التعليمي',
  'Supervised practice': 'التدريب بإشراف',
  'Train with intention.': 'تدرّب بهدف واضح.',
  'Shift in progress.': 'المناوبة جارية.',
  'ACTIVE SHIFT': 'مناوبة نشطة',
  'new drugs': 'أدوية جديدة',
  reviews: 'مراجعات',
  'Add supervised encounter': 'أضف حالة تعليمية بإشراف',
  'End shift & reflect': 'أنه المناوبة وسجّل تأملك',
  "Today's training mission": 'مهمة تدريب اليوم',
  "Choose today's focus": 'اختر تركيز اليوم',
  'Recent encounters': 'آخر الحالات التعليمية',
  'No supervised encounters recorded yet.': 'لا توجد حالات تعليمية مسجلة بعد.',
  'Training reports.': 'تقارير التدريب.',
  'PLACEMENT RECORD': 'سجل التدريب الميداني',
  'Saved reports': 'التقارير المحفوظة',
  'No reports generated yet.': 'لم تُنشأ تقارير بعد.',
  'Generate editable report': 'أنشئ تقريراً قابلاً للتعديل',
  'Training report.': 'تقرير التدريب.',
  'EDITABLE RECORD': 'سجل قابل للتعديل',
  'Training period': 'مدة التدريب',
  FROM: 'من',
  TO: 'إلى',
  'Save report': 'احفظ التقرير',
  'Export UTF-8 text file': 'صدّر ملفاً نصياً UTF-8',
  'BACKUP & DATA': 'النسخ الاحتياطي والبيانات',
  'Own every record.': 'بياناتك ملكك.',
  'Export rollback backup': 'صدّر نسخة احتياطية للاستعادة',
  'Export complete backup': 'صدّر نسخة كاملة',
  'Export lightweight backup': 'صدّر نسخة خفيفة',
  'Portable exports': 'صادرات قابلة للنقل',
  'Export drug library CSV': 'صدّر مكتبة الأدوية بصيغة CSV',
  'Export all training reports': 'صدّر جميع تقارير التدريب',
  'Import Swift or Renlyst JSON': 'استورد JSON من Swift أو رينليست',
  'Choose backup file': 'اختر ملف النسخة الاحتياطية',
  'READY TO IMPORT': 'جاهز للاستيراد',
  'Integrity evidence': 'دليل سلامة البيانات',
  Inspect: 'فحص',
  Hide: 'إخفاء',
  Merge: 'دمج',
  Replace: 'استبدال',
  'Cancel import': 'إلغاء الاستيراد',
  'Protected credentials stay behind': 'تبقى بيانات الاعتماد المحمية على الجهاز',
  'ADD TO RENLYST': 'أضف إلى رينليست',
  'Start with trustworthy context.': 'ابدأ بسياق موثوق.',
  'Add an active drug': 'أضف دواءً فعالاً',
  'Open fast capture': 'افتح الالتقاط السريع',
  'OPTIONAL SMART TOOLS': 'أدوات ذكية اختيارية',
  'Trusted-source import': 'استيراد من مصدر موثوق',
  'Generate a full profile': 'أنشئ ملفاً كاملاً',
  'FAST CAPTURE': 'التقاط سريع',
  'Save the shelf moment.': 'احفظ معلومة الرف.',
  'I know it': 'أعرفه',
  'Identify later': 'أحدده لاحقاً',
  'Active ingredient': 'المادة الفعالة',
  'Brand on the package': 'العلامة على العبوة',
  Strength: 'التركيز',
  'Dosage form': 'الشكل الصيدلاني',
  Chapter: 'الجهاز',
  'Drug class': 'الفئة الدوائية',
  'Shelf location': 'موقع الرف',
  'Package photos': 'صور العبوة',
  Camera: 'الكاميرا',
  'Photo library': 'مكتبة الصور',
  'Read visible package facts': 'اقرأ المعلومات الظاهرة على العبوة',
  'Recognize package': 'تعرّف على العبوة',
  'Save and open profile': 'احفظ وافتح الملف',
  'Save for later': 'احفظ لوقت لاحق',
  'Save another': 'احفظ وأضف آخر',
  'Three memory anchors': 'ثلاث ركائز للتذكّر',
  'The fastest honest path back to this drug': 'أسرع طريق صادق للعودة إلى هذا الدواء',
  'Must remember': 'يجب تذكّره',
  'Key recall': 'نقطة تذكّر',
  'Main use': 'الاستعمال الرئيسي',
  'Safety cue': 'إشارة السلامة',
  'How it works': 'كيف يعمل',
  'Patient cue': 'إشارة للمريض',
  'Brands & packages': 'العلامات والعبوات',
  Uses: 'الاستعمالات',
  'Forms & dosing': 'الأشكال والجرعات',
  Safety: 'السلامة',
  Pharmacology: 'علم الأدوية',
  'Counseling & Arabic': 'الإرشاد والعربية',
  'Sources & notes': 'المصادر والملاحظات',
  'Mastery checks': 'اختبارات الإتقان',
  'Delete profile': 'حذف الملف',
  'Add photographed brand': 'أضف علامة مصوّرة',
  'Structured clinical evidence': 'دليل سريري منظّم',
  'Educational dose calculator': 'حاسبة جرعات تعليمية',
  'Trusted source import': 'استيراد مصدر موثوق',
  'Generate missing sections with AI': 'أنشئ الأقسام الناقصة بالذكاء الاصطناعي',
  'Atomic notes': 'ملاحظات مترابطة',
  'SOURCE BEFORE SUMMARY': 'المصدر قبل الملخص',
  'Trusted import': 'استيراد موثوق',
  SOURCE: 'المصدر',
  'Open provider settings': 'افتح إعدادات المزوّدين',
  'Every trusted source is disabled': 'جميع المصادر الموثوقة معطّلة',
  'Save selected evidence': 'احفظ الأدلة المحددة',
  'OPTIONAL DRAFT, HUMAN DECISION': 'مسودة اختيارية، والقرار للإنسان',
  'Generate profile draft': 'أنشئ مسودة الملف',
  'CARD SAVED': 'تم حفظ البطاقة',
  'Start quick review': 'ابدأ مراجعة سريعة',
  'Open drug profile': 'افتح ملف الدواء',
  'ABOUT RENLYST': 'حول رينليست',
  'Learn safely. Keep ownership.': 'تعلّم بأمان واحتفظ بملكية بياناتك.',
  'Offline-first training companion': 'رفيق تدريب يعمل بلا إنترنت أولاً',
  'Clinical boundary': 'الحدود السريرية',
  'Your data': 'بياناتك',
  'COMMAND SEARCH': 'بحث سريع',
  'Find anything.': 'اعثر على أي معلومة.',
  Capture: 'التقاط',
  'Smart session': 'جلسة ذكية',
  'RECENT PROFILES': 'الملفات الأخيرة',
  RESULTS: 'النتائج',
  'Fine control': 'تحكم دقيق',
  'Keep individual local fields even when their section is selected.':
    'احتفظ بالحقول المحلية الفردية حتى عند تحديد قسمها.',
  'Exclude any generated field you want to keep local.':
    'استبعد أي حقل مُنشأ تريد إبقاء نسخته المحلية.',
  'Trade names': 'الأسماء التجارية',
  'Chapter, class, form & route': 'الجهاز والفئة والشكل وطريق الإعطاء',
  'Active ingredients': 'المواد الفعالة',
  'Dosage forms & strengths': 'الأشكال والتركيزات',
  'Indications / uses': 'دواعي الاستعمال',
  Mechanism: 'آلية العمل',
  'Half-life, onset & duration': 'عمر النصف وبدء المفعول ومدته',
  'Half-life': 'عمر النصف',
  Onset: 'بدء المفعول',
  Duration: 'مدة المفعول',
  'Dosing frequency': 'تكرار الجرعات',
  'Prodrug activation': 'تنشيط الدواء الأولي',
  Elimination: 'الإطراح',
  ADME: 'الامتصاص والتوزيع والاستقلاب والإطراح',
  Warnings: 'التحذيرات',
  Contraindications: 'موانع الاستعمال',
  Interactions: 'التداخلات الدوائية',
  'Toxicity & organ cautions': 'السمية واحتياطات الأعضاء',
  'Reproductive safety': 'السلامة الإنجابية',
  'How to take & food': 'طريقة الاستخدام والطعام',
  'Patient counseling': 'إرشاد المريض',
  'Arabic counseling': 'الإرشاد بالعربية',
  'Arabic learning': 'التعلم بالعربية',
  'Adverse effects': 'الآثار الجانبية',
  'Common adverse effects': 'الآثار الجانبية الشائعة',
  'Serious adverse effects': 'الآثار الجانبية الخطيرة',
  'Dose regimens': 'أنظمة الجرعات',
  'Clinical dosing': 'الجرعات السريرية',
  'Must know': 'معلومات أساسية',
  Flashcards: 'بطاقات المراجعة',
  'Pharmacology scale': 'مقياس علم الأدوية',
  'Safety at a glance': 'السلامة بنظرة سريعة',
  'Risk scale': 'مقياس الخطورة',
  'PK memory': 'تذكّر الحرائك الدوائية',
  Products: 'المنتجات',
  'Pregnancy & lactation': 'الحمل والرضاعة',
  'Medicine pairs': 'أزواج الأدوية',
  'Mechanism of action': 'آلية العمل',
  Absorption: 'الامتصاص',
  Distribution: 'التوزيع',
  Metabolism: 'الاستقلاب',
  'Elimination summary': 'ملخص الإطراح',
  'Back to drug profile': 'العودة إلى ملف الدواء',
  'Imported structure, legacy fallbacks, and explicit unknown states—kept separate from personal notes.':
    'بنية مستوردة وبدائل للبيانات القديمة وحالات غير معروفة بوضوح، منفصلة عن ملاحظاتك الشخصية.',
  'Keys stay in protected device storage': 'تبقى المفاتيح في التخزين المحمي على الجهاز',
  'Credentials are never stored in SQLite and never included in backup exports.':
    'لا تُخزَّن بيانات الاعتماد في SQLite ولا تُضمَّن في النسخ الاحتياطية.',
  'Trusted data sources': 'مصادر البيانات الموثوقة',
  'Arabic health reference when configured': 'مرجع صحي عربي عند إعداده',
  'Ingredient identity and concept matching': 'مطابقة هوية المادة والمفهوم الدوائي',
  'Official label content': 'محتوى النشرة الرسمية',
  'Label and safety search': 'البحث في النشرة والسلامة',
  'Photos are sent only when you explicitly request recognition.':
    'لا تُرسل الصور إلا عندما تطلب التعرّف عليها صراحةً.',
  'Used only for user-triggered drafts and practice generation.':
    'يُستخدم فقط للمسودات والتدريب اللذين تطلبهما أنت.',
  'Optional protected key for authenticated Altibbi access.':
    'مفتاح محمي اختياري للوصول الموثق إلى الطبي.',
  'Settings saved on this device.': 'حُفظت الإعدادات على هذا الجهاز.',
  'Save provider settings': 'حفظ إعدادات المزوّدين',
  'Close provider settings': 'إغلاق إعدادات المزوّدين',
  'Check OpenRouter connection': 'فحص اتصال OpenRouter',
  'Check DeepSeek connection': 'فحص اتصال DeepSeek',
  'OpenRouter API key': 'مفتاح OpenRouter API',
  'DeepSeek API key': 'مفتاح DeepSeek API',
  'Altibbi API key': 'مفتاح الطبي API',
  'Vision model slug': 'معرّف نموذج الرؤية',
  'Model name': 'اسم النموذج',
  'Frame the useful evidence.': 'حدّد الجزء المفيد من العبوة.',
  'Pinch to zoom, drag to position, or rotate in 90° steps. The bright frame is what will be saved.':
    'قرّب بإصبعين واسحب لتحديد الموضع أو دوّر بزيادات 90°. سيُحفظ ما داخل الإطار المضيء.',
  'Zoom in': 'تكبير',
  'Zoom out': 'تصغير',
  Zoom: 'التقريب',
  Rotate: 'تدوير',
  Reset: 'إعادة ضبط',
  'Rotate photo clockwise': 'تدوير الصورة باتجاه عقارب الساعة',
  'Reset photo position': 'إعادة ضبط موضع الصورة',
  'Use this crop': 'استخدام هذا الاقتصاص',
  'This photo could not be prepared safely. Choose another.':
    'تعذّر تجهيز هذه الصورة بأمان. اختر صورة أخرى.',
  Pregnant: 'حامل',
  'Adds a clinician-review caution.': 'يضيف تنبيهاً يتطلب مراجعة مختص.',
  'Surface incomplete, confusing, and fading profiles inside Renlyst.':
    'أظهر الملفات الناقصة أو المربكة أو التي بدأت معلوماتها تتلاشى داخل رينليست.',
  'No identifying data': 'لا توجد بيانات تعريفية',
  'Confirms this note contains no patient-identifying information.':
    'يؤكد أن هذه الملاحظة لا تحتوي معلومات تكشف هوية المريض.',
  'Close dose tools': 'إغلاق أدوات الجرعات',
  'Close report editor': 'إغلاق محرر التقرير',
  'Close shift reflection': 'إغلاق تأمل نهاية المناوبة',
  'Close AI generation': 'إغلاق الإنشاء بالذكاء الاصطناعي',
  'Close trusted import': 'إغلاق الاستيراد الموثوق',
  'Only selected source sections will update the profile':
    'لن تُحدَّث في الملف إلا أقسام المصدر المحددة',
  '. Brand-specific packages belong in their separate brand record.':
    '. تُحفظ العبوات الخاصة بالعلامة التجارية في سجل العلامة المنفصل.',
  '· calculation inputs are never saved.': '· لا تُحفظ مدخلات الحساب إطلاقًا.',
  '(optional through age 10)': '(اختياري حتى عمر 10 سنوات)',
  '/8 · at least one required': '/8 · صورة واحدة على الأقل مطلوبة',
  '/8 · crop, pan, zoom, and rotate before saving':
    '/8 · قصّ الصورة وحركها وكبّرها ودوّرها قبل الحفظ',
  '/8 selected': '/8 محددة',
  '3-hour pharmacy mode · flexible guidance': 'وضع الصيدلية لمدة 3 ساعات · إرشاد مرن',
  'A grounded five-question pack stays available without a connection until the library changes or you refresh it.':
    'تبقى حزمة من خمسة أسئلة مبنية على بياناتك متاحة بلا اتصال حتى تتغير المكتبة أو تُحدّثها.',
  'A photo is enough to begin': 'تكفي صورة للبدء',
  'A quiet feed of due knowledge, confusing cards, and lessons from your own shifts.':
    'موجز هادئ للمعلومات المستحقة والبطاقات المربكة والدروس المستفادة من مناوباتك.',
  'a short return': 'عودة قصيرة',
  'A shorter axis shows the knowledge area that needs more practice.':
    'يشير المحور الأقصر إلى مجال المعرفة الذي يحتاج إلى مزيد من التدريب.',
  accuracy: 'الدقة',
  'Active drug or prodrug': 'دواء فعّال أم طليعة دواء',
  'Add a brand of': 'أضف علامة تجارية لـ',
  'Add a photographed brand': 'إضافة علامة تجارية مصوّرة',
  'Add active ingredient': 'إضافة مادة فعّالة',
  'Add what you saw today': 'أضف ما شاهدته اليوم',
  Adjuncts: 'العلاجات المساعدة',
  'adverse effects · PK and safety scales': 'الآثار الجانبية · الحرائك الدوائية ومقاييس السلامة',
  'Age years': 'العمر بالسنوات',
  'All refreshed': 'تمت مراجعة الكل',
  'Allow camera access in Settings, or choose a photo from your library.':
    'اسمح بالوصول إلى الكاميرا من الإعدادات، أو اختر صورة من مكتبتك.',
  'Allow selected photo access in Settings to choose package images.':
    'اسمح بالوصول إلى الصور المحددة من الإعدادات لاختيار صور العبوة.',
  Altibbi: 'الطبي',
  'ALTIBBI CREDENTIAL': 'بيانات اعتماد الطبي',
  'Altibbi is an Arabic reference source and is always marked for pharmacist review.':
    'الطبي مصدر مرجعي عربي، وتُعلَّم بياناته دائمًا لمراجعة الصيدلي.',
  'An identity or recognizable package note is enough. Clinical detail can wait.':
    'تكفي هوية الدواء أو ملاحظة تميّز العبوة. يمكن تأجيل التفاصيل السريرية.',
  and: 'و',
  'API key': 'مفتاح API',
  'Arabic applies native shaping and right-to-left layout immediately across the app.':
    'تُطبّق العربية تشكيل الحروف والتخطيط من اليمين إلى اليسار فورًا في التطبيق كله.',
  'Attach a small memory, correction, or shelf observation to one part of':
    'أرفق تذكّرًا صغيرًا أو تصحيحًا أو ملاحظة من الرف بجزء واحد من',
  B: 'B',
  'Back to Library': 'العودة إلى المكتبة',
  'Back to Practice': 'العودة إلى التدريب',
  'Back to Training': 'العودة إلى التدريب الميداني',
  'Backed-up record types not present in this snapshot will be removed. This cannot be undone unless you have another backup.':
    'ستُحذف أنواع السجلات غير الموجودة في هذه اللقطة الاحتياطية. لا يمكن التراجع إلا بوجود نسخة احتياطية أخرى.',
  'before import.': 'قبل الاستيراد.',
  'BIGGEST WEAKNESS': 'أكبر نقطة ضعف',
  'Both exports use the Swift-compatible schema-v5 contract and preserve Arabic as UTF-8.':
    'يستخدم كلا التصديرين عقد المخطط v5 المتوافق مع Swift ويحفظان العربية بترميز UTF-8.',
  'Brand on package': 'العلامة على العبوة',
  'Brand printed on package': 'العلامة التجارية المطبوعة على العبوة',
  'Brand products must belong to a known ingredient profile.':
    'يجب أن تنتمي منتجات العلامة التجارية إلى ملف مادة فعّالة معروف.',
  'By indication': 'حسب الاستطباب',
  'Calculate from selected regimen': 'احسب من نظام الجرعات المحدد',
  'Camera access is off': 'الوصول إلى الكاميرا متوقف',
  'Camera, library, crop, rotate, remove · up to eight':
    'الكاميرا والمكتبة والقص والتدوير والحذف · حتى ثماني صور',
  'Cancel editing': 'إلغاء التعديل',
  'Cancel photo edit': 'إلغاء تعديل الصورة',
  'Cancel photo editing': 'إلغاء تعديل الصور',
  'Capture 10 shelf drugs, understand the important points, review what is due, and finish with a short reflection.':
    'التقط 10 أدوية من الرف، وافهم النقاط المهمة، وراجع المستحق، ثم اختم بتأمل قصير.',
  'Capture a known package': 'التقط عبوة معروفة',
  'Capture a medicine package': 'التقط صورة عبوة دواء',
  'Capture an active drug quickly, import reviewed evidence, or generate an unverified draft you will inspect field by field.':
    'التقط دواءً فعّالًا بسرعة، أو استورد دليلًا مُراجعًا، أو أنشئ مسودة غير موثقة تفحصها حقلًا بحقل.',
  'Capture label': 'وصف الالتقاط',
  'Capture the next medicine package': 'التقط عبوة الدواء التالية',
  'Check answer': 'تحقق من الإجابة',
  Choose: 'اختر',
  'Choose a chapter': 'اختر فصلًا',
  'Choose fields': 'اختر الحقول',
  'Choose package photos': 'اختر صور العبوة',
  'Choose today’s focus': 'اختر تركيز اليوم',
  Class: 'الفئة',
  Clear: 'مسح',
  'Clinical pharmacology': 'علم الأدوية السريري',
  'CLINICAL STUDY TOOL': 'أداة دراسة سريرية',
  'Close brand editor': 'إغلاق محرر العلامة التجارية',
  'Close brand entry': 'إغلاق إدخال العلامة التجارية',
  'Close capture': 'إغلاق الالتقاط',
  'Close encounter note': 'إغلاق ملاحظة الحالة التعليمية',
  'Close practice session': 'إغلاق جلسة التدريب',
  'Close quick search': 'إغلاق البحث السريع',
  'Compare two drugs': 'قارن بين دواءين',
  'Complete backups include package images. Lightweight backups are smaller and preserve existing local images when merged.':
    'تشمل النسخ الكاملة صور العبوات. النسخ الخفيفة أصغر وتحافظ على الصور المحلية عند الدمج.',
  'completed shifts': 'مناوبات مكتملة',
  'Component strength': 'تركيز المكوّن',
  'COMPONENT STRENGTHS': 'تراكيز المكوّنات',
  confidence: 'الثقة',
  'CONFIRM ACTIVE INGREDIENT': 'تأكيد المادة الفعّالة',
  'Confirm the ingredient first.': 'أكد المادة الفعّالة أولًا.',
  'Confirmed active ingredient': 'المادة الفعّالة المؤكدة',
  'CONFIRMED DRUG NAME OR ALTIBBI URL': 'اسم الدواء المؤكد أو رابط الطبي',
  'Connect the shelf': 'اربط معلومات الرف',
  Considerations: 'اعتبارات',
  'CONTEXT OR SHIFT · OPTIONAL': 'السياق أو المناوبة · اختياري',
  'Contraindication severity': 'شدة موانع الاستعمال',
  Correct: 'صحيح',
  'correct ·': 'صحيحة ·',
  'Counseling & adverse effects': 'الإرشاد والآثار الجانبية',
  'Counseling sentence': 'جملة الإرشاد',
  'Counters will be calculated from the profiles and reviews saved during this shift.':
    'ستُحسب العدادات من الملفات والمراجعات المحفوظة خلال هذه المناوبة.',
  'Create UTF-8 files for spreadsheets or a combined placement record. Arabic text is preserved.':
    'أنشئ ملفات UTF-8 لجداول البيانات أو سجل تدريب موحّد. سيُحفظ النص العربي.',
  DailyMed: 'DailyMed',
  'day streak': 'أيام متتالية',
  'DeepSeek and OpenRouter keys must be entered again on a new installation. They are never written into an export.':
    'يجب إدخال مفاتيح DeepSeek وOpenRouter مجددًا في أي تثبيت جديد. لا تُكتب مطلقًا في ملفات التصدير.',
  'DeepSeek can assemble an educational draft. Nothing is saved until you inspect and select its sections, and every saved value remains marked unverified.':
    'يمكن لـ DeepSeek إعداد مسودة تعليمية. لا يُحفظ شيء حتى تفحص أقسامها وتحددها، وتبقى كل قيمة محفوظة معلّمة كغير موثقة.',
  'Add a medicine package image. Gemini vision reads the identity and fills the complete educational profile for you to review before saving.':
    'أضف صورة لعبوة الدواء. تقرأ رؤية Gemini الهوية وتملأ الملف التعليمي الكامل لتراجعه قبل الحفظ.',
  'Package image required': 'صورة العبوة مطلوبة',
  'Use a clear front or ingredient-panel photo. Up to four resized images are sent through your configured Gemini model.':
    'استخدم صورة واضحة لواجهة العبوة أو لوحة المكونات. تُرسل حتى أربع صور مصغّرة عبر نموذج Gemini الذي أعددته.',
  REQUIRED: 'مطلوب',
  'Using the saved package photo': 'استخدام صورة العبوة المحفوظة',
  'Add new photos only if the printed ingredient is hard to read.':
    'أضف صورًا جديدة فقط إذا كانت المادة الفعالة المطبوعة صعبة القراءة.',
  'Saved medicine package photo': 'صورة عبوة الدواء المحفوظة',
  'Reading package and building profile…': 'جارٍ قراءة العبوة وبناء الملف…',
  'Generate full profile from image': 'إنشاء الملف الكامل من الصورة',
  'Gemini read this package with low confidence. Check the identity carefully.':
    'قرأ Gemini هذه العبوة بثقة منخفضة. تحقق من الهوية بعناية.',
  'GEMINI VISION & FULL PROFILE': 'رؤية GEMINI والملف الكامل',
  'Package photos are sent through OpenRouter only when you explicitly generate a full profile.':
    'تُرسل صور العبوة عبر OpenRouter فقط عندما تطلب صراحةً إنشاء ملف كامل.',
  'DEEPSEEK PRACTICE': 'تدريب DEEPSEEK',
  'Used only when you explicitly request generated practice questions.':
    'يُستخدم فقط عندما تطلب صراحةً إنشاء أسئلة تدريبية.',
  'DEEPSEEK LEARNING & GENERATION': 'التعلّم والإنشاء عبر DEEPSEEK',
  'DeepSeek model': 'نموذج DeepSeek',
  'Delete drug profile': 'حذف ملف الدواء',
  'Delete linked note?': 'حذف الملاحظة المرتبطة؟',
  'Delete this drug profile?': 'حذف ملف هذا الدواء؟',
  'Do not enter patient information. Verify doses, interactions, pregnancy, and organ cautions against a current trusted source and pharmacist supervision.':
    'لا تدخل معلومات المريض. تحقق من الجرعات والتداخلات والحمل وتحذيرات الأعضاء بمصدر موثوق وحديث وتحت إشراف صيدلي.',
  'Dominant excretion': 'طريق الإطراح الغالب',
  'Dosage forms': 'الأشكال الصيدلانية',
  'Dose regimens & calculator': 'أنظمة الجرعات والحاسبة',
  'Dose regimens.': 'أنظمة الجرعات.',
  'dose(s)': 'جرعة/جرعات',
  'Drugs by chapter': 'الأدوية حسب الفصل',
  'Drugs by class': 'الأدوية حسب الفئة',
  'Due dates, incomplete mastery, safety, counseling, and your own package photos shape the mix.':
    'تحدد مواعيد الاستحقاق والإتقان غير المكتمل والسلامة والإرشاد وصور عبواتك مزيج الأسئلة.',
  'duplicate package': 'عبوة مكررة',
  'duplicate profile': 'ملف مكرر',
  'Duration · hours': 'المدة · ساعات',
  'Duration band': 'نطاق المدة',
  'Duration note': 'ملاحظة المدة',
  'e.g. 500 mg': 'مثال: 500 mg',
  'e.g. 625 mg': 'مثال: 625 mg',
  'e.g. Augmentin': 'مثال: Augmentin',
  'e.g. blue inhaler, top shelf': 'مثال: بخاخ أزرق، الرف العلوي',
  'e.g. GSK': 'مثال: GSK',
  'e.g. inhaler counseling': 'مثال: إرشاد استخدام البخاخ',
  'Earned milestones': 'الإنجازات المكتسبة',
  'Edit drug profile': 'تعديل ملف الدواء',
  'Edit profile': 'تعديل الملف',
  'Edit profile package photos': 'تعديل صور عبوات الملف',
  'Editable package photo': 'صورة عبوة قابلة للتعديل',
  'Educational encounter.': 'حالة تعليمية.',
  'Educational notes only. Never patient-identifying data.':
    'ملاحظات تعليمية فقط. لا تُدخل أبدًا بيانات تكشف هوية المريض.',
  'Encounter topic': 'موضوع الحالة التعليمية',
  'END-SHIFT REFLECTION': 'تأمل نهاية المناوبة',
  'Enter a measured weight. WHO estimates stop after age 10.':
    'أدخل وزنًا مقاسًا. تتوقف تقديرات منظمة الصحة العالمية بعد عمر 10 سنوات.',
  'Every active-ingredient profile stays anchored to one clinical chapter.':
    'يبقى كل ملف مادة فعّالة مرتبطًا بفصل سريري واحد.',
  'Every question in the session stays inside the selected clinical system.':
    'يبقى كل سؤال في الجلسة ضمن الجهاز السريري المحدد.',
  'Every staged image is hashed again immediately before it is promoted into app storage.':
    'يُعاد حساب بصمة كل صورة مرحلية مباشرة قبل نقلها إلى تخزين التطبيق.',
  'Example: Take with a full glass of water.': 'مثال: تناوله مع كوب كامل من الماء.',
  'Existing fields stay untouched unless selected.': 'تبقى الحقول الحالية كما هي ما لم تحددها.',
  'Existing knowledge stays untouched unless its section is selected.':
    'تبقى المعرفة الحالية كما هي ما لم تحدد قسمها.',
  'Explore the knowledge map, compare profiles, and start a shelf quest':
    'استكشف خريطة المعرفة وقارن الملفات وابدأ مهمة على الرف',
  EXPORTED: 'تم التصدير',
  'Extra months': 'أشهر إضافية',
  'Fast manual capture for a known medicine or a package you will identify later.':
    'التقاط يدوي سريع لدواء معروف أو لعبوة ستحددها لاحقًا.',
  Female: 'أنثى',
  'Find the package, capture it, then connect what is easiest to confuse.':
    'اعثر على العبوة والتقطها، ثم اربط المعلومات التي يسهل الخلط بينها.',
  'Five complete.': 'اكتملت الأسئلة الخمسة.',
  'Five questions ready offline': 'خمسة أسئلة جاهزة بلا اتصال',
  'Five-step learning path': 'مسار تعلّم من خمس خطوات',
  'Food instructions': 'تعليمات الطعام',
  Frequency: 'التكرار',
  'FROM YOUR': 'من سجلاتك',
  'Generate an unverified AI draft for this profile':
    'أنشئ مسودة غير موثقة بالذكاء الاصطناعي لهذا الملف',
  'Generate missing sections from a package image': 'أنشئ الأقسام الناقصة من صورة العبوة',
  'Generate missing sections from photo': 'أنشئ الأقسام الناقصة من الصورة',
  'Gemini reads a saved or new package image; selected fields stay unverified':
    'يقرأ Gemini صورة عبوة محفوظة أو جديدة؛ وتبقى الحقول المحددة غير موثقة.',
  'Add a package image; Gemini fills a complete unverified profile for review':
    'أضف صورة العبوة؛ يملأ Gemini ملفًا كاملًا غير موثق لتراجعه.',
  'Use a required package image to build a selectable Gemini profile':
    'استخدم صورة عبوة مطلوبة لبناء ملف Gemini قابل للتحديد.',
  'Generate from your saved shifts, encounters, reviews, and library—then edit before sharing.':
    'أنشئ التقرير من المناوبات والحالات والمراجعات والمكتبة المحفوظة، ثم عدّله قبل المشاركة.',
  'Generate with AI': 'إنشاء بالذكاء الاصطناعي',
  'Generate, edit, and export your placement record.': 'أنشئ سجل تدريبك وعدّله وصدّره.',
  'Go back': 'رجوع',
  'grounded questions': 'أسئلة مبنية على بياناتك',
  'Half-life · hours': 'عمر النصف · ساعات',
  'Half-life band': 'نطاق عمر النصف',
  'Half-life note': 'ملاحظة عمر النصف',
  'Height cm': 'الطول بالسم',
  'Height in centimeters': 'الطول بالسنتيمتر',
  'Hepatic caution': 'تحذير كبدي',
  'Hepatic severity': 'شدة التحذير الكبدي',
  'Hepatic:': 'الكبد:',
  'How to take': 'طريقة الاستخدام',
  'I confirm this note contains no patient-identifying information.':
    'أؤكد أن هذه الملاحظة لا تتضمن معلومات تكشف هوية المريض.',
  'Identity & package context': 'هوية الدواء وسياق العبوة',
  IMAGE: 'صورة',
  'Import or enter an indication- and age-specific structured regimen before using the calculator.':
    'استورد أو أدخل نظام جرعات منظمًا خاصًا بالاستطباب والعمر قبل استخدام الحاسبة.',
  'Ingredient components': 'مكوّنات المواد الفعّالة',
  'Ingredient name': 'اسم المادة الفعّالة',
  'Interaction severity': 'شدة التداخل',
  'interactions ·': 'تداخلات ·',
  'Its package metadata and photos will be removed. The ingredient profile and learning history stay intact.':
    'ستُحذف بيانات العبوة وصورها. يبقى ملف المادة الفعّالة وسجل التعلّم دون تغيير.',
  'Keep the printed total separate from each component.':
    'أبقِ التركيز الكلي المطبوع منفصلًا عن تركيز كل مكوّن.',
  'Keep up to eight views for': 'احتفظ بما يصل إلى ثماني صور لـ',
  'Kept separate from ingredient knowledge': 'محفوظة منفصلة عن معرفة المادة الفعّالة',
  'Key clinical or workflow lessons': 'الدروس السريرية أو العملية الأساسية',
  'Key warning': 'التحذير الأساسي',
  'kg · view source': 'كغم · عرض المصدر',
  'Kidney function': 'وظائف الكلى',
  'Knowledge map': 'خريطة المعرفة',
  Lactation: 'الرضاعة',
  'Last export': 'آخر تصدير',
  'Last restore': 'آخر استعادة',
  'Legacy safety flags': 'تنبيهات السلامة القديمة',
  'Library relationships': 'علاقات المكتبة',
  'Library summary': 'ملخص المكتبة',
  'LINKED FIELD': 'حقل مرتبط',
  'Linked notes': 'ملاحظات مرتبطة',
  'Liver function': 'وظائف الكبد',
  'LOCAL HISTORY': 'السجل المحلي',
  'Lock in': 'ثبّت المعلومة',
  'Make today useful tomorrow.': 'اجعل ما تتعلمه اليوم مفيدًا غدًا.',
  Male: 'ذكر',
  'Management:': 'التدبير:',
  'MANUAL CORRECTION': 'تصحيح يدوي',
  'Marketed strength': 'التركيز المسوّق',
  Mastery: 'الإتقان',
  'Mastery radar': 'مخطط الإتقان',
  'Maximum dose cap applied': 'طُبّق الحد الأقصى للجرعة',
  'MEANINGFUL DIFFERENCES': 'فروق مهمة',
  'Measured weight in kilograms': 'الوزن المقاس بالكيلوغرام',
  'Measured weight kg': 'الوزن المقاس بالكغم',
  'Medicine package for this question': 'عبوة الدواء الخاصة بهذا السؤال',
  'Metabolism & excretion notes': 'ملاحظات الاستقلاب والإطراح',
  'mg per administration': 'mg لكل مرة إعطاء',
  'mg/day in': 'mg/يوم مقسمة على',
  min: 'دقيقة',
  'Missed facts collect here automatically and return in weak-drug sessions.':
    'تتجمع المعلومات التي أخطأت فيها هنا تلقائيًا وتعود في جلسات الأدوية الضعيفة.',
  'misses recorded in the latest twenty': 'أخطاء مسجلة في آخر عشرين سؤالًا',
  'My notes': 'ملاحظاتي',
  'Needs another pass': 'يحتاج إلى مراجعة أخرى',
  'Never enter a patient name, phone number, email, address, prescription number, or other identifying detail.':
    'لا تدخل اسم مريض أو رقم هاتفه أو بريده الإلكتروني أو عنوانه أو رقم الوصفة أو أي معلومة تعريفية أخرى.',
  'NEW EDITABLE REPORT': 'تقرير جديد قابل للتعديل',
  'No active shift.': 'لا توجد مناوبة نشطة.',
  'No atomic notes yet': 'لا توجد ملاحظات محددة بعد',
  'No data yet.': 'لا توجد بيانات بعد.',
  'No embedded image payloads to stage.': 'لا توجد صور مضمّنة لتجهيزها.',
  'No grounded questions yet.': 'لا توجد أسئلة مبنية على بياناتك بعد.',
  'No indication-specific clinical dosing is saved.':
    'لا توجد جرعات سريرية محفوظة خاصة بالاستطباب.',
  'No matching drug, brand, class, note, or Arabic text.':
    'لا يوجد دواء أو علامة أو فئة أو ملاحظة أو نص عربي مطابق.',
  'No offline pack yet': 'لا توجد حزمة بلا اتصال بعد',
  'No package photos are attached.': 'لا توجد صور عبوة مرفقة.',
  'No profile-level photo': 'لا توجد صورة على مستوى الملف',
  'No sourced relationship with another saved profile is available yet.':
    'لا توجد بعد علاقة موثقة بمصدر مع ملف محفوظ آخر.',
  'No structured adverse-effect list is saved.': 'لا توجد قائمة منظمة محفوظة للآثار الجانبية.',
  'No structured dosage forms or strengths are saved.':
    'لا توجد أشكال صيدلانية أو تراكيز منظمة محفوظة.',
  'No structured interaction list is saved.': 'لا توجد قائمة منظمة محفوظة للتداخلات.',
  'No structured pregnancy or lactation evidence is saved.':
    'لا توجد أدلة منظمة محفوظة للحمل أو الرضاعة.',
  None: 'لا شيء',
  Normal: 'طبيعي',
  'Not found': 'غير موجود',
  'NOTE TYPE': 'نوع الملاحظة',
  of: 'من',
  'ONE FACT AT A TIME': 'معلومة واحدة في كل مرة',
  'One small specific note': 'ملاحظة صغيرة ومحددة',
  'ONE SYSTEM, FIVE QUESTIONS': 'جهاز واحد، خمسة أسئلة',
  'Only runs when you tap it. Up to four resized photos are sent through your configured OpenRouter model; clinical knowledge is never generated here.':
    'يعمل فقط عند الضغط عليه. تُرسل حتى أربع صور مصغرة عبر نموذج OpenRouter الذي أعددته؛ ولا تُنشأ معرفة سريرية هنا.',
  'Onset · minutes': 'بدء المفعول · دقائق',
  'Onset band': 'نطاق بدء المفعول',
  'Onset note': 'ملاحظة بدء المفعول',
  'Open atomic notes': 'فتح الملاحظات المحددة',
  'Open library learning tools': 'فتح أدوات تعلّم المكتبة',
  'Open source': 'فتح المصدر',
  openFDA: 'openFDA',
  'Opening dose tools…': 'جارٍ فتح أدوات الجرعات…',
  'Opening package record…': 'جارٍ فتح سجل العبوة…',
  'Opening package records…': 'جارٍ فتح سجلات العبوات…',
  'Opening profile…': 'جارٍ فتح الملف…',
  'Opening protected settings…': 'جارٍ فتح الإعدادات المحمية…',
  'Opening reflection…': 'جارٍ فتح التأمل…',
  'Opening Renlyst': 'جارٍ فتح رينليست',
  'Opening report…': 'جارٍ فتح التقرير…',
  'OPENROUTER PACKAGE VISION': 'رؤية العبوات عبر OPENROUTER',
  'OpenRouter vision model': 'نموذج الرؤية في OpenRouter',
  'Opens the capture sheet': 'يفتح صفحة الالتقاط',
  'Opens the drug profile': 'يفتح ملف الدواء',
  'OPTIONAL ENHANCEMENTS': 'تحسينات اختيارية',
  'Optional note context': 'سياق اختياري للملاحظة',
  'Optional visible package text': 'نص العبوة الظاهر اختياريًا',
  'Other notes': 'ملاحظات أخرى',
  'Package country': 'بلد العبوة',
  'PACKAGE EVIDENCE': 'دليل العبوة',
  'Package facts stay separate from clinical knowledge.':
    'تبقى معلومات العبوة منفصلة عن المعرفة السريرية.',
  'Package manufacturer': 'الشركة المصنّعة للعبوة',
  'PACKAGE PHOTO': 'صورة العبوة',
  'PACKAGE RECORD': 'سجل العبوة',
  'Package route': 'طريق إعطاء العبوة',
  'PACKAGE-SPECIFIC DETAILS': 'تفاصيل خاصة بالعبوة',
  'Partly correct': 'صحيح جزئيًا',
  'Paste leaflet text': 'الصق نص النشرة',
  'Paste the leaflet exactly as printed. This text remains product-specific.':
    'الصق النشرة كما هي مطبوعة تمامًا. يبقى هذا النص خاصًا بالمنتج.',
  'Patient questions': 'أسئلة المريض',
  'Personal notes & mastery': 'الملاحظات الشخصية والإتقان',
  'Pharmacist note': 'ملاحظة الصيدلي',
  Pharmacokinetics: 'الحرائك الدوائية',
  'Photo access is off': 'الوصول إلى الصور متوقف',
  'Practice activity for the last seven days': 'نشاط التدريب خلال الأيام السبعة الماضية',
  'Practice needs one known profile': 'يحتاج التدريب إلى ملف معروف واحد',
  Pregnancy: 'الحمل',
  'Pregnancy caution': 'تحذير الحمل',
  'Pregnancy severity': 'شدة تحذير الحمل',
  'Pregnancy:': 'الحمل:',
  'Preparing brand entry…': 'جارٍ تجهيز إدخال العلامة التجارية…',
  'Preparing clinical evidence…': 'جارٍ تجهيز الدليل السريري…',
  'Preparing five questions…': 'جارٍ تجهيز خمسة أسئلة…',
  'Preparing the saved card…': 'جارٍ تجهيز البطاقة المحفوظة…',
  'Preview and select a DeepSeek draft; all saved fields stay unverified':
    'عاين مسودة DeepSeek وحدد منها؛ تبقى كل الحقول المحفوظة غير موثقة',
  'Printed facts and the leaflet stay attached to this brand package.':
    'تبقى المعلومات المطبوعة والنشرة مرفقتين بعبوة هذه العلامة.',
  'Printed strength': 'التركيز المطبوع',
  'Product leaflet': 'نشرة المنتج',
  profile: 'ملف',
  'PROFILE EVIDENCE': 'دليل الملف',
  'Profile not found': 'الملف غير موجود',
  'Providers & protected keys.': 'المزوّدون والمفاتيح المحمية.',
  Question: 'السؤال',
  'Quick label for unknown package': 'وصف سريع لعبوة غير معروفة',
  'Raw source loaded': 'تم تحميل المصدر الخام',
  'Reading…': 'جارٍ القراءة…',
  'REAL PACKAGES, REAL CONTEXT': 'عبوات حقيقية، سياق حقيقي',
  'Record what you observed and learned—not who the patient was.':
    'سجّل ما لاحظته وتعلمته، لا هوية المريض.',
  'Reduced / unknown': 'منخفضة / غير معروفة',
  'Refresh selected fields from a trusted source': 'تحديث الحقول المحددة من مصدر موثوق',
  'Related drug': 'الدواء المرتبط',
  Remove: 'إزالة',
  'Remove all selected photos': 'إزالة كل الصور المحددة',
  'Remove component': 'إزالة المكوّن',
  'Renal caution': 'تحذير كلوي',
  'Renal severity': 'شدة التحذير الكلوي',
  'Renal:': 'الكلى:',
  'Renlyst is for personal pharmacy learning. Confirm clinical decisions and dispensing with your supervising pharmacist and current local references.':
    'رينليست للتعلّم الصيدلاني الشخصي. أكد القرارات السريرية والصرف مع الصيدلي المشرف والمراجع المحلية الحديثة.',
  'Renlyst remains functional offline. Providers enhance recognition and evidence gathering.':
    'يبقى رينليست عاملًا بلا اتصال. تعزز المزوّدات التعرّف وجمع الأدلة.',
  'Renlyst supports study and supervised training. Verify clinical decisions against current references and local practice.':
    'يدعم رينليست الدراسة والتدريب بإشراف. تحقق من القرارات السريرية وفق المراجع الحديثة والممارسة المحلية.',
  Repaired: 'تم إصلاح',
  'Replace all current Renlyst data?': 'استبدال جميع بيانات رينليست الحالية؟',
  'Replay weak facts': 'إعادة تدريب المعلومات الضعيفة',
  'Report not found.': 'التقرير غير موجود.',
  'Resurface, repair, or save a useful five for offline practice.':
    'استرجع المعلومات أو أصلحها أو احفظ خمسة أسئلة مفيدة للتدريب بلا اتصال.',
  'RESURFACED SHIFT NOTE': 'ملاحظة مستعادة من مناوبة',
  'Return to library': 'العودة إلى المكتبة',
  'Return to Practice': 'العودة إلى التدريب',
  'Return to profile': 'العودة إلى الملف',
  'Return to Training': 'العودة إلى التدريب الميداني',
  'Reveal saved answer': 'إظهار الإجابة المحفوظة',
  'Review every generated section before you export it.': 'راجع كل قسم مُنشأ قبل تصديره.',
  'Review every section': 'راجع كل قسم',
  'reviews due': 'مراجعات مستحقة',
  Routes: 'طرق الإعطاء',
  RxNorm: 'RxNorm',
  'Salt form': 'الشكل الملحي',
  'SAVED ANSWER': 'الإجابة المحفوظة',
  'Saved notes, generated drafts, dose calculations, and imported evidence are educational aids—not a diagnosis, prescription, or substitute for professional judgment. Always verify patient-specific decisions.':
    'الملاحظات المحفوظة والمسودات المنشأة وحسابات الجرعات والأدلة المستوردة أدوات تعليمية، وليست تشخيصًا أو وصفة أو بديلًا عن الحكم المهني. تحقق دائمًا من القرارات الخاصة بالمريض.',
  'SAVED ON THIS DEVICE': 'محفوظ على هذا الجهاز',
  Schema: 'المخطط',
  'Schemas 1–5 are validated fully before any database write. Newer and malformed files are rejected unchanged.':
    'تُتحقق المخططات 1–5 بالكامل قبل أي كتابة في قاعدة البيانات. تُرفض الملفات الأحدث أو التالفة دون تغيير.',
  'Scientific name': 'الاسم العلمي',
  'Search a primary label, inspect the raw evidence, and choose exactly what may update':
    'ابحث في نشرة أصلية وافحص الدليل الخام وحدد بدقة ما يمكن تحديثه',
  'Search drug library': 'البحث في مكتبة الأدوية',
  'Search primary labels, inspect raw text, and select fields before updating':
    'ابحث في النشرات الأصلية وافحص النص الخام وحدد الحقول قبل التحديث',
  'See the systems you are building, compare confusing profiles, and find the next real package to capture.':
    'شاهد الأجهزة التي تبني معرفتك بها، وقارن الملفات المربكة، واعثر على العبوة الحقيقية التالية لالتقاطها.',
  'Select the first or second slot, then choose a profile below.':
    'حدد الخانة الأولى أو الثانية، ثم اختر ملفًا أدناه.',
  'Selected package photos': 'صور العبوة المحددة',
  SERIOUS: 'خطير',
  sessions: 'جلسات',
  'Sex at birth': 'الجنس عند الولادة',
  'SHA-256 source and staged image hashes': 'بصمات SHA-256 للمصدر والصور المرحلية',
  'Shelf quest': 'مهمة الرف',
  'Shows the source file hash and every staged image hash':
    'يعرض بصمة ملف المصدر وبصمة كل صورة مرحلية',
  'SMALL, USEFUL RETURNS': 'مراجعات قصيرة ومفيدة',
  'SOURCE JSON': 'المصدر بصيغة JSON',
  'Source matches': 'نتائج المصدر',
  'Source unavailable': 'المصدر غير متاح',
  'SPECIFIC NOTE': 'ملاحظة محددة',
  'Standard regimens': 'أنظمة الجرعات القياسية',
  'Start a focused five now, or open the profile and continue reviewing every saved field.':
    'ابدأ خمسة أسئلة مركزة الآن، أو افتح الملف وواصل مراجعة كل حقل محفوظ.',
  'Start saved five': 'ابدأ الأسئلة الخمسة المحفوظة',
  STATUS: 'الحالة',
  'Strength on package': 'التركيز على العبوة',
  Strengths: 'التراكيز',
  'SUPERVISED LEARNING': 'تعلّم بإشراف',
  'Supervising pharmacist’s educational point': 'النقطة التعليمية للصيدلي المشرف',
  'System / chapter': 'الجهاز / الفصل',
  'SYSTEM BY SYSTEM': 'جهازًا بعد جهاز',
  'Take package photo': 'التقاط صورة العبوة',
  'The clinical or counseling lesson': 'الدرس السريري أو الإرشادي',
  'The map is empty': 'الخريطة فارغة',
  'The package can change. Your ingredient knowledge will not.':
    'قد تتغير العبوة، لكن معرفتك بالمادة الفعّالة تبقى.',
  'The saved profile could not be opened.': 'تعذّر فتح الملف المحفوظ.',
  'The selected model must accept image input and structured output.':
    'يجب أن يقبل النموذج المحدد إدخال الصور وإخراجًا منظمًا.',
  'The session could not be prepared.': 'تعذّر تجهيز الجلسة.',
  'This is valid for imported profiles. Add evidence only when you have the package.':
    'هذا صالح للملفات المستوردة. أضف الدليل فقط عندما تكون العبوة لديك.',
  'This mode needs more saved evidence.': 'يحتاج هذا النمط إلى مزيد من الأدلة المحفوظة.',
  'This package record is unavailable.': 'سجل هذه العبوة غير متاح.',
  'This profile is unavailable.': 'هذا الملف غير متاح.',
  'This removes the note from this profile and future backups.':
    'سيزيل هذا الملاحظة من الملف ومن النسخ الاحتياطية المستقبلية.',
  'This source URL could not be opened.': 'تعذّر فتح رابط المصدر.',
  'Times per day · optional': 'عدد المرات يوميًا · اختياري',
  'To add another brand for an ingredient you already know, open that drug and choose Add brand. Ingredient knowledge stays unchanged.':
    'لإضافة علامة أخرى لمادة تعرفها، افتح الدواء واختر «إضافة علامة تجارية». تبقى معرفة المادة دون تغيير.',
  'to revisit. Your review dates, field mastery, streak, and daily mission are updated locally.':
    'لإعادة المراجعة. تُحدّث مواعيد المراجعة وإتقان الحقول والاستمرارية والمهمة اليومية محليًا.',
  'Today’s Shelf Quest': 'مهمة رف اليوم',
  'Today’s training mission': 'مهمة تدريب اليوم',
  Topic: 'الموضوع',
  'TOTAL RECORDS': 'إجمالي السجلات',
  Toxicity: 'السمّية',
  'Toxicity severity': 'شدة السمّية',
  'Trade name': 'الاسم التجاري',
  'Training totals': 'إجماليات التدريب',
  TRIMMED: 'تم الاختصار',
  'Trusted source search': 'البحث في مصدر موثوق',
  'Two profiles are needed': 'يلزم ملفان',
  'UNDERSTAND YOUR LIBRARY': 'افهم مكتبتك',
  'Unknown drug': 'دواء غير معروف',
  UPDATED: 'محدّث',
  Use: 'الاستعمال',
  'useful facts saved': 'معلومات مفيدة محفوظة',
  'USEFUL FRICTION': 'صعوبة مفيدة',
  'Uses & mechanism': 'الاستعمالات وآلية العمل',
  'Vault is empty': 'سجل الأخطاء فارغ',
  'Verify the current clinical reference, indication, and product.':
    'تحقق من المرجع السريري الحديث والاستطباب والمنتج.',
  'VISIBLE PACKAGE TEXT · OPTIONAL': 'نص العبوة الظاهر · اختياري',
  Warning: 'التحذير',
  'Warning severity': 'شدة التحذير',
  weak: 'ضعيف',
  'What did I ask the pharmacist?': 'ماذا سألت الصيدلي؟',
  'What did I learn today?': 'ماذا تعلمت اليوم؟',
  'What happened': 'ماذا حدث',
  'What I learned': 'ما تعلمته',
  'What should I review tomorrow?': 'ماذا ينبغي أن أراجع غدًا؟',
  'Where did this become useful?': 'أين أصبحت هذه المعلومة مفيدة؟',
  'Which drugs confused me?': 'ما الأدوية التي أربكتني؟',
  'Which two packages are easiest to confuse? Compare them and name one meaningful difference.':
    'ما العبوتان الأسهل خلطًا؟ قارنهما واذكر فرقًا مهمًا واحدًا.',
  'WHO median estimate:': 'تقدير وسيط منظمة الصحة العالمية:',
  'Work the shelf.': 'تعلّم من الرف.',
  Wrong: 'خطأ',
  'Your answer': 'إجابتك',
  'Your Daily Refresh': 'مراجعتك اليومية',
  'Your library, photos, learning history, encounters, and reports remain on this device unless you choose to export or explicitly invoke an online provider. API credentials are kept in protected device storage and excluded from backups.':
    'تبقى مكتبتك وصورك وسجل تعلمك وحالاتك وتقاريرك على هذا الجهاز ما لم تختر التصدير أو تستدعِ مزودًا عبر الإنترنت صراحةً. تُحفظ بيانات اعتماد API في تخزين الجهاز المحمي وتُستبعد من النسخ الاحتياطية.',
  'Your library, progress, images, and training records stay on this device unless you export them.':
    'تبقى مكتبتك وتقدمك وصورك وسجلات تدريبك على هذا الجهاز ما لم تصدّرها.',
  'Your reminder is on. A focused five is enough for today.':
    'تذكيرك مفعّل. خمسة أسئلة مركزة تكفي اليوم.',
  'Replace all data': 'استبدال كل البيانات',
  'Delete brand': 'حذف العلامة التجارية',
  'Keep history': 'الاحتفاظ بالسجل',
  'Erase history': 'مسح السجل',
  'A cached, grounded pack that works without a connection':
    'حزمة مبنية على بياناتك ومخزنة تعمل دون اتصال.',
  'Brand names and product strengths remain authoritative in their separate brand records.':
    'تبقى أسماء العلامات التجارية وتراكيز المنتجات مرجعاً معتمداً في سجلات العلامات المنفصلة.',
  'Browse every profile inside its clinical system': 'تصفّح كل ملف ضمن نظامه السريري.',
  'Build a selectable DeepSeek draft that stays marked unverified':
    'أنشئ مسودة DeepSeek قابلة للاختيار وتبقى مميزة بأنها غير متحقق منها.',
  'Changing reviewable learning content marks generated questions for regeneration.':
    'تؤدي تغييرات محتوى التعلّم القابل للمراجعة إلى وسم الأسئلة المنشأة لإعادة توليدها.',
  'Complete a few cards and privacy-safe shift notes; Renlyst will resurface them here later.':
    'أكمل بعض البطاقات وملاحظات المناوبات الآمنة للخصوصية؛ وسيعيد رينليست إظهارها هنا لاحقاً.',
  'Create a grounded five from the facts already saved in your library.':
    'أنشئ مجموعة من خمسة أسئلة مبنية على الحقائق المحفوظة في مكتبتك.',
  'Create an experimental AI draft with explicit unverified-field review':
    'أنشئ مسودة تجريبية بالذكاء الاصطناعي مع مراجعة واضحة للحقول غير المتحققة.',
  'Due cards, confusing facts, and your own notes':
    'البطاقات المستحقة والحقائق المربكة وملاحظاتك الخاصة.',
  'Find a drug, brand, class, system, note, or Arabic text':
    'ابحث عن دواء أو علامة أو فئة أو نظام أو ملاحظة أو نص عربي.',
  'Import Swift backups or export a rollback-safe schema-v5 file':
    'استورد نسخ Swift الاحتياطية أو صدّر ملفاً آمناً للرجوع بصيغة schema-v5.',
  'Keep numeric scales separate from exact source notes.':
    'افصل المقاييس الرقمية عن ملاحظات المصدر الدقيقة.',
  'Keep this on only while the active ingredient is missing.':
    'أبقِ هذا مفعلاً فقط أثناء غياب المادة الفعالة.',
  'Missed facts will appear here after a practice answer is rated Wrong.':
    'ستظهر الحقائق التي أخطأت فيها هنا بعد تقييم إجابة تدريب بأنها خاطئة.',
  'Optional trusted sources, package vision, and generation':
    'مصادر موثوقة اختيارية ورؤية للعبوات وتوليد.',
  'Private notes stay local. Mastery changes recalculate confidence immediately.':
    'تبقى الملاحظات الخاصة محلية. وتعيد تغييرات الإتقان احتساب الثقة فوراً.',
  'Purpose, privacy boundaries, and clinical-use guidance':
    'الغرض وحدود الخصوصية وإرشادات الاستخدام السريري.',
  'Put identity, class, use, and warning side by side':
    'ضع الهوية والفئة والاستعمال والتحذير جنباً إلى جنب.',
  'Review mastery, generate a placement record, and export it':
    'راجع الإتقان وأنشئ سجل تدريب وصدّره.',
  'Run a supervised three-hour rhythm and record encounters':
    'اتبع إيقاعاً بإشراف لمدة ثلاث ساعات وسجّل الحالات التعليمية.',
  'Save one precise fact above. Small linked notes are easier to retrieve during practice.':
    'احفظ حقيقة دقيقة واحدة أعلاه. فالملاحظات الصغيرة المرتبطة أسهل للاسترجاع أثناء التدريب.',
  'Search DailyMed, openFDA, RxNorm, or Altibbi and review every field':
    'ابحث في DailyMed أو openFDA أو RxNorm أو الطبي وراجع كل حقل.',
  'Search current sources, choose sections, and review evidence before saving':
    'ابحث في المصادر الحالية واختر الأقسام وراجع الدليل قبل الحفظ.',
  'See missed facts and replay your weak topics':
    'اطلع على الحقائق الفائتة وأعد دراسة موضوعاتك الضعيفة.',
  'Severity is stored separately from the evidence text.': 'تُخزَّن الشدة منفصلة عن نص الدليل.',
  'Turn a system checklist into real package captures':
    'حوّل قائمة تحقق لنظام ما إلى التقاطات لعبوات حقيقية.',
  'Use concise, patient-facing language and keep serious effects separate.':
    'استخدم لغة موجزة موجهة للمريض وافصل الآثار الخطيرة.',
  'Capture a known medicine or save it as unknown. You can complete the clinical profile when you have time.':
    'التقط دواءً معروفاً أو احفظه كغير معروف. يمكنك إكمال الملف السريري عندما يتوفر لديك الوقت.',
  'Capture a package to create a profile without needing to finish every field.':
    'التقط عبوة لإنشاء ملف من دون الحاجة إلى إكمال كل حقل.',
  'Capture a package and save its active ingredient. Unknown packages remain safely in the library but do not create misleading questions.':
    'التقط عبوة واحفظ مادتها الفعالة. تبقى العبوات غير المعروفة آمنة في المكتبة لكنها لا تنشئ أسئلة مضللة.',
  'Capture another known medicine to compare saved facts side by side.':
    'التقط دواءً معروفاً آخر لمقارنة الحقائق المحفوظة جنباً إلى جنب.',
  'Capture a known package to place its ingredient profile in a clinical system.':
    'التقط عبوة معروفة لوضع ملف مادتها الفعالة ضمن نظام سريري.',
  'Capture a known drug with enough saved facts, then return for a grounded five.':
    'التقط دواءً معروفاً مع حقائق محفوظة كافية، ثم عد إلى خمسة أسئلة مبنية على بياناتك.',
  'One five-question session completes today’s mission.':
    'جلسة واحدة من خمسة أسئلة تُكمل مهمة اليوم.',
  'Capture shelf drugs': 'التقط أدوية الرف',
  FIRST: 'الأول',
  SECOND: 'الثاني',
  'Choose profile': 'اختر ملفًا',
  'Choose first profile': 'اختر الملف الأول',
  'Choose second profile': 'اختر الملف الثاني',
  'Not recorded': 'غير مسجل',
  Cardiovascular: 'القلبي الوعائي',
  Respiratory: 'التنفسي',
  Endocrine: 'الغدد الصماء',
  Musculoskeletal: 'العضلي الهيكلي',
  Eye: 'العيون',
  'Ear/Nose/Oropharynx': 'الأذن والأنف والبلعوم',
  Gastrointestinal: 'الجهاز الهضمي',
  Dermatology: 'الأمراض الجلدية',
  Antibiotics: 'المضادات الحيوية',
  OTC: 'أدوية دون وصفة',
  'Vitamins/Supplements': 'الفيتامينات والمكملات',
  'ACE inhibitor': 'مثبط الإنزيم المحول للأنجيوتنسين',
  ARB: 'حاصر مستقبلات الأنجيوتنسين',
  'Beta blocker': 'حاصر بيتا',
  'Calcium channel blocker': 'حاصر قنوات الكالسيوم',
  'Not found on your shelf yet': 'غير موجود على رفك بعد',
};

const normalizedArabicCopy = new Map(
  Object.entries(arabicCopy).map(([english, arabic]) => [
    english.trim().toLocaleLowerCase(),
    arabic,
  ]),
);

function translateDynamicCopy(value: string): string | null {
  let match = /^(\d+) weak drugs need attention$/u.exec(value);
  if (match) return `${match[1]} أدوية ضعيفة تحتاج إلى اهتمام`;

  match = /^Review (\d+) due drugs?$/u.exec(value);
  if (match) return `راجع ${match[1]} من الأدوية المستحقة`;

  match = /^(\d+) weak drugs? needs? a short return$/u.exec(value);
  if (match) return `${match[1]} من الأدوية الضعيفة تحتاج إلى مراجعة قصيرة`;

  match = /^(.+): (\d+) questions$/u.exec(value);
  if (match) return `${translateCopy(match[1]!, 'ar')}: ${match[2]} أسئلة`;

  match = /^Package photo (\d+)$/u.exec(value);
  if (match) return `صورة العبوة ${match[1]}`;
  match = /^Remove package photo (\d+)$/u.exec(value);
  if (match) return `إزالة صورة العبوة ${match[1]}`;
  match = /^Remove ingredient (\d+)$/u.exec(value);
  if (match) return `إزالة المادة الفعّالة ${match[1]}`;
  match = /^Remove (.+?)(\?)?$/u.exec(value);
  if (match) return `حذف ${translateCopy(match[1]!, 'ar')}${match[2] ? '؟' : ''}`;

  match = /^Open saved profile for (.+)$/u.exec(value);
  if (match) return `فتح الملف المحفوظ لـ ${match[1]}`;
  match = /^Delete (.+) note$/u.exec(value);
  if (match) return `حذف ملاحظة ${translateCopy(match[1]!, 'ar')}`;
  match = /^Delete (.+)\?$/u.exec(value);
  if (match) return `حذف ${match[1]}؟`;
  match =
    /^(\d+) brands and (\d+) relationships will be removed\. Choose whether (\d+) reviews and (\d+) encounters should keep their snapshots\.$/u.exec(
      value,
    );
  if (match) {
    return `ستُحذف ${match[1]} علامات تجارية و${match[2]} علاقات. اختر ما إذا كان ينبغي أن تحتفظ ${match[3]} مراجعات و${match[4]} حالات تعليمية بلقطاتها.`;
  }

  match = /^Edit (.+) brand product$/u.exec(value);
  if (match) return `تعديل منتج العلامة ${match[1]}`;
  match = /^(.+) package$/u.exec(value);
  if (match) return `عبوة ${match[1]}`;
  match = /^Delete (.+) brand$/u.exec(value);
  if (match) return `حذف علامة ${match[1]}`;
  match = /^Open (.+) source$/u.exec(value);
  if (match) return `فتح مصدر ${match[1]}`;
  match = /^(.+) mastered$/u.exec(value);
  if (match) return `تم إتقان ${translateCopy(match[1]!, 'ar')}`;

  match = /^(.+), mastery (\d+) of (\d+)(, due for review)?$/u.exec(value);
  if (match) {
    return `${match[1]}، الإتقان ${match[2]} من ${match[3]}${match[4] ? '، مستحق للمراجعة' : ''}`;
  }
  match = /^(.+), (\d+) of (\d+) mastery checks$/u.exec(value);
  if (match) return `${match[1]}، ${match[2]} من ${match[3]} اختبارات إتقان`;
  match = /^Mastery radar: (.+)$/u.exec(value);
  if (match) return `مخطط الإتقان: ${match[1]}`;
  match = /^Open (.+)$/u.exec(value);
  if (match) return `فتح ${match[1]}`;
  match = /^Capture ([A-Z][A-Za-z0-9/ -]{0,80})$/u.exec(value);
  if (match) return `التقاط ${match[1]}`;

  const comma = /^(.+), (.+)$/u.exec(value);
  if (comma) {
    const translatedLead = normalizedArabicCopy.get(comma[1]!.trim().toLocaleLowerCase());
    if (translatedLead) return `${translatedLead}، ${comma[2]}`;
  }
  return null;
}

export function translateCopy(value: string, language: AppLanguage): string {
  if (language === 'en') return value;
  const trimmed = value.trim();
  return (
    normalizedArabicCopy.get(trimmed.toLocaleLowerCase()) ?? translateDynamicCopy(trimmed) ?? value
  );
}

export function hasArabicCopy(value: string): boolean {
  const trimmed = value.trim();
  return (
    normalizedArabicCopy.has(trimmed.toLocaleLowerCase()) || translateDynamicCopy(trimmed) != null
  );
}
