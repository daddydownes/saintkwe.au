/* Warm homepage photographs while the downloaded opening plays. */
(() => {
 'use strict';
 const load = (img, priority = 'auto') => {
  if(!img?.dataset.src)return;
  img.decoding='async';
  img.loading='eager';
  img.fetchPriority=priority;
  if(img.dataset.srcset){img.srcset=img.dataset.srcset;delete img.dataset.srcset;}
  img.src=img.dataset.src;delete img.dataset.src;
 };
 const loadWithin = container => container?.querySelectorAll('img[data-src]').forEach(img=>load(img));
 window.KweMedia={loadWithin};
 let started=false;
 const start = () => {
  if(started)return;
  started=true;
  const images=[...document.querySelectorAll('img[data-src]')];
  const connection=navigator.connection;
  const conserve=connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '');
  const homepage=!!document.querySelector('.wordmark-stage');
  // The opening owns the network until its file is downloaded. Once playback
  // begins, these modest stills can download during the reveal, before scrolling.
  if(homepage&&!conserve){
   images.forEach(img=>load(img,img.getBoundingClientRect().top<innerHeight*2?'auto':'low'));
   return;
  }
  if(!('IntersectionObserver' in window)){images.forEach(img=>load(img));return;}
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
   if(entry.isIntersecting&&!entry.target.closest('[hidden],[aria-hidden="true"]')){
    load(entry.target);observer.unobserve(entry.target);
   }
  }),{rootMargin:conserve?'600px 0px':'1500px 0px'});
  images.forEach(img=>observer.observe(img));
  document.querySelectorAll('.scroll-video.active').forEach(loadWithin);
 };
 window.addEventListener('kwe:intro-ready',start,{once:true});
 window.addEventListener('kwe:intro-finished',start,{once:true});
 if(!document.documentElement.classList.contains('kwe-intro-pending')&&!document.querySelector('.kwe-aperture'))start();
})();
