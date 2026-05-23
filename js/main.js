// js/main.js
import { checkConnection } from './supabase-client.js';
import { login, logout, loadSession, getCurrentUser } from './auth.js';
import { loadCart, addToCart, removeFromCart, getCart } from './cart.js';
import { showSimpleNotification } from './ui.js';

// Exponer funciones globalmente
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;

const WHATSAPP_NUMBER = '5350979465';

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Iniciando aplicación...');
  
  // Verificar conexión
  const isConnected = await checkConnection();
  if (!isConnected) {
    showSimpleNotification('⚠️ Problemas de conexión', 'error');
  }
  
  // Cargar sesión
  const savedUser = loadSession();
  if (savedUser) {
    document.getElementById('userNameDisplay').textContent = `✦ ${savedUser.name}`;
    document.getElementById('loginBtn').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'flex';
    await loadCart();
  }
  
  // Configurar eventos
  setupEventListeners();
  
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
  
  console.log('✅ Aplicación inicializada');
});

function setupEventListeners() {
  // Login
  const modal = document.getElementById('loginModal');
  document.getElementById('loginBtn').onclick = () => modal?.classList.add('active');
  document.getElementById('logoutBtn').onclick = () => {
    logout();
    location.reload();
  };
  
  document.getElementById('submitLoginBtn').onclick = async () => {
    const name = document.getElementById('loginName')?.value.trim();
    const phone = document.getElementById('loginPhone')?.value.trim();
    
    if (!name || !phone) {
      showSimpleNotification('Completa todos los campos', 'error');
      return;
    }
    
    try {
      const user = await login(name, phone);
      if (user) {
        modal?.classList.remove('active');
        document.getElementById('userNameDisplay').textContent = `✦ ${user.name}`;
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('logoutBtn').style.display = 'flex';
        await loadCart();
        showSimpleNotification(`✨ Bienvenido, ${name} ✨`, 'success');
      }
    } catch (error) {
      showSimpleNotification(error.message, 'error');
    }
  };
  
  // Carrito
  document.getElementById('cartBtn').onclick = () => {
    document.getElementById('cartSidebar')?.classList.add('open');
  };
  document.getElementById('closeCartBtn').onclick = () => {
    document.getElementById('cartSidebar')?.classList.remove('open');
  };
  
  // WhatsApp
  document.getElementById('whatsappBtn').onclick = () => {
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
    
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
  };
  
  // Back to top
  document.getElementById('backToTop').onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Menú móvil
  document.getElementById('menuIcon').onclick = () => {
    document.getElementById('navLinks')?.classList.toggle('active');
  };
  
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
