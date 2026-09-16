/* Approved Lens close opening with continuous title handoff. */
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
    layer.className = 'kwe-aperture';
    layer.setAttribute('aria-label', 'Saint Kwe opening animation');
    layer.innerHTML = '<div class="kwe-aperture-curtain top"></div><div class="kwe-aperture-curtain bottom"></div><div class="kwe-aperture-film is-loading" aria-hidden="true"><video muted playsinline preload="metadata" poster="assets/concert-cultrd-125-full.jpg"><source src="assets/july20-intro.mp4" type="video/mp4"></video></div><div class="kwe-aperture-line" aria-hidden="true"></div><p class="kwe-aperture-title" aria-hidden="true"><span class="kwe-aperture-outline">SAINT KWE</span><span class="kwe-aperture-fill">SAINT KWE</span></p><p class="kwe-aperture-eyebrow" aria-hidden="true">MUSIC &nbsp;/&nbsp; VISUALS</p>';
    document.body.append(layer);
    const inertTargets=[...document.body.children].filter(el=>el!==layer&&el.tagName!=='SCRIPT').map(el=>[el,el.inert]);
    inertTargets.forEach(([el])=>el.inert=true);
    const film = layer.querySelector('.kwe-aperture-film');
    const video = layer.querySelector('video');
    video.addEventListener('playing',()=>{film.classList.add('has-frame');film.classList.remove('is-loading');});
    video.addEventListener('waiting',()=>film.classList.add('is-loading'));
    video.addEventListener('error',()=>{film.classList.remove('has-frame','is-loading');});
    const title = layer.querySelector('.kwe-aperture-title');
    const fill = layer.querySelector('.kwe-aperture-fill');
    const line = layer.querySelector('.kwe-aperture-line');
    const eyebrow = layer.querySelector('.kwe-aperture-eyebrow');
    const animations = [];
    let started = false;
    let done = false;
    let finishTimer, handoffTimer;
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
      clearTimeout(finishTimer);clearTimeout(handoffTimer);
      root.classList.remove('aperture-handoff');
      window.removeEventListener('resize', resized);
      document.removeEventListener('visibilitychange', visibilityChanged);
      animations.forEach(animation => animation.cancel());
      video.pause();
      settle();
      root.style.overflow = previousOverflow;
      const restoreFocus = layer.contains(document.activeElement);
      layer.remove();
      inertTargets.forEach(([el,previous])=>el.inert=previous);
      if (restoreFocus) document.querySelector('.flight-launch')?.focus({ preventScroll: true });
      window.removeEventListener('hashchange', finish);
      window.removeEventListener('pagehide', finish);
      reduced.removeEventListener?.('change', motionChanged);

    };
    const animate = (element, frames, duration, delay = 0, easing = 'cubic-bezier(.22,1,.36,1)') => {
      const animation=element.animate(frames, {duration, delay, easing, fill:'both'});
      animations.push(animation);return animation;
    };
    const start = () => {
      if (started || done) return;
      started = true;
      if (reduced.matches || !layer.animate) { finish(); return; }
      settle();
      if(heading){const headingStyle=getComputedStyle(heading);title.style.fontFamily=headingStyle.fontFamily;title.style.fontWeight=headingStyle.fontWeight;title.style.letterSpacing='-.045em';}
      video.muted = true;
      video.play().catch(() => film.classList.remove('is-loading')); // Poster carries the same composition if embedded autoplay is blocked.
      finishTimer = setTimeout(finish, 6500);
      root.classList.add('aperture-handoff');
      animate(line, [{transform:'scaleX(0)'},{transform:'scaleX(1)',offset:.7},{transform:'scaleX(1)',opacity:0}], 850);
      animate(film, [{clipPath:'inset(49.85% 0)'},{clipPath:'inset(24% 0)'}], 1250, 250);
      animate(title, [{opacity:0,transform:'scale(.92)'},{opacity:1,transform:'scale(1)'}], 1150, 300);
      // Extend the reveal above/below the tight line box so tall glyphs fill completely.
      animate(fill, [{clipPath:'inset(-.5em 100% -.5em -.12em)'},{clipPath:'inset(-.5em -.12em -.5em -.12em)'}], 1300, 650, 'cubic-bezier(.4,0,.6,1)');
      animate(eyebrow, [{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}], 650, 1250);
      // Carry the same title into the real homepage heading while the aperture opens.
      handoffTimer=setTimeout(()=>{
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
          animate(eyebrow,[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-18px)'}],450);
          clearTimeout(finishTimer);finishTimer=setTimeout(finish,1860);
        }catch{finish();}
      },2400);
    };
    // Mobile browser address bars change height without changing the layout width.
    function resized(){if(started && Math.abs(innerWidth-initialWidth)>2)finish();}
    function visibilityChanged(){if(document.hidden)finish();}
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
      Promise.race([document.fonts.ready,new Promise(resolve=>setTimeout(resolve,1200))]).then(start);
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
