/* أيقونات خطّية موحّدة (24×24) — تأخذ لون النص الحالي */
(function () {
  function svg(body) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
  }
  window.Icons = {
    // موصل HDMI (الفيشة من الأمام) مع سهم دخول
    hdmi: svg('<path d="M2.5 8.5h13v3.6l-2 2.4h-9l-2-2.4z"/><path d="M5.2 10.6h7.6"/><path d="M9 14.5v3.2"/><path d="M6.8 17.7h4.4"/><path d="M17.2 11h4.3"/><path d="M19.3 8.8l2.2 2.2-2.2 2.2"/>'),
    // لابتوب مع إشارة لاسلكية
    share: svg('<rect x="5" y="11" width="14" height="8" rx="1"/><path d="M2.8 21h18.4"/><path d="M7.6 5.9a6.6 6.6 0 0 1 8.8 0"/><path d="M9.5 7.9a3.8 3.8 0 0 1 5 0"/><circle cx="12" cy="9.4" r=".55" fill="currentColor"/>'),
    expand: svg('<path d="M4 9V4h5"/><path d="M4 4l5.5 5.5"/><path d="M20 9V4h-5"/><path d="M20 4l-5.5 5.5"/><path d="M4 15v5h5"/><path d="M4 20l5.5-5.5"/><path d="M20 15v5h-5"/><path d="M20 20l-5.5-5.5"/>'),
    collapse: svg('<path d="M9.5 4v5.5H4"/><path d="M9.5 9.5L4 4"/><path d="M14.5 4v5.5H20"/><path d="M14.5 9.5L20 4"/><path d="M9.5 20v-5.5H4"/><path d="M9.5 14.5L4 20"/><path d="M14.5 20v-5.5H20"/><path d="M14.5 14.5L20 20"/>'),
    media: svg('<path d="M3 7.5a1.5 1.5 0 0 1 1.5-1.5h4.3l1.8 2h8.9A1.5 1.5 0 0 1 21 9.5v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/><path d="M10.5 11.2v4.6l4-2.3z"/>'),
    home: svg('<path d="M3.5 11L12 4l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5.5h4V20"/>'),
    settings: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>'),
    image: svg('<rect x="3.5" y="5" width="17" height="14" rx="1.5"/><circle cx="9" cy="10" r="1.6"/><path d="M20.5 16l-5-5-8 8"/>'),
    video: svg('<rect x="3.5" y="5.5" width="13" height="13" rx="1.5"/><path d="M16.5 10.5l4-2.5v8l-4-2.5"/>'),
    youtube: svg('<rect x="2.5" y="5.5" width="19" height="13" rx="3.5"/><path d="M10.2 9.4v5.2l4.5-2.6z"/>'),
    slideshow: svg('<rect x="3.5" y="5.5" width="17" height="11" rx="1.5"/><path d="M8 20h8"/><path d="M10.5 9v4l3.5-2z"/>'),
    offline: svg('<path d="M3 3l18 18"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M5 12.5a10 10 0 0 1 4.3-2.5"/><path d="M14.7 10a10 10 0 0 1 4.3 2.5"/><circle cx="12" cy="20" r=".8"/>'),
    check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>')
  };
})();
