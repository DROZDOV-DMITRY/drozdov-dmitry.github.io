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
    $('role-howto-text').textContent = key === 'interview'
      ? 'Сначала скопируй инструкцию роли, открой ИИ-чат и вставь её. После ответов и выбора темы ИИ выдаст «Паспорт проекта». Заранее искать его не нужно.'
      : 'Скопируй роль (или роль с записями), открой ИИ-чат и вставь текст. Нет записей? Начни с интервьюера или коротко объясни свою идею.';
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
  // Мини-мастерская истории: авторская попытка сохраняется только в текущем браузере.
  const storyFields = () => ({
    hook: $('story-hook').value.trim(),
    body: $('story-body').value.trim(),
    ending: $('story-ending').value.trim()
  });
  const buildStory = () => {
    const s = storyFields();
    const result = [
      'МОЙ ЧЕРНОВИК ВИДЕО',
      'HOOK / крючок: ' + (s.hook || 'Пока не придумал'),
      'BODY / основная часть: ' + (s.body || 'Пока не придумал'),
      'ENDING / концовка: ' + (s.ending || 'Пока не придумал'),
      'Что снять: вместе с ИИ запланировать 5–8 реальных кадров и проверить свет, звук и безопасность.',
      'Съёмка и монтаж позднее — на моём смартфоне.'
    ].join('\n');
    $('story-output').value = result;
    return s;
  };
  $('story-build').addEventListener('click', function () {
    const s = buildStory();
    setStatus(this, s.hook && s.body && s.ending
      ? 'План собран. Скопируй его и сохрани там, где откроешь со смартфона.'
      : 'Черновик собран с пропусками. Можешь дописать свои идеи или обсудить их с ИИ.');
  });
  $('story-ai').addEventListener('click', () => {
    const s = buildStory();
    showRole('script',
      'Мой собственный сценарный черновик (пустые поля означают, что я ещё не решил):\n' +
      'HOOK: ' + (s.hook || 'пока нет') + '\n' +
      'BODY: ' + (s.body || 'пока нет') + '\n' +
      'ENDING: ' + (s.ending || 'пока нет') +
      '\nПомоги улучшить три части, не подменяя мою идею. Спроси один вопрос, затем дождись ответа.');
  });

  // Платформенные подсказки: видны только материалы для выбранной площадки.
  const analyticsGuide = () => {
    const selected = $('analysis-platform').value;
    document.querySelectorAll('[data-analysis-guide]').forEach(node => {
      node.hidden = node.getAttribute('data-analysis-guide') !== selected;
    });
  };
  $('analysis-platform').addEventListener('change', analyticsGuide);
  analyticsGuide();
  $('analysis-ai').addEventListener('click', () => {
    const platform = $('analysis-platform').selectedOptions[0]?.textContent || 'Не указано';
    const observation = $('analysis-observation').value.trim();
    const hypothesis = $('analysis-hypothesis').value.trim();
    showRole('analytics',
      'Площадка: ' + platform + '\n' +
      'Что я действительно видел: ' + (observation || 'данных пока нет') + '\n' +
      'Моя предварительная гипотеза: ' + (hypothesis || 'ещё не сформулирована') + '\n' +
      'Помоги найти реальные данные в моём приложении, не придумывай их. Потом обсуди со мной одно улучшение следующего ролика. Если не опубликовано — оцени качество HOOK–BODY–ENDING по моему описанию.');
  });
})();
