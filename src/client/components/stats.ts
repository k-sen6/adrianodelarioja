import { qs } from '../utils/dom';

export function initStats(): void {
  const section = qs('#stats-section') as HTMLElement | null;
  if (!section) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const counters = section.querySelectorAll<HTMLElement>('.stat-number[data-target]');
          counters.forEach((el) => {
            const target = parseInt(el.getAttribute('data-target') ?? '0', 10);
            let current = 0;
            const timer = setInterval(() => {
              current += Math.ceil(target / 50);
              if (current >= target) {
                el.textContent = String(target);
                clearInterval(timer);
              } else {
                el.textContent = String(current);
              }
            }, 30);
          });
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.5 }
  );

  observer.observe(section);
}
