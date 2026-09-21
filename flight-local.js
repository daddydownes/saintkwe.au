(() => {
 'use strict';
 const $=id=>document.getElementById(id);
 const tracks=[['SUMMER AIN’T OVER','e_RMY3Msjro'],['WHO DEM BOYS','b9i6DAuP5qw'],['BABY BOY FREESTYLE','jFzVBUUswUA'],['BOBBY & WHITNEY','1eg_lb5T8kY'],['SPECIAL','hesCXfu5R5Y']];
 const artwork=id=>id==='hesCXfu5R5Y'?'assets/special-court-cover.png':id==='b9i6DAuP5qw'?'assets/b9i6DAuP5qw-hd.jpg':`assets/optimized/${id}-hd.webp`;
 const query=matchMedia('(prefers-reduced-motion: reduce)');
 let reduced=query.matches,index=0,running=false,paused=false,inspecting=false,muted=false,transition=0,last=0,playing=false;
 let needsGesture=false,mediaFailed=false,playRequest=0,depthSupported=true;
 let loadingTimer;
 let departure=0,segmentComplete=false,nextFailed=false,nextLoadingTimer;
 const screen=$('screen'),videos=[document.createElement('video'),document.createElement('video')];
 const wrapper=$('player-wrap');wrapper.replaceChildren(...videos);wrapper.hidden=false;
 const camera=document.createElement('div');camera.className='flight-camera';wrapper.replaceChildren(camera);
 const panels=tracks.map(([name,id],i)=>{const panel=document.createElement('a');panel.className='flight-panel';panel.href='https://www.youtube.com/watch?v='+id;panel.target='_blank';panel.rel='noopener';panel.setAttribute('aria-label','Watch '+name+' on YouTube');panel.title='Watch full video on YouTube';panel.tabIndex=i===0?0:-1;panel.addEventListener('click',()=>pause(true));panel.style.transform=`translate3d(${i%2?260:-260}px,${i%3===1?65:0}px,${-i*2400}px)`;const poster=document.createElement('img');poster.dataset.src=artwork(id);poster.alt='';panel.append(poster);camera.append(panel);return panel;});
 videos.forEach(v=>{v.preload='auto';v.playsInline=true;v.setAttribute('playsinline','');v.volume=.65;v.hidden=true;
  v.addEventListener('playing',()=>{if(v!==current()||!running||paused||mediaFailed)return;playing=true;needsGesture=false;mediaFailed=false;panels[index].classList.add('has-frame');setLoading(false);updateSound();$('media-status').textContent=muted?'Playing muted · next song follows':'Playing automatically · next song follows';});
  v.addEventListener('waiting',()=>{if(v!==current()||!running||paused||needsGesture||mediaFailed)return;playing=false;setLoading(true);$('media-status').textContent='Loading the preview…';});
  v.addEventListener('pause',()=>{if(v===current())playing=false;});
  v.addEventListener('timeupdate',()=>{if(v===current()&&running&&!paused&&!inspecting&&v.currentTime>=8)completeSegment();});
  v.addEventListener('ended',()=>{if(v!==current()||!running||paused||mediaFailed)return;if(inspecting){v.currentTime=0;play();}else completeSegment();});
  v.addEventListener('error',()=>{if(v!==current()||!running)return;showMediaError();});
 });
 // Keep the audible element across tracks: some browsers grant playback per element.
 // The second element only preloads the next original HD clip; it never plays.
 function current(){return videos[0];}
 function loadPoster(i,retry=false){
  const panel=panels[i];if(!panel)return;
  const img=panel.querySelector('img');
  if(!retry&&img.getAttribute('src'))return;
  panel.classList.remove('poster-ready');
  img.onload=()=>{const ready=()=>{if(img.naturalWidth)panel.classList.add('poster-ready');};if(img.decode)img.decode().then(ready,ready);else ready();};
  img.onerror=()=>panel.classList.remove('poster-ready');
  delete img.dataset.src;img.src=artwork(tracks[i][1]);
 }
 function nextReady(){return !!panels[index+1]?.classList.contains('poster-ready')&&videos[1].dataset.source===`assets/optimized/${tracks[index+1][1]}-hq.mp4`&&videos[1].readyState>=3;}
 function clearNextTimer(){clearTimeout(nextLoadingTimer);nextLoadingTimer=null;}
 function waitForNext(){
  if(nextReady()){clearNextTimer();return;}
  if(nextFailed||nextLoadingTimer!=null)return;
  $('media-status').textContent='Loading the next preview…';
  const track=index;
  nextLoadingTimer=setTimeout(()=>{
   nextLoadingTimer=null;if(!running||paused||index!==track||nextReady())return;
   nextFailed=true;updateSound();
   $('media-status').textContent='The next preview is taking longer to load. Tap Retry above.';
  },15000);
 }
 function completeSegment(){
  if(segmentComplete)return;
  if(index===tracks.length-1){finish();return;}
  segmentComplete=true;current().pause();
 }
 // Spend bandwidth on the playing clip first. Only warm the next clip once
 // the complete visible segment is buffered, and respect data-saver mode.
 function warmNext(){
  const v=current();if(!running||paused||mediaFailed||navigator.connection?.saveData)return;
  for(let n=0;n<v.buffered.length;n++)if(v.buffered.start(n)<=v.currentTime&&v.buffered.end(n)>=Math.min(8,v.duration)){
   prepare(videos[1],index+1);window.KweMedia?.loadWithin(panels[index+1]);break;
  }
 }
 current().addEventListener('progress',warmNext);
 current().addEventListener('canplaythrough',warmNext);
 function clearLoadingTimer(){clearTimeout(loadingTimer);loadingTimer=null;}
 function setLoading(value){
  screen.classList.toggle('loading',value);panels[index].classList.toggle('is-loading',value);panels[index].setAttribute('aria-busy',String(value));
  if(!value){clearLoadingTimer();return;}
  if(loadingTimer!=null)return;
  const track=index;
  loadingTimer=setTimeout(()=>{
   loadingTimer=null;
   if(!running||paused||playing||index!==track)return;
   ++playRequest;current().pause();
   showMediaError('The preview is taking longer to load. Tap Retry above or tap the video to watch on YouTube.');
  },15000);
 }
 function updateSound(){
  const label=mediaFailed||nextFailed?'Retry':paused?'Resume':needsGesture?(muted?'Play':'Play sound'):muted?'Unmute':'Mute';
  $('sound').textContent=label;$('sound').setAttribute('aria-label',label);
  $('sound').setAttribute('aria-pressed',String(muted));
  const prompt=running&&!mediaFailed&&!nextFailed&&(muted||needsGesture),focused=document.activeElement;
  $('sound').hidden=!running||prompt;
  $('play-music').hidden=!prompt;
  if(prompt&&focused===$('sound'))$('play-music').focus({preventScroll:true});
  else if(!prompt&&running&&focused===$('play-music'))$('sound').focus({preventScroll:true});
 }
 function showMediaError(message='Preview unavailable. Tap Retry above or tap the video to watch on YouTube.'){panels[index].classList.remove('has-frame');playing=false;mediaFailed=true;needsGesture=false;setLoading(false);updateSound();$('media-status').textContent=message;}
 function prepare(v,i){if(i>=tracks.length)return;const src=`assets/optimized/${tracks[i][1]}-hq.mp4`;if(v.dataset.source!==src){v.dataset.source=src;v.poster=artwork(tracks[i][1]);v.src=src;v.load();}}
 async function play(){const v=current(),request=++playRequest;v.muted=muted;try{await v.play();}catch(e){if(request!==playRequest||!running||paused||e.name==='AbortError')return;if(e.name!=='NotAllowedError'){showMediaError();return;}playing=false;needsGesture=true;mediaFailed=false;setLoading(false);updateSound();$('media-status').textContent='Tap Play Music in the centre to start the music.';}}
 function choose(i){clearLoadingTimer();clearNextTimer();departure=0;segmentComplete=false;nextFailed=false;++playRequest;videos.forEach(v=>{v.pause();v.hidden=true;});panels.forEach(panel=>{panel.classList.remove('is-loading','has-frame');panel.setAttribute('aria-busy','false');});index=i;playing=false;needsGesture=false;mediaFailed=false;transition=0;paused=false;inspecting=false;document.body.classList.remove('inspecting');document.body.classList.add('previewing');setLoading(true);
  panels.forEach((panel,n)=>{panel.tabIndex=n===i?0:-1;panel.inert=n!==i;});const [name,id]=tracks[i];prepare(current(),i);panels[i].append(current());current().currentTime=0;current().hidden=false;
  loadPoster(i);loadPoster(i+1);
  if(panels[i+1])panels[i+1].append(videos[1]);
  $('poster').src=artwork(id);$('poster').alt=`${name} video artwork`;
  $('track-title').textContent=name;$('screen-name').textContent=name;$('chapter').textContent='';$('counter').textContent=`${String(i+1).padStart(2,'0')} / ${tracks.length}`;$('transmission').textContent=String(i+1).padStart(2,'0');$('watch').href=`https://www.youtube.com/watch?v=${id}`;
  $('phase').textContent='IN FLIGHT';$('media-status').textContent='Loading the preview…';$('pause').textContent='Pause flight';$('pause').setAttribute('aria-pressed','false');updateSound();play();
 }
 function launch(){running=true;$('sound').hidden=false;$('journey').hidden=false;$('arrival').hidden=true;choose(0);}
 function finish(){running=false;clearLoadingTimer();clearNextTimer();++playRequest;videos.forEach(v=>v.pause());updateSound();$('journey').hidden=true;$('arrival').hidden=false;window.KweMedia?.loadWithin($('arrival'));$('replay').focus({preventScroll:true});}
 function next(){if(index+1===tracks.length)finish();else choose(index+1);}
 function pause(value){paused=value;updateSound();$('pause').textContent=value?'Resume flight':'Pause flight';$('pause').setAttribute('aria-pressed',String(value));$('phase').textContent=value?'FLIGHT PAUSED':'IN FLIGHT';$('media-status').textContent=value?'Music and flight paused.':'Playing automatically · next song follows';if(value){setLoading(false);clearNextTimer();current().pause();}else{inspecting=false;document.body.classList.remove('inspecting');if(!segmentComplete){setLoading(true);play();}}}
 $('pause').addEventListener('click',()=>pause(inspecting?false:!paused));$('next').addEventListener('click',next);$('replay').addEventListener('click',()=>{launch();($('play-music').hidden?$('sound'):$('play-music')).focus({preventScroll:true});});
 $('play-music').addEventListener('click',()=>{
  if(!running||mediaFailed)return;
  muted=false;paused=false;needsGesture=false;inspecting=false;
  document.body.classList.remove('inspecting');
  $('pause').textContent='Pause flight';$('pause').setAttribute('aria-pressed','false');$('phase').textContent='IN FLIGHT';
  current().muted=false;
  if(!segmentComplete&&(current().paused||current().readyState<3))setLoading(true);
  updateSound();$('media-status').textContent='Playing automatically · next song follows';
  // Preserve the browser's tap/keyboard permission to enable audible playback.
  if(!segmentComplete)play();
 });
 $('sound').addEventListener('click',()=>{
  if(nextFailed){nextFailed=false;clearNextTimer();loadPoster(index+1,true);videos[1].load();updateSound();waitForNext();return;}
  if(paused&&!mediaFailed&&!needsGesture){pause(false);return;}
  if(needsGesture||mediaFailed){const retrying=mediaFailed;paused=false;needsGesture=false;mediaFailed=false;setLoading(true);if(retrying||current().error)current().load();}
  else muted=!muted;
  current().muted=muted;updateSound();
  if(playing&&!paused)$('media-status').textContent=muted?'Playing muted · next song follows':'Playing automatically · next song follows';
  // Call play directly within the tap, before any asynchronous work.
  if(!paused&&!segmentComplete)play();
 });
 $('inspect').addEventListener('click',()=>{inspecting=true;document.body.classList.add('inspecting');$('pause').textContent='Continue flight';$('media-status').textContent='Stay with this clip · Continue flight when ready';});
 $('watch').addEventListener('click',()=>pause(true));
 function motion(){ document.body.classList.toggle('flat-flight',reduced||!depthSupported);$('motion').textContent=reduced?'Motion off':'Reduce motion';$('motion').setAttribute('aria-pressed',String(reduced));}
 $('motion').addEventListener('click',()=>{reduced=!reduced;motion();});query.addEventListener('change',e=>{reduced=e.matches;motion();});motion();
 let resumeAfterVisibility=false;
 document.addEventListener('visibilitychange',()=>{if(!running)return;if(document.hidden){resumeAfterVisibility=!paused;if(resumeAfterVisibility)pause(true);}else if(resumeAfterVisibility){resumeAfterVisibility=false;pause(false);}});window.addEventListener('pagehide',()=>videos.forEach(v=>v.pause()));document.addEventListener('keydown',e=>{if(e.key==='Escape'){videos.forEach(v=>v.pause());if(window.KweTransitions)window.KweTransitions.navigate('index.html#listen');else location.href='index.html#listen';}});
 // The decorative canvas is permanently hidden; only animate the visible camera.
 screen.style.transform='none';screen.style.opacity='1';
 const progress=$('progress');
 function frame(now){const dt=Math.min((now-last)/1000,.05)||0;last=now;
  if(running){const v=current(),t=v.currentTime,d=Math.min(Number.isFinite(v.duration)?v.duration:8,8);if(playing&&!paused)transition+=dt;
   // Keep the last sharp frame until the destination can actually play. A
   // separate clock preserves the original arc even when loading finishes late.
   if(!paused&&!inspecting&&!mediaFailed&&(playing||segmentComplete)&&index<tracks.length-1&&t>=d-3.2){
    if(!nextFailed)prepare(videos[1],index+1);
    if(nextReady()&&!nextFailed){clearNextTimer();departure=Math.min(1,departure+dt/3.2);}
    else waitForNext();
   }
   if(!paused&&!inspecting&&t>=d)completeSegment();
   if(segmentComplete&&departure>=1&&!paused&&!nextFailed){next();requestAnimationFrame(frame);return;}
   const enter=Math.min(1,transition/1.6),leave=departure,ease=leave*leave*(3-2*leave),nextIndex=Math.min(index+1,tracks.length-1);
   // Bend beyond the screen edge before crossing its depth, then settle at the next screen.
   const arc=Math.pow(Math.sin(Math.PI*ease),2),clearance=screen.clientWidth*1.15+520,side=index%2?1:-1;
   const x=(index%2?260:-260)*(1-ease)+(nextIndex%2?260:-260)*ease+side*arc*clearance,y=(index%3===1?65:0)*(1-ease)+(nextIndex%3===1?65:0)*ease-arc*screen.clientHeight*.15,z=(index+ease)*2400-(index===0?1100*Math.pow(1-enter,3):0);
   camera.style.transform=reduced?`translate3d(${-(index%2?260:-260)}px,${-(index%3===1?65:0)}px,${index*2400}px)`:`translate3d(${-x}px,${-y}px,${z}px)`;
   progress.style.width=`${(index+Math.min(1,t/d))/tracks.length*100}%`;
  }requestAnimationFrame(frame);
 }requestAnimationFrame(frame);launch();
 // Verify actual perspective projection; some media/browser backends flatten
 // distant panels even though they accept the CSS 3D properties.
 document.body.classList.remove('flat-flight');
 const nearWidth=panels[0].getBoundingClientRect().width;
 const farWidth=panels[2].getBoundingClientRect().width;
 depthSupported=nearWidth>0&&farWidth<nearWidth*.8;
 motion();
})();
