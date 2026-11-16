/*
 * واجهة شاشة مكتب «رونق الإعمار».
 * الواجهة لا تتعامل مع الشاشة مباشرة؛ كل ما يخص الجهاز يمر عبر window.Device (device/*.js).
 */
(function () {
  'use strict';

  // ---------- الإعدادات ----------
  function merge(a, b) {
    if (!b) return a;
    Object.keys(b).forEach(function (k) {
      if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object') merge(a[k], b[k]);
      else a[k] = b[k];
    });
    return a;
  }
  var cfg = merge(window.RUMAAR_CONFIG, window.RUMAAR_CONFIG_OVERRIDE);
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('rumaar.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('rumaar.' + k, JSON.stringify(v)); } catch (e) {} }
  };
  var prefs = {
    strip: store.get('strip', cfg.showProjectStrip !== false),
    numerals: store.get('numerals', cfg.numerals || 'latn')
  };

  var $ = function (id) { return document.getElementById(id); };
  var app = $('app');
  var I = window.Icons;
  var dev = window.Device;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function D(s) { return window.Cal.digits(s, prefs.numerals); }

  // ---------- الهوية ----------
  function applyTheme() {
    var c = cfg.brand.colors, r = document.documentElement.style;
    Object.keys(c).forEach(function (k) { r.setProperty('--' + k, c[k]); });
    r.setProperty('--font', "'" + cfg.brand.font + "'");
    $('logo').src = cfg.brand.logo;
    $('logo').alt = cfg.brand.nameAr;
    $('brandName').textContent = cfg.brand.nameAr;
    $('brandLegal').textContent = cfg.brand.legalNameAr;
    $('welcome').textContent = cfg.welcome || '';
  }

  // ---------- الساعة والتاريخ والتقويم ----------
  var lastDayKey = '';
  function tickClock() {
    var Cal = window.Cal, now = Cal.now(), p = Cal.parts(now, cfg.timeZone);
    var h12 = p.hh % 12 === 0 ? 12 : p.hh % 12;
    $('clock').innerHTML = esc(D(h12 + ':' + (p.mm < 10 ? '0' : '') + p.mm)) +
      ' <span style="font-size:.45em;color:var(--muted)">' + (p.hh < 12 ? 'ص' : 'م') + '</span>';
    var greg = Cal.DAYS[p.dow] + ' ' + D(p.d) + ' ' + Cal.MONTHS[p.m - 1] + ' ' + D(p.y);
    var hij = Cal.hijri(now, cfg.timeZone, prefs.numerals);
    $('dateLine').innerHTML = '<b>' + esc(greg) + '</b>' + (hij ? ' <span style="color:var(--accent)">•</span> ' + esc(hij) : '');
    var key = p.y + '-' + p.m + '-' + p.d + '-' + prefs.numerals;
    if (key !== lastDayKey) { lastDayKey = key; renderCalendar(p, now); }
  }

  function renderCalendar(p, now) {
    var Cal = window.Cal, ws = cfg.weekStart || 0;
    $('calTitle').textContent = Cal.MONTHS[p.m - 1] + ' ' + D(p.y);
    var hij = Cal.hijri(now, cfg.timeZone, prefs.numerals);
    $('calHijri').textContent = hij ? hij.replace(/^\S+\s/, '') : '';
    var g = Cal.monthGrid(p.y, p.m, p.d, ws), html = '';
    for (var i = 0; i < 7; i++) html += '<div class="cal__dow">' + Cal.DAYS_SHORT[(ws + i) % 7] + '</div>';
    g.weeks.forEach(function (w) {
      w.forEach(function (c, i) {
        var dow = (ws + i) % 7;
        if (!c.d) { html += '<div class="cal__d"></div>'; return; }
        html += '<div class="cal__d' + (dow === 5 ? ' is-fri' : '') + (c.today ? ' is-today" aria-current="date' : '') +
          '" data-day="' + c.d + '">' + D(c.d) + '</div>';
      });
    });
    $('calGrid').innerHTML = html;
  }

  // ---------- رموز QR ----------
  function renderQr() {
    var px = Math.round(11.5 * parseFloat(getComputedStyle(document.documentElement).fontSize) * 2);
    var prof = $('qrProfile'), con = $('qrContact');
    if (window.VCard.validUrl(cfg.profileUrl)) {
      prof.className = 'card qr';
      prof.innerHTML = '';
      prof.appendChild(window.VCard.drawQr(document.createElement('canvas'), cfg.profileUrl, px));
      prof.insertAdjacentHTML('beforeend', '<div class="qr__label">بروفايل الشركة</div><div class="qr__hint">امسح الرمز بكاميرا الجوال</div>');
    } else {
      prof.className = 'card qr qr--missing';
      prof.innerHTML = '<div class="qr__box">بيانات ناقصة:<br>رابط البروفايل</div><div class="qr__label">بروفايل الشركة</div><div class="qr__hint">يُضاف من config.js</div>';
    }
    var v = window.VCard.build(cfg.contact || {});
    if (v.ok) {
      con.className = 'card qr';
      con.innerHTML = '';
      con.appendChild(window.VCard.drawQr(document.createElement('canvas'), v.text, px));
      con.insertAdjacentHTML('beforeend', '<div class="qr__label">بطاقة الاتصال</div><div class="qr__hint">احفظ جهة الاتصال</div>');
    } else {
      con.className = 'card qr qr--missing';
      con.innerHTML = '<div class="qr__box">بيانات ناقصة:<br>' + esc(v.missing.join('، ')) + '</div><div class="qr__label">بطاقة الاتصال</div><div class="qr__hint">تُضاف من config.js</div>';
    }
  }

  // ---------- شريط التحكّم ----------
  var controlsDef = [
    { id: 'hdmi', icon: 'hdmi', label: 'اختيار مدخل HDMI', act: openHdmiMenu },
    { id: 'share', icon: 'share', label: 'مشاركة شاشة اللابتوب', act: openShareMenu },
    { id: 'full', icon: 'expand', label: 'تكبير لملء الشاشة', act: toggleFull },
    { sep: true },
    { id: 'media', icon: 'media', label: 'مكتبة المشاريع والفيديوهات', act: openMediaMenu },
    { id: 'home', icon: 'home', label: 'الرئيسية', act: goHome },
    { id: 'settings', icon: 'settings', label: 'الإعدادات', act: openSettings }
  ];
  var ctlEls = {};
  function renderControls() {
    var nav = $('controls');
    controlsDef.forEach(function (c) {
      if (c.sep) { var s = document.createElement('span'); s.className = 'ctl-sep'; nav.appendChild(s); return; }
      var b = document.createElement('button');
      b.className = 'ctl'; b.type = 'button';
      b.setAttribute('data-nav', ''); b.setAttribute('aria-label', c.label); b.id = 'ctl-' + c.id;
      if (c.id === 'media') b.setAttribute('data-nav-default', '');
      b.innerHTML = I[c.icon];
      b.addEventListener('click', function () { c.act(b); });
      nav.appendChild(b);
      ctlEls[c.id] = b;
    });
  }

  // تلميح قصير باسم الوظيفة عند التحديد
  var tipTimer;
  document.addEventListener('navfocus', function (e) {
    var el = e.detail, tip = $('tooltip');
    clearTimeout(tipTimer);
    if (!el.classList.contains('ctl')) { tip.hidden = true; return; }
    tip.textContent = el.getAttribute('aria-label');
    tip.hidden = false;
    var r = el.getBoundingClientRect(), ar = app.getBoundingClientRect();
    tip.style.left = (r.left + r.width / 2 - ar.left - tip.offsetWidth / 2) + 'px';
    tip.style.top = (r.top - ar.top - tip.offsetHeight - 10) + 'px';
    tipTimer = setTimeout(function () { tip.hidden = true; }, 2500);
  });

  // ---------- نافذة العرض الموحّدة ----------
  var current = null;      // {kind, stop(), item}
  var slideTimer = null, slideIdx = 0;
  var images = (cfg.media || []).filter(function (m) { return m.type === 'image'; });

  function setChip(state, iconKey, text) {
    var chip = $('sourceChip');
    chip.setAttribute('data-state', state);
    chip.querySelector('.chip__icon').innerHTML = I[iconKey] || '';
    chip.querySelector('.chip__text').textContent = text;
  }

  function setStrip(project) {
    var s = $('projectStrip');
    if (!prefs.strip || !project) { s.hidden = true; return; }
    s.querySelector('.strip__name').textContent = project.name || '';
    s.querySelector('.strip__loc').textContent = project.location || '';
    s.querySelector('.strip__scope').textContent = project.scope || '';
    s.querySelector('.strip__sep').style.display = project.location && project.scope ? '' : 'none';
    s.hidden = false;
  }

  function newLayer() {
    var layer = document.createElement('div');
    layer.className = 'viewer__layer';
    $('viewerLayers').appendChild(layer);
    return layer;
  }
  function showLayer(layer) {
    var all = $('viewerLayers').children;
    requestAnimationFrame(function () {
      layer.classList.add('is-on');
      for (var i = 0; i < all.length; i++) if (all[i] !== layer) (function (old) {
        old.classList.remove('is-on');
        setTimeout(function () { if (old.parentNode) old.parentNode.removeChild(old); }, 900);
      })(all[i]);
    });
  }
  function messageCard(layer, opts) {
    layer.innerHTML = '<div class="msg-card' + (opts.bad ? ' msg-card--bad' : '') + '"><div class="msg-card__icon">' + (I[opts.icon] || '') +
      '</div><div class="msg-card__title">' + esc(opts.title) + '</div><div class="msg-card__note">' + (opts.noteHtml || esc(opts.note || '')) + '</div>' +
      (opts.steps ? '<ol class="msg-card__steps">' + opts.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' : '') + '</div>';
  }

  function stopCurrent() {
    clearTimeout(slideTimer); slideTimer = null;
    if (current && current.stop) current.stop();
    current = null;
  }

  /** نقطة الدخول الوحيدة لتغيير المصدر */
  function setSource(src) {
    stopCurrent();
    document.dispatchEvent(new CustomEvent('sourcechange', { detail: src }));
    if (src.kind === 'slideshow') return startSlideshow(src.start || 0);
    if (src.kind === 'image') return showImage(src.item, false);
    if (src.kind === 'video') return showVideo(src.item);
    if (src.kind === 'youtube') return showYouTube(src.item);
    if (src.kind === 'hdmi') return showHdmi(src.input, src.label);
    if (src.kind === 'shareInfo') return showShareInfo();
  }

  function startSlideshow(start) {
    if (!images.length) {
      var l = newLayer(); messageCard(l, { icon: 'image', title: 'لا توجد صور في المكتبة', note: 'أضف صور المشاريع في config.js' });
      showLayer(l); setChip('error', 'slideshow', 'عرض المشاريع — المكتبة فارغة'); setStrip(null);
      current = { kind: 'slideshow' }; return;
    }
    slideIdx = start % images.length;
    current = { kind: 'slideshow', stop: function () { clearTimeout(slideTimer); } };
    (function next() {
      showImage(images[slideIdx], true);
      slideIdx = (slideIdx + 1) % images.length;
      slideTimer = setTimeout(next, (cfg.slideSeconds || 10) * 1000);
    })();
  }

  function showImage(item, inSlideshow) {
    var l = newLayer(), img = new Image();
    img.className = 'kb';
    img.alt = item.project ? item.project.name : (item.title || '');
    img.onload = function () { showLayer(l); };
    img.onerror = function () {
      messageCard(l, { icon: 'image', title: 'تعذّر تحميل الصورة', note: item.src, bad: true }); showLayer(l);
      setChip('error', 'image', 'تعذّر تحميل الصورة');
    };
    img.src = item.src;
    l.appendChild(img);
    var name = item.project ? item.project.name : (item.title || 'صورة');
    setChip('live', inSlideshow ? 'slideshow' : 'image', (inSlideshow ? 'عرض المشاريع: ' : 'صورة: ') + name);
    setStrip(item.project);
    if (!inSlideshow) current = { kind: 'image', item: item };
  }

  function showVideo(item) {
    var l = newLayer(), v = document.createElement('video');
    v.muted = true; v.loop = true; v.autoplay = true; v.setAttribute('playsinline', '');
    v.src = item.src;
    l.appendChild(v); showLayer(l);
    setChip('checking', 'video', 'فيديو: ' + (item.title || '') + ' — جارٍ التحميل');
    v.addEventListener('playing', function () { setChip('live', 'video', 'فيديو: ' + (item.title || '') + ' (بدون صوت)'); });
    v.addEventListener('error', function () {
      messageCard(l, { icon: 'video', title: 'تعذّر تشغيل الفيديو', note: 'تحقق من الملف أو صيغته (MP4/H.264 مستحسن)', bad: true });
      setChip('error', 'video', 'تعذّر تشغيل الفيديو');
    });
    try { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } catch (e) {}
    setStrip(item.project);
    current = { kind: 'video', item: item, stop: function () { try { v.pause(); v.removeAttribute('src'); v.load(); } catch (e) {} } };
  }

  // YouTube: يُحمَّل عند الطلب فقط، مع رسائل واضحة عند عدم السماح بالتضمين أو انقطاع الإنترنت.
  var ytLoading = null;
  function loadYT() {
    if (window.YT && window.YT.Player) return Promise.resolve();
    if (ytLoading) return ytLoading;
    ytLoading = new Promise(function (res, rej) {
      var t = setTimeout(function () { ytLoading = null; rej(new Error('timeout')); }, 12000);
      window.onYouTubeIframeAPIReady = function () { clearTimeout(t); res(); };
      var s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      s.onerror = function () { clearTimeout(t); ytLoading = null; rej(new Error('load')); };
      document.head.appendChild(s);
    });
    return ytLoading;
  }
  function showYouTube(item) {
    var l = newLayer(), holder = document.createElement('div');
    l.appendChild(holder); showLayer(l);
    var title = item.title || 'YouTube';
    setChip('checking', 'youtube', 'YouTube: ' + title + ' — جارٍ التحميل');
    setStrip(item.project);
    var player = null, alive = true;
    current = { kind: 'youtube', item: item, stop: function () { alive = false; try { if (player) player.destroy(); } catch (e) {} } };
    if (!navigator.onLine) {
      messageCard(l, { icon: 'offline', title: 'لا يوجد اتصال بالإنترنت', note: 'YouTube يحتاج اتصالًا. اختر صورًا أو فيديو محليًا من المكتبة.', bad: true });
      setChip('error', 'youtube', 'YouTube غير متاح — لا يوجد اتصال');
      return;
    }
    loadYT().then(function () {
      if (!alive) return;
      var pv = { autoplay: 1, mute: 1, controls: 0, rel: 0, playsinline: 1, modestbranding: 1, disablekb: 1, fs: 0, iv_load_policy: 3 };
      var opts = { host: 'https://www.youtube-nocookie.com', width: '100%', height: '100%', playerVars: pv, events: {} };
      if (item.playlistId) { pv.listType = 'playlist'; pv.list = item.playlistId; pv.loop = 1; } else { opts.videoId = item.videoId; }
      opts.events.onReady = function (e) {
        try { e.target.mute(); e.target.playVideo(); var f = e.target.getIframe(); f.setAttribute('tabindex', '-1'); } catch (x) {}
      };
      opts.events.onStateChange = function (e) {
        if (e.data === 1) setChip('live', 'youtube', 'YouTube: ' + title + ' (بدون صوت)');
        if (e.data === 0 && !item.playlistId) { try { e.target.seekTo(0); e.target.playVideo(); } catch (x) {} }
      };
      opts.events.onError = function (e) {
        var msg = (e.data === 101 || e.data === 150) ? 'مالك الفيديو لا يسمح بتشغيله خارج YouTube'
          : e.data === 100 ? 'الفيديو غير موجود أو خاص' : 'تعذّر تشغيل الفيديو (رمز ' + e.data + ')';
        messageCard(l, { icon: 'youtube', title: 'تعذّر تشغيل YouTube', note: msg, bad: true });
        setChip('error', 'youtube', 'YouTube: ' + msg);
      };
      player = new window.YT.Player(holder, opts);
    }).catch(function () {
      if (!alive) return;
      messageCard(l, { icon: 'youtube', title: 'تعذّر تحميل YouTube', note: 'تحقق من الإنترنت أو من حجب YouTube على الشبكة.', bad: true });
      setChip('error', 'youtube', 'تعذّر تحميل YouTube');
    });
  }

  var stateText = { live: 'متصل', demo: 'تجريبي', checking: 'قيد التحقق', unverified: 'غير مؤكد', error: 'خطأ' };
  function showHdmi(input, label) {
    var l = newLayer(); showLayer(l);
    l.classList.add('fit-contain');
    var plain = 'HDMI ' + input.port, base = label || input.name;
    var name = base === plain ? plain : base + ' — ' + plain;
    var ctl = dev.mountHdmi(l, input);
    ctl.onState(function (state, msg) {
      setChip(state, 'hdmi', name + ' • ' + (msg || stateText[state] || ''));
      if (state === 'error') messageCard(l, {
        icon: 'hdmi', title: 'لا يمكن عرض المدخل داخل اللوحة', bad: true,
        note: msg + '. راجع خطة الاختبار في README قبل الاعتماد على هذه الخاصية.'
      });
    });
    setStrip(null);
    current = { kind: 'hdmi', input: input, stop: function () { ctl.stop(); } };
  }

  function showShareInfo() {
    var l = newLayer(); showLayer(l);
    var ss = cfg.screenShare || {};
    var native = ss.mode === 'native';
    messageCard(l, {
      icon: 'share', title: 'مشاركة شاشة اللابتوب',
      note: native
        ? 'اللابتوب يتصل بالشاشة لاسلكيًا عبر الشبكة (ميزة الشاشة المدمجة)، ويظهر بملء الشاشة خارج هذه اللوحة. زر الشاشة لا يبدأ المشاركة؛ تبدأ من اللابتوب. لعرضها داخل اللوحة يلزم جهاز استقبال على HDMI.'
        : 'غير مهيأة بعد: عرض المشاركة داخل هذه اللوحة يحتاج جهاز استقبال لاسلكي موصولًا بأحد مداخل HDMI.',
      steps: (ss.laptopSteps && ss.laptopSteps.length) ? ss.laptopSteps : null
    });
    setChip(native ? 'info' : 'error', 'share', native ? 'مشاركة اللابتوب — تبدأ من اللابتوب وتظهر بملء الشاشة' : 'مشاركة الشاشة — غير مهيأة');
    setStrip(null);
    current = { kind: 'shareInfo' };
  }

  // ---------- ملء الشاشة ----------
  var idleTimer;
  function isFull() { return app.classList.contains('is-full'); }
  function setFull(on) {
    app.classList.toggle('is-full', on);
    var b = ctlEls.full;
    b.innerHTML = on ? I.collapse : I.expand;
    b.setAttribute('aria-label', on ? 'استعادة الحجم الأصلي' : 'تكبير لملء الشاشة');
    b.classList.toggle('is-active', on);
    poke();
    Nav.focus(b);
  }
  function toggleFull() { setFull(!isFull()); }
  function poke() {
    app.classList.remove('is-idle');
    clearTimeout(idleTimer);
    if (isFull() && !Nav.depth()) idleTimer = setTimeout(function () { app.classList.add('is-idle'); }, cfg.controlsAutoHideMs || 5000);
  }
  document.addEventListener('userinput', poke);

  // ---------- القوائم ----------
  function openPanel(opener, build) {
    var ov = $('overlay');
    ov.innerHTML = '';
    var panel = document.createElement('div');
    panel.className = 'panel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true');
    build(panel);
    ov.appendChild(panel);
    ov.hidden = false;
    clearTimeout(idleTimer); app.classList.remove('is-idle');
    Nav.open(panel, opener, closePanel);
    return panel;
  }
  function closePanel() {
    $('overlay').hidden = true;
    $('overlay').innerHTML = '';
    Nav.close();
    poke();
  }
  function item(icon, main, sub, badge, onClick, isCur) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'list-item' + (isCur ? ' is-current' : ''); b.setAttribute('data-nav', '');
    b.innerHTML = '<span class="list-item__icon">' + (I[icon] || '') + '</span><span class="list-item__main">' + esc(main) +
      (sub ? '<span class="list-item__sub">' + esc(sub) + '</span>' : '') + '</span>' + (badge ? '<span class="list-item__badge">' + esc(badge) + '</span>' : '');
    b.setAttribute('aria-label', main + (sub ? '، ' + sub : ''));
    b.addEventListener('click', onClick);
    return b;
  }
  function head(panel, title, sub) {
    panel.insertAdjacentHTML('beforeend', '<div class="panel__title">' + esc(title) + '</div>' + (sub ? '<div class="panel__sub">' + esc(sub) + '</div>' : ''));
  }

  function openHdmiMenu(opener) {
    openPanel(opener, function (p) {
      head(p, 'اختيار مدخل HDMI', dev.isReal ? 'يُعرض داخل نافذة العرض — الخاصية تحتاج اختبارًا على الشاشة' : 'وضع تجريبي: لا يوجد اتصال حقيقي بمداخل HDMI');
      (cfg.hdmiInputs || []).forEach(function (inp, i) {
        var isCur = current && current.kind === 'hdmi' && current.input.port === inp.port;
        var b = item('hdmi', inp.name, inp.name === 'HDMI ' + inp.port ? 'اسم المدخل قابل للتخصيص' : 'HDMI ' + inp.port, dev.isReal ? null : 'تجريبي', function () {
          closePanel(); setSource({ kind: 'hdmi', input: inp });
        }, isCur);
        if (isCur || (i === 0 && !(current && current.kind === 'hdmi'))) b.setAttribute('data-nav-default', '');
        p.appendChild(b);
      });
    });
  }

  function openShareMenu(opener) {
    var ss = cfg.screenShare || {};
    openPanel(opener, function (p) {
      head(p, 'مشاركة شاشة اللابتوب', 'زر الشاشة لا يبدأ البث من اللابتوب؛ يلزم تنفيذ خطوة على اللابتوب نفسه.');
      if (ss.receiverPort) {
        var inp = { port: ss.receiverPort, name: ss.receiverName || 'جهاز استقبال المشاركة' };
        p.appendChild(item('share', 'عرض جهاز الاستقبال هنا', inp.name + ' — HDMI ' + inp.port, dev.isReal ? null : 'تجريبي', function () {
          closePanel(); setSource({ kind: 'hdmi', input: inp, label: 'مشاركة اللابتوب' });
        }));
        var steps = ss.laptopSteps && ss.laptopSteps.length ? ss.laptopSteps : ['اتبع تعليمات جهاز الاستقبال على اللابتوب (تُكتب هنا بعد اختيار الجهاز).'];
        p.insertAdjacentHTML('beforeend', '<div class="panel__sub" style="margin-top:1rem">على اللابتوب:</div><ol class="msg-card__steps" style="margin:0">' +
          steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>');
      } else {
        var native = ss.mode === 'native';
        p.appendChild(item('share', native ? 'خطوات المشاركة من اللابتوب' : 'كيف تعمل المشاركة داخل اللوحة؟',
          native ? 'لاسلكي عبر الشبكة • يظهر بملء الشاشة' : 'غير مهيأة — تحتاج جهاز استقبال على HDMI', null, function () {
          closePanel(); setSource({ kind: 'shareInfo' });
        }));
      }
    });
  }

  function openMediaMenu(opener) {
    openPanel(opener, function (p) {
      head(p, 'مكتبة المشاريع والفيديوهات', 'اختر ما يُعرض في النافذة');
      var body = document.createElement('div'); body.className = 'panel__body'; p.appendChild(body);
      var ss = item('slideshow', 'عرض صور المشاريع تلقائيًا', images.length + ' صورة • كل ' + (cfg.slideSeconds || 10) + ' ثوانٍ', null, function () {
        closePanel(); setSource({ kind: 'slideshow' });
      }, current && current.kind === 'slideshow');
      ss.setAttribute('data-nav-default', '');
      body.appendChild(ss);
      if (images.length) {
        body.insertAdjacentHTML('beforeend', '<div class="media-section">صور المشاريع</div>');
        var grid = document.createElement('div'); grid.className = 'media-grid';
        images.forEach(function (m) {
          var t = document.createElement('button'); t.type = 'button'; t.className = 'thumb'; t.setAttribute('data-nav', '');
          var name = m.project ? m.project.name : (m.title || 'صورة');
          t.setAttribute('aria-label', name);
          t.innerHTML = '<img alt="" src="' + esc(m.src) + '"><span class="thumb__cap">' + esc(name) + '</span>';
          t.addEventListener('click', function () { closePanel(); setSource({ kind: 'image', item: m }); });
          grid.appendChild(t);
        });
        body.appendChild(grid);
      }
      var vids = (cfg.media || []).filter(function (m) { return m.type === 'video'; });
      var yts = (cfg.media || []).filter(function (m) { return m.type === 'youtube'; });
      body.insertAdjacentHTML('beforeend', '<div class="media-section">فيديوهات وروابط YouTube</div>');
      vids.forEach(function (m) {
        body.appendChild(item('video', m.title || m.src, 'فيديو محلي • بدون صوت', null, function () { closePanel(); setSource({ kind: 'video', item: m }); }));
      });
      yts.forEach(function (m) {
        body.appendChild(item('youtube', m.title || 'YouTube', (m.playlistId ? 'قائمة تشغيل' : 'فيديو') + ' • يحتاج إنترنت وسماح بالتضمين', null,
          function () { closePanel(); setSource({ kind: 'youtube', item: m }); }));
      });
      if (!vids.length && !yts.length) body.insertAdjacentHTML('beforeend', '<div class="panel__foot" style="margin-top:0">لا توجد فيديوهات أو روابط بعد — تُضاف في config.js</div>');
    });
  }

  function missingData() {
    var m = [];
    if (!window.VCard.validUrl(cfg.profileUrl)) m.push('رابط بروفايل الشركة');
    var c = cfg.contact || {};
    if (!c.name) m.push('اسم بطاقة الاتصال');
    if (!c.title) m.push('المنصب');
    if (![].concat(c.mobile || []).filter(Boolean).length && !c.phone) m.push('رقم الهاتف');
    if (!c.email) m.push('البريد الإلكتروني');
    var ssc = cfg.screenShare || {};
    if (!ssc.receiverPort && ssc.mode !== 'native') m.push('جهاز استقبال المشاركة ومدخله');
    if (!(cfg.media || []).some(function (x) { return x.type !== 'image'; })) m.push('فيديوهات/روابط YouTube');
    if (!cfg.brand.colorsApproved) m.push('اعتماد ألوان الهوية');
    return m;
  }

  function openSettings(opener) {
    openPanel(opener, function (p) {
      head(p, 'الإعدادات', 'تعديل البيانات (الشعار، الألوان، الروابط، أسماء المداخل…) من ملف config.js');
      var t1 = item('check', 'شريط المشروع', 'اسم المشروع وموقعه ونطاق الأعمال', prefs.strip ? 'ظاهر' : 'مخفي', function () {
        prefs.strip = !prefs.strip; store.set('strip', prefs.strip);
        t1.querySelector('.list-item__badge').textContent = prefs.strip ? 'ظاهر' : 'مخفي';
        if (!prefs.strip) setStrip(null); else if (current && current.item) setStrip(current.item.project);
      });
      t1.setAttribute('data-nav-default', '');
      p.appendChild(t1);
      var t2 = item('check', 'شكل الأرقام', 'الساعة والتاريخ والتقويم', prefs.numerals === 'arab' ? '٠١٢٣' : '0123', function () {
        prefs.numerals = prefs.numerals === 'arab' ? 'latn' : 'arab'; store.set('numerals', prefs.numerals);
        t2.querySelector('.list-item__badge').textContent = prefs.numerals === 'arab' ? '٠١٢٣' : '0123';
        tickClock();
      });
      p.appendChild(t2);
      p.appendChild(item('home', 'إعادة تحميل الواجهة', 'يعيد قراءة الإعدادات', null, function () { location.reload(); }));
      var miss = missingData();
      var rows = [
        ['وضع التشغيل', dev.isReal ? dev.label : 'عرض تجريبي (ليس على شاشة LG)'],
        ['HDMI داخل اللوحة', dev.isReal ? 'يحتاج اختبارًا على الشاشة' : 'تجريبي — غير متصل'],
        ['الإنترنت', navigator.onLine ? 'متصل' : 'غير متصل'],
        ['المنطقة الزمنية', cfg.timeZone],
        ['بيانات ناقصة', miss.length ? miss.join('، ') : 'لا يوجد']
      ];
      p.insertAdjacentHTML('beforeend', '<div style="margin-top:1rem">' + rows.map(function (r) {
        return '<div class="info-row"><span>' + esc(r[0]) + '</span><span>' + esc(r[1]) + '</span></div>';
      }).join('') + '</div>');
    });
  }

  function goHome() {
    while (Nav.depth()) closePanel();
    if (isFull()) setFull(false);
    setSource({ kind: 'slideshow' });
    Nav.focus(ctlEls.home);
  }

  // ---------- الإنترنت ----------
  function netUpdate() {
    var chip = $('netChip');
    chip.querySelector('.chip__icon').innerHTML = I.offline;
    chip.hidden = navigator.onLine;
  }
  window.addEventListener('online', netUpdate);
  window.addEventListener('offline', netUpdate);

  // لا نسمح بأن يحتجز YouTube (iframe) التحديد
  window.addEventListener('blur', function () {
    setTimeout(function () {
      if (document.activeElement && document.activeElement.tagName === 'IFRAME') { document.activeElement.blur(); window.focus(); Nav.ensureFocus(); }
    }, 0);
  });

  // ---------- التشغيل ----------
  applyTheme();
  renderControls();
  tickClock();
  setInterval(tickClock, 1000);
  renderQr();
  netUpdate();
  setSource({ kind: 'slideshow' });
  Nav.init(app, function onBackMain() { if (isFull()) setFull(false); });

  // للاختبارات الآلية فقط (لا يغيّر السلوك)
  window.__app = { setSource: setSource, isFull: isFull, current: function () { return current; }, missingData: missingData, prefs: prefs };
})();
