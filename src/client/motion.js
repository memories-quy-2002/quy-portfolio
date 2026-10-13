'use strict';
/** Cinematic navigation and bounded scroll effects; all motion has a reduced-motion path. */
(() => {
 const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
 let overlay;
 let animations=[];
 let run=0;
 let frame=0;
 let stages=[];
 let hero;
 let heroRegion;
 let pointer={x:0,y:0};
 let sharedTransition;
 const canAnimate=()=>!preference.matches&&typeof Element.prototype.animate==='function';
 function ensureOverlay(){
  if(overlay)return overlay;
  overlay=document.createElement('div');overlay.className='page-curtain';overlay.setAttribute('aria-hidden','true');
  overlay.innerHTML='<div class="curtain-accent"></div><div class="curtain-panel"><img src="/assets/hero-ring-cutout-1536.webp" alt="" width="1536" height="1024"><div class="curtain-copy"><span class="curtain-brand">PQ · Phú Quý</span><span class="curtain-name"></span><span class="curtain-rule"></span></div></div>';
  document.body.append(overlay);return overlay;
 }
 function cancel(){
  run++;sharedTransition?.skipTransition();sharedTransition=null;animations.forEach(animation=>animation.cancel());animations=[];
  overlay?.classList.remove('active');document.getElementById('main')?.classList.remove('shared-entry');
 }
 function animate(element,keyframes,options){
  const animation=element.animate(keyframes,{fill:'both',...options});animations.push(animation);
  return animation.finished.catch(()=>{});
 }
 async function transition(update,name,isCurrent=()=>true){
  if(!canAnimate()){update();return;}
  cancel();const id=run;const el=ensureOverlay();const accent=el.querySelector('.curtain-accent');const panel=el.querySelector('.curtain-panel');const title=el.querySelector('.curtain-copy');
  el.querySelector('.curtain-name').textContent=name;el.classList.add('active');
  const ease='cubic-bezier(.76,0,.24,1)';
  animate(accent,[{transform:'translateY(105%)'},{transform:'translateY(0%)'}],{duration:140,easing:ease});
  animate(title,[{opacity:0,transform:'translateY(30px)'},{opacity:1,transform:'translateY(0px)'}],{duration:110,delay:40,easing:'cubic-bezier(.22,1,.36,1)'});
  await animate(panel,[{transform:'translateY(110%)'},{transform:'translateY(0%)'}],{duration:150,delay:10,easing:ease});
  if(id!==run||!isCurrent())return;
  // Swap content only once the curtain covers it; this avoids flashes and layout jumps.
  try{update();}catch(error){cancel();throw error;}
  animate(title,[{opacity:1,transform:'translateY(0px)'},{opacity:0,transform:'translateY(-25px)'}],{duration:80,easing:'ease-in'});
  animate(accent,[{transform:'translateY(0%)'},{transform:'translateY(-105%)'}],{duration:160,delay:10,easing:ease});
  await animate(panel,[{transform:'translateY(0%)'},{transform:'translateY(-110%)'}],{duration:150,delay:15,easing:ease});
  if(id===run){el.classList.remove('active');animations.forEach(animation=>animation.cancel());animations=[];}
 }
 async function projectTransition(update,origin,isCurrent=()=>true){
  if(!canAnimate()||typeof document.startViewTransition!=='function'){return transition(update,origin.querySelector('h3')?.textContent||'',isCurrent);}
  cancel();const id=run;
  const sourceImage=origin.querySelector('.project-visual img');const sourceTitle=origin.querySelector('h3');
  if(!sourceImage)return transition(update,sourceTitle?.textContent||'',isCurrent);
  const touched=[];
  const name=(element,value)=>{if(element){element.style.viewTransitionName=value;touched.push(element);}};
  name(sourceImage,'project-shot');name(sourceTitle,'project-heading');
  const view=document.startViewTransition(()=>{
   if(id!==run||!isCurrent())return;
   update();const root=document.getElementById('main');root.classList.add('shared-entry');
   name(root.querySelector('[data-shared-image]'),'project-shot');name(root.querySelector('.case-heading h1'),'project-heading');
  });
  sharedTransition=view;
  try{await view.updateCallbackDone;try{await view.finished;}catch{/* Snapshot animation failure does not undo completed navigation. */}}
  finally{touched.forEach(element=>element.style.removeProperty('view-transition-name'));if(id===run){sharedTransition=null;document.getElementById('main').classList.remove('shared-entry');}}
 }
 function resetHero(){if(hero)for(const property of ['--hero-x','--hero-y','--hero-rx','--hero-ry','--hero-shift'])hero.style.removeProperty(property);pointer={x:0,y:0};}
 function refresh(root){
  resetHero();stages=[...root.querySelectorAll('.project-stage')];hero=root.querySelector('.hero-art');heroRegion=root.querySelector('.hero');
  const nodes=[...hero?.querySelectorAll('[data-system-node]')||[]];
  const detail=hero?.querySelector('[data-system-detail]');
  nodes.forEach(node=>node.addEventListener('click',()=>{
   nodes.forEach(item=>item.setAttribute('aria-pressed',String(item===node)));
   if(detail)detail.textContent=node.dataset.detail||node.querySelector('strong')?.textContent||'';
  }));
  if(preference.matches){stages.forEach(stage=>stage.style.removeProperty('--scroll-lift'));hero?.style.removeProperty('--hero-shift');return;}
  schedule();
 }
 function schedule(){if(frame||preference.matches||document.hidden)return;frame=requestAnimationFrame(draw);}
 function draw(){
  frame=0;const height=window.innerHeight;
  // Read all geometry first, then write custom properties to avoid interleaved layout work.
  const positions=stages.map(stage=>({stage,rect:stage.getBoundingClientRect()}));
  positions.forEach(({stage,rect})=>{if(rect.top<height&&rect.bottom>0){const progress=Math.max(-1,Math.min(1,(rect.top+rect.height/2-height/2)/height));stage.style.setProperty('--scroll-lift',`${progress*18}px`);}});
  if(hero){const rect=hero.getBoundingClientRect();if(rect.bottom>0){hero.style.setProperty('--hero-shift',`${Math.min(45,window.scrollY*.07)}px`);hero.style.setProperty('--hero-rx',`${pointer.y*-8}deg`);hero.style.setProperty('--hero-ry',`${pointer.x*11}deg`);hero.style.setProperty('--hero-x',`${pointer.x*18}px`);hero.style.setProperty('--hero-y',`${pointer.y*13}px`);}}
 }
 window.addEventListener('pointermove',event=>{if(preference.matches||event.pointerType!=='mouse'||!heroRegion)return;const r=heroRegion.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom){pointer={x:0,y:0};}else pointer={x:(event.clientX-r.left)/r.width*2-1,y:(event.clientY-r.top)/r.height*2-1};schedule();},{passive:true});
 window.addEventListener('blur',()=>{resetHero();});
 window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule,{passive:true});
 preference.addEventListener?.('change',()=>{if(preference.matches){cancel();if(frame)cancelAnimationFrame(frame);frame=0;stages.forEach(stage=>stage.style.removeProperty('--scroll-lift'));resetHero();}else schedule();});
 window.PortfolioMotion={transition,projectTransition,cancel,refresh};
})();
