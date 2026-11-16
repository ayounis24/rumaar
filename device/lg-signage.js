/*
 * تكامل شاشة LG webOS Signage (يحتاج اختبارًا على الشاشة).
 *
 * المؤكد من مواصفات LG الرسمية للموديل 55UM5N-H: يدعم "Video Tag (4)" و"Play via URL" و"PIP/PBP".
 * غير مؤكد من توثيق رسمي متاح لنا (توثيق المطوّرين لدى LG مقصور على الشركاء):
 *   - عرض مدخل HDMI داخل عنصر <video> عبر المصدر "ext://hdmi:N" بنوع "service/webos-external".
 *     هذه الطريقة مذكورة في مشاريع مجتمعية فقط، وقد لا تعمل من وضع Play via URL بدون تطبيق Signage مثبّت.
 *   - تقارير مجتمعية تذكر أن حالات الفيديو (paused/stalled) لهذا النوع لا تعكس الصورة الفعلية دائمًا،
 *     لذلك لا نعلن «يعمل» إلا بعد حدث playing، ونعرض «قيد التحقق» قبل ذلك.
 */
(function () {
  function LgSignageDevice() {
    this.id = 'lg';
    this.label = 'LG webOS Signage';
    this.isReal = true;
    this.capabilities = { hdmiInPanel: 'unverified' };
  }

  LgSignageDevice.detect = function () {
    return /Web0S|webOS/i.test(navigator.userAgent);
  };

  LgSignageDevice.prototype.mountHdmi = function (container, input) {
    var video = document.createElement('video');
    video.className = 'hdmi-video';
    video.setAttribute('autoplay', '');
    video.muted = true; // صوت المدخل يُدار من إعدادات الشاشة، وليس من الصفحة
    var source = document.createElement('source');
    source.setAttribute('src', 'ext://hdmi:' + input.port);
    source.setAttribute('type', 'service/webos-external');
    video.appendChild(source);
    container.appendChild(video);

    var listeners = [];
    var ctl = {
      state: 'checking',
      message: 'قيد التحقق من الإشارة…',
      onState: function (cb) { listeners.push(cb); cb(ctl.state, ctl.message); },
      stop: function () {
        clearTimeout(timer);
        try { video.pause(); video.removeAttribute('src'); while (video.firstChild) video.removeChild(video.firstChild); video.load(); } catch (e) {}
        if (video.parentNode) video.parentNode.removeChild(video);
      }
    };
    function set(state, msg) {
      ctl.state = state; ctl.message = msg;
      listeners.forEach(function (cb) { cb(state, msg); });
    }
    video.addEventListener('playing', function () { set('live', 'متصل'); });
    video.addEventListener('error', function () {
      set('error', 'تعذّر عرض المدخل داخل اللوحة على هذا الجهاز/الوضع');
    });
    source.addEventListener('error', function () {
      set('error', 'تعذّر عرض المدخل داخل اللوحة على هذا الجهاز/الوضع');
    });
    // إذا لم يصل حدث playing خلال 8 ثوانٍ لا نعلن نجاحًا ولا فشلًا قاطعًا.
    var timer = setTimeout(function () {
      if (ctl.state === 'checking') set('unverified', 'لم تؤكد الشاشة وصول الإشارة — تحقق من الكابل أو من دعم الخاصية');
    }, 8000);
    try { var p = video.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
    return ctl;
  };

  window.LgSignageDevice = LgSignageDevice;
})();
