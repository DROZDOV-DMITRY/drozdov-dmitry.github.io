/* Локальные наблюдения: не сохраняем данные учеников и не выдаём самоотчёт за освоение. */
(()=>{'use strict';const $=id=>document.getElementById(id);const b=$('copyReport');if(!b)return;
b.addEventListener('click',async()=>{
 const n=document.body.getAttribute('data-lesson')||'?';
 const clean=id=>($(id)?.value||'').trim().slice(0,1500)||'Не указано';
 const note=['Урок L'+n+' · мои наблюдения','Первая попытка: '+clean('initial'),'Проверенный результат: '+clean('result'),'Ошибка/ограничение: '+clean('issue'),'Перенос навыка: '+clean('transfer'),'Это самоотчёт, не оценка освоения.'].join('\n');
 const s=$('reportStatus'),button=b;try{if(!navigator.clipboard)throw new Error('clipboard');await navigator.clipboard.writeText(note);button.textContent='Скопировано ✓';s.textContent='Скопировано. Вставь в свои заметки.';}catch(_){s.textContent='Автокопирование недоступно. Выдели текст своих полей и скопируй вручную.';}
});
})();