import { mountOutlook } from '../outlook-view.js';
mountOutlook(document.querySelector('#living-outlook'));
const revealTargets=document.querySelectorAll('.story-grid, .method-line, .project h2, .link-list a');
if('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches){
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}
    });
  },{threshold:.12});
  revealTargets.forEach(element=>{element.classList.add('reveal');observer.observe(element);});
}
