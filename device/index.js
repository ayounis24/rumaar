/* اختيار طبقة التحكّم في الجهاز. الواجهة لا تعرف إلا هذه الواجهة الموحّدة: window.Device */
(function () {
  var cfg = window.RUMAAR_CONFIG || {};
  var forced = (new URLSearchParams(location.search)).get('device') || cfg.device || 'auto';
  var useLg = forced === 'lg' || (forced === 'auto' && window.LgSignageDevice.detect());
  window.Device = useLg ? new window.LgSignageDevice() : new window.DemoDevice();
})();
