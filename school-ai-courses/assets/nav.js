(() => {
  const ROOT = '/school-ai-courses/';
  const FEEDBACK_URL = 'https://max.ru/u/f9LHodD0cOIPo6kMsyqken8jVFD1_YWdgh0iZZy6woohI4gWOB110cJMMVQ';
  const path = location.pathname.replace(/index\.html$/, '');
  const home = path === ROOT;

  const AI_SERVICES = [
    {
      id: 'duck',
      name: 'Duck.ai',
      note: 'быстрый AI-чат',
      url: 'https://duck.ai/'
    },
    {
      id: 'zai',
      name: 'Z.ai',
      note: 'чат · GLM',
      url: 'https://z.ai/chat'
    },
    {
      id: 'arena',
      name: 'Arena',
      note: 'сравнение моделей',
      url: 'https://arena.ai/'
    }
  ];

  function normalizeLinks(scope = document) {
    scope.querySelectorAll('a[href]').forEach(a => {
      try {
        const u = new URL(a.getAttribute('href'), location.href);
        if (u.origin === location.origin && u.pathname.startsWith(ROOT)) {
          a.removeAttribute('target');
          if (a.getAttribute('rel') === 'noopener') a.removeAttribute('rel');
        } else if (/^https?:$/.test(u.protocol)) {
          a.target = '_blank';
          a.rel = 'noopener';
        }
      } catch (_) {}
    });
  }

  function openAiService(service) {
    const name = 's14-ai-' + service.id;
    const w = window.open(service.url, name, 'popup=yes,width=560,height=780,resizable=yes,scrollbars=yes');
    if (w) {
      try { w.focus(); } catch (_) {}
    } else {
      window.open(service.url, '_blank', 'noopener');
    }
  }

  let activeMenu = null;
  let activeAnchor = null;

  function closeAiMenu() {
    if (activeMenu) activeMenu.remove();
    if (activeAnchor) activeAnchor.setAttribute('aria-expanded', 'false');
    activeMenu = null;
    activeAnchor = null;
  }

  function positionAiMenu(menu, anchor, floating) {
    const r = anchor.getBoundingClientRect();
    const gap = 9;
    const pad = 10;
    const width = Math.min(280, Math.max(230, window.innerWidth - pad * 2));
    menu.style.width = width + 'px';

    if (floating) {
      menu.classList.add('is-floating');
      menu.style.left = 'auto';
      menu.style.right = Math.max(pad, window.innerWidth - r.right) + 'px';
      menu.style.top = 'auto';
      menu.style.bottom = Math.max(pad, window.innerHeight - r.top + gap) + 'px';
    } else {
      menu.classList.remove('is-floating');
      menu.style.bottom = 'auto';
      const left = Math.min(
        Math.max(pad, r.right - width),
        Math.max(pad, window.innerWidth - width - pad)
      );
      menu.style.left = left + 'px';
      menu.style.right = 'auto';
      menu.style.top = Math.min(window.innerHeight - 220, r.bottom + gap) + 'px';
    }
  }

  function createAiMenu(anchor, floating) {
    const menu = document.createElement('div');
    menu.className = 's14-ai-menu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', 'Выбор ИИ-чата');

    const services = floating ? [...AI_SERVICES].reverse() : AI_SERVICES;
    services.forEach(service => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 's14-ai-menu-item s14-ai-' + service.id;
      item.setAttribute('role', 'menuitem');
      item.innerHTML =
        '<span class="s14-ai-service-mark" aria-hidden="true">' +
          (service.id === 'duck' ? 'D' : service.id === 'zai' ? 'Z' : 'A') +
        '</span>' +
        '<span class="s14-ai-service-copy"><strong>' + service.name + '</strong><small>' + service.note + '</small></span>' +
        '<span class="s14-ai-service-arrow" aria-hidden="true">↗</span>';
      item.addEventListener('click', () => {
        closeAiMenu();
        openAiService(service);
      });
      menu.appendChild(item);
    });

    document.body.appendChild(menu);
    positionAiMenu(menu, anchor, floating);
    return menu;
  }

  function toggleAiMenu(anchor, floating) {
    if (activeAnchor === anchor && activeMenu) {
      closeAiMenu();
      return;
    }
    closeAiMenu();
    activeAnchor = anchor;
    activeAnchor.setAttribute('aria-expanded', 'true');
    activeMenu = createAiMenu(anchor, floating);
    activeMenu.querySelector('button')?.focus({ preventScroll: true });
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
    b.type = 'button';
    b.id = id;
    b.className = floating ? 's14-chat-floating' : 's14-top-chat';
    b.innerHTML = '<img src="' + ROOT + 'assets/ui/ai-chat.svg" alt="" width="36" height="36"><span>ИИ-чат</span>';
    b.setAttribute('aria-label', 'Выбрать ИИ-чат');
    b.setAttribute('aria-haspopup', 'menu');
    b.setAttribute('aria-expanded', 'false');
    b.addEventListener('click', e => {
      e.stopPropagation();
      toggleAiMenu(b, floating);
    });
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
        if (ref.origin === location.origin && ref.pathname.startsWith(ROOT)) {
          history.back();
          return;
        }
      } catch (_) {}
      location.href = ROOT;
    });
    holder.appendChild(feedbackLink('nav-big nav-feedback'));
    holder.appendChild(chatButton('s14QuickChatTop'));
    if (header) header.appendChild(holder);
    else document.body.prepend(holder);
  }

  document.body.appendChild(chatButton('s14QuickChat', true));
  normalizeLinks();

  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (a) normalizeLinks(a.parentElement);
    if (activeMenu && !e.target.closest('.s14-ai-menu') && !e.target.closest('.s14-top-chat,.s14-chat-floating')) {
      closeAiMenu();
    }
  }, true);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (activeMenu) {
        const returnFocus = activeAnchor;
        closeAiMenu();
        returnFocus?.focus();
      } else if (home) {
        const homeNav = document.querySelector('.home-nav');
        const homeToggle = document.querySelector('.home-menu-toggle');
        homeNav?.classList.remove('menu-open');
        homeToggle?.setAttribute('aria-expanded', 'false');
        homeToggle?.setAttribute('aria-label', 'Открыть меню');
      }
    }
  });

  window.addEventListener('resize', closeAiMenu, { passive: true });
  window.addEventListener('scroll', closeAiMenu, { passive: true, capture: true });
})();