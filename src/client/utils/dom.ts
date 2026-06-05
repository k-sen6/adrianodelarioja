const IMAGE_FALLBACK = 'https://i.postimg.cc/6QSkBPyF/Hero.webp';

export function qs(selector: string, parent: ParentNode = document): HTMLElement | null {
  return parent.querySelector(selector);
}

export function qsa(selector: string, parent: ParentNode = document): NodeListOf<Element> {
  return parent.querySelectorAll(selector);
}

export function clearElement(el: HTMLElement): void {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

export function setText(el: HTMLElement, text: string | number): void {
  el.textContent = String(text);
}

export function setImageSrc(img: HTMLImageElement, src: string, fallback: string): void {
  img.src = src;
  img.addEventListener('error', () => {
    img.src = fallback;
  }, { once: true });
}

export function toggleClass(el: HTMLElement, cls: string, force?: boolean): void {
  el.classList.toggle(cls, force);
}

export function addClass(el: HTMLElement, cls: string): void {
  el.classList.add(cls);
}

export function removeClass(el: HTMLElement, cls: string): void {
  el.classList.remove(cls);
}

export function on(
  el: HTMLElement | Document | Window,
  event: string,
  handler: EventListenerOrEventListenerObject,
  options?: AddEventListenerOptions
): void {
  el.addEventListener(event, handler, options);
}

export function createElement(
  tag: string,
  attrs?: Record<string, string | undefined>,
  children?: (string | Node)[]
): HTMLElement {
  const el = document.createElement(tag);

  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (value !== undefined) {
        el.setAttribute(key, value);
      }
    }
  }

  if (children) {
    for (const child of children) {
      if (typeof child === 'string') {
        el.appendChild(document.createTextNode(child));
      } else {
        el.appendChild(child);
      }
    }
  }

  return el;
}

export function createProductImage(
  src: string,
  alt: string,
  className?: string
): HTMLImageElement {
  const img = new Image();
  img.src = src;
  img.alt = alt;
  img.loading = 'lazy';
  if (className) img.className = className;
  img.addEventListener('error', () => {
    img.src = IMAGE_FALLBACK;
  }, { once: true });
  return img;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

export function createSvgIcon(pathD: string, fill: string = 'none'): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'icon');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', fill);
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('width', '18');
  svg.setAttribute('height', '18');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', pathD);
  svg.appendChild(path);
  return svg;
}

const HEART_PATH = 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z';
const CART_PATH = 'M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6';

export function createHeartIcon(filled: boolean): SVGSVGElement {
  return createSvgIcon(HEART_PATH, filled ? 'var(--gold)' : 'none');
}

export function createCartIcon(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'icon');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('width', '18');
  svg.setAttribute('height', '18');
  const c1 = document.createElementNS(SVG_NS, 'circle');
  c1.setAttribute('cx', '9');
  c1.setAttribute('cy', '21');
  c1.setAttribute('r', '1');
  const c2 = document.createElementNS(SVG_NS, 'circle');
  c2.setAttribute('cx', '20');
  c2.setAttribute('cy', '21');
  c2.setAttribute('r', '1');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', CART_PATH);
  svg.appendChild(c1);
  svg.appendChild(c2);
  svg.appendChild(path);
  return svg;
}
