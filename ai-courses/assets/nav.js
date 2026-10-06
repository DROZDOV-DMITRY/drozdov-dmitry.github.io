(() => {
  const PREVIEW_PREFIX="/ai-courses/";
  const LIVE_PREFIX="/ai-courses/";
  const inPreview=location.pathname.startsWith(PREVIEW_PREFIX);
  const ROOT=inPreview?PREVIEW_PREFIX:LIVE_PREFIX;
  const INTERNAL_PREFIX=ROOT;
  const cleanPath=location.pathname.replace(/index\.html$/,"");

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
})();