(function(){
  const id=Number(window.S14_METRIKA_COUNTER_ID);
  if(!Number.isInteger(id)||id<=0) return;
  window.ym=window.ym||function(){(window.ym.a=window.ym.a||[]).push(arguments)};
  window.ym.l=1*new Date();
  const s=document.createElement('script');
  s.async=true;
  s.src='https://mc.yandex.ru/metrika/tag.js';
  document.head.appendChild(s);
  window.ym(id,'init',{
    clickmap:true,
    trackLinks:true,
    accurateTrackBounce:true,
    webvisor:false
  });
})();