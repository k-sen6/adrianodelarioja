import { qs, qsa, addClass, removeClass } from '../utils/dom';

export function initLightbox(): void {
  const lightbox = qs('#lightbox') as HTMLElement | null;
  const img = qs('#lightbox-img') as HTMLImageElement | null;
  const closeBtn = qs('#lightbox-close') as HTMLElement | null;
  const prevBtn = qs('#lightbox-prev') as HTMLElement | null;
  const nextBtn = qs('#lightbox-next') as HTMLElement | null;
  const counter = qs('#lightbox-counter') as HTMLElement | null;

  if (!lightbox || !img) return;

  const lb = lightbox;
  const im = img;

  let images: string[] = [];
  let currentIndex = 0;

  function open(index: number): void {
    currentIndex = index;
    im.src = images[currentIndex] ?? '';
    if (counter) counter.textContent = `${currentIndex + 1}/${images.length}`;
    addClass(lb, 'active');
    document.body.style.overflow = 'hidden';
  }

  function close(): void {
    removeClass(lb, 'active');
    document.body.style.overflow = '';
  }

  function prev(): void {
    if (images.length === 0) return;
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    im.src = images[currentIndex] ?? '';
    if (counter) counter.textContent = `${currentIndex + 1}/${images.length}`;
  }

  function next(): void {
    if (images.length === 0) return;
    currentIndex = (currentIndex + 1) % images.length;
    im.src = images[currentIndex] ?? '';
    if (counter) counter.textContent = `${currentIndex + 1}/${images.length}`;
  }

  function updateGallery(): void {
    const galleryImgs = qsa('.gallery-item img') as NodeListOf<HTMLImageElement>;
    images = Array.from(galleryImgs).map((el) => el.src);

    galleryImgs.forEach((el, idx) => {
      el.addEventListener('click', () => open(idx));
      el.style.cursor = 'pointer';
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', close);
  if (prevBtn) prevBtn.addEventListener('click', prev);
  if (nextBtn) nextBtn.addEventListener('click', next);

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (!lb.classList.contains('active')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
  });

  updateGallery();

  const observer = new MutationObserver(() => updateGallery());
  observer.observe(document.body, { childList: true, subtree: true });
}
