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
    $('role-output').textContent = 'После работы с этим ИИ получится: «' + role.output + '».';
    $('role-howto').textContent = key === 'interview'
      ? 'Первый шаг: ответь на вопросы и утверди тему. ИИ составит «Паспорт проекта». Раньше искать его нигде не нужно.'
      : 'Продолжаешь проект? ИИ может опираться на твой «Паспорт проекта» и «Заметку для продолжения». Если их ещё нет, начни с интервью или расскажи о своей идее.';
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
      if(currentRole === 'interview') { copy($('role-prompt').value, this, $('role-prompt')); return; }
      $('role-feedback').textContent = 'Записей пока нет. Сначала получи «Паспорт проекта» у ИИ-интервьюера или нажми «Скопировать роль» без записей.';
      return;
    }
    const prompt = $('role-prompt').value + '\n\nМОЙ УТВЕРЖДЁННЫЙ КОНТЕКСТ (не меняй без моего решения):\n' +
      (brief ? '\nПаспорт проекта:\n' + brief : '') +
      (handoff ? '\nЗаметка для продолжения:\n' + handoff : '');
    copy(prompt, this).then(ok => { $('role-feedback').textContent = ok ? 'Роль с твоими записями скопирована.' : 'Не удалось скопировать; скопируй роль и записи отдельно.'; });
  });
  dialog.querySelectorAll('[data-role-help-link]').forEach(link=>link.addEventListener('click',e=>{
    e.preventDefault();const target=link.getAttribute('href');closeRole();
    if(target){location.hash=target;document.querySelector(target)?.scrollIntoView({block:'start'});}
  }));
  $('copy-note-request').addEventListener('click',async function(){
    const prompt='Составь для меня «Заметку для продолжения» по нашей реальной переписке. Коротко перечисли: 1) что я решил; 2) что действительно сделал; 3) чем помог ИИ; 4) что осталось проверить; 5) одно следующее действие. Не придумывай выполненных шагов. Не включай персональные данные. Я сохраню ответ для нового чата.';
    const ok=await copy(prompt,this);
    $('note-copy-status').textContent=ok?'Просьба скопирована. Вставь её в тот же ИИ-чат, затем ответ ИИ — в поле ниже.':'Выдели и скопируй текст из подсказки: «Составь заметку для продолжения: что сделал, что проверить, что дальше».';
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
  $('copy-max').addEventListener('click', function () {
    const code = cleanCode($('t-project').value, /^[a-zA-Z0-9_-]{1,32}$/, 'PROJECT_ID_НЕ_УКАЗАН');
    const ep = cleanCode($('t-episode').value, /^[a-zA-Z0-9_-]{1,16}$/, 'EP01');
    const version = cleanCode($('t-version').value, /^v[0-9]{1,3}$/i, 'v01');
    const status = $('t-status').value;
    const message = `Курс ИИ · Блогинг\nКод проекта: ${code}\nНомер выпуска: ${ep}\nВерсия: ${version}\nФайл: ${ep}_${version}.mp4\nСтатус до получения учителем: ${$('t-status').selectedOptions[0].textContent}\nПроверено мной: MP4 открывается, начало/конец и звук на месте (подтверди только после фактической проверки).\nПожалуйста, подтвердите получение, скачивание и открытие правильной версии файла.`;
    copy(message, this);
  });
  function numberOrUnavailable(id) {
    const val = $(id).value.trim();
    if (!val) return 'Нет данных';
    const n = Number(val);
    return Number.isSafeInteger(n) && n >= 0 ? String(n) : 'Нет данных';
  }
  $('snapshot').addEventListener('click', function () {
    const measured = $('a-measured').value.trim();
    if (!measured) {setStatus(this, 'Укажи реальное время замера — оно обязательно для сопоставимой статистики.');$('a-measured').focus();return;}
    const views = numberOrUnavailable('a-views');
    const likes = numberOrUnavailable('a-likes');
    const comments = numberOrUnavailable('a-comments');
    const shares = numberOrUnavailable('a-shares');
    const known = [likes,comments,shares].every(x => x !== 'Нет данных') && views !== 'Нет данных' && Number(views)>0;
    const rate = known ? (((Number(likes)+Number(comments)+Number(shares))/Number(views))*100).toFixed(2) + '% (условная доля реакций, не универсальный рейтинг)' : 'Не рассчитано (нет сопоставимых чисел)';
    const source = $('a-source').value.trim() || 'Нет данных';
    const hypothesis = $('a-hypothesis').value.trim() || 'Не указано';
    const doc = [
      'Карточка статистики',
      'Код проекта: ' + cleanCode($('t-project').value, /^[a-zA-Z0-9_-]{1,32}$/, 'Не указано'),
      'Номер выпуска: ' + cleanCode($('t-episode').value, /^[a-zA-Z0-9_-]{1,16}$/, 'EP01'),
      'Версия выпуска: ' + cleanCode($('t-version').value, /^v[0-9]{1,3}$/i, 'v01'),
      'Площадка: ' + $('a-platform').selectedOptions[0].textContent,
      'Время публикации: не указано',
      'Время замера: ' + measured,
      'Период: ' + $('a-window').selectedOptions[0].textContent,
      'Источник: ' + source,
      'Просмотры: ' + views, 'Охват: ' + numberOrUnavailable('a-reach'),
      'Среднее время просмотра: нет данных', 'Удержание: нет данных',
      'Лайки: ' + likes, 'Комментарии: ' + comments, 'Репосты: ' + shares,
      'Сохранения: нет данных', 'Полезные действия: нет данных',
      'Платное продвижение: неизвестно',
      'Качество данных: ' + $('a-quality').value,
      'Условная доля реакций: ' + rate,
      'Качество ролика: не описано',
      'Гипотеза: ' + hypothesis,
      'Наблюдение: требуется анализ',
      'Ограничение: один замер не доказывает причину изменений',
      'Изменение следующего выпуска: согласовать',
      'Проверка учителя: требуется'
    ].join('\n');
    $('snapshot-text').value = doc;
    setStatus(this, 'Карточка собрана. Скопируй её и передай ИИ-аналитику.');
  });
})();
