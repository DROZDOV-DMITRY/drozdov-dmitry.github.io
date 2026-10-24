(()=>{'use strict';
const canvas=document.getElementById('field'),c=canvas.getContext('2d',{alpha:false});
const $=id=>document.getElementById(id);
if(!c){$('hint').textContent='Браузер не поддерживает Canvas 2D. Попробуй другой браузер.';return}
const W=990,H=720,S=94,OX=72,OY=31,COLS=9,ROWS=7;
let TOTAL=5,startingGold=230,startingHealth=12,bonusBase=50,enemyHpGrowth=.29,enemySpeedGrowth=.07,spawnIntervalMultiplier=.84;
const sprites={},resourceStatuses=[],effects=[];
const safeImagePath=x=>typeof x==='string'&&/^assets\/[a-z0-9_./-]+\.(png|webp|jpg|jpeg)$/i.test(x)&&!x.split('/').includes('..')?x:null;
function numeric(x,fallback,min,max){const v=Number(x);return Number.isFinite(v)?Math.round(clamp(v,min,max)):fallback}
function decimal(x,fallback,min,max){const v=Number(x);return Number.isFinite(v)?clamp(v,min,max):fallback}
function readSettings(cfg){
 const g=cfg?.game||{},prices=cfg?.towerCosts||{};
 startingGold=numeric(g.startGold,230,50,2000);
 startingHealth=numeric(g.startHealth,12,1,40);
 TOTAL=numeric(g.maxWaves,5,1,5);
 bonusBase=numeric(g.bonusBetweenWaves,50,0,200);
 enemyHpGrowth=decimal(g.waveEnemyHealthGrowth,.29,0,1);
 enemySpeedGrowth=decimal(g.waveEnemySpeedGrowth,.07,0,.4);
 spawnIntervalMultiplier=decimal(g.spawnIntervalMultiplier,.84,.3,1.6);
 for(const kind of ['ray','frost','nova'])TYPES[kind].cost=numeric(prices[kind],TYPES[kind].cost,20,500);
}
function loadImage(key,source){
 return new Promise(resolve=>{
  const path=safeImagePath(source);
  if(!path){resourceStatuses.push({key,ok:false,path:String(source||'—'),reason:'Неверный путь'});resolve();return}
  const img=new Image();let done=false;
  const finish=ok=>{if(done)return;done=true;if(ok)sprites[key]=img;resourceStatuses.push({key,ok,path,reason:ok?'':'Файл не найден или повреждён'});resolve()};
  img.onload=()=>finish(img.naturalWidth>0&&img.naturalHeight>0);
  img.onerror=()=>finish(false);img.src=path;
 });
}
async function loadResources(){
 let config=window.CRYSTAL_OFFLINE_CONFIG||{},mode='config.offline.js',warning='';
 if(location.protocol!=='file:'){
  try{
   const response=await fetch('game.json',{cache:'no-cache'});
   if(!response.ok)throw Error('HTTP '+response.status);
   const parsed=await response.json();
   if(!parsed||typeof parsed!=='object'||!parsed.assets)throw Error('Неверная схема JSON');
   config=parsed;mode='game.json';
  }catch(error){warning='Невозможно прочитать game.json: '+error.message}
 }
 readSettings(config);
 const paths=config.assets||{};
 await Promise.all(['flare','magic','bush','bushOrange'].map(key=>loadImage(key,paths[key])));
 const count=resourceStatuses.filter(r=>r.ok).length;
 const status=$('asset-status'),list=$('asset-list'),src=$('config-mode');
 if(status)status.textContent='Ресурсы проекта · '+count+'/'+resourceStatuses.length+' загружены · '+mode;
 if(list){list.textContent='';for(const r of resourceStatuses){const li=document.createElement('li');li.className=r.ok?'asset-ok':'asset-missing';li.textContent=(r.ok?'✓ ':'⚠ ')+r.key+' — '+r.path+(r.ok?'':' ('+r.reason+')');list.appendChild(li)}}
 if(src)src.textContent=(mode==='game.json'?'Онлайн: настройки читаются из game.json.':'Локально: используется config.offline.js.')+(warning?' '+warning:'')+' Для игры двойным щелчком обнови config.offline.js после правки JSON.';
}

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
 [
  'wisp',
  'wisp',
  'wisp',
  'runner',
  'wisp',
  'wisp',
  'runner',
  'wisp'
 ],
 [
  'wisp',
  'runner',
  'wisp',
  'runner',
  'brute',
  'wisp',
  'runner',
  'wisp',
  'brute',
  'runner',
  'wisp',
  'runner',
  'wisp',
  'runner'
 ],
 [
  'runner',
  'wisp',
  'brute',
  'runner',
  'wisp',
  'runner',
  'brute',
  'runner',
  'wisp',
  'brute',
  'runner',
  'wisp',
  'brute',
  'runner',
  'wisp',
  'runner',
  'wisp',
  'runner'
 ],
 [
  'runner',
  'brute',
  'runner',
  'wisp',
  'runner',
  'brute',
  'runner',
  'brute',
  'wisp',
  'runner',
  'brute',
  'wisp',
  'runner',
  'brute',
  'runner',
  'wisp',
  'brute',
  'runner',
  'wisp',
  'brute',
  'runner',
  'wisp'
 ],
 [
  'runner',
  'brute',
  'runner',
  'wisp',
  'brute',
  'runner',
  'brute',
  'wisp',
  'runner',
  'brute',
  'runner',
  'brute',
  'wisp',
  'runner',
  'boss',
  'brute',
  'runner',
  'brute',
  'wisp',
  'runner',
  'brute',
  'runner',
  'brute',
  'runner',
  'brute',
  'runner'
 ]
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
let gold=startingGold,heart=startingHealth,wave=0,score=0,kills=0,phase='ready',speed=1,paused=false,selection='ray',focusTower=null;
let towers=[],monsters=[],shots=[],particles=[],texts=[],waveQueue=[],waveTime=0,serial=0,pulseCd=0,pulseArmed=false;
let hovered=null,keyboardCursor=null,last=0,clock=0,uiClock=0,toastUntil=0,toastText='';
let waveStartLives=startingHealth,wind=0,landFrame=0;
const COLOR={ray:'#72f8dc',frost:'#a9c5ff',nova:'#ffcd8d'};
function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect?ctx.roundRect(x,y,w,h,r):(ctx.rect(x,y,w,h));}
function glowCircle(ctx,x,y,r,color,alpha=1){ctx.save();ctx.globalAlpha=alpha;const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'#0000');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.restore()}
function polygon(ctx,x,y,r,edges,rotation,fill,stroke){ctx.beginPath();for(let i=0;i<edges;i++){const a=(i/edges)*Math.PI*2+rotation;const px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py)}ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.stroke()}}

const visual=window.CRYSTAL_ART.create({
 c,b,bg,W,H,S,OX,OY,COLS,ROWS,TRACK,routePts,stars,plants,sprites,TYPES,ENEMIES,
 roundRect,glowCircle,polygon,mid,clamp,canvas,reduce,
 read:()=>({clock,keyboardCursor,hovered,phase,selection,towers,monsters,shots,effects,particles,texts,pulseArmed,paused,focusTower})
});
visual.scene();
function setHint(text,forSeconds=3){toastText=text;toastUntil=clock+forSeconds;$('hint').textContent=text}
function sync(){
 $('gold').textContent=gold;$('health').textContent=heart;$('wave').textContent=wave+' / '+TOTAL;$('score').textContent=score;
 const fight=phase==='battle',ready=phase==='ready';
 $('start').disabled=!ready||wave>=TOTAL;
 $('start').innerHTML=wave===0?'Начать волну <span>→</span>':wave<TOTAL?'Следующая волна <span>→</span>':'Все волны пройдены';
 $('pause').disabled=!fight;$('pause').textContent=paused?'▶':'Ⅱ';$('pause').setAttribute('aria-pressed',String(paused));
 $('speed').textContent='×'+speed;
 $('speed').setAttribute('aria-label','Скорость игры ×'+speed+'. Нажмите, чтобы переключить на ×'+(speed===5?1:speed+1));
 $('speed').title='Скорость игры: ×'+speed+' (нажмите для переключения до ×5)';
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
 if(sprites.flare){effects.push({x,y,life:0,ttl:.46,size:rand(44,78),sprite:'flare'});if(effects.length>60)effects.splice(0,effects.length-60)}
 if(reduce)count=Math.min(3,count);
 for(let i=0;i<count;i++){const a=rand(0,Math.PI*2),spd=rand(40,160);particles.push({x,y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,ttl:rand(.2,.6),life:0,r:rand(2,5),color})}
 if(particles.length>250)particles.splice(0,particles.length-250);
}
function floatText(x,y,msg,color){texts.push({x,y,msg,color,life:0});if(texts.length>28)texts.shift()}
function makeMonster(kind){
 const d=ENEMIES[kind],p=routePts[0];
 const scaledHp=Math.round(d.hp*(1+enemyHpGrowth*(wave-1)));
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
 gold+=bonusBase+10*wave;phase='ready';pulseArmed=false;paused=false;score+=100*wave;
 setHint('Волна отражена! Бонус ✧ '+(bonusBase+10*wave)+'. Усиль оборону.',5);sync();
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
 gold=startingGold;heart=startingHealth;wave=0;score=0;kills=0;phase='ready';speed=1;paused=false;selection='ray';focusTower=null;
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
 if(sprites.magic)effects.push({x,y,life:0,ttl:.7,size:250,sprite:'magic'});
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
$('speed').addEventListener('click',()=>{speed=speed===5?1:speed+1;sync()});
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
 if(waveQueue.length&&waveTime<=0){const kind=waveQueue.shift();makeMonster(kind);waveTime=spawnIntervalMultiplier*(kind==='brute'?1.35:kind==='boss'?2.2:1)*(1-.065*(wave-1))}
 for(const e of monsters)if(!e.dead){
 if(e.slowTime>0)e.slowTime-=dt;else e.slowRate=1;
 e.dist+=ENEMIES[e.kind].speed*(1+enemySpeedGrowth*(wave-1))*e.slowRate*dt;
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
 for(const fx of effects)fx.life+=dt;
 for(let i=effects.length-1;i>=0;i--)if(effects[i].life>=effects[i].ttl)effects.splice(i,1);
 for(const p of particles){
 p.life+=dt;if(p.pulse){p.r+=dt*330;continue}
 p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.97;p.vy*=.97
 }
 particles=particles.filter(p=>p.life<p.ttl);
 for(const t of texts){t.life+=dt;t.y-=dt*45}texts=texts.filter(t=>t.life<1);
 if(clock>toastUntil&&phase==='ready'&&wave>0){$('hint').textContent='Усиль свои башни и начни следующую волну.';toastUntil=clock+1000}
}
function frame(t){
 if(!last)last=t;
 const dt=Math.min(.05,(t-last)/1000);last=t;
 // Divide accelerated time into bounded ticks, so x5 cannot skip projectiles or collisions.
 if(!paused&&phase!=='victory'&&phase!=='defeat'){
   let remaining=dt*speed;
   while(remaining>0.000001){const step=Math.min(.03,remaining);simulation(step);remaining-=step;if(phase==='victory'||phase==='defeat')break}
 }
 else if(phase==='victory'||phase==='defeat'){clock+=dt;for(const p of particles)p.life+=dt;particles=particles.filter(p=>p.life<p.ttl)}
 visual.draw(dt);uiClock+=dt;
 if(uiClock>.17){sync();uiClock=0}
 requestAnimationFrame(frame);
}
window.__crystalTest=Object.freeze({snapshot:()=>({gold,heart,wave,score,phase,kills,towers:towers.length,monsters:monsters.length,selection,speed,pulseCd,paused}),route:ROUTE.map(p=>p.slice()),version:'2.0'});
loadResources().then(()=>{
 visual.scene();reset();requestAnimationFrame(frame);
}).catch(error=>{
 const status=$('asset-status');if(status)status.textContent='Ошибка ресурсов: '+error.message;
 reset();requestAnimationFrame(frame);
});
})();