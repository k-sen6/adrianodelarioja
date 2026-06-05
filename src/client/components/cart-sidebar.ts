import { qs, on, clearElement, createElement } from '../utils/dom';
import { getCart, getCartTotal, getCartCount, removeFromCart } from '../lib/cart';
import { getCurrentUser } from '../lib/auth';
import { getWhatsAppNumber } from '../lib/supabase';
import { showNotification } from '../lib/notifications';

export function initCart(): void {
  const cartBtn = qs('#cart-btn') as HTMLElement | null;
  const closeBtn = qs('#close-cart-btn') as HTMLElement | null;
  const sidebar = qs('#cart-sidebar') as HTMLElement | null;
  const whatsappBtn = qs('#whatsapp-btn') as HTMLElement | null;

  if (cartBtn && sidebar) {
    on(cartBtn, 'click', () => sidebar.classList.add('open'));
  }

  if (closeBtn && sidebar) {
    on(closeBtn, 'click', () => sidebar.classList.remove('open'));
  }

  if (whatsappBtn) {
    on(whatsappBtn, 'click', enviarWhatsApp);
  }
}

export function updateCartUI(): void {
  const container = document.getElementById('cart-items');
  const totalSpan = document.getElementById('cart-total');
  const countSpan = document.getElementById('cart-count');
  if (!container) return;

  const items = getCart();
  const total = getCartTotal();

  container.textContent = '';

  if (items.length === 0) {
    container.appendChild(
      createElement('div', { class: 'loading' }, ['✨ Tu carrito está vacío ✨'])
    );
    if (totalSpan) totalSpan.textContent = ' CUP0';
    if (countSpan) countSpan.textContent = '0';
    return;
  }

  for (const item of items) {
    const cartItem = createElement('div', { class: 'cart-item' });

    const img = document.createElement('img');
    img.className = 'cart-item-image';
    img.src = item.products?.image_url ?? '';
    img.alt = item.products?.name ?? 'Producto';
    img.addEventListener('error', () => {
      img.src = 'https://i.postimg.cc/6QSkBPyF/Hero.webp';
    }, { once: true });

    const details = createElement('div', { class: 'cart-item-details' });
    const nameEl = createElement('div', { class: 'cart-item-name' }, [item.products?.name ?? 'Producto']);
    const priceEl = createElement('div', { class: 'cart-item-price' }, [` CUP${item.products?.price ?? 0}`]);
    details.appendChild(nameEl);
    details.appendChild(priceEl);

    const removeBtn = createElement('button', { class: 'cart-item-remove', 'aria-label': 'Eliminar' }, ['🗑️']);
    removeBtn.addEventListener('click', async () => {
      const success = await removeFromCart(item.id);
      if (success) {
        updateCartUI();
        showNotification(`${item.products?.name ?? 'Producto'} eliminado`);
      }
    });

    cartItem.appendChild(img);
    cartItem.appendChild(details);
    cartItem.appendChild(removeBtn);
    container.appendChild(cartItem);
  }

  if (totalSpan) totalSpan.textContent = ` CUP${total}`;
  if (countSpan) countSpan.textContent = String(getCartCount());
}

function enviarWhatsApp(): void {
  const items = getCart();
  if (items.length === 0) {
    showNotification('⚠️ Agrega productos al carrito primero');
    return;
  }

  const user = getCurrentUser();
  const waNumber = getWhatsAppNumber();
  const productLines = items
    .map((item) => `• ${item.products?.name} -  CUP${item.products?.price}`)
    .join('%0A');
  const total = getCartTotal();
  const userName = user ? user.name : 'Cliente';
  const userPhone = user ? user.phone : 'No registrado';

  const message = [
    `✨ *PEDIDO - ADRIANO DE LA RIOJA* ✨`,
    ``,
    `👤 *Cliente:* ${userName}`,
    `📱 *WhatsApp:* ${userPhone}`,
    ``,
    `📦 *PRODUCTOS:*`,
    `${productLines}`,
    ``,
    `💰 *TOTAL:*  CUP${total}`,
    ``,
    `📍 *Retiro:* Obispo #508, La Habana Vieja`,
  ].join('%0A');

  window.open(`https://wa.me/${waNumber}?text=${message}`, '_blank');
}
