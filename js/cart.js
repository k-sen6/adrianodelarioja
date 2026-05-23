// js/cart.js
import { supabase } from './supabase-client.js';
import { getCurrentUser } from './auth.js';
import { showNotification } from './ui.js';

let cart = [];

// Cargar carrito
export async function loadCart() {
  const user = getCurrentUser();
  if (!user) {
    cart = [];
    updateCartUI();
    return cart;
  }
  
  try {
    const { data, error } = await supabase
      .from('cart')
      .select('id, product_id, products(id,name,price,image_url,category)')
      .eq('user_id', user.id);
    
    if (error) throw error;
    
    cart = data || [];
    updateCartUI();
    document.getElementById('cartCount').textContent = cart.length;
    return cart;
    
  } catch (error) {
    console.error('Error loading cart:', error);
    cart = [];
    updateCartUI();
    return cart;
  }
}

// Añadir al carrito
export async function addToCart(productId, productName, productPrice, productImage) {
  const user = getCurrentUser();
  if (!user) {
    showNotification({ name: 'Inicia sesión' }, 'login_required');
    document.getElementById('loginModal').classList.add('active');
    return false;
  }
  
  const exists = cart.find(i => i.product_id === productId);
  if (exists) {
    showNotification({ name: productName, image_url: productImage }, 'already_exists');
    return false;
  }
  
  try {
    const { error } = await supabase
      .from('cart')
      .insert({ user_id: user.id, product_id: productId });
    
    if (error) throw error;
    
    await loadCart();
    
    showNotification(
      { name: productName, image_url: productImage },
      'added',
      () => removeFromCartDirect(productId, productName)
    );
    return true;
    
  } catch (error) {
    console.error('Error adding to cart:', error);
    showNotification({ name: productName }, 'error');
    return false;
  }
}

// Eliminar directamente
async function removeFromCartDirect(productId, productName) {
  const item = cart.find(i => i.product_id === productId);
  if (!item) return;
  
  try {
    await supabase.from('cart').delete().eq('id', item.id);
    await loadCart();
  } catch (error) {
    console.error('Error:', error);
  }
}

// Eliminar del carrito
export async function removeFromCart(cartId, productName, productImage, productId, productPrice) {
  try {
    await supabase.from('cart').delete().eq('id', cartId);
    await loadCart();
    
    showNotification(
      { name: productName, image_url: productImage },
      'removed',
      () => addToCart(productId, productName, productPrice, productImage)
    );
  } catch (error) {
    console.error('Error:', error);
    showNotification({ name: productName }, 'error');
  }
}

// Actualizar UI
function updateCartUI() {
  const container = document.getElementById('cartItems');
  const totalSpan = document.getElementById('cartTotal');
  
  if (!container) return;
  
  if (!cart.length) {
    container.innerHTML = '<div class="loading">✨ Tu carrito está vacío ✨</div>';
    if (totalSpan) totalSpan.textContent = '€0';
    return;
  }
  
  let total = 0;
  container.innerHTML = cart.map(item => {
    const price = item.products?.price || 0;
    total += price;
    return `
      <div class="cart-item">
        <img class="cart-item-image" src="${item.products?.image_url || 'https://i.postimg.cc/6QSkBPyF/Hero.webp'}" 
             onerror="this.src='https://i.postimg.cc/6QSkBPyF/Hero.webp'">
        <div class="cart-item-details">
          <div class="cart-item-name">${item.products?.name || 'Producto'}</div>
          <div class="cart-item-price">€${price}</div>
        </div>
        <button class="cart-item-remove" 
                onclick="window.removeFromCart(${item.id}, '${item.products?.name || ''}', '${item.products?.image_url || ''}', ${item.product_id}, ${price})">
          🗑️
        </button>
      </div>
    `;
  }).join('');
  
  if (totalSpan) totalSpan.textContent = `€${total}`;
}

// Obtener carrito
export function getCart() {
  return cart;
}
