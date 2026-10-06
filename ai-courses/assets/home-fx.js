(() => {
  const g=document.getElementById("gnomeCharacter");
  const base=document.getElementById("gnomeBase");
  if(!g || !base) return;
  const gnomeSrc="/ai-courses/assets/gnome-home.webp";
  base.src=gnomeSrc;
  g.querySelectorAll(".gnome-part").forEach(x=>x.src=gnomeSrc);

  const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine=matchMedia("(pointer:fine)").matches;
  const actions=["gnome-squat","gnome-wave","gnome-wink","gnome-coat-fix","gnome-ears-both","gnome-ears-alt"];
  let hover=false,last=0,timer=0;

  function run(name){
    if(reduced) return;
    clearTimeout(timer);
    actions.forEach(x=>g.classList.remove(x));
    void g.offsetWidth;
    g.classList.add(name || actions[Math.floor(Math.random()*actions.length)]);
    timer=setTimeout(()=>actions.forEach(x=>g.classList.remove(x)),1100);
  }

  if(fine){
    g.addEventListener("pointerenter",()=>{hover=true;run()});
    g.addEventListener("pointerleave",()=>{hover=false});
    g.addEventListener("pointermove",()=>{
      const now=performance.now();
      if(now-last>900){last=now;run()}
    },{passive:true});
  }

  setInterval(()=>{ if(!hover) run(); },5000);
  setTimeout(()=>run("gnome-wink"),800);
})();