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

const revealTargets = document.querySelectorAll([
  '.story-panel:not(.hero-panel) h2',
  '.story-panel:not(.hero-panel) .panel-copy',
  '.story-panel:not(.hero-panel) .challenge-signals',
  '.story-panel:not(.hero-panel) .approach-list',
  '.section-head h2',
  '.section-head .section-intro',
  '.workflow-grid article',
  '.data-card',
  '.research-copy > *',
  '.project-card',
  '.field-bridge-copy > *',
  '.footer-brand-panel',
  '.footer-column'
].join(', '));

if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  revealTargets.forEach((element, index) => {
    element.classList.add('text-reveal');
    if (/^H[1-3]$/.test(element.tagName)) element.classList.add('text-reveal-heading');
    element.style.setProperty('--reveal-delay', `${(index % 4) * 75}ms`);
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-revealed');
      observer.unobserve(entry.target);
    });
  }, { threshold: .12, rootMargin: '0px 0px -8% 0px' });

  revealTargets.forEach(element => observer.observe(element));
}
