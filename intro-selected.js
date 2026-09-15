/* One-screen handoff: real footage inside the title rises into the music services. */
(() => {
 'use strict';
 const root=document.documentElement;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const eligible=!reduced.matches&&!location.hash&&scrollY<2&&!document.hidden;
 if(!eligible){root.classList.add('mock-settled');return;}
 root.classList.add('kwe-intro-pending');
 let video,hold,deadline,cleanup,maskFrame=0,resizeObserver,finished=false,holdStarted=false;
 const inputs=['hashchange','pagehide'];
 const scrollKeys=new Set(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' ']);
 let inertElements=[];
 function blockScroll(event){if(event.ctrlKey||(event.touches&&event.touches.length>1))return;if(!finished&&(event.type!=='keydown'||scrollKeys.has(event.key)))event.preventDefault();}
 window.addEventListener('wheel',blockScroll,{capture:true,passive:false});
 window.addEventListener('touchmove',blockScroll,{capture:true,passive:false});
 window.addEventListener('keydown',blockScroll,true);
 function finish(event) {
  if(finished)return;
  finished=true;clearTimeout(hold);clearTimeout(deadline);clearTimeout(cleanup);cancelAnimationFrame(maskFrame);
  root.classList.remove('kwe-intro-pending','kwe-intro-exiting');root.classList.add('mock-settled');
  root.dataset.introPhase=event?.type||'complete';
  const listen=document.getElementById('listen');if(listen)listen.inert=false;
  inertElements.forEach(([element,wasInert])=>element.inert=wasInert);inertElements=[];
  if(!location.hash&&event?.type!=='pagehide')window.scrollTo({top:0,left:0,behavior:'instant'});
  video?.pause();resizeObserver?.disconnect();
  window.removeEventListener('wheel',blockScroll,true);window.removeEventListener('touchmove',blockScroll,true);window.removeEventListener('keydown',blockScroll,true);
  inputs.forEach(type=>window.removeEventListener(type,finish,true));
  document.removeEventListener('visibilitychange',hide);reduced.removeEventListener('change',finish);
 }
 function hide(){if(document.hidden)finish();}
 function beginHold() {
  if(finished||holdStarted)return;
  holdStarted=true;clearTimeout(deadline);root.dataset.introPhase='holding';
  hold=setTimeout(()=>{
   if(finished)return;
   root.dataset.introPhase='rising';root.classList.add('kwe-intro-exiting');
   cleanup=setTimeout(()=>finish(),1900);
  },3000);
 }
 // Fail open even if fonts, playback or a later script never become ready.
 deadline=setTimeout(beginHold,2500);
 inputs.forEach(type=>window.addEventListener(type,finish,{capture:true,passive:true}));
 document.addEventListener('visibilitychange',hide);reduced.addEventListener('change',finish);
 async function start() {
  const heading=document.querySelector('.wordmark-stage h1');
  const listen=document.getElementById('listen');
  try {
   if(!heading||matchMedia('(forced-colors: active)').matches||(!CSS.supports('mask-image','url("")')&&!CSS.supports('-webkit-mask-image','url("")'))){finish();return;}
   if(finished)return;
   listen.inert=true;
   inertElements=[...document.querySelectorAll('main > :not(.hero),footer')].map(element=>[element,element.inert]);
   inertElements.forEach(([element])=>element.inert=true);
   await document.fonts.ready;
   if(finished||root.classList.contains('kwe-intro-exiting'))return;
   video=document.createElement('video');video.className='kwe-wordmark-video';
   video.muted=true;video.defaultMuted=true;video.playsInline=true;
   video.setAttribute('aria-hidden','true');video.setAttribute('muted','');video.setAttribute('playsinline','');
   video.poster='assets/july20-intro.jpg';video.preload='auto';video.src='assets/july20-intro.mp4';
   function mask() {
    maskFrame=0;
    const style=getComputedStyle(heading);
    const width=heading.clientWidth,height=heading.clientHeight;
    const canvas=document.createElement('canvas');canvas.width=Math.ceil(width*2);canvas.height=Math.ceil(height*2);
    const ctx=canvas.getContext('2d');ctx.scale(2,2);ctx.font=`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    ctx.letterSpacing=style.letterSpacing;ctx.textAlign='center';ctx.fillStyle='#fff';
    const metrics=ctx.measureText('SAINT KWE');
    ctx.fillText('SAINT KWE',width/2,(height+metrics.actualBoundingBoxAscent-metrics.actualBoundingBoxDescent)/2);
    const image=`url(${canvas.toDataURL()})`;video.style.maskImage=image;video.style.webkitMaskImage=image;
   }
   mask();heading.append(video);heading.classList.add('has-wordmark-video');
   video.addEventListener('playing',beginHold,{once:true});video.addEventListener('error',beginHold,{once:true});
   video.play().catch(beginHold);
   const control=document.querySelector('.wordmark-motion');if(control)control.hidden=true;
   resizeObserver=new ResizeObserver(()=>{if(!maskFrame&&!finished)maskFrame=requestAnimationFrame(mask);});resizeObserver.observe(heading);
  }catch{finish();}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
