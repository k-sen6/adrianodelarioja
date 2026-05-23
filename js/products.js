// js/products.js
import { supabase } from './supabase-client.js';

let allProducts = [];
let currentFilter = 'all';

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
  renderProducts();
}

export function renderProducts() {
  let filtered = currentFilter === 'all' 
    ? allProducts 
    : allProducts.filter(p => p.category === currentFilter);
  
  const container = document.getElementById('productGrid');
  if (!container) return;
  
  if (!filtered.length) {
    container.innerHTML = '<div class="loading">✨ No hay productos en esta categoría ✨</div>';
    return;
  }
  
  container.innerHTML = filtered.map(p => `
    <div class="product-card">
      <img src="${p.image_url}" alt="${p.name}" onerror="this.src='https://i.postimg.cc/6QSkBPyF/Hero.webp'">
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-price">€${p.price}</div>
        <div class="product-actions">
          <button class="product-btn" onclick="window.addToCart(${p.id}, '${p.name}', ${p.price}, '${p.image_url}')">
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
}

export function filterProducts(category) {
  currentFilter = category;
  renderProducts();
}

export function getAllProducts() {
  return allProducts;
}
