// terminal.js - extracted terminal intro animation

/*
  This script runs the terminal-style intro animation once per session using localStorage.
  It mirrors the previous inline implementation but is now in its own file (deferred).
*/

(function(){
  const OVERLAY_ID = 'terminal-overlay';
  const LINES_ID = 'terminal-lines';
  const MAIN_ID = 'main-content';
  const STORAGE_KEY = 'terminal_seen';

  const messages = [
    '> Initializing system...',
    '> Loading security modules...',
    '> Connecting to threat intelligence feeds...',
    '> Access granted.'
  ];

  const typingSpeed = 36; // ms per character
  const lineDelay = 650; // ms between lines
  const finalDelay = 700; // ms after last line before fade

  const overlay = document.getElementById(OVERLAY_ID);
  const linesContainer = document.getElementById(LINES_ID);
  const main = document.getElementById(MAIN_ID);

  function sleep(ms){return new Promise(res=>setTimeout(res,ms))}

  function createLine(){
    const el = document.createElement('div');
    el.className = 'term-line';
    linesContainer.appendChild(el);
    return el;
  }

  async function typeText(el,text){
    el.textContent = '';
    const cursor = document.createElement('span');
    cursor.className = 'cursor';
    el.appendChild(cursor);

    for(let i=0;i<text.length;i++){
      cursor.insertAdjacentText('beforebegin',text[i]);
      await sleep(typingSpeed + Math.random()*30);
    }

    await sleep(120);
    cursor.remove();
  }

  async function runSequence(){
    for(let i=0;i<messages.length;i++){
      const line = createLine();
      await typeText(line,messages[i]);
      await sleep(lineDelay + Math.random()*120);
    }

    try{localStorage.setItem(STORAGE_KEY,'1')}catch(e){}

    await sleep(finalDelay);
    overlay.classList.add('fade-out');
    main.style.opacity = '1';

    setTimeout(()=>{
      overlay.style.display='none';
      overlay.setAttribute('aria-hidden','true');
    },820);
  }

  function init(){
    const seen = (()=>{try{return localStorage.getItem(STORAGE_KEY)}catch(e){return null}})();
    if(seen){
      overlay.style.display='none';
      overlay.setAttribute('aria-hidden','true');
      main.style.opacity = '1';
      return;
    }

    window.requestAnimationFrame(()=>{
      linesContainer.innerHTML = '';
      runSequence().catch(err=>{overlay.style.display='none';main.style.opacity='1';console.error('Terminal intro error:',err);});
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else init();

})();
