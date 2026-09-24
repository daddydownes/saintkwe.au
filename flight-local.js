(() => {
 'use strict';
 const $=id=>document.getElementById(id);
 const tracks=[['SUMMER AIN’T OVER','e_RMY3Msjro'],['WHO DEM BOYS','b9i6DAuP5qw'],['BABY BOY FREESTYLE','jFzVBUUswUA'],['BOBBY & WHITNEY','1eg_lb5T8kY']];
 const artwork=id=>id==='b9i6DAuP5qw'?'assets/b9i6DAuP5qw-hd.jpg':`assets/optimized/${id}-hd.webp`;
 const query=matchMedia('(prefers-reduced-motion: reduce)');
 let reduced=query.matches,index=0,running=false,paused=false,inspecting=false,muted=false,transition=0,last=0,playing=false;
 let needsGesture=false,mediaFailed=false,playRequest=0,depthSupported=true;
 let loadingTimer;
 let departure=0,segmentComplete=false,nextFailed=false,nextLoadingTimer;
 const clamp=(value,min=0,max=1)=>Math.min(max,Math.max(min,value));
 const smooth=value=>{const t=clamp(value);return t*t*(3-2*t);};
 const depth=2400,perspective=900,travelTime=3.6;
 const screen=$('screen'),videos=[document.createElement('video'),document.createElement('video')];
 const wrapper=$('player-wrap');wrapper.replaceChildren(...videos);wrapper.hidden=false;
 const camera=document.createElement('div');camera.className='flight-camera';wrapper.replaceChildren(camera);
 const title=$('track-title'),incomingTitle=document.createElement('div');
 incomingTitle.className='incoming-title';incomingTitle.setAttribute('aria-hidden','true');
 const titleStage=document.createElement('div');titleStage.className='title-stage';title.before(titleStage);titleStage.append(title,incomingTitle);
 let titleWords=[],incomingWords=[],titleEntry=0;
 function wordsInto(element,name){element.replaceChildren();const glyphs=[];name.split(' ').forEach((word,i)=>{if(i)element.append(' ');const group=document.createElement('span');group.className='title-word';for(const letter of word){const glyph=document.createElement('span');glyph.className='title-glyph';glyph.textContent=letter;group.append(glyph);glyphs.push(glyph);}element.append(group);});return glyphs;}
 function setTitles(i){title.setAttribute('aria-label',tracks[i][0]);titleWords=wordsInto(title,tracks[i][0]);titleWords.forEach(word=>word.setAttribute('aria-hidden','true'));incomingWords=wordsInto(incomingTitle,tracks[i+1]?.[0]||'');}
 function setWatch(i){const watch=$('watch');if(watch.dataset.track===String(i))return;watch.dataset.track=String(i);watch.href=`https://www.youtube.com/watch?v=${tracks[i][1]}`;watch.setAttribute('aria-label',`Watch ${tracks[i][0]} music video on YouTube`);}
 function poseTitle(glyphs,progress,incoming){const distance=Math.max(innerWidth*1.4,700);glyphs.forEach((glyph,i)=>{const stagger=i*.003,p=smooth((progress-stagger)/.72),travel=incoming?1-p:p;glyph.style.visibility='visible';glyph.style.opacity='1';glyph.style.transform=`translate3d(${(incoming?-1:1)*travel*distance}px,${(incoming?1:-1)*travel*32-Math.sin(Math.PI*p)*20}px,${-travel*110}px) rotateY(${(incoming?-1:1)*travel*22}deg) rotateZ(${-travel*3}deg)`;});}
 const panels=tracks.map(([name,id],i)=>{const panel=document.createElement('a');panel.className='flight-panel';panel.href='https://www.youtube.com/watch?v='+id;panel.target='_blank';panel.rel='noopener';panel.setAttribute('aria-label','Watch '+name+' on YouTube');panel.title='Watch full video on YouTube';panel.tabIndex=i===0?0:-1;panel.addEventListener('click',()=>pause(true));panel.style.transform=`translate3d(${i%2?260:-260}px,${i%3===1?65:0}px,${-i*depth}px)`;const poster=document.createElement('img');poster.dataset.src=artwork(id);poster.alt='';panel.append(poster);camera.append(panel);return panel;});
 videos.forEach(v=>{v.preload='auto';v.playsInline=true;v.setAttribute('playsinline','');v.volume=.65;v.hidden=true;
  v.addEventListener('playing',()=>{if(v!==current()||!running||paused||mediaFailed)return;playing=true;needsGesture=false;mediaFailed=false;panels[index].classList.add('has-frame');setLoading(false);updateSound();$('media-status').textContent='';});
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
  const ready=()=>{if(img.naturalWidth)panel.classList.add('poster-ready');};
  const decoded=()=>{if(img.decode)img.decode().then(ready,ready);else ready();};
  img.onload=decoded;img.onerror=()=>panel.classList.remove('poster-ready');
  // The shared image loader may have completed this poster before we arrive.
  if(!retry&&img.getAttribute('src')){if(img.complete)decoded();return;}
  panel.classList.remove('poster-ready');
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
 function choose(i,arrived=false){clearLoadingTimer();clearNextTimer();departure=0;segmentComplete=false;nextFailed=false;++playRequest;videos.forEach(v=>{v.pause();v.hidden=true;});panels.forEach(panel=>{panel.classList.remove('is-loading','has-frame');panel.setAttribute('aria-busy','false');});index=i;playing=false;needsGesture=false;mediaFailed=false;transition=arrived?1.6:0;paused=false;inspecting=false;document.body.classList.remove('inspecting');document.body.classList.add('previewing');setLoading(true);
  panels.forEach((panel,n)=>{panel.tabIndex=n===i?0:-1;panel.inert=n!==i;});const [name,id]=tracks[i];prepare(current(),i);panels[i].append(current());current().currentTime=0;current().hidden=false;
  loadPoster(i);loadPoster(i+1);
  if(panels[i+1])panels[i+1].append(videos[1]);
  $('poster').src=artwork(id);$('poster').alt=`${name} video artwork`;
  setTitles(i);titleEntry=arrived?1.6:0;$('screen-name').textContent=name;$('chapter').textContent='';$('counter').textContent=`${String(i+1).padStart(2,'0')} / ${String(tracks.length).padStart(2,'0')}`;$('transmission').textContent=String(i+1).padStart(2,'0');setWatch(i);
  $('phase').textContent='IN FLIGHT';$('media-status').textContent='Loading the preview…';$('pause').textContent='Pause flight';$('pause').setAttribute('aria-pressed','false');updateSound();play();
 }
 function launch(){running=true;$('sound').hidden=false;$('journey').hidden=false;$('arrival').hidden=true;choose(0);}
 function finish(){running=false;clearLoadingTimer();clearNextTimer();++playRequest;videos.forEach(v=>v.pause());updateSound();$('journey').hidden=true;$('arrival').hidden=false;window.KweMedia?.loadWithin($('arrival'));$('replay').focus({preventScroll:true});}
 function next(arrived=false){if(index+1===tracks.length)finish();else choose(index+1,arrived);}
 function pause(value){paused=value;updateSound();$('pause').textContent=value?'Resume flight':'Pause flight';$('pause').setAttribute('aria-pressed',String(value));$('phase').textContent=value?'FLIGHT PAUSED':'IN FLIGHT';$('media-status').textContent=value?'Music and flight paused.':'';if(value){setLoading(false);clearNextTimer();current().pause();}else{inspecting=false;document.body.classList.remove('inspecting');if(!segmentComplete){setLoading(true);play();}}}
 $('pause').addEventListener('click',()=>pause(inspecting?false:!paused));$('next').addEventListener('click',()=>next());$('replay').addEventListener('click',()=>{launch();($('play-music').hidden?$('sound'):$('play-music')).focus({preventScroll:true});});
 $('play-music').addEventListener('click',()=>{
  if(!running||mediaFailed)return;
  muted=false;paused=false;needsGesture=false;inspecting=false;
  document.body.classList.remove('inspecting');
  $('pause').textContent='Pause flight';$('pause').setAttribute('aria-pressed','false');$('phase').textContent='IN FLIGHT';
  current().muted=false;
  if(!segmentComplete&&(current().paused||current().readyState<3))setLoading(true);
  updateSound();$('media-status').textContent='';
  // Preserve the browser's tap/keyboard permission to enable audible playback.
  if(!segmentComplete)play();
 });
 $('sound').addEventListener('click',()=>{
  if(nextFailed){nextFailed=false;clearNextTimer();loadPoster(index+1,true);videos[1].load();updateSound();waitForNext();return;}
  if(paused&&!mediaFailed&&!needsGesture){pause(false);return;}
  if(needsGesture||mediaFailed){const retrying=mediaFailed;paused=false;needsGesture=false;mediaFailed=false;setLoading(true);if(retrying||current().error)current().load();}
  else muted=!muted;
  current().muted=muted;updateSound();
  if(playing&&!paused)$('media-status').textContent='';
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
  if(running){const v=current(),t=v.currentTime,d=Math.min(Number.isFinite(v.duration)?v.duration:8,8);if(playing&&!paused)transition+=dt;if(!paused)titleEntry+=dt;
   // Keep the last sharp frame until the destination can actually play. A
   // separate clock preserves the original arc even when loading finishes late.
   if(!paused&&!inspecting&&!mediaFailed&&(playing||segmentComplete)&&index<tracks.length-1&&t>=d-travelTime){
    if(!nextFailed)prepare(videos[1],index+1);
    if(nextReady()&&!nextFailed){clearNextTimer();if(!needsGesture)$('media-status').textContent='';departure=Math.min(1,departure+dt/travelTime);}
    else waitForNext();
   }
   if(!paused&&!inspecting&&t>=d)completeSegment();
   if(segmentComplete&&departure>=1&&!paused&&!nextFailed){next(true);requestAnimationFrame(frame);return;}
   const enter=clamp(transition/1.6),leave=departure,ease=smooth(leave),nextIndex=Math.min(index+1,tracks.length-1);
   if(leave>.55)setWatch(nextIndex);
   const flat=reduced||!depthSupported;
   // Travel round the RIGHT edge, then look back into the next screen. Rotating
   // at the eye (the perspective distance) makes the turn read as a real orbit.
   const arc=Math.pow(Math.sin(Math.PI*ease),1.3),clearance=screen.clientWidth*.85+440;
   const fromX=index%2?260:-260,toX=nextIndex%2?260:-260;
   const fromY=index%3===1?65:0,toY=nextIndex%3===1?65:0;
   const x=fromX*(1-ease)+toX*ease+arc*clearance;
   const y=fromY*(1-ease)+toY*ease-arc*screen.clientHeight*.09;
   const z=(index+ease)*depth-(index===0?1100*Math.pow(1-enter,3):0);
   const gaze=smooth((leave-.06)/.48),targetX=fromX*(1-gaze)+toX*gaze,targetY=fromY*(1-gaze)+toY*gaze;
   const distance=perspective+(index+gaze)*depth-z;
   const yaw=Math.atan2(targetX-x,distance)*180/Math.PI;
   const pitch=-Math.atan2(targetY-y,Math.hypot(targetX-x,distance))*180/Math.PI;
   const bank=-Math.sin(Math.PI*leave)*3.5;
   camera.style.transform=flat?`translate3d(${-fromX}px,${-fromY}px,${index*depth}px)`:`translateZ(${perspective}px) rotateZ(${bank}deg) rotateX(${pitch}deg) rotateY(${yaw}deg) translate3d(${-x}px,${-y}px,${z-perspective}px)`;
   // Retire the current words with the departing frame; reveal the next title
   // as its screen swings into view. Both settle before playback changes clips.
   if(flat){poseTitle(titleWords,0,false);poseTitle(incomingWords,0,true);}
   else if(leave>0){poseTitle(titleWords,clamp(leave/.75),false);poseTitle(incomingWords,clamp((leave-.25)/.65),true);}
   else{poseTitle(titleWords,clamp(titleEntry/1.6),true);poseTitle(incomingWords,0,true);}
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
