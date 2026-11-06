/* Course AI search v1.0.0 | 2026-11-06. Local search remains the fallback. */
(()=>{'use strict';
const path=location.pathname;
const adult=/^\/school-ai-courses\/adults\/tools\/(?:index\.html)?$/.test(path);
const student=/^\/school-ai-courses\/tools\/(?:index\.html)?$/.test(path);
if(!adult&&!student)return;
const scope=adult?'adults':'school';
const input=document.getElementById(adult?'adult-tool-search':'tool-search');
const selector=adult?'.adult-tool-card':'.tool-card-v2';
const endpoint='https://lingering-violet-d3f1ai-lab-search.matamasaki.workers.dev/api/search';
const sitekey='0x4AAAAAAFy_t2KZHWghT5WD';
if(!input)return;
let button,panel,status,results,challenge,widget=null,loading=null,busy=false,run=0,query='',ctrl=null;
const say=t=>{if(status)status.textContent=t};
const setBusy=x=>{busy=x;if(button)button.disabled=x};
const cancel=()=>{run++;query='';if(ctrl){ctrl.abort();ctrl=null}setBusy(false);if(panel)panel.hidden=true};
const fail=t=>{say(t+' Обычный поиск и фильтры ниже продолжают работать.');results?.replaceChildren();setBusy(false)};
function turnstileScript(){
 if(window.turnstile)return Promise.resolve(window.turnstile);
 if(loading)return loading;
 loading=new Promise((ok,bad)=>{const s=document.createElement('script');s.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';s.async=true;s.onload=()=>window.turnstile?ok(window.turnstile):bad(Error('turnstile'));s.onerror=()=>bad(Error('turnstile'));document.head.appendChild(s)}).catch(e=>{loading=null;throw e});return loading;
}
function visit(id){const card=document.getElementById(id);if(!card)return;
 input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));
 if(student)document.querySelector('[data-tool-filter="all"]')?.click();
 card.hidden=false;card.classList.add('course-ai-target');card.scrollIntoView({behavior:'smooth',block:'center'});
 window.setTimeout(()=>card.classList.remove('course-ai-target'),3000);
}
async function search(token,current){
 if(!token||current!==run||query!==input.value.trim().slice(0,180))return;
 const abort=new AbortController();ctrl=abort;const timer=window.setTimeout(()=>abort.abort(),23000);
 say('Подбираем инструменты из каталога…');
 try{
 const response=await fetch(endpoint,{method:'POST',mode:'cors',headers:{'Content-Type':'application/json'},body:JSON.stringify({scope,query,turnstile_token:token}),signal:abort.signal});
 if(!response.ok)throw Error('unavailable');
 const data=await response.json();if(!Array.isArray(data.products))throw Error('invalid');
 if(current!==run||query!==input.value.trim().slice(0,180))return;
 say(String(data.answer||'Рекомендации ИИ').slice(0,450));results.replaceChildren();
 const cards=new Map([...document.querySelectorAll(selector)].map(e=>[e.dataset.aiId,e]));
 const seen=new Set();
 for(const item of data.products.slice(0,5)){
  if(!item||typeof item.id!=='string'||seen.has(item.id))continue;
  const card=cards.get(item.id);
  if(!card||(student&&card.dataset.aiAdultOnly==='true'))continue;
  seen.add(item.id);
  const a=document.createElement('a');a.className='course-ai-result';a.href='#'+item.id;
  const title=document.createElement('strong');title.textContent=card.querySelector('h3')?.textContent?.trim()||'Инструмент';
  const reason=document.createElement('span');reason.textContent=String(item.reason||card.querySelector('p')?.textContent||'').slice(0,180);
  a.append(title,reason);a.addEventListener('click',e=>{e.preventDefault();visit(item.id)});results.appendChild(a);
 }
 if(!results.children.length){const p=document.createElement('p');p.textContent='Подходящих инструментов нет. Уточните задачу или воспользуйтесь фильтрами.';results.appendChild(p)}
 }catch{if(current===run)fail('ИИ-подбор временно недоступен.')}
 finally{window.clearTimeout(timer);if(ctrl===abort)ctrl=null;if(current===run)setBusy(false);try{if(current===run&&widget!==null&&window.turnstile)window.turnstile.reset(widget)}catch{}}
}
async function invoke(){
 const q=input.value.trim().slice(0,180);
 if(q.length<3){panel.hidden=false;say('Опишите задачу хотя бы тремя символами.');return}
 if(busy)return;
 const current=++run;query=q;panel.hidden=false;results.replaceChildren();setBusy(true);say('Проверяем запрос Cloudflare…');
 try{
 const ts=await turnstileScript();if(current!==run)return;
 if(widget===null){widget=ts.render(challenge,{sitekey,theme:'light',appearance:'interaction-only',execution:'execute',callback:token=>{void search(token,run)},'error-callback':()=>{if(!panel.hidden)fail('Не удалось пройти проверку Cloudflare.')},'expired-callback':()=>{if(!panel.hidden)fail('Проверка истекла. Повторите запрос.')},'unsupported-callback':()=>{if(!panel.hidden)fail('Проверка не поддерживается этим браузером.')}});if(widget==null)throw Error('render')}
 else ts.reset(widget);
 ts.execute(widget);
 }catch{if(current===run)fail('Cloudflare Turnstile сейчас недоступен.')}
}
function mount(){
 const controls=document.createElement('div');controls.className='course-ai-controls';
 button=document.createElement('button');button.type='button';button.className='course-ai-button';button.textContent='Подобрать с ИИ';
 button.setAttribute('aria-controls','course-ai-panel');
 const hint=document.createElement('span');hint.className='course-ai-hint';hint.textContent='Запрос отправится в Groq только после нажатия. Не вводите личные данные.';
 controls.append(button,hint);
 panel=document.createElement('section');panel.id='course-ai-panel';panel.className='course-ai-panel';panel.hidden=true;
 panel.setAttribute('aria-label','ИИ-подбор инструментов');
 const h=document.createElement('h3');h.textContent='Инструменты для вашей задачи';
 const v=document.createElement('small');v.className='course-ai-version';v.textContent='ИИ-поиск V1.0 · 06.11.2026';
 status=document.createElement('p');status.className='course-ai-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 challenge=document.createElement('div');challenge.className='course-ai-challenge';
 results=document.createElement('div');results.className='course-ai-results';
 panel.append(h,v,status,challenge,results);
 input.insertAdjacentElement('afterend',controls);controls.insertAdjacentElement('afterend',panel);
 button.addEventListener('click',()=>void invoke());
 input.addEventListener('input',cancel);
 input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();void invoke()}});
 document.querySelectorAll(adult?'.adult-tool-filter':'[data-tool-filter]').forEach(el=>el.addEventListener('click',cancel));
}
// Enable UI only once the deployed Worker advertises this exact catalog.
// Until then, do not interfere with the existing local search.
const guard=new AbortController();const timeout=window.setTimeout(()=>guard.abort(),6000);
fetch(endpoint.replace('/api/search','/health'),{cache:'no-store',signal:guard.signal})
.then(r=>r.ok?r.json():null).then(data=>{if(data?.configured===true&&Array.isArray(data.catalogs)&&data.catalogs.includes(scope))mount()})
.catch(()=>{}).finally(()=>window.clearTimeout(timeout));
})();