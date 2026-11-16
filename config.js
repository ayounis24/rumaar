/*
 * إعدادات واجهة شاشة مكتب «رونق الإعمار» — كل البيانات تُعدَّل من هنا فقط، بلا لمس للتصميم.
 *
 * قواعد مهمة:
 *  - الحقول الفارغ ("") تعني «بيانات ناقصة»: تظهر على الشاشة كبطاقة واضحة تطلب الإكمال،
 *    ولا يُولَّد لها أي رمز QR.
 *  - الألوان أدناه «مقترحة» مستخرجة من اللوجو، وتحتاج اعتمادًا من دليل الهوية إن وُجد.
 *  - بيانات المشاريع والصور مأخوذة من بروفايل الشركة (بلا أرقام مالية).
 *  - هذا الملف منشور مع الصفحة؛ أي بيانات تضعها هنا (مثل أرقام بطاقة الاتصال) ستكون
 *    مرئية لمن يفتح رابط الصفحة. راجع README قبل وضع بيانات شخصية.
 */
window.RUMAAR_CONFIG = {
  brand: {
    nameAr: 'رونق الإعمار',
    legalNameAr: 'شركة رونق الإعمار للمقاولات',
    nameEn: 'RUMAAR',
    logo: 'media/logo.png',
    // ألوان الهوية المعتمدة: ‎#262629 داكن ، ‎#C8A347 ذهبي ، ‎#F7F7F7 فاتح ، ‎#AEB1B0 رمادي.
    // (surface/surface2/line درجات مشتقة من الداكن لفصل البطاقات؛ ok/warn/bad ألوان حالة فقط)
    colors: {
      accent: '#C8A347',      // الذهبي المعتمد
      accentInk: '#262629',   // النص فوق الذهبي
      bg: '#262629',          // الداكن المعتمد
      surface: '#2E2E32',
      surface2: '#36363A',
      line: '#444448',
      text: '#F7F7F7',        // الفاتح المعتمد
      muted: '#AEB1B0',       // الرمادي المعتمد
      ok: '#4CC38A', warn: '#E5A33A', bad: '#E5534B'
    },
    font: 'IBM Plex Sans Arabic',
    colorsApproved: true
  },

  // رسالة الترحيب في الشريط العلوي
  welcome: 'أهلًا وسهلًا بكم',

  // المنطقة الزمنية للساعة والتقويم (أسماء IANA)
  timeZone: 'Asia/Riyadh',
  numerals: 'latn',      // 'latn' أرقام 0-9 ، 'arab' أرقام ٠-٩
  weekStart: 0,          // 0 = الأحد أول الأسبوع، 6 = السبت

  // رابط بروفايل الشركة (يُولَّد له QR). اتركه فارغًا حتى يتوفر الرابط الصحيح.
  profileUrl: 'https://drive.google.com/file/d/1lTDY7Mb7PeMrE8pPR9W1S3IgD8TkVvvC/view?usp=drive_link',

  // بطاقة الاتصال (vCard). يلزم الاسم + هاتف أو بريد على الأقل لتوليد QR.
  contact: {
    name: 'أحمد يونس',
    nameEn: 'Ahmed Younis',
    title: 'المدير التنفيذي — Executive Director',
    org: 'شركة رونق الإعمار للمقاولات',
    mobile: ['+966531074973', '+966500979795'],  // من بطاقة العمل
    phone: '+966112077978',                       // الهاتف الأرضي
    email: 'a.younis@rumaar.com',
    website: 'https://rumaar.com',
    address: ''
  },

  // مداخل HDMI — الأسماء قابلة للتخصيص (مثل: «كاميرات المكتب»، «لابتوب الاجتماعات»)
  hdmiInputs: [
    { port: 1, name: 'كاميرات المكتب' }
    // مداخل أخرى عند الحاجة: { port: 2, name: '...' }, { port: 3, name: '...' }
  ],

  // مشاركة شاشة اللابتوب.
  // الحالي: اللابتوب يتصل لاسلكيًا عبر الشبكة (IP) بالشاشة مباشرة (ميزة الشاشة المدمجة) — تعمل بملء الشاشة
  // خارج هذه الواجهة. للعرض داخل اللوحة يلزم جهاز استقبال على HDMI: ضع رقم مدخله في receiverPort.
  screenShare: {
    mode: 'native',
    receiverPort: null,
    receiverName: 'جهاز استقبال المشاركة',
    laptopSteps: [
      'على اللابتوب: اتصل بالشاشة لاسلكيًا عبر الشبكة بالطريقة المعتادة في المكتب.',
      'ستعرض الشاشة اللابتوب بملء الشاشة (ميزة الشاشة المدمجة، خارج هذه الواجهة).',
      'للرجوع لهذه اللوحة: أوقف المشاركة من اللابتوب، أو اختر الواجهة من قائمة المداخل في الريموت.'
    ]
  },

  // مكتبة الوسائط: صور المشاريع، فيديوهات محلية، وروابط YouTube.
  // type: 'image' | 'video' | 'youtube'
  // project: { name, location, scope } يظهر في شريط المشروع.
  media: [
    { type: 'image', src: 'media/projects/fitness-time-xpress.jpg',
      project: { name: 'فيتنس تايم إكسبرس', location: 'جازان', scope: 'القطاع الرياضي • 1,000 م²' } },
    { type: 'image', src: 'media/projects/laban-square.jpg',
      project: { name: 'لبن سكوير', location: 'الرياض', scope: 'مجمع تجاري • 25,530 م²' } },
    { type: 'image', src: 'media/projects/educational-complex-jazan.jpg',
      project: { name: 'المجمع التعليمي — وزارة التعليم', location: 'جازان', scope: 'القطاع التعليمي • 10,890 م²' } },
    { type: 'image', src: 'media/projects/agility-logistics-city.jpg',
      project: { name: 'مدينة أجيليتي اللوجستية', location: 'المهجر، جدة', scope: 'القطاع الصناعي • 49,700 م²' } },
    { type: 'image', src: 'media/projects/fitness-time-oraija.jpg',
      project: { name: 'فيتنس تايم عريجاء', location: 'الرياض', scope: 'القطاع الرياضي • 3,800 م²' } },
    { type: 'image', src: 'media/projects/etoile-residential.jpg',
      project: { name: 'مجمع إيتوال السكني', location: 'الرياض', scope: 'القطاع السكني • 13,500 م²' } },
    { type: 'image', src: 'media/projects/adex-residential.jpg',
      project: { name: 'مجمع سكني خاص — مجموعة أدكس', location: 'حطين، الرياض', scope: 'القطاع السكني • 34,750 م²' } }
    // أمثلة لإضافة مصادر أخرى (احذف // للتفعيل):
    // { type: 'video', src: 'media/videos/project.mp4', title: 'فيديو المشروع' },
    // { type: 'youtube', videoId: 'XXXXXXXXXXX', title: 'عنوان الفيديو' },
    // { type: 'youtube', playlistId: 'PLxxxxxxxx', title: 'قائمة تشغيل' }
  ],

  slideSeconds: 10,           // مدة كل صورة في العرض التلقائي
  showProjectStrip: true,     // إظهار شريط المشروع (يمكن تغييره من الإعدادات على الشاشة)
  controlsAutoHideMs: 5000,   // إخفاء أدوات التحكم في ملء الشاشة بعد هذه المدة

  // 'auto' : يكتشف شاشة LG تلقائيًا، 'demo' : عرض تجريبي، 'lg' : فرض تكامل LG
  device: 'auto'
};
