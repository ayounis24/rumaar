/*
 * اختبارات الواجهة الآلية (على الكمبيوتر، في وضع العرض التجريبي).
 * التشغيل:  node tests/run.cjs   (بعد تشغيل خادم محلي على المنفذ 8765 — راجع README)
 * المتطلبات: playwright + jsqr  (npm install)
 */
const { chromium } = require('playwright');
const jsQR = require('jsqr');

const BASE = process.env.BASE || 'http://127.0.0.1:8765/index.html';
const results = [];
function ok(cond, msg) { if (!cond) throw new Error(msg); }

async function page(browser, query = '', override = null, size = { width: 1920, height: 1080 }) {
  const ctx = await browser.newContext({ viewport: size });
  const p = await ctx.newPage();
  p.errors = [];
  p.on('pageerror', e => p.errors.push(e.message));
  p.on('console', m => { if (m.type() === 'error') p.errors.push(m.text()); });
  if (override) await p.addInitScript(o => { window.RUMAAR_CONFIG_OVERRIDE = o; }, override);
  await p.goto(BASE + query, { waitUntil: 'load' });
  await p.waitForTimeout(400);
  return p;
}
const focused = p => p.evaluate(() => {
  const a = document.activeElement;
  return a ? (a.getAttribute('aria-label') || a.textContent.trim()) : null;
});
async function key(p, k, n = 1) { for (let i = 0; i < n; i++) { await p.keyboard.press(k); await p.waitForTimeout(80); } }

async function test(name, fn) {
  try { await fn(); results.push(['PASS', name]); }
  catch (e) { results.push(['FAIL', name + ' — ' + e.message]); }
}

(async () => {
  const browser = await chromium.launch();

  await test('التحميل بدون أخطاء', async () => {
    const p = await page(browser, '?now=2026-11-16T07:41:00Z');
    ok(p.errors.length === 0, 'أخطاء: ' + p.errors.join(' | '));
    await p.context().close();
  });

  await test('التنقّل بالأسهم بين أيقونات التحكّم (يمين ← يسار)', async () => {
    const p = await page(browser);
    ok((await focused(p)) === 'مكتبة المشاريع والفيديوهات', 'التحديد الافتراضي: ' + await focused(p));
    const seq = [];
    await key(p, 'ArrowRight', 5);           // أقصى اليمين
    seq.push(await focused(p));
    for (let i = 0; i < 6; i++) { await key(p, 'ArrowLeft'); seq.push(await focused(p)); }
    const expected = ['اختيار مدخل HDMI', 'مشاركة شاشة اللابتوب', 'تكبير لملء الشاشة', 'مكتبة المشاريع والفيديوهات', 'الرئيسية', 'الإعدادات', 'الإعدادات'];
    ok(JSON.stringify(seq) === JSON.stringify(expected), 'الترتيب: ' + seq.join(' / '));
    await p.context().close();
  });

  const threeInputs = { hdmiInputs: [{ port: 1, name: 'كاميرات المكتب' }, { port: 2, name: 'HDMI 2' }, { port: 3, name: 'HDMI 3' }] };
  await test('قائمة HDMI: اختيار المدخل 3، والعودة للزر، وحالة «تجريبي» بدون فيديو مزيف', async () => {
    const p = await page(browser, '', threeInputs);
    await key(p, 'ArrowRight', 5); await key(p, 'Enter');
    ok(await p.isVisible('.panel'), 'القائمة لم تُفتح');
    ok((await focused(p)).includes('HDMI 1'), 'التحديد داخل القائمة: ' + await focused(p));
    await key(p, 'ArrowDown', 2); ok((await focused(p)).startsWith('HDMI 3'), 'بعد الأسهم: ' + await focused(p));
    await key(p, 'Enter');
    ok(!(await p.isVisible('.panel')), 'القائمة لم تُغلق');
    ok((await focused(p)) === 'اختيار مدخل HDMI', 'التحديد لم يرجع للزر: ' + await focused(p));
    const chip = await p.$eval('#sourceChip', c => ({ s: c.getAttribute('data-state'), t: c.textContent }));
    ok(chip.s === 'demo' && /HDMI 3/.test(chip.t), 'الشارة: ' + JSON.stringify(chip));
    ok(await p.$('.demo-source'), 'بطاقة الوضع التجريبي غير ظاهرة');
    ok(!(await p.$('#viewerLayers video')), 'يوجد عنصر فيديو يوحي ببث HDMI حقيقي');
    await p.context().close();
  });

  await test('قائمة HDMI الحقيقية: «كاميرات المكتب» فقط', async () => {
    const p = await page(browser);
    await key(p, 'ArrowRight', 5); await key(p, 'Enter');
    const items = await p.$$eval('.panel .list-item', l => l.map(x => x.getAttribute('aria-label')));
    ok(items.length === 1 && items[0].startsWith('كاميرات المكتب'), JSON.stringify(items));
    await p.context().close();
  });

  await test('زر Back يغلق القائمة ويحفظ مكان التحديد', async () => {
    const p = await page(browser);
    await key(p, 'Enter');                      // فتح المكتبة من الزر الافتراضي
    ok(await p.isVisible('.panel'), 'المكتبة لم تُفتح');
    await key(p, 'ArrowDown'); await key(p, 'ArrowLeft');
    await key(p, 'Escape');
    ok(!(await p.isVisible('.panel')), 'لم تُغلق بـ Back');
    ok((await focused(p)) === 'مكتبة المشاريع والفيديوهات', 'التحديد بعد الإغلاق: ' + await focused(p));
    await p.context().close();
  });

  await test('التكبير لملء الشاشة ثم الاستعادة مع الحفاظ على المصدر', async () => {
    const p = await page(browser, '', Object.assign({ controlsAutoHideMs: 700 }, threeInputs));
    await key(p, 'ArrowRight', 5); await key(p, 'Enter'); await key(p, 'ArrowDown', 2); await key(p, 'Enter'); // HDMI 3
    await p.evaluate(() => { window.__srcBefore = window.__app.current(); window.__nodeBefore = document.querySelector('.demo-source'); });
    await key(p, 'ArrowLeft', 2);               // زر التكبير
    ok((await focused(p)) === 'تكبير لملء الشاشة', 'لم نصل لزر التكبير: ' + await focused(p));
    await key(p, 'Enter');
    ok(await p.evaluate(() => window.__app.isFull()), 'لم يتحول لملء الشاشة');
    const vw = await p.$eval('.viewer', v => v.getBoundingClientRect().width);
    ok(vw >= 1900, 'النافذة لم تملأ العرض: ' + vw);
    ok(!(await p.isVisible('.cal')), 'التقويم ما زال ظاهرًا');
    ok((await focused(p)) === 'استعادة الحجم الأصلي', 'اسم الزر بعد التكبير: ' + await focused(p));
    await p.waitForTimeout(1100);
    ok(await p.evaluate(() => document.getElementById('app').classList.contains('is-idle')), 'أدوات التحكم لم تختفِ تلقائيًا');
    await key(p, 'ArrowLeft');                  // أي ضغطة تُظهر الأدوات
    ok(!(await p.evaluate(() => document.getElementById('app').classList.contains('is-idle'))), 'الأدوات لم تظهر عند التفاعل');
    await key(p, 'Escape');                     // Back
    ok(!(await p.evaluate(() => window.__app.isFull())), 'Back لم يستعد الحجم');
    ok((await focused(p)) === 'تكبير لملء الشاشة', 'التحديد بعد الاستعادة: ' + await focused(p));
    const same = await p.evaluate(() => window.__app.current() === window.__srcBefore && document.contains(window.__nodeBefore));
    ok(same, 'المصدر أُعيد إنشاؤه بدل الحفاظ عليه');
    await p.context().close();
  });

  const calCases = [
    { now: '2026-11-16T07:41:00Z', title: 'نوفمبر 2026', today: 16, lead: 0, days: 30 },
    { now: '2026-05-15T09:00:00Z', title: 'مايو 2026', today: 15, lead: 5, days: 31 },
    { now: '2026-11-30T22:30:00Z', title: 'ديسمبر 2026', today: 1, lead: 2, days: 31, note: 'منتصف الليل بتوقيت الرياض' },
    { now: '2028-02-10T09:00:00Z', title: 'فبراير 2028', today: 10, lead: 2, days: 29, note: 'سنة كبيسة' },
    { now: '2026-11-16T07:41:00Z', title: 'نوفمبر 2026', today: 16, lead: 1, days: 30, ws: 6, note: 'الأسبوع يبدأ السبت' }
  ];
  for (const c of calCases) {
    await test('التقويم: ' + c.title + (c.note ? ' (' + c.note + ')' : ''), async () => {
      const p = await page(browser, '?now=' + c.now, c.ws !== undefined ? { weekStart: c.ws } : null);
      const r = await p.evaluate(() => {
        const cells = [...document.querySelectorAll('#calGrid .cal__d')];
        return {
          title: document.getElementById('calTitle').textContent,
          lead: cells.findIndex(x => x.dataset.day === '1'),
          days: cells.filter(x => x.dataset.day).length,
          today: [...document.querySelectorAll('#calGrid .is-today')].map(x => x.dataset.day)
        };
      });
      ok(r.title === c.title, 'العنوان ' + r.title);
      ok(r.lead === c.lead, 'بداية الشهر في العمود ' + r.lead + ' والمتوقع ' + c.lead);
      ok(r.days === c.days, 'عدد الأيام ' + r.days);
      ok(r.today.length === 1 && +r.today[0] === c.today, 'اليوم المميز ' + r.today);
      await p.context().close();
    });
  }

  await test('QR: لا يُولَّد رمز عند نقص البيانات', async () => {
    const p = await page(browser, '', { profileUrl: '', contact: { name: '', mobile: [], phone: '', email: '' } });
    ok(!(await p.$('#qrProfile canvas')) && !(await p.$('#qrContact canvas')), 'ظهر رمز رغم نقص البيانات');
    ok(/بيانات ناقصة/.test(await p.textContent('#qrProfile')) && /بيانات ناقصة/.test(await p.textContent('#qrContact')), 'لا توجد رسالة بيانات ناقصة');
    await p.context().close();
  });

  await test('QR: الرموز المولّدة تُقرأ وتطابق البيانات (بيانات اختبار)', async () => {
    const testData = {
      profileUrl: 'https://example.com/rumaar-profile-test',
      contact: { name: 'اسم تجريبي للاختبار', title: 'منصب تجريبي', mobile: '+966500000000', email: 'test@example.com', website: 'https://example.com' }
    };
    const p = await page(browser, '', testData);
    const read = async sel => {
      const img = await p.$eval(sel + ' canvas', c => {
        const d = c.getContext('2d').getImageData(0, 0, c.width, c.height);
        return { w: c.width, h: c.height, data: Array.from(d.data) };
      });
      const r = jsQR(Uint8ClampedArray.from(img.data), img.w, img.h);
      ok(r, 'تعذّرت قراءة الرمز ' + sel);
      return r.data;
    };
    const prof = await read('#qrProfile');
    ok(prof === testData.profileUrl, 'رابط البروفايل المقروء: ' + prof);
    const vc = await read('#qrContact');
    ok(/^BEGIN:VCARD/.test(vc) && vc.includes('FN;CHARSET=UTF-8:اسم تجريبي للاختبار') && vc.includes('TEL;TYPE=CELL:+966500000000') &&
       vc.includes('EMAIL;TYPE=INTERNET:test@example.com') && /END:VCARD$/.test(vc), 'محتوى vCard: ' + vc);
    await p.context().close();
  });

  await test('QR الحقيقيان: البروفايل يفتح الرابط، وبطاقة الاتصال فيها الاسم والأرقام والبريد', async () => {
    const p = await page(browser);
    const img = await p.$eval('#qrContact canvas', c => {
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height);
      return { w: c.width, h: c.height, data: Array.from(d.data) };
    });
    const r = jsQR(Uint8ClampedArray.from(img.data), img.w, img.h);
    ok(r, 'تعذّرت قراءة الرمز');
    const v = r.data;
    ['FN;CHARSET=UTF-8:أحمد يونس', 'N;CHARSET=UTF-8:يونس;أحمد;;;', 'TEL;TYPE=CELL:+966531074973', 'TEL;TYPE=CELL:+966500979795',
     'TEL;TYPE=WORK,VOICE:+966112077978', 'EMAIL;TYPE=INTERNET:a.younis@rumaar.com', 'URL:https://rumaar.com']
      .forEach(x => ok(v.includes(x), 'ناقص: ' + x + '\n' + v));
    const pimg = await p.$eval('#qrProfile canvas', c => {
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height);
      return { w: c.width, h: c.height, data: Array.from(d.data) };
    });
    const pr = jsQR(Uint8ClampedArray.from(pimg.data), pimg.w, pimg.h);
    ok(pr && pr.data === 'https://drive.google.com/file/d/1lTDY7Mb7PeMrE8pPR9W1S3IgD8TkVvvC/view?usp=drive_link', 'رابط البروفايل المقروء: ' + (pr && pr.data));
    await p.context().close();
  });

  await test('مكتبة الوسائط: اختيار صورة مشروع يعرضها ويحدّث شريط المشروع', async () => {
    const p = await page(browser);
    await key(p, 'Enter'); await key(p, 'ArrowDown'); await key(p, 'ArrowLeft');
    const name = await focused(p);
    await key(p, 'Enter');
    await p.waitForTimeout(300);
    const r = await p.evaluate(() => ({ chip: document.querySelector('#sourceChip .chip__text').textContent, strip: document.querySelector('.strip__name').textContent }));
    ok(r.chip.includes(name) && r.strip === name, JSON.stringify(r) + ' / ' + name);
    await p.context().close();
  });

  await test('YouTube بدون اتصال: رسالة خطأ واضحة ولا يحتجز التحديد', async () => {
    const p = await page(browser, '', { media: [{ type: 'image', src: 'media/projects/laban-square.jpg', project: { name: 'لبن سكوير' } }, { type: 'youtube', videoId: 'aaaaaaaaaaa', title: 'فيديو اختبار' }] });
    await p.route(/youtube/, r => r.abort());
    await key(p, 'Enter'); await key(p, 'ArrowDown', 3);
    ok((await focused(p)).startsWith('فيديو اختبار'), 'التحديد: ' + await focused(p));
    await key(p, 'Enter');
    await p.waitForFunction(() => document.getElementById('sourceChip').getAttribute('data-state') === 'error', null, { timeout: 15000 });
    ok(/YouTube/.test(await p.textContent('#viewerLayers')), 'لا توجد رسالة خطأ في النافذة');
    const before = await focused(p);
    await key(p, 'ArrowLeft');
    ok((await focused(p)) !== before, 'التحديد محتجز');
    await p.context().close();
  });

  await test('الإعدادات: إخفاء شريط المشروع ويُحفظ بعد إعادة التحميل', async () => {
    const p = await page(browser);
    ok(await p.isVisible('#projectStrip'), 'الشريط مخفي من البداية');
    await key(p, 'ArrowLeft', 2); await key(p, 'Enter'); await key(p, 'Enter');
    ok(!(await p.isVisible('#projectStrip')), 'لم يختفِ الشريط');
    await key(p, 'Escape');
    await p.reload(); await p.waitForTimeout(400);
    ok(!(await p.isVisible('#projectStrip')), 'الإعداد لم يُحفظ');
    await p.context().close();
  });

  await test('4K: نفس التوزيع بنسب مطابقة لـ1080p', async () => {
    const a = await page(browser, '', null, { width: 1920, height: 1080 });
    const b = await page(browser, '', null, { width: 3840, height: 2160 });
    const ratio = async p => p.evaluate(() => {
      const v = document.querySelector('.viewer').getBoundingClientRect(), s = document.querySelector('.side').getBoundingClientRect();
      return [v.width / innerWidth, v.height / innerHeight, s.width / innerWidth, v.left / innerWidth].map(x => x.toFixed(3));
    });
    const ra = await ratio(a), rb = await ratio(b);
    ok(JSON.stringify(ra) === JSON.stringify(rb), '1080p ' + ra + ' / 4K ' + rb);
    const vw = parseFloat(ra[0]); ok(vw > 0.6 && vw < 0.7, 'عرض نافذة العرض ' + vw + ' من الشاشة');
    await a.context().close(); await b.context().close();
  });

  await browser.close();
  let fails = 0;
  for (const [s, n] of results) { if (s === 'FAIL') fails++; console.log((s === 'PASS' ? '✅ ' : '❌ ') + n); }
  console.log(`\n${results.length - fails}/${results.length} نجح`);
  process.exit(fails ? 1 : 0);
})();
