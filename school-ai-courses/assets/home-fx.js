(() => {
  const g=document.getElementById("gnomeCharacter");
  if(!g) return;

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
    timer=setTimeout(()=>actions.forEach(x=>g.classList.remove(x)),1050);
  }

  function chooseByPointer(e){
    const r=g.getBoundingClientRect();
    const x=(e.clientX-r.left)/r.width;
    const y=(e.clientY-r.top)/r.height;
    if(y<.24) return x<.5?"gnome-ears-alt":"gnome-ears-both";
    if(y<.42) return "gnome-wink";
    if(y>.62) return "gnome-squat";
    return x>.54?"gnome-wave":"gnome-coat-fix";
  }

  if(fine){
    g.addEventListener("pointerenter",e=>{hover=true;run(chooseByPointer(e))});
    g.addEventListener("pointerleave",()=>{hover=false});
    g.addEventListener("pointermove",e=>{
      const now=performance.now();
      if(now-last>900){last=now;run(chooseByPointer(e))}
    },{passive:true});
  }

  setInterval(()=>{if(!hover)run()},5000);
  setTimeout(()=>run("gnome-wink"),700);
})();