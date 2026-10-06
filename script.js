(() => {
 'use strict';
 const header = document.querySelector('.site-header');
 const menu = document.querySelector('.menu-toggle');
 const nav = document.querySelector('.nav-links');
 const mobile = matchMedia('(max-width: 600px)');
 const reduced = matchMedia('(prefers-reduced-motion: reduce)');
 const links = [...nav.querySelectorAll('a')].filter(link => document.querySelector(link.getAttribute('href')));
 const sections = [...document.querySelectorAll('main > section[id]')];
 let menuAnimation;
 function setMenu(open, restoreFocus = false) {
  const wasOpen = menu.getAttribute('aria-expanded') === 'true';
  const menuStyle = getComputedStyle(nav);
  const startOpacity = menuStyle.display === 'none' ? 0 : menuStyle.opacity;
  const startTranslate = menuStyle.display === 'none' ? '0 -4px' : menuStyle.translate;
  menuAnimation?.cancel();
  menuAnimation = undefined;
  menu.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('open', open);
  nav.inert = mobile.matches && !open;
  if (mobile.matches && wasOpen !== open && !reduced.matches) {
   nav.classList.add('menu-animating');
   const animation = nav.animate([{opacity:startOpacity,translate:startTranslate},{opacity:open?1:0,translate:open?'0 0':'0 -4px'}], {duration:180,easing:'ease-out'});
   menuAnimation = animation;
   animation.finished.then(() => { if(menuAnimation === animation) { nav.classList.remove('menu-animating'); menuAnimation=undefined; scheduleNavigation(); } }).catch(()=>{});
  } else nav.classList.remove('menu-animating');
  if (restoreFocus) menu.focus();
 }
 menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
 document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') setMenu(false, true);
 });
 document.addEventListener('click', event => {
  if (!header.contains(event.target)) setMenu(false);
 });
 header.addEventListener('focusout', () => {
  requestAnimationFrame(() => {
   if (!header.contains(document.activeElement)) setMenu(false);
  });
 });
 mobile.addEventListener('change', () => {
  const focusedLink = nav.contains(document.activeElement);
  setMenu(false, mobile.matches && focusedLink);
 });
 document.documentElement.classList.add('menu-ready');
 nav.inert = mobile.matches;
 // Move focus out of the menu before its links become hidden.
 document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', () => {
   const target = document.querySelector(link.getAttribute('href'));
   if (!target) return;
   setMenu(false);
   target.setAttribute('tabindex', '-1');
   target.focus({ preventScroll: true });
  });
 });
 let scrollFrame = 0;
 function updateNavigation() {
  scrollFrame = 0;
  header.classList.toggle('scrolled', scrollY > 12);
  const marker = header.getBoundingClientRect().height + 110;
  let current = sections[0];
  for (const section of sections) {
   if (section.getBoundingClientRect().top <= marker) current = section;
  }
  if (scrollY + innerHeight >= document.documentElement.scrollHeight - 2) current = sections.at(-1);
  const groups = { identity: 'about', tools: 'skills' };
  const id = groups[current.id] || current.id;
  links.forEach(link => {
   if (link.hash === `#${id}`) link.setAttribute('aria-current', 'location');
   else link.removeAttribute('aria-current');
  });
 }
 function scheduleNavigation() {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateNavigation);
 }
 addEventListener('scroll', scheduleNavigation, { passive: true });
 addEventListener('resize', scheduleNavigation);
 updateNavigation();
 const aboutButton = document.querySelector('.about-toggle');
 const aboutDetails = document.getElementById('about-details');
 const aboutInner = aboutDetails.querySelector('.about-details-inner');
 let aboutOpen = false;
 let aboutAnimation;
 let aboutRevision = 0;
 function finishAbout(open) {
  aboutDetails.hidden = !open;
  aboutDetails.style.removeProperty('height');
  scheduleNavigation();
 }
 function setAbout(open, animate = true) {
  const revision = ++aboutRevision;
  const startHeight = aboutDetails.hidden ? 0 : aboutDetails.getBoundingClientRect().height;
  const startStyle = getComputedStyle(aboutDetails);
  const startOpacity = aboutDetails.hidden ? '0' : startStyle.opacity;
  const startTransform = aboutDetails.hidden ? 'translateY(-6px)' : startStyle.transform;
  aboutAnimation?.cancel();
  aboutAnimation = undefined;
  aboutOpen = open;
  aboutButton.setAttribute('aria-expanded', String(open));
  aboutButton.textContent = open ? 'SHOW LESS ↑' : 'LEARN MORE ABOUT ME ↓';
  aboutDetails.inert = !open;
  aboutDetails.setAttribute('aria-hidden', String(!open));
  if (!animate || reduced.matches) {
   finishAbout(open);
   return;
  }
  aboutDetails.hidden = false;
  const endHeight = open ? aboutInner.getBoundingClientRect().height : 0;
  aboutAnimation = aboutDetails.animate([
   { height: `${startHeight}px`, opacity: startOpacity, transform: startTransform },
   { height: `${endHeight}px`, opacity: open ? 1 : 0, transform: open ? 'translateY(0)' : 'translateY(-6px)' }
  ], { duration: 360, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'both' });
  aboutAnimation.finished.then(() => {
   if (revision !== aboutRevision) return;
   aboutAnimation.cancel();
   aboutAnimation = undefined;
   finishAbout(open);
  }).catch(() => {}); // A newer toggle or resize replaces the cancelled animation.
 }
 aboutButton.hidden = false;
 setAbout(false, false);
 aboutButton.addEventListener('click', () => setAbout(!aboutOpen));
 let aboutInnerHeight = 0;
 new ResizeObserver(() => {
  const height = aboutInner.getBoundingClientRect().height;
  if (Math.abs(height - aboutInnerHeight) > 1 && aboutAnimation) setAbout(aboutOpen);
  aboutInnerHeight = height;
 }).observe(aboutInner);
 reduced.addEventListener('change', () => {
  if (reduced.matches) setAbout(aboutOpen, false);
 });
 const cards = [...document.querySelectorAll('.project-card')];
 const filters = [...document.querySelectorAll('.project-filter button')];
 const status = document.createElement('p');
 status.className = 'project-status';
 status.setAttribute('role', 'status');
 status.setAttribute('aria-live', 'polite');
 document.querySelector('.projects-grid').before(status);
 status.textContent = `${cards.length} projects shown`;
 filters.forEach(button => {
  button.addEventListener('click', () => {
   filters.forEach(filter => {
    const selected = filter === button;
    filter.classList.toggle('active', selected);
    filter.setAttribute('aria-pressed', String(selected));
   });
   let count = 0;
   cards.forEach(card => {
    // Immediate visibility prevents stale filter timers.
    card.hidden = button.dataset.filter !== 'all' && !card.dataset.category.split(' ').includes(button.dataset.filter);
    if (!card.hidden) { count++; card.classList.add('visible'); card.style.setProperty('--delay','0ms'); seen.add(card); observer?.unobserve(card); }
   });
   status.textContent = `${count} ${count === 1 ? 'project' : 'projects'} shown`;
   scheduleNavigation();
  });
 });
 document.querySelectorAll('.expand').forEach(button => {
  const details = document.getElementById(button.getAttribute('aria-controls'));
  const title = button.closest('.project-card').querySelector('h3').textContent.trim();
  let animation;
  let revision = 0;
  function expand(open) {
   const current = ++revision;
   const height = details.hidden ? 0 : details.getBoundingClientRect().height;
   const opacity = details.hidden ? 0 : getComputedStyle(details).opacity;
   animation?.cancel();
   animation = undefined;
   details.inert = !open;
   details.setAttribute('aria-hidden', String(!open));
   if (!reduced.matches && (open || height > 0)) {
    details.hidden = false;
    const targetHeight = open ? details.getBoundingClientRect().height : 0;
    animation = details.animate([
     {height:`${height}px`,opacity,paddingTop:height ? '16px' : '0px',paddingBottom:height ? '20px' : '0px',transform:height ? 'none' : 'translateY(-4px)'},
     {height:`${targetHeight}px`,opacity:open ? 1 : 0,paddingTop:open ? '16px' : '0px',paddingBottom:open ? '20px' : '0px',transform:open ? 'none' : 'translateY(-4px)'}
    ],{duration:300,easing:'cubic-bezier(.2,.7,.2,1)',fill:'both'});
    animation.finished.then(()=>{
     if(current !== revision) return;
     animation.cancel(); animation=undefined; details.hidden=!open; scheduleNavigation();
    }).catch(()=>{});
   } else {
    details.hidden = !open;
   }
   button.setAttribute('aria-expanded', String(open));
   button.setAttribute('aria-label', `${open ? 'Collapse' : 'Expand'} details: ${title}`);
   button.textContent = open ? 'COLLAPSE DETAILS ↑' : 'EXPAND DETAILS →';
  }
  expand(false);
  button.addEventListener('click', () => {
   expand(button.getAttribute('aria-expanded') !== 'true');
   scheduleNavigation();
  });
  addEventListener('resize',()=>{
   if(animation) expand(button.getAttribute('aria-expanded')==='true');
  });
 });
 const heroItems = [...document.querySelectorAll('.hero-left, .hero-right')];
 const reveals = [...document.querySelectorAll('.section-header > *, .about-card, .identity-card, .arsenal-card, .skill, .project-card, .timeline-card, .tool-group, .technology-chips li, .contact-terminal, .contact-row, .channel-config')];
 const seen = new WeakSet();
 let observer;
 function setupMotion() {
  observer?.disconnect();
  if (reduced.matches || !('IntersectionObserver' in window)) {
   document.documentElement.classList.remove('motion-ready');
   [...reveals,...heroItems].forEach(element => { element.getAnimations().forEach(a=>a.cancel()); element.classList.add('visible'); seen.add(element); });
   setMenu(menu.getAttribute('aria-expanded') === 'true');
   document.querySelectorAll('.expand').forEach(button=>{ const e=document.getElementById(button.getAttribute('aria-controls'));e.getAnimations().forEach(a=>a.cancel());e.hidden=button.getAttribute('aria-expanded')!=='true'; });
   return;
  }
  observer = new IntersectionObserver(entries => {
   const batches = new Map();
   entries.forEach(entry => {
    if(entry.target === hero) {
     heroVisible=entry.isIntersecting;
     syncHero();
     return;
    }
    if (!entry.isIntersecting) return;
    const element=entry.target;
    const count=batches.get(element.parentElement)||0;
    batches.set(element.parentElement,count+1);
    const base=element.matches('.section-header > *')?0:element.matches('.channel-config')?300:element.matches('.contact-row')?180:120;
    element.style.setProperty('--delay',`${mobile.matches?Math.min(count*20,60):base+Math.min(count*60,240)}ms`);
    element.classList.add('visible');
    seen.add(element);
    observer.unobserve(element);
   });
  }, { threshold: .08 });
  reveals.forEach(element => {
   element.classList.add('reveal');
   if(element.matches('.section-header > p'))element.classList.add('technical-reveal');
   if(!seen.has(element))observer.observe(element);
  });
  document.documentElement.classList.add('motion-ready');
  observer.observe(hero);
 }
 // Background network: CSS-pixel physics, capped raster resolution, no layout reads per frame.
 const tablet = matchMedia('(max-width: 1100px)');
 const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
 const canvas = document.querySelector('.particle-network');
 const context = canvas.getContext('2d');
 const hero = document.querySelector('.hero');
 const portrait = document.querySelector('.hero-right');
 const tilt = document.querySelector('.portrait-tilt');
 const output = document.querySelector('.typewriter-output');
 const boot = document.querySelector('.boot-screen');
 const phrases = ['Computer Engineering Student','Embedded Systems','Electronics & PCB Design','Full-Stack Development','Hardware-Software Integration'];
 let points=[], width=0, height=0, frame=0, lastTime=0, lastPaint=0, resizeFrame=0;
 let heroVisible=true, heroStarted=false, typingTimer=0, phrase=0, characters=0, deleting=false;
 let pointer={x:0,y:0,active:false,strength:0};
 let tiltFrame=0, tiltTime=0, targetX=0, targetY=0, currentX=0, currentY=0, portraitBounds;
 const bootTimers=new Set();
 let bootActive=false, bootExiting=false;
 const bootAnimations=[];
 function later(callback,delay) {
  const id=setTimeout(()=>{bootTimers.delete(id);callback();},delay);
  bootTimers.add(id); return id;
 }
 function particleCount() { return mobile.matches ? 24 : tablet.matches ? 40 : innerWidth < 1400 ? 64 : 80; }
 function resizeNetwork() {
  resizeFrame=0;
  width=innerWidth; height=innerHeight;
  const dpr=Math.min(devicePixelRatio || 1,1.5);
  canvas.width=Math.round(width*dpr); canvas.height=Math.round(height*dpr);
  context?.setTransform(dpr,0,0,dpr,0,0);
  points=Array.from({length:particleCount()},()=>{
   const angle=Math.random()*Math.PI*2, speed=3+Math.random()*6;
   return {x:Math.random()*width,y:Math.random()*height,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,baseX:Math.cos(angle)*speed,baseY:Math.sin(angle)*speed,r:.8+Math.random(),opacity:.18+Math.random()*.27,crimson:Math.random()<.35};
  });
  canvas.dataset.particles=String(points.length);
  canvas.dataset.dpr=String(dpr);
  if(context && !reduced.matches) drawNetwork();
  portraitBounds=undefined;
  settleTilt();
 }
 function drawNetwork() {
  context.clearRect(0,0,width,height);
  let connections=0;
  for(let i=0;i<points.length;i++) {
   const p=points[i];
   for(let j=i+1;j<points.length;j++) {
    const q=points[j],distance=Math.hypot(p.x-q.x,p.y-q.y);
    if(distance>=130) continue;
    const nearby=pointer.strength*Math.max(0,1-Math.min(Math.hypot(p.x-pointer.x,p.y-pointer.y),Math.hypot(q.x-pointer.x,q.y-pointer.y))/180);
    context.strokeStyle=`rgba(255,48,56,${(.1+.08*nearby)*(1-distance/130)})`;
    context.lineWidth=.5;context.beginPath();context.moveTo(p.x,p.y);context.lineTo(q.x,q.y);context.stroke();connections++;
   }
   context.fillStyle=`rgba(${p.crimson?'143,20,36':'255,48,56'},${p.opacity})`;
   context.beginPath();context.arc(p.x,p.y,p.r,0,Math.PI*2);context.fill();
  }
  canvas.dataset.connections=String(connections);
 }
 function tickNetwork(time) {
  frame=0;
  if(document.hidden || reduced.matches || !context) return;
  const interval=tablet.matches ? 1000/30 : 1000/60;
  if(time-lastPaint>=interval-1) {
   const dt=lastTime ? Math.min((time-lastTime)/1000,.033) : 0;
   lastTime=time; lastPaint=time;
   const attraction=finePointer.matches && !mobile.matches;
   const target=pointer.active && attraction ? 1 : 0;
   pointer.strength+=(target-pointer.strength)*(1-Math.exp(-dt/.3));
   for(const p of points) {
    const damp=1-Math.exp(-dt/.8);
    p.vx+=(p.baseX-p.vx)*damp;p.vy+=(p.baseY-p.vy)*damp;
    const dx=pointer.x-p.x,dy=pointer.y-p.y,d=Math.hypot(dx,dy);
    if(attraction && pointer.strength>.001 && d>1 && d<180) {
     const force=6*(1-d/180)**2*pointer.strength*dt;
     p.vx+=dx/d*force;p.vy+=dy/d*force;
    }
    const speed=Math.hypot(p.vx,p.vy);
    if(speed>14) {p.vx*=14/speed;p.vy*=14/speed;}
    p.x=(p.x+p.vx*dt+width)%width;p.y=(p.y+p.vy*dt+height)%height;
   }
   drawNetwork();
  }
  frame=requestAnimationFrame(tickNetwork);
 }
 function syncNetwork() {
  cancelAnimationFrame(frame);frame=0;lastTime=0;lastPaint=0;
  const running=!document.hidden && !reduced.matches && Boolean(context);
  canvas.dataset.running=String(running);
  if(running) frame=requestAnimationFrame(tickNetwork);
 }
 addEventListener('pointermove',event=>{
  if(event.pointerType==='touch' || !finePointer.matches || mobile.matches || reduced.matches) return;
  pointer.x=event.clientX;pointer.y=event.clientY;pointer.active=true;
 },{passive:true});
 document.documentElement.addEventListener('pointerleave',()=>{pointer.active=false;});
 addEventListener('blur',()=>{pointer.active=false;});
 addEventListener('resize',()=>{if(!resizeFrame)resizeFrame=requestAnimationFrame(resizeNetwork);});
 function typeTick() {
  typingTimer=0;
  if(!heroStarted || !heroVisible || document.hidden || reduced.matches) return;
  const text=phrases[phrase];
  characters+=deleting ? -1 : 1;
  output.textContent=text.slice(0,characters);
  let delay=deleting ? 30 : 58;
  if(!deleting && characters===text.length) {deleting=true;delay=1400;}
  else if(deleting && characters===0) {deleting=false;phrase=(phrase+1)%phrases.length;delay=250;}
  typingTimer=setTimeout(typeTick,delay);
 }
 function syncHero() {
  const paused=document.hidden || !heroVisible;
  hero.classList.toggle('hero-paused',paused);
  clearTimeout(typingTimer);typingTimer=0;
  if(reduced.matches) {output.textContent=phrases[0];settleTilt();return;}
  if(!paused && heroStarted) typingTimer=setTimeout(typeTick,characters ? 250 : 58);
  if(paused) settleTilt();
 }
 function settleTilt() {
  cancelAnimationFrame(tiltFrame);tiltFrame=0;tiltTime=0;
  targetX=targetY=currentX=currentY=0;tilt.style.removeProperty('transform');
 }
 function tickTilt(time) {
  tiltFrame=0;
  if(reduced.matches || document.hidden || !heroVisible || tablet.matches || !finePointer.matches) {settleTilt();return;}
  const dt=tiltTime ? Math.min(time-tiltTime,33) : 16;tiltTime=time;
  const smoothing=1-Math.exp(-dt/120);
  currentX+=(targetX-currentX)*smoothing;currentY+=(targetY-currentY)*smoothing;
  tilt.style.transform=`rotateX(${currentX.toFixed(3)}deg) rotateY(${currentY.toFixed(3)}deg)`;
  if(Math.abs(currentX-targetX)+Math.abs(currentY-targetY)>.015) tiltFrame=requestAnimationFrame(tickTilt);
  else if(targetX===0 && targetY===0) settleTilt();
 }
 portrait.addEventListener('pointerenter',()=>{portraitBounds=portrait.getBoundingClientRect();});
 portrait.addEventListener('pointermove',event=>{
  if(event.pointerType==='touch' || reduced.matches || tablet.matches || !finePointer.matches || !heroVisible) return;
  // Recompute once after scrolling/resizing; the smoothing loop never reads layout.
  const bounds=portraitBounds || (portraitBounds=portrait.getBoundingClientRect());
  targetX=-Math.max(-1,Math.min(1,((event.clientY-bounds.top)/bounds.height)*2-1))*6;
  targetY=Math.max(-1,Math.min(1,((event.clientX-bounds.left)/bounds.width)*2-1))*6;
  if(!tiltFrame) {tiltTime=0;tiltFrame=requestAnimationFrame(tickTilt);}
 });
 portrait.addEventListener('pointerleave',()=>{targetX=targetY=0;if(!tiltFrame)tiltFrame=requestAnimationFrame(tickTilt);});
 function startHero(immediate=false) {
  document.documentElement.classList.remove('boot-preparing');
  heroItems.forEach(e=>e.style.removeProperty('opacity'));
  if(heroStarted) {
   if(immediate) heroItems.forEach(e=>e.getAnimations().forEach(a=>a.cancel()));
   return;
  }
  heroStarted=true;hero.classList.add('hero-started');
  if(!immediate && !reduced.matches) {
   const duration=mobile.matches ? 450 : tablet.matches ? 650 : 850;
   heroItems[0].animate([{opacity:0,translate:mobile.matches?'-14px 0':tablet.matches?'-26px 0':'-42px 0'},{opacity:1,translate:'0 0'}],{duration,easing:'cubic-bezier(.2,.7,.2,1)',fill:'backwards'});
   heroItems[1].animate([{opacity:0,scale:'.92'},{opacity:1,scale:'1'}],{duration:duration-150,delay:150,easing:'cubic-bezier(.2,.7,.2,1)',fill:'backwards'});
  }
  syncHero();
 }
 function removeBoot() {
  bootActive=false;boot.hidden=true;bootExiting=false;
  bootTimers.forEach(clearTimeout);bootTimers.clear();
  bootAnimations.forEach(a=>a.cancel());bootAnimations.length=0;
  document.removeEventListener('keydown',skipBoot);
  document.removeEventListener('focusin',focusBoot);
 }
 function exitBoot(immediate=false,skipped=false) {
  if(!bootActive) {if(immediate)startHero(true);return;}
  if(bootExiting && !immediate) return;
  bootExiting=true;
  if(skipped || immediate) {bootTimers.forEach(clearTimeout);bootTimers.clear();}
  startHero(immediate);
  if(immediate) {removeBoot();return;}
  const fade=boot.animate([{opacity:1},{opacity:0}],{duration:skipped?180:mobile.matches?500:tablet.matches?600:650,easing:'ease-out',fill:'forwards'});
  bootAnimations.push(fade);
  fade.finished.then(removeBoot).catch(()=>{});
 }
 function skipBoot(event) {
  if(!bootActive || !['Escape','Enter',' ','Spacebar'].includes(event.key))return;
  if(event.target===document.body || event.target===document.documentElement) event.preventDefault();
  exitBoot(false,true);
 }
 function focusBoot() {if(bootActive)exitBoot(true,true);}
 function bootReveal(element,delay) {
  const animation=element.animate([{opacity:0,translate:'0 -10px'},{opacity:1,translate:'0 0'}],{duration:170,delay,easing:'ease-out',fill:'backwards'});
  bootAnimations.push(animation);
 }
 function initializeBoot() {
  if(reduced.matches || scrollY>20 || location.hash && location.hash!=='#home') {startHero(true);return;}
  boot.hidden=false;bootActive=true;document.documentElement.classList.add('boot-preparing');
  const total=mobile.matches?1800:tablet.matches?2400:2700;
  const fade=mobile.matches?500:tablet.matches?600:650;
  const exitAt=total-fade;
  boot.dataset.duration=String(total);
  bootReveal(boot.querySelector('.boot-heading'),0);
  boot.querySelectorAll('.boot-lines p').forEach((line,i)=>bootReveal(line,120+i*95));
  bootReveal(boot.querySelector('.boot-ready'),mobile.matches?900:1400);
  bootReveal(boot.querySelector('.boot-access'),mobile.matches?1050:1600);
  bootReveal(boot.querySelector('.boot-welcome'),exitAt-100);
  const progress=boot.querySelector('.boot-progress span').animate([{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:mobile.matches?1200:tablet.matches?1750:2050,easing:'linear',fill:'forwards'});
  bootAnimations.push(progress);
  later(()=>{
   bootAnimations.push(boot.querySelector('.boot-lines').animate([{opacity:1},{opacity:.3}],{duration:300,fill:'forwards'}));
   bootAnimations.push(boot.animate([{backgroundColor:'#090607'},{backgroundColor:'rgba(9,6,7,.4)'}],{duration:400,fill:'forwards'}));
   document.documentElement.classList.remove('boot-preparing');
   // Background emerges before foreground entrance begins.
   for(const element of [canvas,hero.querySelector('.hero-circuits')]) element.animate([{opacity:0},{opacity:1}],{duration:400,fill:'backwards'});
   heroItems.forEach(e=>e.style.opacity='0');
  },exitAt-250);
  later(()=>{heroItems.forEach(e=>e.style.removeProperty('opacity'));exitBoot();},exitAt);
  document.addEventListener('keydown',skipBoot);
  document.addEventListener('focusin',focusBoot);
 }
 boot.addEventListener('click',()=>exitBoot(false,true));
 addEventListener('scroll',()=>{
  document.querySelector('.scroll-indicator').classList.toggle('scrolled',scrollY>40);
  portraitBounds=undefined;
 },{passive:true});
 document.addEventListener('visibilitychange',()=>{
  document.documentElement.classList.toggle('document-hidden',document.hidden);
  pointer.active=false;
  if(document.hidden && bootActive) exitBoot(true,true);
  syncNetwork();syncHero();
 });
 // The single section observer also maintains the hero visibility lifecycle.
 resizeNetwork();
 setupMotion();
 initializeBoot();
 syncNetwork();
 reduced.addEventListener('change',()=>{
  if(reduced.matches) {
   heroItems.forEach(e=>e.style.removeProperty('opacity'));
   [canvas,hero.querySelector('.hero-circuits')].forEach(e=>e.getAnimations().forEach(a=>a.cancel()));
   exitBoot(true,true);
   document.querySelectorAll('.project-details').forEach(e=>e.getAnimations().forEach(a=>a.cancel()));
  }
  setupMotion();syncNetwork();syncHero();
 });
 finePointer.addEventListener('change',()=>{pointer.active=false;settleTilt();});
})();
