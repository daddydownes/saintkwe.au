(() => {
 'use strict';
 const root=document.documentElement,key='kwe-route-transition';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let busy=false,cleanup,departure,pendingHref;
 let lockedBody,previousBodyInert,previousFocus;
 function reset(){
  clearTimeout(cleanup);clearTimeout(departure);departure=null;pendingHref=null;
  root.classList.remove('kwe-route','kwe-route-cover','kwe-route-reveal');delete root.dataset.kweDirection;busy=false;
  if(lockedBody){
   lockedBody.inert=previousBodyInert;
   if(!previousBodyInert&&previousFocus?.isConnected&&document.activeElement===lockedBody)previousFocus.focus?.({preventScroll:true});
   lockedBody=null;previousFocus=null;
  }
 }
 function mark(direction){root.dataset.kweDirection=direction;root.classList.add('kwe-route');}
 // Set the arrival cover before the new document paints. Never cover a direct visit.
 try{
  const saved=JSON.parse(sessionStorage.getItem(key)||'null');sessionStorage.removeItem(key);
  if(saved&&saved.target===location.pathname+location.search+location.hash&&Date.now()-saved.time<15000&&!reduced.matches){
   busy=true;mark(saved.direction);
   const reveal=()=>{clearTimeout(cleanup);root.classList.add('kwe-route-reveal');cleanup=setTimeout(reset,660);};
   cleanup=setTimeout(reset,4000);
   if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',reveal,{once:true});else reveal();
  }
 }catch{/* Storage may be unavailable in an embedded browser; normal navigation still works. */}
 function navigate(href){
  const target=new URL(href,location.href);
  if(target.origin!==location.origin){location.assign(target.href);return;}
  // An arrival reveal must not swallow a quick Exit/Enter click. Only ignore
  // repeated clicks while an outgoing navigation is already scheduled.
  if(busy){if(pendingHref)return;reset();}
  if(reduced.matches){location.assign(target.href);return;}
  busy=true;
  // The departing page must not accept keyboard navigation behind the shutter.
  // Arrival remains interactive so an immediate Exit is never swallowed.
  lockedBody=document.body;previousBodyInert=lockedBody.inert;previousFocus=document.activeElement;lockedBody.inert=true;
  const direction=target.pathname.endsWith('/flight.html')?'enter':'exit';
  mark(direction);root.classList.add('kwe-route-cover');
  if(direction==='exit')document.querySelectorAll('video,audio').forEach(media=>media.pause());
  pendingHref=target.href;
  departure=setTimeout(()=>{
   departure=null;pendingHref=null;
   try{sessionStorage.setItem(key,JSON.stringify({target:target.pathname+target.search+target.hash,direction,time:Date.now()}));}catch{}
   location.assign(target.href);
   // Fail open if navigation is cancelled; also clear the cover after bfcache restoration.
   cleanup=setTimeout(reset,4000);
  },620);
 }
 window.KweTransitions={navigate};
 document.addEventListener('click',event=>{
  if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const link=event.target.closest('a');if(!link||link.hasAttribute('download')||(link.target&&link.target!=='_self'))return;
  const target=new URL(link.href,location.href);if(target.origin!==location.origin)return;
  const entering=link.classList.contains('flight-launch');
  const exiting=location.pathname.endsWith('/flight.html')&&target.pathname.endsWith('/index.html');
  if(!entering&&!exiting)return;
  event.preventDefault();navigate(target.href);
 });
 window.addEventListener('pageshow',event=>{if(event.persisted)reset();});
 window.addEventListener('pagehide',()=>{clearTimeout(departure);clearTimeout(cleanup);});
 reduced.addEventListener('change',()=>{if(reduced.matches){const href=pendingHref;reset();if(href)location.assign(href);}});
})();
