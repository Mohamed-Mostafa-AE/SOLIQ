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
  '.hero-copy > .eyebrow',
  '.hero-copy > h1',
  '.hero-copy > .hero-description',
  '.hero-copy > .hero-actions',
  '.hero-copy > .hero-disclaimer',
  '.story-panel:not(.hero-panel) h2',
  '.story-panel:not(.hero-panel) .panel-copy',
  '.story-panel:not(.hero-panel) .challenge-signals',
  '.story-panel:not(.hero-panel) .mini-data-grid',
  '.story-panel:not(.hero-panel) .approach-list',
  '.story-panel:not(.hero-panel) .scope-note',
  '.section-head h2',
  '.section-head .section-intro',
  '.workflow-grid article',
  '.data-card',
  '.research-layout h2',
  '.research-copy > *',
  '.project-card',
  '.field-bridge-copy > *',
  '.footer-brand-panel',
  '.footer-column'
].join(', '));

if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  revealTargets.forEach(element => {
    element.classList.add('text-reveal');
    if (/^H[1-3]$/.test(element.tagName)) element.classList.add('text-reveal-heading');
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-revealed');
      observer.unobserve(entry.target);
    });
  }, { threshold: .12, rootMargin: '0px 0px -10% 0px' });

  revealTargets.forEach(element => observer.observe(element));
}


// A restrained, code-generated star field behind the persistent Earth scene.
// Motion is slow and layered; it pauses off-screen and respects reduced-motion settings.
function mountEarthStarfield(canvas) {
  if (!canvas) return;
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) return;

  const rail = canvas.parentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 760px)');
  let width = 0;
  let height = 0;
  let dpr = 1;
  let stars = [];
  let frame = 0;
  let lastTime = 0;
  let visible = false;
  let disposed = false;
  let seed = 73129;

  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const draw = time => {
    if (!context || disposed) return;
    context.clearRect(0, 0, width, height);
    for (const star of stars) {
      const shimmer = reducedMotion.matches ? 1 : 1 + Math.sin(time * .00055 + star.phase) * star.twinkle;
      const alpha = Math.max(.12, Math.min(.9, star.alpha * shimmer));
      context.beginPath();
      context.fillStyle = star.warm
        ? `rgba(231, 222, 190, ${alpha})`
        : `rgba(220, 235, 232, ${alpha})`;
      context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      context.fill();
    }
  };

  const resize = () => {
    const bounds = rail.getBoundingClientRect();
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    dpr = Math.min(window.devicePixelRatio || 1, mobile.matches ? 1.1 : 1.35);
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed = 73129;
    const count = mobile.matches ? 220 : 390;
    stars = Array.from({ length: count }, () => {
      const layer = Math.floor(random() * 3);
      return {
        x: random() * width,
        y: random() * height,
        radius: layer === 0 ? .45 + random() * .4 : layer === 1 ? .65 + random() * .65 : .9 + random() * .8,
        alpha: .34 + random() * (layer === 2 ? .56 : .4),
        phase: random() * Math.PI * 2,
        twinkle: .08 + random() * .22,
        speedX: (random() - .5) * (.75 + layer * .48),
        speedY: (.16 + random() * .22) * (layer + 1)
      };
    });
    draw(performance.now());
  };

  const render = time => {
    frame = 0;
    if (disposed || !visible || document.hidden) return;
    const delta = lastTime ? Math.min((time - lastTime) / 1000, .05) : 0;
    lastTime = time;
    if (!reducedMotion.matches) {
      for (const star of stars) {
        star.x += star.speedX * delta;
        star.y += star.speedY * delta;
        if (star.x < -3) star.x = width + 3;
        if (star.x > width + 3) star.x = -3;
        if (star.y > height + 3) star.y = -3;
      }
    }
    draw(time);
    if (!reducedMotion.matches) frame = requestAnimationFrame(render);
  };

  const onVisibility = () => {
    if (document.hidden) {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    } else if (visible && !reducedMotion.matches && !frame) {
      lastTime = 0;
      frame = requestAnimationFrame(render);
    } else if (visible) draw(performance.now());
  };

  const observer = new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting);
    if (!visible) {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    } else if (!reducedMotion.matches && !document.hidden && !frame) {
      lastTime = 0;
      frame = requestAnimationFrame(render);
    } else {
      draw(performance.now());
    }
  }, { rootMargin: '100px' });

  observer.observe(rail);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(rail);
  document.addEventListener('visibilitychange', onVisibility);
  reducedMotion.addEventListener?.('change', onVisibility);
  mobile.addEventListener?.('change', resize);
  resize();

  return () => {
    disposed = true;
    if (frame) cancelAnimationFrame(frame);
    observer.disconnect();
    resizeObserver.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    reducedMotion.removeEventListener?.('change', onVisibility);
    mobile.removeEventListener?.('change', resize);
    context.clearRect(0, 0, width, height);
  };
}

mountEarthStarfield(document.querySelector('#earth-stars'));
