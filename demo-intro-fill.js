(() => {
 'use strict';
 const duration=5600, reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const outline=document.querySelector('.outline'), liquid=document.querySelector('.liquid');
 const surfaces=document.querySelectorAll('.surface'), finish=document.querySelector('.finish');
 const word=document.querySelector('.word'), progress=document.querySelector('#progress');
 const pause=document.querySelector('#pause'), time=document.querySelector('#time');
 let elapsed=0,last=0,playing=false,request;
 const clamp=x=>Math.max(0,Math.min(1,x));
 const ease=x=>x*x*(3-2*x);
 function render(ms){
  const draw=ease(clamp(ms/1500)), fill=ease(clamp((ms-900)/3500)), settle=ease(clamp((ms-4200)/900));
  outline.style.strokeDasharray='1100';outline.style.strokeDashoffset=1100*(1-draw);
  outline.style.opacity=.35+.65*draw;
  const level=390-fill*370, amplitude=17*Math.sin(fill*Math.PI)*(1-settle);
  let path='';
  for(let x=-50;x<=1450;x+=15){
   const y=level+Math.sin(x*.011-ms*.0017)*amplitude+Math.sin(x*.022+ms*.001)*amplitude*.22+(x-700)*.055*Math.sin(fill*Math.PI);
   path+=(x===-50?'M':'L')+x+' '+y.toFixed(2)+' ';
  }
  liquid.setAttribute('d',path+'L1450 510L-50 510Z');
  surfaces.forEach(surface=>{surface.setAttribute('d',path);surface.style.opacity=1-settle;});
  finish.style.opacity=settle;outline.style.opacity=(.35+.65*draw)*(1-settle);
  word.style.transformOrigin='700px 250px';word.style.transform='scale('+(0.975+.025*ease(clamp(ms/4600)))+')';
  progress.value=String(Math.round(ms/duration*1000));time.textContent=(ms/1000).toFixed(1)+' / 5.6';
 }
 function frame(now){
  if(!playing)return;
  elapsed=Math.min(duration,elapsed+Math.min(now-last,50));last=now;render(elapsed);
  if(elapsed<duration)request=requestAnimationFrame(frame);else{playing=false;pause.textContent='Play';}
 }
 function play(){if(playing)return;playing=true;last=performance.now();pause.textContent='Pause';request=requestAnimationFrame(frame);}
 function stop(){playing=false;cancelAnimationFrame(request);pause.textContent='Play';}
 pause.addEventListener('click',()=>{if(playing)stop();else{if(elapsed>=duration)elapsed=0;play();}});
 document.querySelector('#replay').addEventListener('click',()=>{stop();elapsed=0;render(0);play();});
 progress.addEventListener('input',()=>{stop();elapsed=Number(progress.value)/1000*duration;render(elapsed);});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 reduced.addEventListener('change',event=>{if(event.matches){stop();elapsed=duration;render(elapsed);}});
 document.fonts.ready.then(()=>{if(reduced.matches){elapsed=duration;render(elapsed);pause.textContent='Play';}else{render(0);play();}});
})();