(() => {
 'use strict';
 const $=id=>document.getElementById(id);
 const tracks=[['SUMMER AIN’T OVER','e_RMY3Msjro'],['WHO DEM BOYS','b9i6DAuP5qw'],['BABY BOY FREESTYLE','jFzVBUUswUA'],['BOBBY & WHITNEY','1eg_lb5T8kY'],['SPECIAL','hesCXfu5R5Y']];
 const query=matchMedia('(prefers-reduced-motion: reduce)');
 let reduced=query.matches,index=0,active=0,running=false,paused=false,inspecting=false,muted=false,transition=0,last=0,playing=false;
 const screen=$('screen'),memories=[...document.querySelectorAll('.memory')],videos=[document.createElement('video'),document.createElement('video')];
 const wrapper=$('player-wrap');wrapper.replaceChildren(...videos);wrapper.hidden=false;
 const camera=document.createElement('div');camera.className='flight-camera';wrapper.replaceChildren(camera);
 const panels=tracks.map(([name,id],i)=>{const panel=document.createElement('a');panel.className='flight-panel';panel.href='https://www.youtube.com/watch?v='+id;panel.target='_blank';panel.rel='noopener';panel.setAttribute('aria-label','Watch '+name+' on YouTube');panel.title='Watch full video on YouTube';panel.tabIndex=i===0?0:-1;panel.addEventListener('click',()=>pause(true));panel.style.transform=`translate3d(${i%2?260:-260}px,${i%3===1?65:0}px,${-i*2400}px)`;const poster=document.createElement('img');poster.src=id==='hesCXfu5R5Y'?'assets/special-court-cover.png':`assets/${id}-hd.jpg`;poster.alt='';panel.append(poster);camera.append(panel);return panel;});
 videos.forEach(v=>{v.preload='auto';v.playsInline=true;v.setAttribute('playsinline','');v.volume=.65;v.hidden=true;
  v.addEventListener('playing',()=>{if(v!==current())return;playing=true;screen.classList.remove('loading');$('enable-audio').hidden=true;$('media-status').textContent='Playing automatically · next song follows';});
  v.addEventListener('waiting',()=>{if(v!==current())return;playing=false;screen.classList.add('loading');$('media-status').textContent='Loading the preview…';});
  v.addEventListener('pause',()=>{if(v===current())playing=false;});
  v.addEventListener('ended',()=>{if(v!==current())return;if(inspecting){v.currentTime=0;play();}else next();});
  v.addEventListener('error',()=>{if(v!==current())return;playing=false;screen.classList.remove('loading');$('media-status').textContent='Preview unavailable. Retry below or tap the video to watch on YouTube.';$('enable-audio').hidden=false;$('enable-audio').textContent='Retry preview';});
 });
 function current(){return videos[active];}
 function prepare(v,i){if(i>=tracks.length)return;const src=`assets/previews/${tracks[i][1]}-hq.mp4`;if(v.dataset.source!==src){v.dataset.source=src;v.src=src;v.load();}}
 async function play(){const v=current();v.muted=muted;try{await v.play();}catch(e){if(v!==current()||!running||paused||e.name==='AbortError')return;playing=false;screen.classList.remove('loading');$('enable-audio').hidden=false;$('enable-audio').textContent='Play with sound';$('media-status').textContent='Tap once to start the music. Then the journey plays automatically.';}}
 function choose(i){videos.forEach(v=>{v.pause();v.hidden=true;});index=i;active=i%2;playing=false;transition=0;paused=false;inspecting=false;document.body.classList.remove('inspecting');document.body.classList.add('previewing');screen.classList.add('loading');
  panels.forEach((panel,n)=>panel.tabIndex=n===i?0:-1);const [name,id]=tracks[i];prepare(current(),i);panels[i].append(current());current().currentTime=0;current().hidden=false;prepare(videos[1-active],i+1);if(panels[i+1])panels[i+1].append(videos[1-active]);
  $('poster').src=id==='hesCXfu5R5Y'?'assets/special-court-cover.png':`assets/${id}-hd.jpg`;$('poster').alt=`${name} video artwork`;
  $('track-title').textContent=name;$('screen-name').textContent=name;$('chapter').textContent='';$('counter').textContent=`${String(i+1).padStart(2,'0')} / ${tracks.length}`;$('transmission').textContent=String(i+1).padStart(2,'0');$('watch').href=`https://www.youtube.com/watch?v=${id}`;
  $('phase').textContent='IN FLIGHT';$('media-status').textContent='Loading the preview…';$('pause').textContent='Pause flight';$('pause').setAttribute('aria-pressed','false');$('enable-audio').hidden=true;play();
 }
 function launch(){running=true;$('journey').hidden=false;$('arrival').hidden=true;choose(0);}
 function finish(){running=false;videos.forEach(v=>v.pause());$('journey').hidden=true;$('arrival').hidden=false;$('replay').focus({preventScroll:true});}
 function next(){if(index+1===tracks.length)finish();else choose(index+1);}
 function pause(value){paused=value;$('pause').textContent=value?'Resume flight':'Pause flight';$('pause').setAttribute('aria-pressed',String(value));$('phase').textContent=value?'FLIGHT PAUSED':'IN FLIGHT';$('media-status').textContent=value?'Music and flight paused.':'Playing automatically · next song follows';if(value)current().pause();else{inspecting=false;document.body.classList.remove('inspecting');play();}}
 $('pause').addEventListener('click',()=>pause(inspecting?false:!paused));$('next').addEventListener('click',next);$('replay').addEventListener('click',launch);
 $('sound').addEventListener('click',()=>{muted=!muted;videos.forEach(v=>v.muted=muted);$('sound').textContent=muted?'Sound on':'Mute';$('sound').setAttribute('aria-pressed',String(muted));if(!paused)play();});
 $('enable-audio').addEventListener('click',()=>{muted=false;paused=false;if(current().error)current().load();$('sound').textContent='Mute';$('sound').setAttribute('aria-pressed','false');play();});
 $('inspect').addEventListener('click',()=>{inspecting=true;document.body.classList.add('inspecting');$('pause').textContent='Continue flight';$('media-status').textContent='Stay with this clip · Continue flight when ready';});
 $('watch').addEventListener('click',()=>pause(true));
 function motion(){ $('motion').textContent=reduced?'Motion off':'Reduce motion';$('motion').setAttribute('aria-pressed',String(reduced));}
 $('motion').addEventListener('click',()=>{reduced=!reduced;motion();});query.addEventListener('change',e=>{reduced=e.matches;motion();});motion();
 document.addEventListener('visibilitychange',()=>{if(running)pause(document.hidden);});window.addEventListener('pagehide',()=>videos.forEach(v=>v.pause()));document.addEventListener('keydown',e=>{if(e.key==='Escape'){videos.forEach(v=>v.pause());location.href='index.html#listen';}});
 const canvas=$('space'),ctx=canvas.getContext('2d');let w,h;const stars=Array.from({length:70},()=>({x:Math.random()*2-1,y:Math.random()*2-1,z:Math.random()*2+.1}));
 function size(){w=innerWidth;h=innerHeight;const ratio=Math.min(devicePixelRatio||1,2);canvas.width=w*ratio;canvas.height=h*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);}size();addEventListener('resize',size);
 function frame(now){const dt=Math.min((now-last)/1000,.05)||0;last=now;ctx.clearRect(0,0,w,h);
  if(running){const v=current(),t=v.currentTime,d=Number.isFinite(v.duration)?v.duration:12;if(playing&&!paused)transition+=dt;
   const enter=Math.min(1,transition/1.6),leave=inspecting||index===tracks.length-1?0:Math.max(0,(t-(d-3.2))/3.2),ease=leave*leave*(3-2*leave),nextIndex=Math.min(index+1,tracks.length-1);
   // Bend beyond the screen edge before crossing its depth, then settle at the next screen.
   const arc=Math.pow(Math.sin(Math.PI*ease),2),clearance=screen.clientWidth*1.15+520,side=index%2?1:-1;
   const x=(index%2?260:-260)*(1-ease)+(nextIndex%2?260:-260)*ease+side*arc*clearance,y=(index%3===1?65:0)*(1-ease)+(nextIndex%3===1?65:0)*ease-arc*screen.clientHeight*.15,z=(index+ease)*2400-(index===0?1100*Math.pow(1-enter,3):0);
   camera.style.transform=reduced?`translate3d(${-(index%2?260:-260)}px,${-(index%3===1?65:0)}px,${index*2400}px)`:`translate3d(${-x}px,${-y}px,${z}px)`;
   screen.style.transform='none';screen.style.opacity='1';$('progress').style.width=`${(index+Math.min(1,t/d))/tracks.length*100}%`;
  }requestAnimationFrame(frame);
 }requestAnimationFrame(frame);launch();
})();
