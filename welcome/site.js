import { mountOutlook } from '../outlook-view.js';

mountOutlook(document.querySelector('#living-outlook'));

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

primaryNav?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', closeMenu);
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeMenu();
});

const revealTargets = document.querySelectorAll('.story-grid, .method-line, .project-heading, .link-list a');
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .12 });
  revealTargets.forEach(element => {
    element.classList.add('reveal');
    observer.observe(element);
  });
}
