(() => {
 const sound=document.getElementById('sound');
 if(!sound)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let cleanup;
 sound.addEventListener('click',()=>{
  clearTimeout(cleanup);sound.classList.remove('is-rippling');
  if(reduced.matches)return;
  // Restart just this decorative ripple, without touching audio or button labels.
  void sound.offsetWidth;
  sound.classList.add('is-rippling');
  cleanup=setTimeout(()=>sound.classList.remove('is-rippling'),520);
 });
 reduced.addEventListener('change',()=>{if(reduced.matches){clearTimeout(cleanup);sound.classList.remove('is-rippling');}});
})();
