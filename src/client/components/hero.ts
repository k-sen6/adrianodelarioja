import { qs, on, addClass } from '../utils/dom';

export function initHero(): void {
  const heroImg = qs('#hero-image') as HTMLImageElement | null;
  const heroPlaceholder = qs('#hero-placeholder') as HTMLElement | null;
  const typedEl = qs('#typed-text') as HTMLElement | null;

  if (heroImg) {
    const onLoad = () => {
      addClass(heroImg, 'loaded');
      if (heroPlaceholder) {
        heroPlaceholder.style.opacity = '0';
      }
    };

    if (heroImg.complete) {
      onLoad();
    } else {
      on(heroImg, 'load', onLoad);
    }
  }

  if (typedEl) {
    initTypedText(typedEl);
  }
}

function initTypedText(el: HTMLElement): void {
  const phrases = [
    'Vestir con oficio...',
    'durar sin prisa.',
    'Artesanía contemporánea.',
    'Alta costura cubana.',
    'Elegancia atemporal.',
    'Hecho a mano en La Habana.',
  ];

  let phraseIndex = 0;
  let charIndex = 0;
  let deleting = false;

  function type(): void {
    const current = phrases[phraseIndex] ?? '';

    if (deleting) {
      el.textContent = current.substring(0, Math.max(0, charIndex - 1));
      charIndex = Math.max(0, charIndex - 1);
    } else {
      el.textContent = current.substring(0, charIndex + 1);
      charIndex = Math.min(current.length, charIndex + 1);
    }

    if (!deleting && charIndex === current.length) {
      deleting = true;
      setTimeout(type, 2000);
      return;
    }

    if (deleting && charIndex === 0) {
      deleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      setTimeout(type, 300);
      return;
    }

    setTimeout(type, deleting ? 50 : 80);
  }

  type();
}
