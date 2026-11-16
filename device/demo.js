/*
 * مشغّل العرض التجريبي — للمعاينة على الكمبيوتر.
 * لا يعرض أي فيديو على أنه بث HDMI؛ يعرض بطاقة واضحة تقول إن المدخل غير متصل في هذا الوضع.
 */
(function () {
  function DemoDevice() {
    this.id = 'demo';
    this.label = 'عرض تجريبي';
    this.isReal = false;
    this.capabilities = { hdmiInPanel: 'demo' };
  }

  DemoDevice.prototype.mountHdmi = function (container, input) {
    var el = document.createElement('div');
    el.className = 'demo-source';
    el.innerHTML =
      '<div class="demo-source__icon" aria-hidden="true">' + window.Icons.hdmi + '</div>' +
      '<div class="demo-source__title"></div>' +
      '<div class="demo-source__note">وضع تجريبي: لا يوجد اتصال بمدخل HDMI حقيقي في هذا المتصفح.<br>على الشاشة الفعلية يُعرض المدخل هنا بعد اختبار التكامل.</div>';
    var plain = 'HDMI ' + input.port;
    el.querySelector('.demo-source__title').textContent = input.name === plain ? plain : input.name + ' (' + plain + ')';
    container.appendChild(el);
    var listeners = [];
    var ctl = {
      state: 'demo',
      message: 'تجريبي — غير متصل',
      onState: function (cb) { listeners.push(cb); cb(ctl.state, ctl.message); },
      stop: function () { if (el.parentNode) el.parentNode.removeChild(el); }
    };
    return ctl;
  };

  window.DemoDevice = DemoDevice;
})();
