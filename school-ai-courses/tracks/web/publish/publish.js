(()=>{'use strict';
function status(b,s){const x=b.parentElement?.querySelector('.gp-feedback');if(x)x.textContent=s;}
async function copy(t,b,id){
 let ok=false;try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(t);ok=true;}}catch(e){}
 if(!ok){const a=document.createElement('textarea');a.value=t;a.style.position='fixed';a.style.opacity='0';document.body.appendChild(a);a.select();try{ok=document.execCommand('copy')}catch(e){}a.remove();}
 if(!ok&&id){const a=document.getElementById(id);if(a){a.focus();a.select();}}
 status(b,ok?'Скопировано.':'Не удалось скопировать автоматически. Выдели текст и нажми Ctrl+C.');
}
document.querySelectorAll('[data-copy]').forEach(b=>b.addEventListener('click',()=>{let id=b.getAttribute('data-copy'),el=document.getElementById(id);if(el)copy(el.value,b,id)}));
document.getElementById('gp-copy-help')?.addEventListener('click',function(){
 const issue=document.getElementById('gp-issue').value.trim();
 const intro='Продолжаем нашу публикацию на GitHub Pages, НЕ начинай заново. Сохрани уже подтверждённые этапы. Перед инструкцией проверь актуальные сведения по GitHub для браузера Windows (если веб недоступен, признай это и попроси скриншот). Я сейчас опишу проблему. Определи текущий экран и подскажи ОДНО конкретное действие с точным английским названием видимой кнопки. Не предлагай создавать новый репозиторий без диагностики.';
 copy(intro+'\n\n'+(issue?'Проблема: '+issue:'Я застрял. Спроси, что вижу на экране.'),this,'gp-issue');
});
document.getElementById('gp-open-ai')?.addEventListener('click',function(){
 let el=document.getElementById('s14QuickChatTop')||document.getElementById('s14QuickChat');if(el){el.click();}else{status(this,'Открой кнопку «ИИ-чат» вверху страницы.');}
});
})();