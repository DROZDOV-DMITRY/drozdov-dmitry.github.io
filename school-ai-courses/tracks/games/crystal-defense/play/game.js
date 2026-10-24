(()=>{'use strict';
const canvas=document.getElementById('field'),c=canvas.getContext('2d',{alpha:false});
const $=id=>document.getElementById(id);
if(!c){$('hint').textContent='Браузер не поддерживает Canvas 2D. Попробуй другой браузер.';return}
const W=990,H=720,S=94,OX=72,OY=31,COLS=9,ROWS=7,TOTAL=5;
const ROUTE=[[0,3],[1,3],[2,3],[2,2],[2,1],[3,1],[4,1],[4,2],[4,3],[5,3],[6,3],[6,4],[6,5],[7,5],[8,5]];
const TRACK=new Set(ROUTE.map(q=>q.join(',')));
const TYPES={
 ray:{name:'Луч',cost:65,range:2.25,rate:.48,damage:23,shot:580,color:'#8df9e9'},
 frost:{name:'Иней',cost:90,range:2.45,rate:1.13,damage:16,shot:425,color:'#9abbff',slow:.48},
 nova:{name:'Нова',cost:120,range:2.14,rate:1.46,damage:40,shot:345,color:'#ffc184',splash:1.12}
};
const ENEMIES={
 wisp:{hp:55,speed:82,bounty:16,radius:19,color:'#ee76b4',damage:1},
 runner:{hp:40,speed:132,bounty:15,radius:15,color:'#ffcf85',damage:1},
 brute:{hp:220,speed:52,bounty:44,radius:27,color:'#9a80fe',damage:2},
 boss:{hp:610,speed:44,bounty:120,radius:35,color:'#fd627f',damage:3}
};
const NEXT_WAVE_TIPS=[
 'Разведчики и первые быстрые существа. Луч хорошо начинает оборону.',
 'Появятся тяжёлые панцирные враги: Нова пробивает их лучше Луча.',
 'Больше быстрых существ и панцирей. Иней помогает задерживать прорыв.',
 'Смешанная атака. Комбинируй массовый урон и контроль скорости.',
 'Финальный босс с крепкой бронёй. Подготовь Нову и сохрани импульс.'
];
const ROSTER=[
['wisp','wisp','wisp','wisp','wisp','runner','wisp','wisp'],
['wisp','runner','wisp','runner','wisp','brute','runner','wisp','wisp','runner'],
['runner','wisp','brute','wisp','runner','brute','wisp','runner','wisp','runner','wisp'],
['runner','brute','wisp','runner','brute','wisp','runner','brute','wisp','runner','brute','wisp'],
['runner','brute','runner','wisp','brute','wisp','runner','brute','runner','boss','brute','runner']
];
const mid=(x,y)=>({x:OX+(x+.5)*S,y:OY+(y+.5)*S});
const routePts=ROUTE.map(q=>mid(...q));
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const rand=(a,b)=>a+Math.random()*(b-a);
const sq=(a,b)=>{const x=a.x-b.x,y=a.y-b.y;return x*x+y*y};
const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
const bg=document.createElement('canvas');bg.width=W;bg.height=H;
const b=bg.getContext('2d');
const stars=Array.from({length:64},(_,i)=>({x:(i*131+45)%W,y:(i*87+19)%H,r:(i%3+1)*.75}));
const plants=Array.from({length:60},(_,i)=>({x:(i*433+37)%W,y:(i*167+71)%H,size:4+(i%5)*3,rotate:(i*5)%6}));
let gold=230,heart=12,wave=0,score=0,kills=0,phase='ready',speed=1,paused=false,selection='ray',focusTower=null;
let towers=[],monsters=[],shots=[],particles=[],texts=[],waveQueue=[],waveTime=0,serial=0,pulseCd=0,pulseArmed=false;
let hovered=null,keyboardCursor=null,last=0,clock=0,uiClock=0,toastUntil=0,toastText='';
let waveStartLives=12,wind=0,landFrame=0;
const COLOR={ray:'#72f8dc',frost:'#a9c5ff',nova:'#ffcd8d'};
function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect?ctx.roundRect(x,y,w,h,r):(ctx.rect(x,y,w,h));}
function glowCircle(ctx,x,y,r,color,alpha=1){ctx.save();ctx.globalAlpha=alpha;const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'#0000');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.restore()}
function polygon(ctx,x,y,r,edges,rotation,fill,stroke){ctx.beginPath();for(let i=0;i<edges;i++){const a=(i/edges)*Math.PI*2+rotation;const px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py)}ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.stroke()}}
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
scene();
function setHint(text,forSeconds=3){toastText=text;toastUntil=clock+forSeconds;$('hint').textContent=text}
function sync(){
 $('gold').textContent=gold;$('health').textContent=heart;$('wave').textContent=wave+' / '+TOTAL;$('score').textContent=score;
 const fight=phase==='battle',ready=phase==='ready';
 $('start').disabled=!ready||wave>=TOTAL;
 $('start').innerHTML=wave===0?'Начать волну <span>→</span>':wave<TOTAL?'Следующая волна <span>→</span>':'Все волны пройдены';
 $('pause').disabled=!fight;$('pause').textContent=paused?'▶':'Ⅱ';$('pause').setAttribute('aria-pressed',String(paused));
 $('speed').textContent='×'+speed;$('speed').setAttribute('aria-pressed',String(speed===2));
 $('pulse').disabled=!fight||paused||pulseCd>0;
 $('pulse').classList.toggle('armed',pulseArmed);
 $('pulse-counter').textContent=pulseCd>0?Math.ceil(pulseCd)+' c':fight?'ГОТОВ':'12 c';
 $('phase-dot').classList.toggle('battle',fight);
 $('phase-title').textContent=phase==='victory'?'Победа!':phase==='defeat'?'Сердце погасло':fight?'Держи оборону!':'Время подготовиться';
 $('phase-desc').textContent=phase==='victory'?'Все пять волн отражены.':phase==='defeat'?'Попробуй другую расстановку башен.':fight?(paused?'Пауза. Продолжи битву.':'Противников на поле: '+monsters.filter(e=>!e.dead).length):NEXT_WAVE_TIPS[Math.min(wave,TOTAL-1)];
 document.querySelectorAll('[data-kind]').forEach(t=>{const yes=t.dataset.kind===selection;t.classList.toggle('selected',yes);t.setAttribute('aria-pressed',String(yes))});
 if(focusTower){
 const t=focusTower,d=TYPES[t.kind];$('detail-name').textContent=d.name+' · уровень '+t.level;
 $('detail-glyph').textContent=t.kind==='ray'?'✦':t.kind==='frost'?'❄':'✺';
 $('detail-text').textContent='Урон '+Math.round(d.damage*(1+.57*(t.level-1)))+' · радиус '+(d.range+.2*(t.level-1)).toFixed(1)+' клетки. Выбранную башню можно усилить или продать.';
 const price=upgradeCost(t);
 $('upgrade').disabled=t.level>=3||gold<price||phase==='defeat'||phase==='victory';
 $('upgrade').textContent=t.level>=3?'Максимальный уровень':'Улучшить ✧ '+price;
 $('sell').disabled=phase==='defeat'||phase==='victory';$('sell').textContent='Продать ✧ '+refund(t);
 }else{
 $('detail-name').textContent='Твоя первая оборона';$('detail-glyph').textContent='✧';
 $('detail-text').textContent='Выбери один из трёх видов башен. Нажми на построенную башню, чтобы улучшить её или вернуть часть кристаллов.';
 $('upgrade').disabled=true;$('upgrade').textContent='Выбери башню на карте';$('sell').disabled=true;$('sell').textContent='Продать';
 }
 $('build-note').textContent=pulseArmed?'Коснись точки на поле: импульс ударит по врагам в радиусе.':'Нажми на свободную клетку; дорога отмечена светлой дорожкой.';
}
function upgradeCost(t){return Math.round(TYPES[t.kind].cost*.77+(t.level-1)*28)}
function refund(t){return Math.round((TYPES[t.kind].cost+(t.level-1)*upgradeCost({kind:t.kind,level:1}))*.58)}
function blast(x,y,color,count=9){
 if(reduce)count=Math.min(3,count);
 for(let i=0;i<count;i++){const a=rand(0,Math.PI*2),spd=rand(40,160);particles.push({x,y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,ttl:rand(.2,.6),life:0,r:rand(2,5),color})}
 if(particles.length>250)particles.splice(0,particles.length-250);
}
function floatText(x,y,msg,color){texts.push({x,y,msg,color,life:0});if(texts.length>28)texts.shift()}
function makeMonster(kind){
 const d=ENEMIES[kind],p=routePts[0];
 const scaledHp=Math.round(d.hp*(1+.24*(wave-1)));
 monsters.push({id:++serial,kind,dist:0,x:p.x,y:p.y,hp:scaledHp,max:scaledHp,slowTime:0,slowRate:1,rot:rand(0,7),anim:rand(0,7),dead:false});
}
function monsterPosition(e){
 const n=e.dist/S,k=Math.floor(n),t=n-k;
 if(k>=routePts.length-1)return{...routePts.at(-1),arrived:true};
 const a=routePts[k],b=routePts[k+1];
 return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,arrived:false};
}
function killEnemy(e){
 if(e.dead)return;e.dead=true;const d=ENEMIES[e.kind];gold+=d.bounty;score+=d.bounty*10;kills++;
 floatText(e.x,e.y,'+'+d.bounty,'#ffe09b');blast(e.x,e.y,d.color,e.kind==='boss'?30:12);
}
function hurt(e,damage,slow=0,source=''){
 if(e.dead)return;
 if((e.kind==='brute'||e.kind==='boss')&&source==='ray')damage*=.62;
 if(e.kind==='boss'&&source==='frost'&&slow)slow=Math.max(slow,.7);
 e.hp-=damage;
 if(slow){e.slowRate=Math.min(e.slowRate,slow);e.slowTime=Math.max(e.slowTime,1.65)}
 if(e.hp<=0)killEnemy(e);
}
function fireTower(t,e){
 const d=TYPES[t.kind],o=mid(t.x,t.y);
 shots.push({x:o.x,y:o.y,target:e,kind:t.kind,speed:d.shot,damage:d.damage*(1+.57*(t.level-1)),color:d.color,slow:d.slow||0,splash:(d.splash||0)*S,life:0});
 t.cool=d.rate/(1+.22*(t.level-1));t.flash=.18;
 if(shots.length>100)shots.shift();
}
function nextWave(){
 if(phase!=='ready'||wave>=TOTAL)return;
 wave++;waveQueue=ROSTER[wave-1].slice();waveTime=0;phase='battle';pulseCd=0;pulseArmed=false;waveStartLives=heart;
 setHint('Волна '+wave+'! Защити Сердце долины.',3);sync();
}
function finishWave(){
 if(phase!=='battle')return;
 if(wave===TOTAL){endGame(true);return}
 gold+=50+10*wave;phase='ready';pulseArmed=false;paused=false;score+=100*wave;
 setHint('Волна отражена! Бонус ✧ '+(50+10*wave)+'. Усиль оборону.',5);sync();
}
function endGame(win){
 phase=win?'victory':'defeat';paused=false;pulseArmed=false;$('screen-state').hidden=false;
 $('state-sigil').textContent=win?'✦':'◇';
 $('state-eyebrow').textContent=win?'СЕРДЦЕ СОХРАНЕНО':'РУБЕЖ ПРОРВАН';
 $('state-title').textContent=win?'Долина сияет снова!':'Это ещё не конец';
 $('state-copy').textContent=win?'Ты отразил все пять волн, уничтожил '+kills+' противников и набрал '+score+' очков. Попробуй новую тактику и побей свой результат.':'Ты продержался до волны '+wave+'. Перестрой оборону: сочетай быстрые лучи, замедление и массовый урон.';
 sync();
}
function reset(){
 gold=230;heart=12;wave=0;score=0;kills=0;phase='ready';speed=1;paused=false;selection='ray';focusTower=null;
 towers=[];monsters=[];shots=[];particles=[];texts=[];waveQueue=[];waveTime=0;serial=0;pulseCd=0;pulseArmed=false;clock=0;uiClock=0;last=0;
 $('screen-state').hidden=true;setHint('Выбери башню и поставь её рядом с дорогой.',12);sync();
}
function buildOn(x,y){
 if(phase==='victory'||phase==='defeat')return;
 if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=COLS||y>=ROWS)return;
 const existing=towers.find(t=>t.x===x&&t.y===y);
 if(existing){focusTower=existing;pulseArmed=false;setHint('Башня выбрана. Можно улучшить её или продать.',2);sync();return}
 focusTower=null;
 if(pulseArmed){pulseArmed=false;setHint('Коснись места удара ещё раз.',2);sync();return}
 if(TRACK.has(x+','+y)){setHint('Дорогу перекрывать нельзя — выбери соседнюю клетку.',3);sync();return}
 const d=TYPES[selection];if(gold<d.cost){setHint('Не хватает кристаллов: нужно '+d.cost+'.',3);sync();return}
 gold-=d.cost;towers.push({x,y,kind:selection,level:1,cool:0,flash:0});
 const p=mid(x,y);blast(p.x,p.y,d.color,20);setHint(d.name+' построена! ✧ −'+d.cost,1.8);sync();
}
function castPulse(x,y){
 if(phase!=='battle'||paused||pulseCd>0)return;
 const R=125;let count=0;
 for(const e of monsters)if(!e.dead&&sq(e,{x,y})<R*R){hurt(e,130,.52);count++}
 particles.push({pulse:true,x,y,r:0,life:0,ttl:.53,color:'#ffd3f9'});
 blast(x,y,'#ffbbe8',reduce?5:48);pulseCd=13;pulseArmed=false;
 setHint(count?'Импульс! Поражено существ: '+count:'Импульс активирован. В этот раз враги были слишком далеко.',3);
 sync();
}
function pointerCell(px,py){const x=Math.floor((px-OX)/S),y=Math.floor((py-OY)/S);return{x,y}}
function pointFromEvent(ev){const r=canvas.getBoundingClientRect();return{x:(ev.clientX-r.left)*W/r.width,y:(ev.clientY-r.top)*H/r.height}}
canvas.addEventListener('pointerdown',e=>{
 e.preventDefault();const pt=pointFromEvent(e);
 try{canvas.setPointerCapture(e.pointerId)}catch(_){}
 const pos=pointerCell(pt.x,pt.y);
 if(pulseArmed){castPulse(pt.x,pt.y);return}
 if(pos.x<0||pos.y<0||pos.x>=COLS||pos.y>=ROWS){focusTower=null;sync();return}
 buildOn(pos.x,pos.y);
});
canvas.addEventListener('pointermove',e=>{
 if(e.pointerType==='touch'){hovered=null;return}
 const pt=pointFromEvent(e);hovered=pointerCell(pt.x,pt.y)
});
canvas.addEventListener('pointerleave',()=>hovered=null);
document.querySelectorAll('[data-kind]').forEach(btn=>btn.addEventListener('click',()=>{
 selection=btn.dataset.kind;focusTower=null;pulseArmed=false;
 setHint('Выбрано: '+TYPES[selection].name+'. Нажми на свободную клетку.',2.5);sync();
}));
$('start').addEventListener('click',nextWave);
$('speed').addEventListener('click',()=>{speed=speed===1?2:1;sync()});
$('pause').addEventListener('click',()=>{if(phase!=='battle')return;paused=!paused;sync()});
$('pulse').addEventListener('click',()=>{
 if(phase!=='battle'||pulseCd>0||paused)return;
 pulseArmed=!pulseArmed;focusTower=null;
 setHint(pulseArmed?'Выбери точку на игровом поле для энергетического импульса.':'Импульс отменён.',3);sync();
});
$('upgrade').addEventListener('click',()=>{
 if(!focusTower||focusTower.level>=3||phase==='defeat'||phase==='victory')return;
 const p=upgradeCost(focusTower);if(gold<p){setHint('Для улучшения не хватает кристаллов.',2);return}
 gold-=p;focusTower.level++;const pt=mid(focusTower.x,focusTower.y);blast(pt.x,pt.y,TYPES[focusTower.kind].color,25);
 setHint('Башня усилена до уровня '+focusTower.level+'!',3);sync();
});
$('sell').addEventListener('click',()=>{
 if(!focusTower||phase==='victory'||phase==='defeat')return;
 const t=focusTower;gold+=refund(t);towers=towers.filter(x=>x!==t);focusTower=null;
 const pt=mid(t.x,t.y);blast(pt.x,pt.y,'#f5d3a1',12);setHint('Башня продана. Часть кристаллов возвращена.',2);sync();
});
$('restart-overlay').addEventListener('click',reset);
$('restart-small').addEventListener('click',()=>{if(phase==='ready'&&wave===0){reset();return}if(window.confirm('Начать новую игру? Текущий прогресс будет потерян.'))reset()});
document.addEventListener('keydown',e=>{
 if(e.target&&/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
 if(['1','2','3'].includes(e.key)){selection=['ray','frost','nova'][+e.key-1];focusTower=null;pulseArmed=false;sync()}
 if(e.key==='Escape'){pulseArmed=false;focusTower=null;sync()}
 if(e.key.toLowerCase()==='e'&&phase==='battle'&&pulseCd<=0){pulseArmed=!pulseArmed;sync()}
 if(e.key.toLowerCase()==='p'&&phase==='battle'){paused=!paused;sync()}
 if(e.code==='Space'&&phase==='ready'){e.preventDefault();nextWave()}
 if(document.activeElement===canvas){
 if(e.key.startsWith('Arrow')){e.preventDefault();if(!keyboardCursor)keyboardCursor={x:4,y:0};keyboardCursor.x=clamp(keyboardCursor.x+(e.key==='ArrowRight')-(e.key==='ArrowLeft'),0,COLS-1);keyboardCursor.y=clamp(keyboardCursor.y+(e.key==='ArrowDown')-(e.key==='ArrowUp'),0,ROWS-1)}
 if(e.key==='Enter'){e.preventDefault();if(!keyboardCursor)keyboardCursor={x:4,y:0};if(pulseArmed){const p=mid(keyboardCursor.x,keyboardCursor.y);castPulse(p.x,p.y)}else buildOn(keyboardCursor.x,keyboardCursor.y)}
 }
});
function simulation(dt){
 clock+=dt;pulseCd=Math.max(0,pulseCd-dt);
 if(phase==='battle'){
 waveTime-=dt;
 if(waveQueue.length&&waveTime<=0){const kind=waveQueue.shift();makeMonster(kind);waveTime=.75*(kind==='brute'?1.65:kind==='boss'?2.7:1)}
 for(const e of monsters)if(!e.dead){
 if(e.slowTime>0)e.slowTime-=dt;else e.slowRate=1;
 e.dist+=ENEMIES[e.kind].speed*e.slowRate*dt;
 const p=monsterPosition(e);e.x=p.x;e.y=p.y;
 if(p.arrived){e.dead=true;heart=Math.max(0,heart-ENEMIES[e.kind].damage);blast(e.x,e.y,'#ff8bba',18);floatText(e.x,e.y,'−'+ENEMIES[e.kind].damage,'#ff94a8');if(heart===0){endGame(false);break}}
 }
 for(const t of towers){
 t.cool-=dt;t.flash=Math.max(0,t.flash-dt);
 if(t.cool>0)continue;
 const o=mid(t.x,t.y),d=TYPES[t.kind],range=(d.range+.2*(t.level-1))*S;
 let target=null;
 for(const e of monsters)if(!e.dead&&sq(o,e)<range*range&&(!target||e.dist>target.dist))target=e;
 if(target)fireTower(t,target);
 }
 for(const sh of shots){
 if(sh.dead)continue;sh.life+=dt;if(sh.life>2){sh.dead=true;continue}
 if(sh.target.dead){sh.dead=true;continue}
 const t=sh.target,dx=t.x-sh.x,dy=t.y-sh.y,dist=Math.hypot(dx,dy),move=sh.speed*dt;
 if(dist<=move+14){
 sh.dead=true;hurt(t,sh.damage,sh.slow,sh.kind);
 if(sh.splash){for(const other of monsters){if(other!==t&&!other.dead&&sq(t,other)<sh.splash*sh.splash)hurt(other,sh.damage*.57,sh.slow*.5,sh.kind)}}
 blast(t.x,t.y,sh.color,sh.kind==='nova'?17:7);
 }else{sh.x+=dx/dist*move;sh.y+=dy/dist*move}
 }
 shots=shots.filter(x=>!x.dead);monsters=monsters.filter(x=>!x.dead);
 if(phase==='battle'&&!waveQueue.length&&!monsters.length)finishWave();
 }
 for(const p of particles){
 p.life+=dt;if(p.pulse){p.r+=dt*330;continue}
 p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.97;p.vy*=.97
 }
 particles=particles.filter(p=>p.life<p.ttl);
 for(const t of texts){t.life+=dt;t.y-=dt*45}texts=texts.filter(t=>t.life<1);
 if(clock>toastUntil&&phase==='ready'&&wave>0){$('hint').textContent='Усиль свои башни и начни следующую волну.';toastUntil=clock+1000}
}
function drawTower(t){
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
 c.save();for(const sh of shots){
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
function frame(t){
 if(!last)last=t;
 const dt=Math.min(.05,(t-last)/1000);last=t;
 if(!paused&&phase!=='victory'&&phase!=='defeat')simulation(dt*speed);
 else if(phase==='victory'||phase==='defeat'){clock+=dt;for(const p of particles)p.life+=dt;particles=particles.filter(p=>p.life<p.ttl)}
 draw(dt);uiClock+=dt;
 if(uiClock>.17){sync();uiClock=0}
 requestAnimationFrame(frame);
}
window.__crystalTest=Object.freeze({snapshot:()=>({gold,heart,wave,score,phase,kills,towers:towers.length,monsters:monsters.length,selection,speed,pulseCd,paused}),route:ROUTE.map(p=>p.slice()),version:'2.0'});
reset();requestAnimationFrame(frame);
})();