/* بطاقة الاتصال (vCard 3.0) + رموز QR حقيقية فقط عند اكتمال البيانات */
(function () {
  function esc(v) { return String(v).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1'); }

  /** يرجع {ok, text, missing[]} */
  function build(c) {
    var missing = [];
    if (!c.name) missing.push('الاسم');
    var mobiles = [].concat(c.mobile || []).filter(Boolean);
    if (!mobiles.length && !c.phone && !c.email) missing.push('رقم هاتف أو بريد');
    if (missing.length) return { ok: false, missing: missing };
    var parts = String(c.name).trim().split(/\s+/);
    var family = parts.length > 1 ? parts.pop() : '', given = parts.join(' ');
    var L = ['BEGIN:VCARD', 'VERSION:3.0', 'N;CHARSET=UTF-8:' + esc(family) + ';' + esc(given) + ';;;', 'FN;CHARSET=UTF-8:' + esc(c.name)];
    if (c.nameEn) L.push('NICKNAME:' + esc(c.nameEn));
    if (c.org) L.push('ORG;CHARSET=UTF-8:' + esc(c.org));
    if (c.title) L.push('TITLE;CHARSET=UTF-8:' + esc(c.title));
    mobiles.forEach(function (m) { L.push('TEL;TYPE=CELL:' + String(m).replace(/\s/g, '')); });
    if (c.phone) L.push('TEL;TYPE=WORK,VOICE:' + c.phone.replace(/\s/g, ''));
    if (c.email) L.push('EMAIL;TYPE=INTERNET:' + c.email);
    if (c.website) L.push('URL:' + c.website);
    if (c.address) L.push('ADR;TYPE=WORK;CHARSET=UTF-8:;;' + esc(c.address) + ';;;;');
    L.push('END:VCARD');
    return { ok: true, text: L.join('\r\n'), missing: [] };
  }

  function validUrl(u) { return /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(u || ''); }

  /** يرسم QR داكن على أبيض (لقراءة موثوقة بالهاتف) داخل canvas */
  function drawQr(canvas, text, px) {
    qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
    var qr = qrcode(0, 'M');
    qr.addData(text, 'Byte');
    qr.make();
    var n = qr.getModuleCount(), quiet = 4, total = n + quiet * 2;
    var cell = Math.max(2, Math.floor(px / total));
    canvas.width = canvas.height = cell * total;
    var g = canvas.getContext('2d');
    g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, canvas.width, canvas.height);
    g.fillStyle = '#111111';
    for (var r = 0; r < n; r++) for (var col = 0; col < n; col++)
      if (qr.isDark(r, col)) g.fillRect((col + quiet) * cell, (r + quiet) * cell, cell, cell);
    canvas.setAttribute('data-qr-text-length', String(text.length));
    return canvas;
  }

  window.VCard = { build: build, validUrl: validUrl, drawQr: drawQr };
})();
