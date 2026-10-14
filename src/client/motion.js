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
 let orbitFrame=0;
 let orbitObserver;
 let orbitContext;
 function stopOrbit(){
  if(orbitFrame)cancelAnimationFrame(orbitFrame);
  orbitFrame=0;orbitObserver?.disconnect();orbitObserver=null;orbitContext=null;
 }
 function scheduleOrbit(){
  if(orbitFrame||!orbitContext||!orbitContext.visible||document.hidden)return;
  orbitFrame=requestAnimationFrame(drawOrbit);
 }
 function drawOrbit(now){
  orbitFrame=0;
  const context=orbitContext;
  if(!context||!context.visible||document.hidden)return;
  if(!preference.matches)context.elapsed+=Math.min(.06,Math.max(0,(now-context.last)/1000));
  context.last=now;
  const rect=context.visual.getBoundingClientRect(),width=rect.width,height=rect.height;
  if(!width||!height)return;
  const canvas=context.connectionCanvas,canvasContext=context.connectionContext;
  const pixelRatio=Math.min(2,window.devicePixelRatio||1);
  if(canvas&&canvasContext){
   const pixelWidth=Math.max(1,Math.round(width*pixelRatio)),pixelHeight=Math.max(1,Math.round(height*pixelRatio));
   if(canvas.width!==pixelWidth||canvas.height!==pixelHeight){canvas.width=pixelWidth;canvas.height=pixelHeight;}
   canvasContext.setTransform(pixelRatio,0,0,pixelRatio,0,0);
   canvasContext.clearRect(0,0,width,height);
  }
  const planes=[
   {tilt:.13,turn:-.18,speed:.105,tiltY:0},
   {tilt:.58,turn:.49,speed:.132,tiltY:.12},
   {tilt:-.55,turn:-.62,speed:-.094,tiltY:-.14}
  ];
  const yaw=context.yaw+context.hoverYaw,pitch=context.pitch+context.hoverPitch;
  context.visual.style.setProperty('--orbit-tilt-x',(pitch*180/Math.PI).toFixed(2)+'deg');
  context.visual.style.setProperty('--orbit-tilt-y',(yaw*180/Math.PI).toFixed(2)+'deg');
  const positions=[];
  context.nodes.forEach(({element,plane,phase,radius,speed})=>{
   const path=planes[plane]||planes[0],angle=phase+context.elapsed*speed;
   let x=Math.cos(angle),y=Math.sin(angle),z=0;
   const yt=y*Math.cos(path.tilt),zt=y*Math.sin(path.tilt);
   const xr=x*Math.cos(path.turn)-yt*Math.sin(path.turn);
   const yr=x*Math.sin(path.turn)+yt*Math.cos(path.turn);
   x=xr;y=yr;z=zt;
   const px=x*Math.cos(path.tiltY)+z*Math.sin(path.tiltY);
   z=-x*Math.sin(path.tiltY)+z*Math.cos(path.tiltY);x=px;
   const yawX=x*Math.cos(yaw)+z*Math.sin(yaw);
   const yawZ=-x*Math.sin(yaw)+z*Math.cos(yaw);
   const pitchY=y*Math.cos(pitch)-yawZ*Math.sin(pitch);
   const depth=y*Math.sin(pitch)+yawZ*Math.cos(pitch);
   const nodeX=yawX*radius*width,nodeY=pitchY*radius*height;
   element.style.setProperty('--node-x',nodeX.toFixed(2)+'px');
   element.style.setProperty('--node-y',nodeY.toFixed(2)+'px');
   element.style.setProperty('--node-scale',(1+depth*.075).toFixed(3));
   element.style.setProperty('--node-depth',String(10+Math.round(depth*22)));
   positions.push({x:width/2+nodeX,y:height/2+nodeY,depth});
  });
  if(canvasContext&&positions.length>1){
   const edges=[[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[0,3],[1,4],[2,5]];
   canvasContext.save();
   canvasContext.lineCap='round';
   canvasContext.lineWidth=1.25;
   edges.forEach(([from,to])=>{
    const a=positions[from],b=positions[to];
    if(!a||!b)return;
    const visibility=.72+((a.depth+b.depth+2)*.07);
    const gradient=canvasContext.createLinearGradient(a.x,a.y,b.x,b.y);
    gradient.addColorStop(0,'rgba(91, 242, 220,'+(.36*visibility)+')');
    gradient.addColorStop(1,'rgba(119, 204, 255,'+(.27*visibility)+')');
    canvasContext.strokeStyle=gradient;
    canvasContext.shadowColor='rgba(78, 233, 218, 0.4)';
    canvasContext.shadowBlur=7;
    canvasContext.setLineDash([]);
    canvasContext.beginPath();
    canvasContext.moveTo(a.x,a.y);
    canvasContext.lineTo(b.x,b.y);
    canvasContext.stroke();
    canvasContext.strokeStyle='rgba(190, 255, 249,'+(.5*visibility)+')';
    canvasContext.lineWidth=1;
    canvasContext.setLineDash([2,8]);
    canvasContext.lineDashOffset=-(context.elapsed*16)%10;
    canvasContext.shadowBlur=4;
    canvasContext.beginPath();
    canvasContext.moveTo(a.x,a.y);
    canvasContext.lineTo(b.x,b.y);
    canvasContext.stroke();
   });
   canvasContext.restore();
  }
  if(!preference.matches)orbitFrame=requestAnimationFrame(drawOrbit);
 }
 function bindOrbit(visual,nodes){
  stopOrbit();
  if(!visual||!nodes.length)return;
  const context=orbitContext={visual,nodes:nodes.map(element=>({element,plane:Number(element.dataset.orbitPlane)||0,phase:Number(element.dataset.orbitPhase)||0,radius:Number(element.dataset.orbitRadius)||.405,speed:Number(element.dataset.orbitSpeed)||.1})),elapsed:0,last:performance.now(),visible:!('IntersectionObserver'in window),yaw:0,pitch:0,hoverYaw:0,hoverPitch:0,dragging:false,lastX:0,lastY:0};
  context.connectionCanvas=visual.querySelector('[data-system-connections]');
  try{context.connectionContext=context.connectionCanvas?.getContext('2d',{alpha:true})||null;}catch{context.connectionContext=null;}
  visual.classList.remove('is-dragging');
  visual.addEventListener('pointerdown',event=>{
   if(event.target.closest('[data-orbit-node]')||(event.pointerType==='mouse'&&event.button!==0))return;
   context.dragging=true;context.lastX=event.clientX;context.lastY=event.clientY;visual.classList.add('is-dragging');
   try{visual.setPointerCapture(event.pointerId);}catch{/* Continue without pointer capture if unsupported. */}
   event.preventDefault();
  });
  visual.addEventListener('pointermove',event=>{
   const bounds=visual.getBoundingClientRect();
   if(context.dragging){
    const dx=event.clientX-context.lastX,dy=event.clientY-context.lastY;context.lastX=event.clientX;context.lastY=event.clientY;
    context.yaw=(context.yaw+dx*Math.PI*2/Math.max(1,bounds.width))%(Math.PI*2);
    context.pitch=Math.max(-.78,Math.min(.78,context.pitch+dy*Math.PI/Math.max(1,bounds.height)));
    context.hoverYaw=0;context.hoverPitch=0;scheduleOrbit();
   }else if(event.pointerType==='mouse'){
    context.hoverYaw=((event.clientX-bounds.left)/Math.max(1,bounds.width)-.5)*.28;
    context.hoverPitch=(.5-(event.clientY-bounds.top)/Math.max(1,bounds.height))*.22;scheduleOrbit();
   }
  },{passive:true});
  const endDrag=event=>{
   context.dragging=false;visual.classList.remove('is-dragging');
   if(event?.pointerId!==undefined){try{if(visual.hasPointerCapture(event.pointerId))visual.releasePointerCapture(event.pointerId);}catch{/* Pointer capture may already be released. */}}
  };
  visual.addEventListener('pointerup',endDrag);visual.addEventListener('pointercancel',endDrag);visual.addEventListener('lostpointercapture',()=>{context.dragging=false;visual.classList.remove('is-dragging');});
  visual.addEventListener('pointerleave',event=>{if(event.pointerType==='mouse'&&!context.dragging){context.hoverYaw=0;context.hoverPitch=0;scheduleOrbit();}});
  if('IntersectionObserver'in window){orbitObserver=new IntersectionObserver(entries=>{const entry=entries[0];if(!entry)return;context.visible=entry.isIntersecting;if(context.visible){context.last=performance.now();scheduleOrbit();}else if(orbitFrame){cancelAnimationFrame(orbitFrame);orbitFrame=0;}},{threshold:.08});orbitObserver.observe(visual);}
  scheduleOrbit();
 }
 function refresh(root){
  resetHero();stages=[...root.querySelectorAll('.project-stage')];hero=root.querySelector('.hero-art');heroRegion=root.querySelector('.hero');
  const visual=root.querySelector('[data-system-visual]');
  const nodes=[...visual?.querySelectorAll('[data-system-node]')||[]];
  const detail=root.querySelector('[data-system-detail]');
  const detailLayer=detail?.querySelector('[data-system-detail-layer]');
  const detailTitle=detail?.querySelector('[data-system-detail-title]');
  const detailTags=detail?.querySelector('[data-system-detail-tags]');
  const detailCopy=detail?.querySelector('[data-system-detail-copy]');
  nodes.forEach(node=>node.addEventListener('click',()=>{
   nodes.forEach(item=>item.setAttribute('aria-pressed',String(item===node)));
   if(detailLayer)detailLayer.textContent=node.dataset.layer||'';
   if(detailTitle)detailTitle.textContent=node.getAttribute('aria-label')||'';
   if(detailCopy)detailCopy.textContent=node.dataset.detail||'';
   if(detailTags){detailTags.replaceChildren(...(node.dataset.stack||'').split('|').filter(Boolean).map(label=>{const tag=document.createElement('span');tag.className='system-detail-tag';tag.textContent=label;return tag;}));}
   if(detail){detail.dataset.state='selected';detail.classList.add('is-open');}
  }));
  bindOrbit(visual,nodes);
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
 document.addEventListener('visibilitychange',()=>{if(document.hidden){if(orbitFrame)cancelAnimationFrame(orbitFrame);orbitFrame=0;}else{if(orbitContext)orbitContext.last=performance.now();scheduleOrbit();schedule();}});
 preference.addEventListener?.('change',()=>{if(preference.matches){cancel();if(frame)cancelAnimationFrame(frame);frame=0;stages.forEach(stage=>stage.style.removeProperty('--scroll-lift'));resetHero();}else schedule();});
 window.PortfolioMotion={transition,projectTransition,cancel,refresh};
})();

