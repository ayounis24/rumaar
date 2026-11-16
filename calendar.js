/*
 * التاريخ والوقت والتقويم وفق المنطقة الزمنية في الإعدادات.
 * لا يعتمد على المنطقة الزمنية للجهاز. يدعم ?now=ISO للاختبار.
 */
(function () {
  var MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  var DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  var DAYS_SHORT = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

  var nowOverride = (new URLSearchParams(location.search)).get('now');
  var offset = nowOverride ? (new Date(nowOverride).getTime() - Date.now()) : 0;

  function now() { return new Date(Date.now() + offset); }

  /** {y, m (1-12), d, hh, mm, dow (0=Sun)} in the given IANA time zone */
  function parts(date, tz) {
    var f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', hour12: false
    });
    var o = {};
    f.formatToParts(date).forEach(function (p) { o[p.type] = p.value; });
    var y = +o.year, m = +o.month, d = +o.day;
    var hh = +o.hour % 24;
    return { y: y, m: m, d: d, hh: hh, mm: +o.minute, dow: new Date(Date.UTC(y, m - 1, d)).getUTCDay() };
  }

  function digits(s, numerals) {
    if (numerals !== 'arab') return String(s);
    return String(s).replace(/[0-9]/g, function (c) { return '٠١٢٣٤٥٦٧٨٩'[+c]; });
  }

  function hijri(date, tz, numerals) {
    try {
      var f = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-' + (numerals === 'arab' ? 'arab' : 'latn'),
        { timeZone: tz, day: 'numeric', month: 'long', year: 'numeric' });
      return f.format(date);
    } catch (e) { return ''; }
  }

  function daysInMonth(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); }

  /** Month grid: array of weeks, each 7 cells {d|null, today:bool} */
  function monthGrid(y, m, todayD, weekStart) {
    var first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
    var lead = (first - weekStart + 7) % 7;
    var n = daysInMonth(y, m), cells = [], i;
    for (i = 0; i < lead; i++) cells.push({ d: null });
    for (i = 1; i <= n; i++) cells.push({ d: i, today: i === todayD });
    while (cells.length % 7) cells.push({ d: null });
    var weeks = [];
    for (i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return { weeks: weeks, lead: lead, days: n };
  }

  window.Cal = {
    MONTHS: MONTHS, DAYS: DAYS, DAYS_SHORT: DAYS_SHORT,
    now: now, parts: parts, digits: digits, hijri: hijri, monthGrid: monthGrid, daysInMonth: daysInMonth
  };
})();
