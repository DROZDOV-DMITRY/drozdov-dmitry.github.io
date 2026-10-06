(function(){
  function sameSiteNewPageLinks(){
    document.querySelectorAll('a[href]').forEach(function(a){
      const raw=a.getAttribute('href');
      if(!raw || raw.charAt(0)==='#' || raw.startsWith('javascript:') || raw.startsWith('mailto:') || raw.startsWith('tel:')) return;
      try{
        const u=new URL(a.href,location.href);
        const current=new URL(location.href);
        if(u.origin===current.origin && u.pathname!==current.pathname){
          a.target='_blank';
          const rel=new Set((a.getAttribute('rel')||'').split(/\s+/).filter(Boolean));
          rel.add('noopener');
          a.setAttribute('rel',[...rel].join(' '));
        }
      }catch(e){}
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',sameSiteNewPageLinks);
  else sameSiteNewPageLinks();
})();