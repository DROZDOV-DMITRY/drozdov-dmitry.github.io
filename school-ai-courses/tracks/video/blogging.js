/* Блогинг B1. Все пользовательские поля остаются только в браузере; сайт не передаёт данные на сервер. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const roles = JSON.parse($('roles-data').textContent);
  let currentRole = null;
  let opener = null;
  const dialog = $('role-dialog');
  const setStatus = (button, text) => {
    const status = button.closest('.action-line')?.querySelector('.copy-message');
    if (status) status.textContent = text;
  };
  async function copy(text, button, fallbackField) {
    let ok = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        ok = true;
      }
    } catch (_) {}
    if (!ok) {
      const tmp = document.createElement('textarea');
      tmp.value = text; tmp.style.position = 'fixed'; tmp.style.opacity = '0';
      document.body.appendChild(tmp); tmp.select();
      try { ok = document.execCommand('copy'); } catch (_) {}
      tmp.remove();
    }
    if (!ok && fallbackField) { fallbackField.focus(); fallbackField.select(); }
    if (button?.id === 'role-copy') $('role-feedback').textContent = ok ? 'Роль скопирована.' : 'Выдели текст роли и нажми Ctrl+C.';
    else if (button) setStatus(button, ok ? 'Скопировано.' : 'Не удалось автоматически скопировать — выдели текст и нажми Ctrl+C.');
    return ok;
  }
  function showRole(key, prefix = '') {
    const role = roles[key]; if (!role) return;
    currentRole = key;
    opener = document.activeElement;
    $('role-title').textContent = role.title;
    $('role-description').textContent = role.description;
    $('role-output').textContent = 'Ожидаемый результат: ' + role.output + '. Если работа уже началась, приложи свой BLOG_PROJECT_BRIEF и SESSION_HANDOFF.';
    $('role-prompt').value = prefix ? prefix + '\n\n' + role.prompt : role.prompt;
    $('role-feedback').textContent = '';
    dialog.hidden = false;
    document.body.style.overflow = 'hidden';
    $('role-close').focus();
  }
  function closeRole() {
    dialog.hidden = true;
    document.body.style.overflow = '';
    opener?.focus();
  }
  document.querySelectorAll('[data-role]').forEach(button => button.addEventListener('click', () => showRole(button.dataset.role)));
  $('role-close').addEventListener('click', closeRole);
  dialog.querySelector('[data-close-role]').addEventListener('click', closeRole);
  dialog.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); closeRole(); }
    if (e.key !== 'Tab') return;
    const els = Array.from(dialog.querySelectorAll('button:not([disabled]),textarea:not([disabled])')).filter(el => el.offsetParent !== null);
    if (!els.length) return;
    const first = els[0], last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  $('role-copy').addEventListener('click', () => copy($('role-prompt').value, $('role-copy'), $('role-prompt')));
  $('role-copy-context').addEventListener('click', function () {
    const brief = $('brief').value.trim();
    const handoff = $('handoff').value.trim();
    if (!brief && !handoff) {
      $('role-feedback').textContent = 'Сначала вставь утверждённое ТЗ или состояние проекта в поля выше.';
      return;
    }
    const prompt = $('role-prompt').value + '\n\nМОЙ УТВЕРЖДЁННЫЙ КОНТЕКСТ (не меняй без моего решения):\n' +
      (brief ? '\nBLOG_PROJECT_BRIEF:\n' + brief : '') +
      (handoff ? '\nSESSION_HANDOFF:\n' + handoff : '');
    copy(prompt, this).then(ok => { $('role-feedback').textContent = ok ? 'Роль вместе с ТЗ скопирована.' : 'Не удалось скопировать; используй обычное копирование роли и отдельно ТЗ.'; });
  });
  $('role-chat').addEventListener('click', () => {
    const b = $('s14QuickChatTop') || $('s14QuickChat');
    if (b) { closeRole(); b.click(); }
    else $('role-feedback').textContent = 'Открой ссылку Duck.ai, Z.ai или Qwen в разделе выше.';
  });
  document.querySelectorAll('button[data-copy]').forEach(btn => btn.addEventListener('click', () => {
    const field = $(btn.dataset.copy);
    if (field) copy(field.value, btn, field);
  }));
  $('montage-guide').addEventListener('click', function () {
    const app = $('app-name').value;
    const device = $('app-device').value;
    const stage = $('app-step').value;
    const prefix = 'Мои условия: работаю на ' + device + ', монтаж выполняю в ' + app + '. Мой текущий этап: ' + stage + '. Не начинай сначала, если этап уже завершён. Начни с проверки актуального экрана или попроси описание.';
    showRole('montage', prefix);
  });
  document.querySelectorAll('[data-route]').forEach(btn => btn.addEventListener('click', () => {
    const phone = btn.dataset.route === 'phone';
    document.querySelectorAll('[data-route]').forEach(b => {
      const selected = b === btn;
      b.classList.toggle('is-active', selected);
      b.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });
    $('route-phone').hidden = !phone;
    $('route-pc').hidden = phone;
  }));
  const cleanCode = (text, pattern, fallback) => pattern.test(text.trim()) ? text.trim() : fallback;
  function numberOrUnavailable(id) {
    const val = $(id).value.trim();
    if (!val) return 'NOT_AVAILABLE';
    const n = Number(val);
    return Number.isSafeInteger(n) && n >= 0 ? String(n) : 'NOT_AVAILABLE';
  }
  $('snapshot').addEventListener('click', function () {
    const measured = $('a-measured').value.trim();
    if (!measured) {setStatus(this, 'Укажи реальное время замера — оно обязательно для сопоставимой статистики.');$('a-measured').focus();return;}
    const views = numberOrUnavailable('a-views');
    const likes = numberOrUnavailable('a-likes');
    const comments = numberOrUnavailable('a-comments');
    const shares = numberOrUnavailable('a-shares');
    const known = [likes,comments,shares].every(x => x !== 'NOT_AVAILABLE') && views !== 'NOT_AVAILABLE' && Number(views)>0;
    const rate = known ? (((Number(likes)+Number(comments)+Number(shares))/Number(views))*100).toFixed(2) + '% (условная доля реакций, не универсальный рейтинг)' : 'NOT_CALCULATED (нет сопоставимых исходных чисел)';
    const source = $('a-source').value.trim() || 'NOT_AVAILABLE';
    const hypothesis = $('a-hypothesis').value.trim() || 'NOT_SET';
    const doc = [
      'BLOG_ANALYTICS_SNAPSHOT v1',
      'PROJECT_ID: ' + cleanCode($('t-project').value, /^[a-zA-Z0-9_-]{1,32}$/, 'NOT_SET'),
      'EPISODE_ID: ' + cleanCode($('t-episode').value, /^[a-zA-Z0-9_-]{1,16}$/, 'EP01'),
      'EPISODE_VERSION: ' + cleanCode($('t-version').value, /^v[0-9]{1,3}$/i, 'v01'),
      'PLATFORM: ' + $('a-platform').value,
      'POSTED_AT: NOT_PROVIDED',
      'MEASURED_AT: ' + measured,
      'WINDOW_LABEL: ' + $('a-window').value,
      'DATA_SOURCE: ' + source,
      'VIEWS: ' + views, 'REACH: ' + numberOrUnavailable('a-reach'),
      'AVG_WATCH_TIME: NOT_AVAILABLE', 'RETENTION_OR_COMPLETION: NOT_AVAILABLE',
      'LIKES: ' + likes, 'COMMENTS_COUNT: ' + comments, 'SHARES: ' + shares,
      'SAVES: NOT_AVAILABLE', 'USEFUL_ACTIONS: NOT_AVAILABLE',
      'PAID_PROMOTION: UNKNOWN',
      'DATA_QUALITY: ' + $('a-quality').value,
      'INTERPRETIVE_REACTIONS_SHARE: ' + rate,
      'CONTENT_QUALITY_NOTE: NOT_RECORDED',
      'HYPOTHESIS_BEFORE_RELEASE: ' + hypothesis,
      'OBSERVATION: TO_BE_INTERPRETED',
      'UNCERTAINTY: single snapshot cannot prove causal effect',
      'CHANGE_FOR_NEXT_EPISODE: TO_BE_AGREED',
      'TEACHER_REVIEW: REQUIRED'
    ].join('\n');
    $('snapshot-text').value = doc;
    setStatus(this, 'Карточка собрана. Скопируй её и передай ИИ-аналитику.');
  });
})();
