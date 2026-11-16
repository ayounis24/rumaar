/*
 * تنقّل الريموت: الأسهم تنقل التحديد حسب موقع العناصر على الشاشة، OK يختار، Back يغلق/يرجع.
 * "النطاق" (scope) هو المكان الذي يتحرك فيه التحديد: اللوحة الرئيسية أو القائمة المفتوحة.
 * عند إغلاق قائمة يعود التحديد للزر الذي فتحها.
 */
(function () {
  var KEY = {
    LEFT: [37], UP: [38], RIGHT: [39], DOWN: [40],
    OK: [13],
    BACK: [461, 27, 8, 10009] // 461 = Back في ريموت LG webOS، Esc/Backspace للكمبيوتر
  };
  function is(code, list) { return list.indexOf(code) >= 0; }

  var stack = [];          // [{root, opener, onBack}]
  var mainRoot = null;
  var lastInRoot = new WeakMap ? new WeakMap() : null;
  var backHandler = null;  // يُستدعى عند Back في اللوحة الرئيسية

  function scopeRoot() { return stack.length ? stack[stack.length - 1].root : mainRoot; }

  function focusables(root) {
    var list = root.querySelectorAll('[data-nav]');
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (el.disabled || el.getAttribute('aria-disabled') === 'true') continue;
      var r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (getComputedStyle(el).visibility === 'hidden') continue;
      out.push(el);
    }
    return out;
  }

  function focus(el) {
    if (!el) return;
    el.focus({ preventScroll: false });
    if (lastInRoot) lastInRoot.set(scopeRoot(), el);
    document.dispatchEvent(new CustomEvent('navfocus', { detail: el }));
  }

  function current() {
    var a = document.activeElement;
    var root = scopeRoot();
    return a && root && root.contains(a) && a.hasAttribute('data-nav') ? a : null;
  }

  function ensureFocus() {
    if (current()) return current();
    var root = scopeRoot();
    var remembered = lastInRoot && lastInRoot.get(root);
    var target = (remembered && root.contains(remembered) && focusables(root).indexOf(remembered) >= 0)
      ? remembered : (root.querySelector('[data-nav-default]') || focusables(root)[0]);
    focus(target);
    return target;
  }

  /** أقرب عنصر في الاتجاه المطلوب (هندسيًا) */
  function move(dir) {
    var cur = current();
    if (!cur) { ensureFocus(); return; }
    var c = cur.getBoundingClientRect();
    var cx = c.left + c.width / 2, cy = c.top + c.height / 2;
    var best = null, bestScore = Infinity;
    focusables(scopeRoot()).forEach(function (el) {
      if (el === cur) return;
      var r = el.getBoundingClientRect();
      var x = r.left + r.width / 2, y = r.top + r.height / 2;
      var dx = x - cx, dy = y - cy, main, cross;
      if (dir === 'left') { if (r.right > c.left + 1 && dx >= -1) return; main = -dx; cross = Math.abs(dy); }
      if (dir === 'right') { if (r.left < c.right - 1 && dx <= 1) return; main = dx; cross = Math.abs(dy); }
      if (dir === 'up') { if (r.bottom > c.top + 1 && dy >= -1) return; main = -dy; cross = Math.abs(dx); }
      if (dir === 'down') { if (r.top < c.bottom - 1 && dy <= 1) return; main = dy; cross = Math.abs(dx); }
      if (main <= 0) return;
      var score = main + cross * 2.2;
      if (score < bestScore) { bestScore = score; best = el; }
    });
    if (best) focus(best);
  }

  function open(root, opener, onBack) {
    stack.push({ root: root, opener: opener || current(), onBack: onBack });
    var first = root.querySelector('[data-nav-default]') || focusables(root)[0];
    focus(first);
  }

  function close() {
    var top = stack.pop();
    if (!top) return;
    if (top.opener && document.body.contains(top.opener)) focus(top.opener); else ensureFocus();
  }

  function onKey(e) {
    var k = e.keyCode;
    // لا نلتقط Backspace داخل حقول الكتابة (لا يوجد منها حاليًا، احتياطًا)
    if (k === 8 && /INPUT|TEXTAREA/.test((document.activeElement || {}).tagName || '')) return;
    document.dispatchEvent(new CustomEvent('userinput'));
    if (is(k, KEY.LEFT)) { e.preventDefault(); move('left'); }
    else if (is(k, KEY.RIGHT)) { e.preventDefault(); move('right'); }
    else if (is(k, KEY.UP)) { e.preventDefault(); move('up'); }
    else if (is(k, KEY.DOWN)) { e.preventDefault(); move('down'); }
    else if (is(k, KEY.OK)) {
      var cur = current() || ensureFocus();
      if (cur) { e.preventDefault(); cur.click(); }
    } else if (is(k, KEY.BACK)) {
      e.preventDefault();
      if (stack.length) {
        var top = stack[stack.length - 1];
        if (top.onBack) top.onBack(); else close();
      } else if (backHandler) backHandler();
    }
  }

  window.Nav = {
    init: function (root, onBackMain) {
      mainRoot = root; backHandler = onBackMain;
      document.addEventListener('keydown', onKey, true);
      // التحديد لا يضيع لو ضغط المستخدم على مكان فارغ بالماوس (للاختبار على الكمبيوتر)
      document.addEventListener('mousedown', function (e) { if (!e.target.closest('[data-nav]')) e.preventDefault(); });
      ensureFocus();
    },
    open: open, close: close, focus: focus, ensureFocus: ensureFocus, current: current,
    depth: function () { return stack.length; },
    KEY: KEY
  };
})();
