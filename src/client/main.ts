import { initHeader } from './components/header';
import { initHero } from './components/hero';
import { initProductGrid } from './components/product-grid';
import { initCart } from './components/cart-sidebar';
import { initAuth, updateAuthUI } from './components/auth';
import { initLightbox } from './components/lightbox';
import { initStats } from './components/stats';
import { initScrollReveal, initScrollProgress, initLoadingScreen } from './components/scroll-effects';
import { initCursor } from './components/custom-cursor';
import { loadSession, getCurrentUser } from './lib/auth';
import { loadCart } from './lib/cart';
import { loadWishlist } from './lib/wishlist';

async function main(): Promise<void> {
  initScrollReveal();
  initScrollProgress();
  initLoadingScreen();
  initCursor();
  initHeader();
  initHero();
  initLightbox();
  initStats();

  // Auth must be initialized before cart and product grid
  await initAuth();
  initCart();

  // Product grid depends on auth state (wishlist icons)
  await initProductGrid();
}

document.addEventListener('DOMContentLoaded', () => {
  main().catch((err) => {
    console.error('[adriano] Initialization error:', err);
  });
});
