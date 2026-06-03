import { describe, it, expect, vi } from 'vitest';

// Test the DOM utility functions
function createElement(tag: string, attrs?: Record<string, string>, children?: (string | Node)[]) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      el.setAttribute(key, value);
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

function clearElement(el: HTMLElement): void {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

function setText(el: HTMLElement, text: string | number): void {
  el.textContent = String(text);
}

describe('createElement', () => {
  it('should create an element with tag name', () => {
    const el = createElement('div');
    expect(el.tagName).toBe('DIV');
  });

  it('should set attributes', () => {
    const el = createElement('div', { class: 'foo', id: 'bar' });
    expect(el.getAttribute('class')).toBe('foo');
    expect(el.getAttribute('id')).toBe('bar');
  });

  it('should append text children', () => {
    const el = createElement('p', {}, ['Hello', ' ', 'World']);
    expect(el.textContent).toBe('Hello World');
  });

  it('should append node children', () => {
    const span = document.createElement('span');
    span.textContent = 'inner';
    const el = createElement('div', {}, [span]);
    expect(el.children.length).toBe(1);
    expect(el.children[0]?.textContent).toBe('inner');
  });
});

describe('clearElement', () => {
  it('should remove all children', () => {
    const el = document.createElement('div');
    el.appendChild(document.createElement('span'));
    el.appendChild(document.createElement('span'));
    expect(el.children.length).toBe(2);
    clearElement(el);
    expect(el.children.length).toBe(0);
  });
});

describe('setText', () => {
  it('should set textContent from string', () => {
    const el = document.createElement('div');
    setText(el, 'hello');
    expect(el.textContent).toBe('hello');
  });

  it('should set textContent from number', () => {
    const el = document.createElement('div');
    setText(el, 42);
    expect(el.textContent).toBe('42');
  });
});
