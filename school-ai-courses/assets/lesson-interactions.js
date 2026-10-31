/* Decorative feedback never changes lesson state or intercepts a click. */
(()=>{'use strict';
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const creatures=[
'<path d="M24 35Q5 5 8 36L27 48M52 33Q72 7 70 37L51 48" fill="#aa9cf4"/><path d="M12 54Q2 58 6 42L29 42" fill="#4dbbb1"/><ellipse cx="38" cy="44" rx="21" ry="16" fill="#4dbbb1"/><ellipse cx="51" cy="27" rx="16" ry="15" fill="#70d8bb"/><path d="M43 14l1-9 8 8m6 1 8-6-2 13" fill="#ffd46d"/><circle cx="56" cy="24" r="3" fill="#20334d"/><path d="M28 54l-6 7m23-6 5 6" stroke="#258b8a" stroke-width="6" stroke-linecap="round"/>',
'<ellipse cx="40" cy="48" rx="18" ry="15" fill="#e66b82"/><circle cx="40" cy="31" r="13" fill="#ffd4b0"/><path d="M21 29L40 2l15 29z" fill="#7564d3"/><path d="M27 38q13 23 26 0" fill="white"/><circle cx="44" cy="29" r="2.5" fill="#20334d"/><path d="M31 60l-9 3m26-3 9 3" stroke="#243b64" stroke-width="7" stroke-linecap="round"/>',
'<path d="M20 48q-22-16-15 6" stroke="#ad9ac9" stroke-width="4" fill="none"/><ellipse cx="39" cy="48" rx="21" ry="14" fill="#ad9ac9"/><circle cx="52" cy="35" r="13" fill="#c9b7df"/><circle cx="42" cy="29" r="9" fill="#ecd3e6"/><circle cx="59" cy="27" r="9" fill="#ecd3e6"/><path d="M40 24V13q-10-7-3-12 5-4 10 1 8-9 13 0 12-1 9 9l-8 3v10z" fill="white" stroke="#cfdae8" stroke-width="2"/><circle cx="58" cy="36" r="2.5" fill="#243b64"/><circle cx="66" cy="41" r="3" fill="#ed839b"/>'
];let last=-Infinity;
addEventListener('DOMContentLoaded',()=>{document.querySelectorAll('input[type="checkbox"]').forEach(el=>{const label=el.closest('label');if(label){label.style.display='block';label.style.cursor='default';}el.remove();});document.querySelector('#finalStatus')?.remove();document.querySelectorAll('button.done,button.l01-done,button[data-step],button[data-fast]').forEach(el=>el.remove());});
document.addEventListener('click',event=>{
const target=event.target.closest('button,summary,.actions a,.s14-next-link');
if(!target||target.disabled)return;
target.classList.add('s14-pressed');setTimeout(()=>target.classList.remove('s14-pressed'),160);
if(reduce.matches||event.detail===0||performance.now()-last<15000||Math.random()>.16)return;
last=performance.now();const box=target.getBoundingClientRect(),el=document.createElement('span');
el.className='s14-surprise';el.setAttribute('aria-hidden','true');
el.innerHTML='<svg viewBox="0 0 80 70" xmlns="http://www.w3.org/2000/svg">'+creatures[Math.floor(Math.random()*creatures.length)]+'</svg>';
el.style.left=Math.max(8,Math.min(innerWidth-90,box.right-35))+'px';el.style.top=Math.max(10,Math.min(innerHeight-80,box.top-50))+'px';el.style.setProperty('--run',box.left>innerWidth/2?'-150px':'150px');
document.body.append(el);setTimeout(()=>el.remove(),700);
});
})();