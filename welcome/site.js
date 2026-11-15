import { mountOutlook } from '../outlook-view.js';
import { mountEarthScene } from './earth-scene.js';

mountOutlook(document.querySelector('#living-outlook'));
mountEarthScene({
  canvas: document.querySelector('#earth-canvas'),
  rail: document.querySelector('.planet-rail-global'),
  story: document.querySelector('.earth-story'),
  status: document.querySelector('#earth-status')
});

const menuToggle = document.querySelector('.menu-toggle');
const primaryNav = document.querySelector('#primary-nav');

function closeMenu() {
  if (!menuToggle || !primaryNav) return;
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Open navigation');
  primaryNav.classList.remove('is-open');
}

menuToggle?.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
  primaryNav?.classList.toggle('is-open', !isOpen);
});

primaryNav?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeMenu();
});

const revealTargets = document.querySelectorAll('.story-copy, .challenge-signals, .approach-list, .workflow-grid article, .data-card, .research-copy, .project-card');
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .12 });
  revealTargets.forEach(element => observer.observe(element));
}
