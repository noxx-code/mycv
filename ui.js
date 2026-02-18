// ui.js
// Handles smooth scrolling and reveal-on-scroll animations

(function(){
  // Smooth scroll for anchor links
  document.addEventListener('click', function(e){
    const a = e.target.closest('a');
    if(!a) return;
    const href = a.getAttribute('href');
    if(!href || !href.startsWith('#')) return;
    const target = document.querySelector(href);
    if(!target) return;
    e.preventDefault();
    target.scrollIntoView({behavior:'smooth',block:'start'});
    history.replaceState(null,'',href);
  });

  // Reveal elements on scroll using IntersectionObserver
  const reveals = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    const obs = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add('in-view');
        }
      });
    },{threshold:0.08});
    reveals.forEach(r=>obs.observe(r));
  } else {
    // Fallback: show all
    reveals.forEach(r=>r.classList.add('in-view'));
  }

  // When terminal overlay finishes, ensure main-content gets focus for accessibility
  document.addEventListener('DOMContentLoaded', ()=>{
    const main = document.getElementById('main-content');
    if(main) main.setAttribute('tabindex','-1');
  });

})();
