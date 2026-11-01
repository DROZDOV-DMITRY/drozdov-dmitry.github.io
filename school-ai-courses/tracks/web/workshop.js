(()=>{'use strict';
function feedback(btn,ok){
 const s=btn.parentElement?.querySelector('.sw-status');
 if(s)s.textContent=ok?'Скопировано.':'Выдели текст запроса и нажми Ctrl+C.';
}
async function copy(text,btn,id){
 let ok=false;
 try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);ok=true;}}catch(e){}
 if(!ok){
  const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();
  try{ok=document.execCommand('copy');}catch(e){}
  ta.remove();
 }
 if(!ok&&id){let x=document.getElementById(id);if(x){x.focus();x.select();}}
 feedback(btn,ok);
}
document.querySelectorAll('[data-copy]').forEach(btn=>btn.addEventListener('click',()=>{
 const id=btn.dataset.copy;const ta=document.getElementById(id);if(ta)copy(ta.value,btn,id);
}));
document.querySelectorAll('[data-style]').forEach(btn=>btn.addEventListener('click',()=>{
 const style=btn.dataset.style;
 document.querySelectorAll('[data-style]').forEach(b=>{let selected=b===btn;b.classList.toggle('is-selected',selected);b.setAttribute('aria-pressed',selected?'true':'false');});
 document.getElementById('sw-fast-panel').hidden=style!=='fast';
 document.getElementById('sw-deep-panel').hidden=style!=='deep';
}));
document.getElementById('sw-copy-fix')?.addEventListener('click',function(){
 const issue=document.getElementById('sw-issue').value.trim();
 const n=Math.max(2,Math.min(99,Number(document.getElementById('sw-version')?.value||2)));const file='index_v'+String(n).padStart(2,'0')+'.html';
 const prompt="Мы продолжаем работу над моим одностраничным сайтом. Сохрани утверждённые в этом диалоге тему, структуру, стиль и работающие части. Найди причину проблемы и внеси точечное исправление. Дай ПОЛНЫЙ новый код файла "+file+" от <!doctype html> до </html>, без пропусков и внешних зависимостей. Не предлагай перезаписывать предыдущий файл: я сохраню результат отдельно как "+file+" и проверю его в Microsoft Edge. Сохрани всё, что уже работало."+'\n\n'+(issue?'Вот моя задача:\n'+issue:'Предложи одно небольшое улучшение, которое сделает сайт удобнее.');
 copy(prompt,this,'sw-issue');
});
})();
