// js/products.js
import { supabase } from './supabase-client.js';

let allProducts = [];
let currentFilter = 'all';
let currentSearch = '';
const ITEMS_PER_PAGE = 6;
let currentPage = 1;

export async function loadProducts() {
  const container = document.getElementById('productGrid');
  if (container) {
    container.innerHTML = '<div class="loading">Cargando productos...</div>';
  }

  const { data, error } = await supabase.from('products').select('*');

  if (error) {
    console.error('Error loading products:', error);
    if (container) {
      container.innerHTML = `<div class="loading">Error: ${error.message}</div>`;
    }
    return;
  }

  if (!data || data.length === 0) {
    if (container) {
      container.innerHTML = '<div class="loading">No hay productos.</div>';
    }
    return;
  }

  allProducts = data;
  currentPage = 1;
  renderProducts();
}

function getFiltered() {
  let filtered = currentFilter === 'all'
    ? allProducts
    : allProducts.filter(p => p.category === currentFilter);

  if (currentSearch.trim()) {
    const q = currentSearch.trim().toLowerCase();
    filtered = filtered.filter(p => p.name.toLowerCase().includes(q));
  }

  return filtered;
}

export function renderProducts() {
  const filtered = getFiltered();
  const container = document.getElementById('productGrid');
  if (!container) return;

  if (!filtered.length) {
    container.innerHTML = '<div class="loading">✨ No hay productos en esta categoría ✨</div>';
    renderPagination(0);
    return;
  }

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = filtered.slice(start, start + ITEMS_PER_PAGE);

  container.innerHTML = pageItems.map(p => `
    <div class="product-card">
      <img src="${p.image_url}" alt="${p.name}" loading="lazy" onerror="this.src='https://i.postimg.cc/6QSkBPyF/Hero.webp'">
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-price">€${p.price}</div>
        <div class="product-actions">
          <button class="product-btn" onclick="window.addToCart(${p.id}, '${p.name.replace(/'/g, "\\'")}', ${p.price}, '${p.image_url}')">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `).join('');

  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  const container = document.getElementById('paginationControls');
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div class="pagination">
      <button class="page-btn" onclick="window.goToPage(${currentPage - 1})" ${currentPage <= 1 ? 'disabled' : ''}>
        ‹ Anterior
      </button>
      <span class="page-info">Página ${currentPage} de ${totalPages}</span>
      <button class="page-btn" onclick="window.goToPage(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''}>
        Siguiente ›
      </button>
    </div>
  `;
}

window.goToPage = function(page) {
  const filtered = getFiltered();
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderProducts();
  document.getElementById('productGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export function filterProducts(category) {
  currentFilter = category;
  currentPage = 1;
  renderProducts();
}

window.filterProducts = filterProducts;

export function searchProducts(query) {
  currentSearch = query;
  currentPage = 1;
  renderProducts();
}

window.searchProducts = searchProducts;

export function getAllProducts() {
  return allProducts;
}
