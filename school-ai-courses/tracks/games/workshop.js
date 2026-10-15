
(function(){
  async function copyValue(text, button, status){
    let ok=false;
    try{if(navigator.clipboard && window.isSecureContext){await navigator.clipboard.writeText(text);ok=true;}}catch(e){}
    if(!ok){
      const temp=document.createElement('textarea');temp.value=text;temp.style.position='fixed';temp.style.opacity='0';
      document.body.appendChild(temp);temp.select();
      try{ok=document.execCommand('copy');}catch(e){}
      temp.remove();
    }
    if(status){status.textContent=ok?'Скопировано.':'Не удалось скопировать: выдели текст и нажми Ctrl+C.';}
    if(!ok){const target=button.closest('.gw-step')?.querySelector('textarea');if(target){target.focus();target.select();}}
  }
  document.querySelectorAll('[data-copy-editor]').forEach(function(button){
    button.addEventListener('click',function(){
      const id=button.getAttribute('data-copy-editor');
      const input=document.getElementById(id);
      const status=button.parentElement.querySelector('.gw-copy-status');
      if(input)copyValue(input.value,button,status);
    });
  });
  const fix=document.querySelector('[data-fix-prompt]');
  if(fix){
    fix.addEventListener('click',function(){
      const issue=document.getElementById('gw-issue');
      const file=fix.getAttribute('data-file');
      const detail=(issue?.value||'').trim();
      const msg='Продолжаем в ЭТОМ ЖЕ диалоге разработку моей HTML-игры. '
       +(detail?'Вот что я обнаружил или хочу улучшить:\n'+detail+'\n\n':'Помоги мне улучшить игру и предложи одно небольшое полезное изменение.\n\n')
       +'Сохрани все уже работающие функции. Пришли ПОЛНЫЙ обновлённый код HTML, CSS и JavaScript одним блоком, без сокращений, без внешних библиотек и без файлов кроме '+file+'. Я целиком заменю содержимое файла '+file+' и заново проверю игру в Microsoft Edge.';
      copyValue(msg,fix,fix.parentElement.querySelector('.gw-copy-status'));
    });
  }
})();
