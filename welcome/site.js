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


// Full-page star field: ported from Mars Society Egypt so the atmosphere
// remains continuous while moving between Soliq sections.
function mountEarthStarfield(canvas) {
  if (!canvas) return;
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(max-width: 760px)');
  let width = 0;
  let height = 0;
  let dpr = 1;
  let stars = [];
  let raf = 0;
  let lastTime = 0;
  let visible = false;
  let disposed = false;
  let seed = 73129;

  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, mobile.matches ? 1.15 : 1.5);
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed = 73129;
    const count = mobile.matches ? 260 : Math.min(900, Math.max(520, Math.round(width * height / 2200)));
    stars = Array.from({ length: count }, (_, index) => {
      const layer = index % 3;
      return {
        x: random() * width,
        y: random() * height,
        radius: layer === 0 ? .38 + random() * .46 : layer === 1 ? .5 + random() * .7 : .72 + random() * 1.0,
        alpha: .23 + random() * (layer === 2 ? .52 : .34),
        phase: random() * Math.PI * 2,
        twinkle: .1 + random() * .26,
        speedX: (random() - .5) * (1.1 + layer * .75),
        speedY: (.45 + random() * .9) * (layer + 1) * .38,
        warm: random() > .78,
        layer
      };
    });
    draw(0);
  };

  const draw = time => {
    if (disposed) return;
    context.clearRect(0, 0, width, height);
    for (const star of stars) {
      const shimmer = reducedMotion.matches ? 1 : 1 + Math.sin(time * .00055 + star.phase) * star.twinkle;
      const opacity = Math.max(.10, Math.min(.96, star.alpha * shimmer));
      context.beginPath();
      context.fillStyle = star.warm
        ? `rgba(255, 204, 170, ${opacity})`
        : `rgba(237, 242, 255, ${opacity})`;
      context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      context.fill();
      if (star.layer === 2 && star.radius > 1.2) {
        context.strokeStyle = `rgba(255, 218, 190, ${opacity * .16})`;
        context.lineWidth = .5;
        context.beginPath();
        context.moveTo(star.x - 3.5, star.y);
        context.lineTo(star.x + 3.5, star.y);
        context.moveTo(star.x, star.y - 3.5);
        context.lineTo(star.x, star.y + 3.5);
        context.stroke();
      }
    }
  };

  const shouldShow = () => true;

  const render = time => {
    raf = 0;
    if (disposed || !visible || document.hidden) return;
    const delta = lastTime ? Math.min((time - lastTime) / 1000, .05) : 0;
    lastTime = time;
    if (!reducedMotion.matches) {
      for (const star of stars) {
        star.x += star.speedX * delta * (2.0 + star.layer * 1.4);
        star.y += star.speedY * delta * (2.0 + star.layer * 1.4);
        if (star.x < -5) star.x = width + 5;
        if (star.x > width + 5) star.x = -5;
        if (star.y > height + 5) star.y = -5;
      }
    }
    draw(time);
    if (!reducedMotion.matches) raf = requestAnimationFrame(render);
  };

  const updateVisibility = () => {
    const nextVisible = shouldShow();
    canvas.style.opacity = nextVisible ? '.91' : '0';
    if (nextVisible && !visible) {
      visible = true;
      lastTime = 0;
      draw(performance.now());
      if (!reducedMotion.matches && !document.hidden && !raf) raf = requestAnimationFrame(render);
    } else if (!nextVisible && visible) {
      visible = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }
  };

  const onMotionPreference = () => {
    if (reducedMotion.matches) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      draw(performance.now());
    } else if (visible && !document.hidden && !raf) {
      raf = requestAnimationFrame(render);
    }
  };

  const onVisibilityChange = () => {
    if (document.hidden) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    } else if (visible && !reducedMotion.matches && !raf) {
      raf = requestAnimationFrame(render);
    }
  };

  resize();
  updateVisibility();
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('scroll', updateVisibility, { passive: true });
  document.addEventListener('visibilitychange', onVisibilityChange);
  reducedMotion.addEventListener?.('change', onMotionPreference);
  mobile.addEventListener?.('change', resize);

  return () => {
    disposed = true;
    if (raf) cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    window.removeEventListener('scroll', updateVisibility);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    reducedMotion.removeEventListener?.('change', onMotionPreference);
    mobile.removeEventListener?.('change', resize);
    context.clearRect(0, 0, width, height);
  };
}

mountEarthStarfield(document.querySelector('#earth-stars'));
