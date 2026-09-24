/* Preserve the aperture motion, with a soft film reveal and black closing circle. */
(() => {
  'use strict';
 const root=document.documentElement;
 const reloading=performance.getEntriesByType('navigation')[0]?.type==='reload';
 if(reloading){
  history.scrollRestoration='manual';
  if(location.hash)history.replaceState(history.state,'',location.pathname+location.search);
  window.scrollTo({top:0,left:0,behavior:'instant'});
  document.addEventListener('DOMContentLoaded',()=>window.scrollTo({top:0,left:0,behavior:'instant'}),{once:true});
 }
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const eligible=!reduced.matches&&!location.hash;
 if(!eligible){root.classList.add('mock-settled');return;}
 root.classList.remove('mock-settled');
 root.classList.add('kwe-intro-pending');

  let activeFinish;
  const boot = () => {
    if (document.hidden) return;
    activeFinish?.();
    history.scrollRestoration='manual';
    window.scrollTo({top:0,left:0,behavior:'instant'});
    const initialWidth=innerWidth;
    const root = document.documentElement;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const layer = document.createElement('div');
    layer.className = 'kwe-aperture is-preparing';
    layer.setAttribute('aria-label', 'Saint Kwe opening animation');
    layer.innerHTML = '<div class="kwe-aperture-curtain top"></div><div class="kwe-aperture-curtain bottom"></div><div class="kwe-aperture-film is-loading" aria-hidden="true"><video muted playsinline preload="metadata" poster="assets/optimized/intro-poster.webp"><source data-src="assets/july20-intro.mp4?v=original-restored" type="video/mp4"></video></div><div class="kwe-aperture-line" aria-hidden="true"></div><p class="kwe-aperture-title" aria-hidden="true"><span class="kwe-aperture-outline">SAINT KWE</span><span class="kwe-aperture-fill">SAINT KWE</span></p>';
    document.body.append(layer);
    const inertTargets=[...document.body.children].filter(el=>el!==layer&&el.tagName!=='SCRIPT').map(el=>[el,el.inert]);
    inertTargets.forEach(([el])=>el.inert=true);
    const film = layer.querySelector('.kwe-aperture-film');
    const video = layer.querySelector('video');
    const blackout = document.createElement('div');
    blackout.className = 'kwe-aperture-blackout';
    film.append(blackout);
    const fallbackUrl = 'assets/optimized/intro-h264.mp4';
    let clipUrl = video.canPlayType('video/mp4; codecs="av01.0.08M.08"') ? 'assets/optimized/intro-av1.mp4' : fallbackUrl;
    // Let the browser stream/buffer the real file progressively instead of
    // making the complete MP4 download a prerequisite for playback.
    video.querySelector('source').remove();
    video.preload = 'auto';
    video.muted = true;
    video.defaultMuted = true;
    const controls = document.createElement('div');
    controls.className = 'kwe-aperture-controls';
    controls.hidden = true;
    controls.innerHTML = '<p role="status">Loading the opening…</p><button type="button" class="intro-retry" hidden>Play opening</button><button type="button" class="intro-skip" hidden>Skip opening</button>';
    layer.append(controls);
    const status = controls.querySelector('[role="status"]');
    const retry = controls.querySelector('.intro-retry');
    const skip = controls.querySelector('.intro-skip');
    skip.hidden = true;
    const title = layer.querySelector('.kwe-aperture-title');
    const fill = layer.querySelector('.kwe-aperture-fill');
    const line = layer.querySelector('.kwe-aperture-line');
    // The centre slit belongs to the footage reveal. Keeping it outside the
    // film let it flash before the video opacity animation had even started.
    film.append(line);
    const animations = [];
    let started = false;
    let done = false;
    let pendingPlay, playAttempt = 0;
    const fontReady = Promise.race([document.fonts.ready,new Promise(resolve=>setTimeout(resolve,1200))]);
    let recoveryTimer, skipTimer, frameRequest, fontsReady = false, frameReady = false, buffering = true, escapeAvailable = false;
    const heading=document.querySelector('.wordmark-stage h1');
    const previousOverflow = root.style.overflow;
    root.style.overflow = 'hidden';
    const settle = () => {
      root.classList.remove('kwe-intro-pending', 'kwe-intro-exiting');
      root.classList.add('mock-settled');
      document.body.classList.add('mock-settled');
    };
    const finish = () => {
      if (done) return;
      done = true;
      activeFinish = null;
      clearTimeout(recoveryTimer);
      clearTimeout(skipTimer);
      if(frameRequest != null) video.cancelVideoFrameCallback?.(frameRequest);
      root.classList.remove('aperture-handoff');
      window.removeEventListener('resize', resized);
      document.removeEventListener('visibilitychange', visibilityChanged);
      animations.forEach(animation => animation.cancel());
      video.pause();
      video.removeAttribute('src');
      video.load();
      settle();
      root.style.overflow = previousOverflow;
      const restoreFocus = layer.contains(document.activeElement);
      layer.remove();
      inertTargets.forEach(([el,previous])=>el.inert=previous);
      window.dispatchEvent(new Event('kwe:intro-finished'));
      if (restoreFocus) document.querySelector('.flight-launch')?.focus({ preventScroll: true });
      window.removeEventListener('hashchange', finish);
      window.removeEventListener('pagehide', finish);
      reduced.removeEventListener?.('change', motionChanged);

    };
    const animate = (element, frames, duration, delay = 0, easing = 'cubic-bezier(.22,1,.36,1)') => {
      const animation=element.animate(frames, {duration, delay, easing, fill:'both'});
      animation.finished.catch(() => {});
      animations.push(animation);return animation;
    };
    const drawOutline = () => {
      const guide=layer.querySelector('.kwe-aperture-outline');
      const style=getComputedStyle(guide), size=parseFloat(style.fontSize);
      const width=guide.offsetWidth,height=guide.offsetHeight;
      const canvas=document.createElement('canvas').getContext('2d');
      canvas.font=`${style.fontWeight} ${size}px ${style.fontFamily}`;
      const metrics=canvas.measureText('SAINT KWE');
      const ascent=metrics.fontBoundingBoxAscent??size*.9;
      const descent=metrics.fontBoundingBoxDescent??size*.25;
      const baseline=(height-ascent-descent)/2+ascent;
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.classList.add('kwe-aperture-drawing');
      svg.setAttribute('width',width);svg.setAttribute('height',height);
      svg.setAttribute('aria-hidden','true');
      const makeStroke = className => {
        const text=document.createElementNS(svg.namespaceURI,'text');
        text.textContent='SAINT KWE';text.setAttribute('x','0');text.setAttribute('y',baseline);
        text.style.fontFamily=style.fontFamily;text.style.fontWeight=style.fontWeight;
        text.style.fontSize=size+'px';text.style.letterSpacing=style.letterSpacing;
        text.setAttribute('textLength',width);text.setAttribute('lengthAdjust','spacingAndGlyphs');
        text.setAttribute('class',className);text.style.strokeWidth=Math.max(1.8,size*.012)+'px';
        svg.append(text);return text;
      };
      const stroke=makeStroke('kwe-outline-stroke');
      const shine=makeStroke('kwe-outline-shine');
      title.append(svg);
      // Dash lengths scale with the type so the phone draw lasts as long as desktop.
      const length=size*6;
      stroke.style.strokeDasharray=String(length);
      shine.style.strokeDasharray=`${size*.14} ${length}`;
      animate(stroke,[{strokeDashoffset:String(length)},{strokeDashoffset:'0'}],3000,150,'linear');
      animate(shine,[{strokeDashoffset:String(length),opacity:0},{opacity:.75,offset:.18},{opacity:.75,offset:.8},{strokeDashoffset:'0',opacity:0}],3000,150,'linear');
      animate(guide,[{opacity:.16},{opacity:.16}],3750,0,'linear');
      // Hold the completed outline, then resolve as one clean word, without a sweep.
      fill.style.clipPath='inset(-.5em -.12em -.5em -.12em)';
      animate(fill,[{opacity:0},{opacity:1}],280,3500,'ease-in-out');
      animate(svg,[{opacity:1},{opacity:0}],280,3500,'ease-in-out');
    };
    // These clocks pause with the visual animations when playback buffers.
    const afterPlayback = (duration, callback) => {
      const clock = animate(layer, [{},{}], duration);
      clock.finished.then(() => { if (!done) callback(); }).catch(() => {});
    };
    const start = () => {
      if (started || done || !fontsReady || !frameReady || buffering || document.hidden) return;
      started = true;
      if (reduced.matches || !layer.animate) { finish(); return; }
      settle();
      if(heading){const headingStyle=getComputedStyle(heading);title.style.fontFamily=headingStyle.fontFamily;title.style.fontWeight=headingStyle.fontWeight;title.style.letterSpacing='-.045em';}
      layer.classList.remove('is-preparing');
      controls.hidden = true;
      root.classList.add('aperture-handoff');
      animate(line, [{transform:'scaleX(0)'},{transform:'scaleX(1)',offset:.7},{transform:'scaleX(1)',opacity:0}], 850);
      animate(film, [{clipPath:'inset(49.85% 0)'},{clipPath:'inset(24% 0)'}], 1250, 250);
      // Fade the centre slit and footage together as the aperture opens outward.
      animate(film, [{opacity:0},{opacity:1}], 1100, 250, 'cubic-bezier(.4,0,.6,1)');
      animate(title, [{opacity:1,transform:'scale(.92)'},{opacity:1,transform:'scale(1)'}], 1150, 300);
      drawOutline();
      // Carry the same title into the real homepage heading while the aperture opens.
      afterPlayback(3800,()=>{
        if(done)return;
        try{
          const range=document.createRange();range.selectNodeContents(heading);
          const target=range.getBoundingClientRect();
          const sourceRange=document.createRange();sourceRange.selectNodeContents(fill);
          const source=sourceRange.getBoundingClientRect();
          if(!source.width||!source.height||!target.width||!target.height){finish();return;}
          const sx=target.width/source.width,sy=target.height/source.height;
          const box=title.getBoundingClientRect(),ox=box.left+box.width/2,oy=box.top+box.height/2;
          // Account for the font baseline relative to the transform origin, not just box centres.
          const x=target.left+target.width/2-ox-sx*(source.left+source.width/2-ox);
          const y=target.top+target.height/2-oy-sy*(source.top+source.height/2-oy);
          animate(title,[{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${x}px,${y}px) scale(${sx},${sy})`,opacity:1}],1450,0,'cubic-bezier(.65,0,.2,1)');
          animate(layer.querySelector('.kwe-aperture-outline'),[{opacity:1},{opacity:0}],500);
          animate(layer.querySelector('.top'),[{transform:'translateY(0)'},{transform:'translateY(-100%)'}],1450,0,'cubic-bezier(.65,0,.2,1)');
          animate(layer.querySelector('.bottom'),[{transform:'translateY(0)'},{transform:'translateY(100%)'}],1450,0,'cubic-bezier(.65,0,.2,1)');
          const W=innerWidth,H=innerHeight,radius=Math.min(W,H)*.18;
          animate(film,[{clipPath:'inset(24% 0 round 0px)'},{clipPath:`inset(${H/2-radius}px ${W/2-radius}px round ${radius}px)`,offset:.62},{clipPath:'inset(50% 50% round 100px)'}],1800,0,'cubic-bezier(.55,0,.2,1)');
          animate(blackout,[{opacity:0},{opacity:1,offset:.62},{opacity:1}],1800,0,'cubic-bezier(.55,0,.2,1)');
          afterPlayback(1860,finish);
        }catch{finish();}
      });
    };
    function recovery(message) {
      if(done)return;
      escapeAvailable=true;
      controls.hidden=false;
      status.textContent=message;
      retry.hidden=false;
      skip.hidden=false;
    }
    function waiting() {
      if(done)return;
      buffering=true;frameReady=false;
      film.classList.add('is-loading');
      animations.forEach(animation=>{if(animation.playState==='running')animation.pause();});
      clearTimeout(recoveryTimer);
      if(escapeAvailable){
        controls.hidden=false;
        retry.hidden=false;
        skip.hidden=false;
        status.textContent='Still loading. You can retry or skip the opening.';
      }
    }
    function decoded() {
      frameRequest=null;
      if(done || document.hidden || video.paused || video.readyState<2)return;
      frameReady=true;buffering=false;
      clearTimeout(recoveryTimer);
      film.classList.add('has-frame');film.classList.remove('is-loading');
      controls.hidden=true;
      animations.forEach(animation=>{if(animation.playState==='paused')animation.play();});
      start();
    }
    function playing() {
      if(done)return;
      if(frameRequest != null)video.cancelVideoFrameCallback?.(frameRequest);
      if(video.requestVideoFrameCallback)frameRequest=video.requestVideoFrameCallback(decoded);
      else decoded();
    }
    function play(restart = false) {
      if(done || document.hidden || (pendingPlay && !restart))return;
      const attempt=++playAttempt;
      waiting();status.textContent='Loading the opening…';
      if(escapeAvailable){
        controls.hidden=false;
        retry.hidden=false;
        skip.hidden=false;
      }else{
        retry.hidden=true;
        controls.hidden=true;
      }
      pendingPlay=(async()=>{
        const requestedUrl=new URL(clipUrl,location.href).href;
        if(video.src!==requestedUrl || (restart && video.error)){
          video.pause();
          frameReady=false;
          video.src=clipUrl;
          video.load();
        }
        await fontReady;
        fontsReady=true;
        if(done || document.hidden || attempt!==playAttempt)return;
        if(!started && video.currentTime>0)video.currentTime=0;
        try { await video.play(); }
        catch { if(!done && attempt===playAttempt)recovery('Tap to play the opening.'); }
      })().finally(()=>{if(attempt===playAttempt)pendingPlay=null;});
    }
    video.addEventListener('playing',playing);
    video.addEventListener('waiting',waiting);
    video.addEventListener('error',()=>{
      if(done)return;
      if(clipUrl!==fallbackUrl){
        clipUrl=fallbackUrl;pendingPlay=null;frameReady=false;
        video.pause();video.src=clipUrl;video.load();play(true);return;
      }
      waiting();recovery('The opening could not load. Try again.');
    });
    // Keep the reveal alive if a short clip reaches its end during loading.
    video.loop=true;
    retry.addEventListener('click',()=>play(true));
    skip.addEventListener('click',finish);
    // A normal connection sees only the outline and footage. After six seconds
    // the escape remains eligible for every later stall; healthy playback is
    // never terminated just because the deadline elapsed.
    skipTimer=setTimeout(()=>{
      if(done)return;
      escapeAvailable=true;
      skip.hidden=false;
      if(buffering || !started){
        controls.hidden=false;retry.hidden=false;
        status.textContent='The opening is taking longer to load.';
      }
    },6000);
    // Mobile browser address bars change height without changing the layout width.
    function resized(){if(started && Math.abs(innerWidth-initialWidth)>2)finish();}
    function visibilityChanged(){if(document.hidden){waiting();video.pause();}else play();}
    function motionChanged(event) { if (event.matches) finish(); }
    activeFinish=finish;
    window.addEventListener('hashchange', finish);
    window.addEventListener('pagehide', finish);
    reduced.addEventListener?.('change', motionChanged);
    window.addEventListener('resize',resized);
    document.addEventListener('visibilitychange',visibilityChanged);
    if(reduced.matches)finish();
    else {
      // Do not measure fallback-font geometry if the display face is still loading.
      play();
    }
  };
  const ready = () => {
    if (document.hidden) {
      const shown = () => {
        if (document.hidden) return;
        document.removeEventListener('visibilitychange', shown);
        boot();
      };
      document.addEventListener('visibilitychange', shown);
    } else boot();
  };
  // Back/forward caches restore the old document without re-running scripts.
  window.addEventListener('pageshow', event => {
    if (event.persisted && !location.hash && !reduced.matches) ready();
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, {once:true});
  else ready();
})();
