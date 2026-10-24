/* Separate presentation layer: scene and animated 2D drawing. No ES modules / no server required. */
(()=>{'use strict';
window.CRYSTAL_ART=Object.freeze({create(d){
 const {c,b,bg,W,H,S,OX,OY,COLS,ROWS,TRACK,routePts,stars,plants,sprites,TYPES,ENEMIES,
        roundRect,glowCircle,polygon,mid,clamp,canvas,reduce}=d;
 let runtime={};
function scene(){
 const sky=b.createLinearGradient(0,0,W,H);sky.addColorStop(0,'#0a234a');sky.addColorStop(.52,'#202851');sky.addColorStop(1,'#071c32');b.fillStyle=sky;b.fillRect(0,0,W,H);
 const aurora=b.createRadialGradient(780,70,0,780,70,540);aurora.addColorStop(0,'#4db5a04f');aurora.addColorStop(.65,'#3a5ed511');aurora.addColorStop(1,'#0000');b.fillStyle=aurora;b.fillRect(0,0,W,H);
 b.save();b.globalAlpha=.8;for(const p of stars){b.fillStyle=p.r>1.5?'#e4f8fc':'#80b4cf';b.beginPath();b.arc(p.x,p.y,p.r,0,7);b.fill()}b.restore();
 // Island edge: floating hexagonal land plate.
 b.save();b.shadowBlur=33;b.shadowColor='#2b9fac88';roundRect(b,OX-17,OY-7,COLS*S+34,ROWS*S+24,35);b.fillStyle='#0c2848';b.fill();b.restore();
 for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
   const xx=OX+x*S,yy=OY+y*S;const road=TRACK.has(x+','+y);
   const g=b.createLinearGradient(xx,yy,xx+S,yy+S);
   if(road){g.addColorStop(0,'#42547d');g.addColorStop(1,'#283b64')}
   else{g.addColorStop(0,(x+y)%2?'#1c5060':'#1c495a');g.addColorStop(1,'#19374f')}
   roundRect(b,xx+2,yy+2,S-4,S-4,9);b.fillStyle=g;b.fill();
   b.strokeStyle=road?'#9cbaf133':'#69d6c21b';b.lineWidth=1.4;b.stroke();
   if(!road){b.fillStyle='#acf4d30a';roundRect(b,xx+5,yy+5,S-10,9,3);b.fill()}
 }
 // Curving luminous road ribbon, with dashed motifs.
 b.save();b.lineCap='round';b.lineJoin='round';
 const line=()=>{b.beginPath();routePts.forEach((p,i)=>i?b.lineTo(p.x,p.y):b.moveTo(p.x,p.y))};
 line();b.lineWidth=64;b.strokeStyle='#879bc433';b.stroke();
 line();b.lineWidth=51;b.strokeStyle='#5a709c';b.stroke();
 line();b.lineWidth=44;b.strokeStyle='#263455';b.stroke();
 line();b.lineWidth=2;b.strokeStyle='#97d3f07f';b.setLineDash([8,19]);b.stroke();b.setLineDash([]);
 b.restore();
 // Crystal flowers, sparingly placed away from the road.
 plants.forEach((p,i)=>{
   const x=Math.floor((p.x-OX)/S),y=Math.floor((p.y-OY)/S);
   if(x<0||x>=COLS||y<0||y>=ROWS||TRACK.has(x+','+y))return;
   b.save();b.translate(p.x,p.y);b.rotate(p.rotate);
   polygon(b,0,4,p.size,4,Math.PI/4,i%3?'#4ea5a34c':'#9d8ee14a',null);
   polygon(b,0,-3,p.size*.72,4,Math.PI/4,i%3?'#72d8cf99':'#9db6e899','#d7fbff44');
   b.restore();
 });
 // Additional original CC0 asset illustrations preserve the established game style.
 const foliage=[[.7,.65,'bush'],[1.4,5.4,'bushOrange'],[3.55,5.5,'bush'],[6.4,.48,'bushOrange'],[7.8,2.18,'bush'],[8.5,.65,'bushOrange']];
 for(const [gx,gy,key] of foliage){
  const img=sprites[key];if(!img)continue;
  b.save();b.globalAlpha=.42;b.shadowColor='#72d8c2';b.shadowBlur=9;
  b.drawImage(img,OX+gx*S-37,OY+gy*S-31,75,60);b.restore()
 }
 const e=routePts[0],z=routePts.at(-1);
 glowCircle(b,e.x,e.y,70,'#ce4d879c',.56);
 glowCircle(b,z.x,z.y,112,'#46e5d9ab',.8);
 b.save();b.translate(e.x,e.y);
 polygon(b,0,0,30,6,Math.PI/6,'#28183e','#fb8bc8');
 polygon(b,0,0,16,6,Math.PI/6,'#bf4c81','#ffd3e7');b.restore();
 b.save();b.translate(z.x,z.y);
 polygon(b,0,11,40,6,Math.PI/6,'#1e4868','#71d5dc');
 polygon(b,0,0,29,6,Math.PI/6,'#247891','#b9ffff');
 polygon(b,0,-6,16,4,Math.PI/4,'#aafcff','#fff');
 b.restore();
 // Framing arch at the start and end.
 b.lineWidth=5;b.strokeStyle='#ffffff27';
 roundRect(b,OX-8,OY-12,COLS*S+16,ROWS*S+24,28);b.stroke();
}
function drawTower(t){
 const {focusTower,clock}=runtime;
 const p=mid(t.x,t.y),d=TYPES[t.kind],lev=t.level;
 c.save();c.translate(p.x,p.y);
 c.fillStyle='#030d27a6';c.beginPath();c.ellipse(3,18,31,12,0,0,Math.PI*2);c.fill();
 if(t===focusTower){glowCircle(c,0,0,69,d.color,.35);c.strokeStyle=d.color;c.lineWidth=2.5;c.setLineDash([6,7]);c.beginPath();c.arc(0,0,(d.range+.2*(lev-1))*S,0,7);c.stroke();c.setLineDash([])}
 polygon(c,0,10,35,6,Math.PI/6,'#193456','#659bb4');
 polygon(c,0,1,27,6,Math.PI/6,'#34547a','#b4dbef');
 polygon(c,0,-10,24,6,Math.PI/6,'#162448','#c2eaff');
 c.shadowColor=d.color;c.shadowBlur=15+t.flash*110;
 if(t.kind==='ray'){polygon(c,0,-15,23,4,Math.PI/4,'#33b8ae','#d7ffff');polygon(c,0,-18,11,4,Math.PI/4,'#a6fff2','#fff')}
 if(t.kind==='frost'){polygon(c,0,-12,27,6,Math.PI/6,'#789fe9','#d7e7ff');polygon(c,0,-14,18,6,Math.PI/6,'#bed7ff','#fff')}
 if(t.kind==='nova'){polygon(c,0,-10,27,8,Math.PI/8,'#f18b70','#ffe6b2');polygon(c,0,-12,13,8,Math.PI/8,'#fff0c1','#fff')}
 c.shadowBlur=0;
 if(t.flash>0){c.strokeStyle=d.color;c.lineWidth=4;c.beginPath();c.arc(0,-13,35+t.flash*40,0,Math.PI*2);c.stroke()}
 for(let i=0;i<lev;i++){c.beginPath();c.fillStyle='#fff4cb';c.arc(-9+i*9,26,3.1,0,7);c.fill()}
 c.restore();
}
function drawEnemy(e){
 const {clock}=runtime;
 const d=ENEMIES[e.kind];
 c.save();c.translate(e.x,e.y+Math.sin(clock*4+e.anim)*2);c.rotate(Math.sin(clock*2+e.rot)*.12);
 glowCircle(c,0,0,d.radius*2.1,d.color,.29);c.shadowBlur=18;c.shadowColor=d.color;
 if(e.kind==='wisp'){polygon(c,0,-4,19,5,-Math.PI/2,'#bf427f','#ffb7e1');polygon(c,0,-7,9,5,-Math.PI/2,'#ffd7ee','#fff')}
 else if(e.kind==='runner'){polygon(c,0,1,18,3,-Math.PI/2,'#f4ae65','#ffe7b0');polygon(c,0,-2,8,3,-Math.PI/2,'#fff4d5','#fff')}
 else if(e.kind==='brute'){polygon(c,0,1,27,6,Math.PI/6,'#5847a4','#b8aaff');polygon(c,0,-3,16,6,Math.PI/6,'#ba9dff','#f6efff')}
 else{polygon(c,0,0,38,8,Math.PI/8,'#9c315b','#ff86a3');polygon(c,0,-6,24,8,Math.PI/8,'#ff607c','#ffe2ed');polygon(c,0,-6,12,4,Math.PI/4,'#fff4f5','#fff')}
 c.shadowBlur=0;
 if(e.slowTime>0){c.strokeStyle='#a4eeff';c.lineWidth=4;c.beginPath();c.arc(0,0,d.radius+9,0,Math.PI*2);c.stroke()}
 c.fillStyle='#09122c';roundRect(c,-d.radius,-d.radius-20,d.radius*2,7,4);c.fill();
 const frac=clamp(e.hp/e.max,0,1);c.fillStyle=frac>.4?'#80f7d1':'#ffbf8a';roundRect(c,-d.radius,-d.radius-20,d.radius*2*frac,7,4);c.fill();
 c.restore();
}
function draw(dt){
 const {clock,keyboardCursor,hovered,phase,selection,towers,monsters,shots,effects,particles,texts,pulseArmed,paused}=d.read();
 runtime={clock,focusTower:d.read().focusTower};
 c.clearRect(0,0,W,H);c.drawImage(bg,0,0);
 if(!reduce){const a=.5+.5*Math.sin(clock*1.55);glowCircle(c,routePts.at(-1).x,routePts.at(-1).y,68+9*a,'#b8fff7',.19+.17*a)}
 const h=keyboardCursor&&document.activeElement===canvas?keyboardCursor:hovered;
 if(h&&h.x>=0&&h.x<COLS&&h.y>=0&&h.y<ROWS&&phase!=='victory'&&phase!=='defeat'){
 const road=TRACK.has(h.x+','+h.y),occupied=towers.some(t=>t.x===h.x&&t.y===h.y),p=mid(h.x,h.y);
 c.save();c.fillStyle=road?'#ff648a48':occupied?'#ffd28230':'#80ffe541';c.strokeStyle=road?'#ff8bac':occupied?'#ffd18b':'#89f9e6';c.lineWidth=3;roundRect(c,OX+h.x*S+7,OY+h.y*S+7,S-14,S-14,12);c.fill();c.stroke();
 if(!road&&!occupied){c.globalAlpha=.5;glowCircle(c,p.x,p.y,55,TYPES[selection].color,.6)}c.restore();
 }
 towers.forEach(drawTower);
 monsters.forEach(drawEnemy);
 c.save();
 for(const fx of effects){const img=sprites[fx.sprite];if(!img)continue;c.save();
  c.globalAlpha=Math.max(0,1-fx.life/fx.ttl)*.72;c.globalCompositeOperation='lighter';
  const size=fx.size*(1+.38*fx.life/fx.ttl);
  c.drawImage(img,fx.x-size/2,fx.y-size/2,size,size);c.restore()
 }
 for(const sh of shots){
 c.strokeStyle=sh.color;c.lineWidth=sh.kind==='ray'?7:5;c.shadowBlur=20;c.shadowColor=sh.color;
 c.beginPath();c.arc(sh.x,sh.y,sh.kind==='nova'?10:6,0,Math.PI*2);c.fillStyle='#fff';c.fill();
 c.beginPath();c.arc(sh.x,sh.y,sh.kind==='nova'?8:5,0,Math.PI*2);c.fillStyle=sh.color;c.fill();
 }c.restore();
 for(const p of particles){c.save();c.globalAlpha=clamp(1-p.life/p.ttl,0,1);if(p.pulse){c.strokeStyle='#ffd6fa';c.lineWidth=9*(1-p.life/p.ttl);c.shadowColor='#ff6da9';c.shadowBlur=26;c.beginPath();c.arc(p.x,p.y,p.r,0,Math.PI*2);c.stroke()}else{glowCircle(c,p.x,p.y,p.r*4,p.color,.45);c.fillStyle=p.color;c.beginPath();c.arc(p.x,p.y,p.r,0,7);c.fill()}c.restore()}
 c.save();c.font='bold 24px Manrope,Segoe UI,sans-serif';c.textAlign='center';
 for(const t of texts){c.globalAlpha=1-t.life;c.shadowColor='#020a1e';c.shadowBlur=8;c.fillStyle=t.color;c.fillText(t.msg,t.x,t.y)}c.restore();
 if(pulseArmed&&phase==='battle'){c.save();c.strokeStyle='#f5c2ff';c.lineWidth=3;c.setLineDash([12,8]);c.beginPath();c.arc(hovered?mid(clamp(hovered.x,0,8),clamp(hovered.y,0,6)).x:W/2,hovered?mid(clamp(hovered.x,0,8),clamp(hovered.y,0,6)).y:H/2,125,0,7);c.stroke();c.restore()}
 if(paused&&phase==='battle'){c.fillStyle='#060e23a6';c.fillRect(0,0,W,H);c.textAlign='center';c.fillStyle='#e8f8ff';c.font='800 43px Manrope,Segoe UI,sans-serif';c.fillText('ПАУЗА',W/2,H/2)}
}

 return {scene,draw};
}});
})();