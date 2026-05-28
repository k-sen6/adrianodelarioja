// js/main.js
import { supabase, checkConnection } from './supabase-client.js';
import { login, logout, loadSession, getCurrentUser } from './auth.js';
import { loadCart, addToCart, removeFromCart, getCart } from './cart.js';
import { showSimpleNotification } from './ui.js';
import { CONFIG } from './config.js';

// Exponer funciones globalmente
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
  // Verificar conexión
  const isConnected = await checkConnection();
  if (!isConnected) {
    showSimpleNotification('⚠️ Problemas de conexión', 'error');
  }
  
  // Cargar sesión guardada
  const savedUser = await loadSession();
  if (savedUser) {
    const userNameSpan = document.getElementById('userNameDisplay');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (userNameSpan) userNameSpan.textContent = `✦ ${savedUser.name}`;
    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'flex';
    await loadCart();
  }
  
  // Configurar eventos
  setupEventListeners();
  
  // Cargar productos (necesitas implementar esta función si no existe)
  if (typeof loadProducts === 'function') {
    await loadProducts();
  } else {
    console.warn('[main] loadProducts no está definida');
  }
  
  // Hero image
  const heroImg = document.getElementById('heroImage');
  const heroPlaceholder = document.getElementById('heroPlaceholder');
  if (heroImg) {
    heroImg.onload = () => {
      heroImg.classList.add('loaded');
      if (heroPlaceholder) heroPlaceholder.style.opacity = '0';
    };
    if (heroImg.complete) heroImg.classList.add('loaded');
  }
  
  // Ocultar loader
  setTimeout(() => {
    const loader = document.getElementById('loadingPlaceholder');
    if (loader) {
      loader.classList.add('hidden');
      setTimeout(() => loader.style.display = 'none', 500);
    }
  }, 800);
});

function setupEventListeners() {
  // Login
  const modal = document.getElementById('loginModal');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const submitLoginBtn = document.getElementById('submitLoginBtn');
  
  if (loginBtn) {
    loginBtn.onclick = () => {
      if (modal) modal.classList.add('active');
    };
  }
  
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      logout();
      location.reload();
    };
  }
  
  if (submitLoginBtn) {
    submitLoginBtn.onclick = async () => {
      const name = document.getElementById('loginName')?.value.trim();
      const phone = document.getElementById('loginPhone')?.value.trim();
      
      if (!name || !phone) {
        showSimpleNotification('Completa todos los campos', 'error');
        return;
      }
      
      try {
        const user = await login(name, phone);
        if (user) {
          if (modal) modal.classList.remove('active');
          const userNameSpan = document.getElementById('userNameDisplay');
          const loginBtnElem = document.getElementById('loginBtn');
          const logoutBtnElem = document.getElementById('logoutBtn');
          
          if (userNameSpan) userNameSpan.textContent = `✦ ${user.name}`;
          if (loginBtnElem) loginBtnElem.style.display = 'none';
          if (logoutBtnElem) logoutBtnElem.style.display = 'flex';
          await loadCart();
          showSimpleNotification(`✨ Bienvenido`, 'success');
        }
      } catch (error) {
        showSimpleNotification(error.message, 'error');
      }
    };
  }
  
  // Carrito
  const cartBtn = document.getElementById('cartBtn');
  const closeCartBtn = document.getElementById('closeCartBtn');
  const cartSidebar = document.getElementById('cartSidebar');
  
  if (cartBtn) {
    cartBtn.onclick = () => {
      if (cartSidebar) cartSidebar.classList.add('open');
    };
  }
  
  if (closeCartBtn) {
    closeCartBtn.onclick = () => {
      if (cartSidebar) cartSidebar.classList.remove('open');
    };
  }
  
  // WhatsApp
  const whatsappBtn = document.getElementById('whatsappBtn');
  if (whatsappBtn) {
    whatsappBtn.onclick = () => {
      const cart = getCart();
      if (!cart.length) {
        showSimpleNotification('⚠️ Agrega productos al carrito', 'error');
        return;
      }
      
      const user = getCurrentUser();
      const items = cart.map(item => `• ${item.products?.name} - €${item.products?.price}`).join('%0A');
      const total = cart.reduce((sum, item) => sum + (item.products?.price || 0), 0);
      const userName = user ? user.name : 'Cliente';
      const userPhone = user ? user.phone : 'No registrado';
      
      const message = `✨ *PEDIDO - ADRIANO DE LA RIOJA* ✨%0A%0A👤 *Cliente:* ${userName}%0A📱 *WhatsApp:* ${userPhone}%0A%0A📦 *PRODUCTOS:*%0A${items}%0A%0A💰 *TOTAL:* €${total}%0A%0A📍 *Retiro:* Obispo #508, La Habana Vieja`;
      
      window.open(`https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${message}`, '_blank');
    };
  }
  
  // Back to top
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    backToTop.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  // Menú móvil
  const menuIcon = document.getElementById('menuIcon');
  const navLinks = document.getElementById('navLinks');
  if (menuIcon && navLinks) {
    menuIcon.onclick = () => navLinks.classList.toggle('active');
  }
  
  // Scroll header
  window.addEventListener('scroll', () => {
    const header = document.getElementById('stickyHeader');
    const backBtn = document.getElementById('backToTop');
    
    if (window.scrollY > 30) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
    
    if (window.scrollY > 500) {
      backBtn?.classList.add('visible');
    } else {
      backBtn?.classList.remove('visible');
    }
  });
}
