import { qs } from '../utils/dom';

export function initCursor(): void {
  const cursor = qs('#custom-cursor') as HTMLElement | null;
  if (!cursor) return;

  const prefersFine = window.matchMedia('(pointer: fine)').matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersFine || prefersReducedMotion) {
    cursor.style.display = 'none';
    return;
  }

  cursor.style.display = 'block';

  const c = cursor;

  let lastParticleTime = 0;

  document.addEventListener('mousemove', (e: MouseEvent) => {
    c.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;

    const now = Date.now();
    if (now - lastParticleTime > 60) {
      const particle = document.createElement('div');
      particle.className = 'cursor-particle';
      particle.style.left = `${e.clientX}px`;
      particle.style.top = `${e.clientY}px`;
      document.body.appendChild(particle);
      setTimeout(() => particle.remove(), 600);
      lastParticleTime = now;
    }
  });

  const interactiveSelector =
    'a, button, .product-btn, .filter-btn, .header-icon, .social-btn, .modal-content button, .close-cart, .cart-item-remove, .location-link, .nav-links a, .gallery-item, .back-to-top, .whatsapp-btn';

  function addHoverEvents(): void {
    document.querySelectorAll<HTMLElement>(interactiveSelector).forEach((el) => {
      if (el.getAttribute('data-cursor-listener')) return;
      el.setAttribute('data-cursor-listener', 'true');

      el.addEventListener('mouseenter', () => c.classList.add('hover'));
      el.addEventListener('mouseleave', () => c.classList.remove('hover'));
      el.addEventListener('mousedown', () => c.classList.add('click'));
      el.addEventListener('mouseup', () => c.classList.remove('click'));
    });
  }

  addHoverEvents();

  const observer = new MutationObserver(() => addHoverEvents());
  observer.observe(document.body, { childList: true, subtree: true });
}
