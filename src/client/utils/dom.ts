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
