import { qs, clearElement, createElement, setImageSrc } from '../utils/dom';
import { fetchProducts } from '../lib/products';
import { addToCart, getCartCount } from '../lib/cart';
import { toggleWishlist, isInWishlist, getWishlistCount } from '../lib/wishlist';
import { getCurrentUser } from '../lib/auth';
import { showNotification } from '../lib/notifications';
import { updateCartUI } from './cart-sidebar';
import type { Product, FilterCategory } from '../types';

let allProducts: Product[] = [];
let currentFilter: FilterCategory = 'all';
let currentSearch = '';
let currentPage = 1;
const ITEMS_PER_PAGE = 6;

export async function initProductGrid(): Promise<void> {
  await loadProducts();

  document.querySelectorAll<HTMLElement>('[data-filter-btn]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll<HTMLElement>('[data-filter-btn]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = (btn.getAttribute('data-filter') as FilterCategory) || 'all';
      currentPage = 1;
      renderProducts();
    });
  });

  const searchInput = document.querySelector<HTMLInputElement>('#search-input');
  if (searchInput) {
    let timer: ReturnType<typeof setTimeout>;
    searchInput.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        currentSearch = searchInput.value;
        currentPage = 1;
        renderProducts();
      }, 300);
    });
  }
}

async function loadProducts(): Promise<void> {
  const container = document.getElementById('product-grid');
  if (!container) return;

  try {
    allProducts = await fetchProducts();
    currentPage = 1;
    renderProducts();
  } catch {
    container.textContent = '';
    container.appendChild(
      createElement('div', { class: 'loading' }, ['Error al cargar productos'])
    );
  }
}

function getFiltered(): Product[] {
  let filtered = currentFilter === 'all'
    ? allProducts
    : allProducts.filter((p) => p.category === currentFilter);

  if (currentSearch.trim()) {
    const q = currentSearch.trim().toLowerCase();
    filtered = filtered.filter((p) => p.name.toLowerCase().includes(q));
  }

  return filtered;
}

function renderProducts(): void {
  const container = document.getElementById('product-grid');
  const paginationContainer = document.getElementById('pagination-controls');
  if (!container) return;

  const filtered = getFiltered();
  container.textContent = '';

  if (filtered.length === 0) {
    container.appendChild(
      createElement('div', { class: 'loading' }, ['✨ No hay productos en esta categoría ✨'])
    );
    renderPagination(0, paginationContainer);
    return;
  }

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = filtered.slice(start, start + ITEMS_PER_PAGE);

  for (const product of pageItems) {
    container.appendChild(createProductCard(product));
  }

  renderPagination(totalPages, paginationContainer);
}

function createProductCard(product: Product): HTMLElement {
  const card = createElement('div', { class: 'product-card' });

  const img = document.createElement('img');
  img.src = product.image_url;
  img.alt = product.name;
  img.loading = 'lazy';
  setImageSrc(img, product.image_url, 'https://i.postimg.cc/6QSkBPyF/Hero.webp');

  const info = createElement('div', { class: 'product-info' });
  const name = createElement('div', { class: 'product-name' }, [product.name]);
  const price = createElement('div', { class: 'product-price' }, [`€${product.price}`]);
  const actions = createElement('div', { class: 'product-actions' });

  const isFav = isInWishlist(product.id);
  const wishlistBtn = createElement('button', {
    class: `product-btn${isFav ? ' wishlist-active' : ''}`,
    'aria-label': isFav ? 'Quitar de favoritos' : 'Añadir a favoritos',
  });
  wishlistBtn.innerHTML = `<svg class="icon" viewBox="0 0 24 24" fill="${isFav ? 'var(--gold)' : 'none'}" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
  wishlistBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const user = getCurrentUser();
    if (!user) {
      showNotification('🔐 Inicia sesión primero');
      openLoginModal();
      return;
    }
    const success = await toggleWishlist(product.id);
    if (success) {
      const active = isInWishlist(product.id);
      wishlistBtn.classList.toggle('wishlist-active', active);
      wishlistBtn.innerHTML = `<svg class="icon" viewBox="0 0 24 24" fill="${active ? 'var(--gold)' : 'none'}" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
      showNotification(active ? '✨ Añadido a favoritos' : '❤️ Eliminado de favoritos');
      updateWishlistCount();
    }
  });

  const cartBtn = createElement('button', { class: 'product-btn', 'aria-label': 'Añadir al carrito' });
  cartBtn.innerHTML = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`;
  cartBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const user = getCurrentUser();
    if (!user) {
      showNotification('🔐 Inicia sesión primero');
      openLoginModal();
      return;
    }
    const success = await addToCart(product.id);
    if (success) {
      showNotification(`✨ ${product.name} añadido`);
      updateCartCount();
      updateCartUI();
    } else {
      showNotification('⚠️ El producto ya está en el carrito');
    }
  });

  actions.appendChild(wishlistBtn);
  actions.appendChild(cartBtn);
  info.appendChild(name);
  info.appendChild(price);
  info.appendChild(actions);
  card.appendChild(img);
  card.appendChild(info);

  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--x', `${((e.clientX - rect.left) / rect.width) * 100}%`);
    card.style.setProperty('--y', `${((e.clientY - rect.top) / rect.height) * 100}%`);
  });

  return card;
}

function renderPagination(totalPages: number, container: HTMLElement | null): void {
  if (!container) return;
  container.textContent = '';

  if (totalPages <= 1) return;

  const wrapper = createElement('div', { class: 'pagination' });

  const prevBtn = createElement('button', {
    class: 'page-btn',
  }, ['‹ Anterior']);
  if (currentPage <= 1) prevBtn.setAttribute('disabled', '');
  prevBtn.addEventListener('click', () => goToPage(currentPage - 1));

  const info = createElement('span', { class: 'page-info' }, [`Página ${currentPage} de ${totalPages}`]);

  const nextBtn = createElement('button', {
    class: 'page-btn',
  }, ['Siguiente ›']);
  if (currentPage >= totalPages) nextBtn.setAttribute('disabled', '');
  nextBtn.addEventListener('click', () => goToPage(currentPage + 1));

  wrapper.appendChild(prevBtn);
  wrapper.appendChild(info);
  wrapper.appendChild(nextBtn);
  container.appendChild(wrapper);
}

function goToPage(page: number): void {
  const totalPages = Math.ceil(getFiltered().length / ITEMS_PER_PAGE);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderProducts();
  document.getElementById('product-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function openLoginModal(): void {
  document.getElementById('login-modal')?.classList.add('active');
}

export function updateCartCount(): void {
  const el = document.getElementById('cart-count');
  if (el) el.textContent = String(getCartCount());
}

export function updateWishlistCount(): void {
  const el = document.getElementById('wishlist-count');
  if (el) el.textContent = String(getWishlistCount());
}
