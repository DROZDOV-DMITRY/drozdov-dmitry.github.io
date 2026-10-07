(() => {
  const ROOT = '/school-ai-courses/';
  const FEEDBACK_URL = 'https://max.ru/u/f9LHodD0cOIPo6kMsyqken8jVFD1_YWdgh0iZZy6woohI4gWOB110cJMMVQ';
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
  function feedbackLink(className = '') {
    const a = document.createElement('a');
    a.href = FEEDBACK_URL;
    a.className = className;
    a.textContent = 'Связь';
    a.setAttribute('aria-label', 'Обратная связь через MAX');
    return a;
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
    const homeNav = document.querySelector('.home-nav');
    const homeLinks = document.querySelector('.home-links');
    if (homeLinks) {
      homeLinks.id = 'homeMainMenu';
      homeLinks.appendChild(feedbackLink('s14-feedback'));
      homeLinks.appendChild(chatButton('s14QuickChatTop'));
    }
    if (homeNav && homeLinks) {
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'home-menu-toggle';
      toggle.setAttribute('aria-controls', 'homeMainMenu');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Открыть меню');
      toggle.innerHTML = '<span></span><span></span><span></span>';
      const brand = homeNav.querySelector('.home-brand');
      brand?.after(toggle);

      const closeMenu = () => {
        homeNav.classList.remove('menu-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Открыть меню');
      };
      const openMenu = () => {
        homeNav.classList.add('menu-open');
        toggle.setAttribute('aria-expanded', 'true');
        toggle.setAttribute('aria-label', 'Закрыть меню');
      };
      toggle.addEventListener('click', () => {
        homeNav.classList.contains('menu-open') ? closeMenu() : openMenu();
      });
      homeNav.addEventListener('click', e => {
        if (e.target.closest('.home-links a, .home-max')) closeMenu();
      });
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeMenu();
      });
      matchMedia('(min-width: 901px)').addEventListener?.('change', e => {
        if (e.matches) closeMenu();
      });
    }
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
    holder.appendChild(feedbackLink('nav-big nav-feedback'));
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
