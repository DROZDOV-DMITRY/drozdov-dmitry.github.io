/* Локальная мастерская: данные остаются в текущей вкладке, пока ученик сам не скопирует их. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const get = id => $(id).value.trim();
  const selectedFormat = () => document.querySelector('input[name="format"]:checked')?.value || 'Текст';
  async function copy(text, button, status) {
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = 'Скопировано. Вставь текст только в выбранный тобой ИИ-чат.';
      return true;
    } catch (_) {
      if (button?.id === 'copy-ai') { $('ai-prompt').focus(); $('ai-prompt').select(); }
      else { const range = document.createRange(); range.selectNodeContents($('summary')); const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range); }
      status.textContent = 'Текст выделен. Скопируй его вручную.';
      return false;
    }
  }
  $('prepare-ai').addEventListener('click', () => {
    const draft = get('draft');
    if (!draft) {
      $('ai-status').textContent = 'Сначала напиши свой черновик — ИИ должен помогать твоей работе.';
      $('draft').focus();
      return;
    }
    const prompt = [
      'Ты — бережный редактор школьной публикации. Ученик 11–15 лет написал свой черновик. Не переписывай его и не добавляй факты.',
      'Сначала задай один конкретный вопрос о самом непонятном месте и дождись ответа. Затем предложи не более двух вариантов улучшения и объясни, что изменится. Решение принимает автор.',
      'Не проси личные данные. Если в тексте есть фамилии, контакты, школа/адрес или другие сведения, укажи удалить их до обсуждения.',
      'Аудитория: ' + (get('reader') || 'не указана'),
      'Цель: ' + (get('purpose') || 'не указана'),
      'Формат: ' + selectedFormat(),
      'Черновик автора:\n' + draft
    ].join('\n\n');
    $('ai-prompt').value = prompt;
    $('ai-prompt').hidden = false;
    $('copy-ai').hidden = false;
    $('ai-status').textContent = 'Проверь запрос: он содержит черновик. Удали личные сведения. Ничего не отправится без твоего копирования и вставки.';
    $('ai-prompt').focus();
  });
  $('copy-ai').addEventListener('click', function () { copy($('ai-prompt').value, this, $('ai-status')); });
  $('make-summary').addEventListener('click', () => {
    const draft = get('draft'), revision = get('revision');
    if (!draft || !revision) {
      $('summary-status').textContent = 'Добавь свой первый черновик и улучшенную версию, чтобы сравнить их.';
      (!draft ? $('draft') : $('revision')).focus();
      return;
    }
    if (!$('reviewed').checked) {
      $('summary-status').textContent = 'Сначала отметь, что проверил работу и сам выбрал изменения.';
      $('reviewed').focus();
      return;
    }
    const summary = [
      'МОЯ ШКОЛЬНАЯ ПУБЛИКАЦИЯ',
      'Кому: ' + (get('reader') || 'не указано'),
      'Зачем: ' + (get('purpose') || 'не указано'),
      'Формат: ' + selectedFormat(),
      '', 'МОЙ ПЕРВЫЙ ЧЕРНОВИК', draft,
      '', 'МОЯ ИТОГОВАЯ ВЕРСИЯ', revision,
      '', 'Источник фактов: ' + (get('source') || 'не указан'),
      'Чем помог ИИ: ' + (get('ai-note') || 'не использовал / не указано'),
      'Решение об аудитории: оставить себе, показать классу по договорённости или отдельно обсудить публикацию с учителем и родителем.'
    ].join('\n');
    $('summary').textContent = summary;
    $('summary').hidden = false;
    $('copy-summary').hidden = false;
    $('summary-status').textContent = 'Карточка готова в этой вкладке. Скопируй её, если хочешь сохранить.';
  });
  $('copy-summary').addEventListener('click', function () { copy($('summary').textContent, this, $('summary-status')); });
})();
