import {productHref} from "./catalog-core.mjs";

// AI LAB — protected Groq recommendations. The existing local catalog search is the fallback.
const byId=id=>document.getElementById(id);
const form=byId("hero-search-form");
const search=byId("search");
const panel=byId("ai-search-panel");
const result=byId("ai-result");
const challenge=byId("ai-challenge");
const retry=byId("ai-invoke");
const endpoint=String(window.AI_SEARCH_ENDPOINT||"");
const sitekey=String(window.AI_TURNSTILE_SITE_KEY||"");

if(form&&search&&panel&&result&&challenge&&endpoint.startsWith("https://")&&sitekey){
  let widgetId=null;
  let scriptPromise=null;
  let sequence=0;
  let activeQuery="";
  let controller=null;
  let working=false;

  const status=message=>{result.textContent=message;};
  const setWorking=value=>{working=value;if(retry)retry.disabled=value;};
  const fallback=message=>{
    status(message+" Обычный поиск по каталогу остаётся доступен ниже.");
    setWorking(false);
  };

  function loadTurnstile(){
    if(window.turnstile)return Promise.resolve(window.turnstile);
    if(scriptPromise)return scriptPromise;
    scriptPromise=new Promise((resolve,reject)=>{
      const script=document.createElement("script");
      script.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async=true;
      script.onload=()=>window.turnstile?resolve(window.turnstile):reject(new Error("turnstile_missing"));
      script.onerror=()=>reject(new Error("turnstile_load"));
      document.head.appendChild(script);
    }).catch(error=>{scriptPromise=null;throw error;});
    return scriptPromise;
  }

  function cancelStale(){
    sequence++;
    activeQuery="";
    if(controller){controller.abort();controller=null;}
    setWorking(false);
    panel.hidden=true;
  }

  async function requestRecommendations(){
    const query=search.value.trim().slice(0,180);
    if(query.length<3){
      cancelStale();
      return;
    }
    const run=++sequence;
    activeQuery=query;
    if(controller){controller.abort();controller=null;}
    panel.hidden=false;
    setWorking(true);
    status("Проверяем запрос и подбираем подходящие ИИ-продукты…");
    try{
      const turnstile=await loadTurnstile();
      if(run!==sequence)return;
      if(widgetId===null){
        widgetId=turnstile.render(challenge,{
          sitekey,
          theme:"dark",
          appearance:"interaction-only",
          execution:"execute",
          callback:token=>{void performSearch(token,run);},
          "error-callback":()=>{if(run===sequence)fallback("Не удалось пройти проверку Cloudflare.");},
          "expired-callback":()=>{if(run===sequence)fallback("Срок проверки истёк. Повторите запрос.");},
          "unsupported-callback":()=>{if(run===sequence)fallback("Этот браузер не поддерживает проверку Cloudflare.")}
        });
        if(widgetId===undefined||widgetId===null)throw new Error("turnstile_render");
      }else{
        turnstile.reset(widgetId);
      }
      turnstile.execute(widgetId);
    }catch{
      if(run===sequence)fallback("Сервис проверки посетителя временно недоступен.");
    }
  }

  async function performSearch(token,run){
    if(run!==sequence||!token)return;
    const query=activeQuery;
    if(!query||query!==search.value.trim().slice(0,180))return;
    status("Groq подбирает решения из каталога AI LAB…");
    const abort=new AbortController();
    controller=abort;
    const timeout=setTimeout(()=>abort.abort(),23000);
    try{
      // Do not restrict the model to local lexical matches: it must see the full catalog.
      const response=await fetch(endpoint,{
        method:"POST",
        mode:"cors",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({query,turnstile_token:token}),
        signal:abort.signal
      });
      if(!response.ok)throw new Error("provider_unavailable");
      const data=await response.json();
      if(!Array.isArray(data.products))throw new Error("bad_response");
      if(run!==sequence)return;
      result.replaceChildren();
      const answer=document.createElement("p");
      answer.className="giga-search-answer";
      answer.textContent=String(data.answer||"").trim().slice(0,450)||"Подходящие решения из каталога AI LAB:";
      result.appendChild(answer);
      const records=Array.isArray(window.PORTFOLIO_RECORDS)?window.PORTFOLIO_RECORDS:[];
      const allowed=new Map(records.map(product=>[product.id,product]));
      let shown=0;
      const used=new Set();
      for(const item of data.products.slice(0,5)){
        if(!item||typeof item.id!=="string"||used.has(item.id))continue;
        const product=allowed.get(item.id);
        if(!product)continue;
        used.add(item.id);
        const link=document.createElement("a");
        link.className="giga-search-choice";
        link.href=productHref(product,window.location.pathname+window.location.search);
        const title=document.createElement("strong");
        title.textContent=product.title;
        const reason=document.createElement("span");
        reason.textContent=String(item.reason||product.public_pitch||product.subtitle||"").slice(0,180);
        link.append(title,reason);
        result.appendChild(link);
        shown++;
      }
      if(!shown){
        const note=document.createElement("p");
        note.className="giga-search-hint";
        note.textContent="Точных рекомендаций от ИИ нет. Проверьте результаты обычного поиска ниже.";
        result.appendChild(note);
      }
    }catch{
      if(run===sequence)fallback("Сейчас ИИ-подбор недоступен.");
    }finally{
      clearTimeout(timeout);
      if(controller===abort)controller=null;
      if(run===sequence)setWorking(false);
      try{if(window.turnstile&&widgetId!==null)window.turnstile.reset(widgetId);}catch{}
    }
  }

  form.addEventListener("submit",event=>{
    event.preventDefault();
    void requestRecommendations();
  });
  document.querySelectorAll("[data-search-example]").forEach(button=>{
    button.addEventListener("click",()=>{void requestRecommendations();});
  });
  retry?.addEventListener("click",()=>{if(!working)void requestRecommendations();});
  search.addEventListener("input",cancelStale);
  window.addEventListener("popstate",cancelStale);
}
