
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
  // Navigation tracks the visible step; checkboxes are self-report, not filesystem evidence.
  const steps=[...document.querySelectorAll('[data-workshop-step]')];
  const links=[...document.querySelectorAll('.gw-plan-link')];
  const marker=document.querySelector('.gw-current-location');
  function setStep(n){
    if(n<1||n>5)return;
    links.forEach((a,i)=>i===n-1?a.setAttribute('aria-current','step'):a.removeAttribute('aria-current'));
    if(marker)marker.textContent='Ты здесь: шаг '+n+' из 5 · '+['Подготовь файл','Попроси ИИ','Вставь код','Проверь игру','Улучши'][n-1];
  }
  if(steps.length===5&&links.length===5){
    links.forEach((a,i)=>a.addEventListener('click',()=>setStep(i+1)));
    const m=location.hash.match(/^#gw-step-([1-5])$/);if(m)setStep(Number(m[1]));
    let queued=false;
    addEventListener('scroll',()=>{
      if(queued)return;queued=true;
      requestAnimationFrame(()=>{
        queued=false;let n=1;
        steps.forEach((el,i)=>{if(el.getBoundingClientRect().top<210)n=i+1;});
        setStep(n);
      });
    },{passive:true});
  }
  document.querySelectorAll('[data-check-ready]').forEach(button=>{
    button.addEventListener('click',()=>{
      const box=button.closest('[data-checkpoint]');
      const missing=[...box.querySelectorAll('[data-ready-check]')].filter(c=>!c.checked).length;
      const status=box.querySelector('[role="status"]');
      if(missing){if(status)status.textContent='Проверь ещё '+missing+' пункт(а) по экрану. Если трудно, открой подсказку.';return;}
      if(status)status.textContent='Самопроверка отмечена. Сайт не проверял файлы на компьютере.';
      setStep(2);
      const next=document.getElementById('gw-step-2');
      if(next){next.scrollIntoView({behavior:'smooth',block:'start'});history.replaceState(null,'','#gw-step-2');}
    });
  });
})();
