import { qs, qsa } from '../utils/dom';

export function initScrollReveal(): void {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      }
    },
    { threshold: 0.1 }
  );

  qsa('.reveal').forEach((el) => observer.observe(el));
}

export function initScrollProgress(): void {
  const bar = qs('#scroll-progress') as HTMLElement | null;
  if (!bar) return;

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = `${Math.min(percent, 100)}%`;
  });
}

export function initLoadingScreen(): void {
  setTimeout(() => {
    const loader = qs('#loading-placeholder') as HTMLElement | null;
    if (loader) {
      loader.classList.add('hidden');
      setTimeout(() => {
        loader.style.display = 'none';
      }, 500);
    }
  }, 800);
}
