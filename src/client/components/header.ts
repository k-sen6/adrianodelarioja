import { qs, on, toggleClass } from '../utils/dom';

export function initHeader(): void {
  const header = qs('#sticky-header') as HTMLElement | null;
  const menuIcon = qs('#menu-icon') as HTMLElement | null;
  const navLinks = qs('#nav-links') as HTMLElement | null;
  const backBtn = qs('#back-to-top') as HTMLElement | null;

  if (!header) return;

  on(window, 'scroll', () => {
    const y = window.scrollY;
    toggleClass(header, 'scrolled', y > 30);

    if (backBtn) {
      toggleClass(backBtn, 'visible', y > 500);
    }
  });

  if (menuIcon && navLinks) {
    on(menuIcon, 'click', () => {
      toggleClass(navLinks, 'active');
    });

    navLinks.querySelectorAll('a[data-nav]').forEach((link) => {
      (link as HTMLElement).addEventListener('click', () => {
        navLinks.classList.remove('active');
      });
    });
  }
}
