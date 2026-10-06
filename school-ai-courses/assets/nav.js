(() => {
  const ROOT = '/school-ai-courses/';
  const path = location.pathname.replace(/index\.html$/, '');
  const home = path === ROOT;
  function normalizeLinks(scope = document) {
    scope.querySelectorAll('a[href]').forEach(a => {
      try {
        const u = new URL(a.getAttribute('href'), location.href);
        if (u.origin === location.origin && u.pathname.startsWith(ROOT)) {
          a.removeAttribute('target');
          if (a.getAttribute('rel') === 'noopener') a.removeAttribute('rel');
        } else if (/^https?:$/.test(u.protocol)) {
          a.target = '_blank'; a.rel = 'noopener';
        }
      } catch (_) {}
    });
  }
  function openQuickChat() {
    const w = window.open('https://duck.ai/', 's14-ai-chat', 'popup=yes,width=520,height=760,resizable=yes,scrollbars=yes');
    if (w) { try { w.focus(); } catch (_) {} }
    else window.open('https://duck.ai/', '_blank', 'noopener');
  }
  function chatButton(id, floating = false) {
    const b = document.createElement('button');
    b.type = 'button'; b.id = id;
    b.className = floating ? 's14-chat-floating' : 's14-top-chat';
    b.innerHTML = '<img src="' + ROOT + 'assets/ui/ai-chat.svg" alt="" width="36" height="36"><span>ИИ-чат</span>';
    b.setAttribute('aria-label', 'Открыть быстрый ИИ-чат');
    b.addEventListener('click', openQuickChat);
    return b;
  }
  if (home) {
    document.querySelector('.home-links')?.appendChild(chatButton('s14QuickChatTop'));
  } else {
    const header = document.querySelector('.topbar .inner');
    const holder = document.createElement('nav');
    holder.className = 'student-global-nav';
    holder.setAttribute('aria-label', 'Навигация курса');
    holder.innerHTML = '<button type="button" class="nav-big nav-back">← Назад</button><a class="nav-big nav-home" href="' + ROOT + '">⌂ Главная</a>';
    holder.querySelector('.nav-back').addEventListener('click', () => {
      try {
        const ref = new URL(document.referrer);
        if (ref.origin === location.origin && ref.pathname.startsWith(ROOT)) { history.back(); return; }
      } catch (_) {}
      location.href = ROOT;
    });
    holder.appendChild(chatButton('s14QuickChatTop'));
    if (header) header.appendChild(holder); else document.body.prepend(holder);
  }
  document.body.appendChild(chatButton('s14QuickChat', true));
  normalizeLinks();
  // Preserve same-tab behavior for links created by existing lesson controls.
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (a) normalizeLinks(a.parentElement);
  }, true);
})();
