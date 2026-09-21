/* Load photographs near the viewport, after the opening has finished. */
(() => {
 'use strict';
 const load = img => {
  if(!img?.dataset.src)return;
  img.decoding='async';
  if(img.dataset.srcset){img.srcset=img.dataset.srcset;delete img.dataset.srcset;}
  img.src=img.dataset.src;delete img.dataset.src;
 };
 const loadWithin = container => container?.querySelectorAll('img[data-src]').forEach(load);
 window.KweMedia={loadWithin};
 const start = () => {
  if(document.documentElement.classList.contains('kwe-intro-pending')||document.querySelector('.kwe-aperture'))return;
  if(!('IntersectionObserver' in window)){document.querySelectorAll('img[data-src]').forEach(load);return;}
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
   if(entry.isIntersecting&&!entry.target.closest('[inert],[hidden],[aria-hidden="true"]')){
    load(entry.target);observer.unobserve(entry.target);
   }
  }),{rootMargin:'250px 0px'});
  document.querySelectorAll('img[data-src]').forEach(img=>observer.observe(img));
  // JS selects the first catalog panel before this deferred module runs.
  document.querySelectorAll('.scroll-video.active').forEach(loadWithin);
 };
 window.addEventListener('kwe:intro-finished',start,{once:true});
 start();
})();
