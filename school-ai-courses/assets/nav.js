(() => {
  const ROOT="/school-ai-courses/";
  const INTERNAL_PREFIX=ROOT;
  const cleanPath=location.pathname.replace(/index\\.html$/,"");

  document.querySelectorAll('a[href]').forEach(a=>{
    try{
      const u=new URL(a.getAttribute('href'), location.href);
      const internal=u.origin===location.origin && u.pathname.startsWith(INTERNAL_PREFIX);
      if(internal){
        a.removeAttribute("target");
        if(a.getAttribute("rel")==="noopener") a.removeAttribute("rel");
      }else if(/^https?:$/.test(u.protocol)){
        a.target="_blank";
        a.rel="noopener";
      }
    }catch(_){}
  });

  function openQuickChat(){
    const url="https://duck.ai/";
    const features="popup=yes,width=520,height=760,resizable=yes,scrollbars=yes";
    const w=window.open(url,"s14-ai-chat",features);
    if(w){
      try{w.focus()}catch(_){}
    }else{
      window.open(url,"_blank","noopener");
    }
  }

  function ensureQuickChatStyle(){
    if(document.getElementById("s14QuickChatStyle")) return;
    const style=document.createElement("style");
    style.id="s14QuickChatStyle";
    style.textContent=
      "#s14QuickChat{position:fixed;right:18px;bottom:18px;z-index:9999;border:0;border-radius:999px;padding:13px 17px;background:#111827;color:#fff;font:800 15px/1.1 Segoe UI,Arial,sans-serif;box-shadow:0 10px 32px rgba(0,0,0,.28);cursor:pointer}" +
      "#s14QuickChat:hover{transform:translateY(-1px)}" +
      "#s14QuickChat:focus-visible{outline:3px solid #7dd3fc;outline-offset:3px}" +
      ".s14-top-chat{border:0;background:#17254a;color:#fff!important;cursor:pointer;text-decoration:none;padding:9px 12px;border-radius:999px;font:800 .88rem/1.2 Segoe UI,Arial,sans-serif}" +
      ".s14-top-chat:hover,.s14-top-chat:focus-visible{background:#0f6b58!important;color:#fff!important;outline:none}" +
      "@media(max-width:640px){#s14QuickChat{right:12px;bottom:12px;padding:12px 15px;font-size:14px}}";
    document.head.appendChild(style);
  }

  function addFloatingChat(){
    if(document.getElementById("s14QuickChat")) return;
    const btn=document.createElement("button");
    btn.id="s14QuickChat";
    btn.type="button";
    btn.textContent="💬 ИИ-чат";
    btn.title="Открыть быстрый ИИ-чат";
    btn.setAttribute("aria-label","Открыть быстрый ИИ-чат");
    btn.addEventListener("click",openQuickChat);
    document.body.appendChild(btn);
  }

  function addTopChat(container){
    if(!container || document.getElementById("s14QuickChatTop")) return;
    const top=document.createElement("button");
    top.id="s14QuickChatTop";
    top.type="button";
    top.className="s14-top-chat";
    top.textContent="💬 ИИ-чат";
    top.title="Открыть быстрый ИИ-чат";
    top.addEventListener("click",openQuickChat);
    container.appendChild(top);
  }

  ensureQuickChatStyle();
  addFloatingChat();

  const homeTop=document.querySelector(".topnav");
  if(homeTop) addTopChat(homeTop);

  if(cleanPath===ROOT) return;

  document.body.classList.add("with-global-nav");
  const holder=document.createElement("div");
  holder.className="student-global-nav";
  holder.innerHTML='<button type="button" class="nav-big nav-back">← Назад</button><a class="nav-big nav-home" href="'+ROOT+'">⌂ Главная</a>';
  const top=document.querySelector(".topbar .inner");
  if(top) top.appendChild(holder); else document.body.prepend(holder);
  holder.querySelector(".nav-back").addEventListener("click",()=>{
    const ref=document.referrer||"";
    if(ref.includes(INTERNAL_PREFIX)) history.back();
    else location.href=ROOT;
  });
  addTopChat(holder);
})();