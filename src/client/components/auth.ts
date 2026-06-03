import { qs, on } from '../utils/dom';
import { loginUser, loadSession, logoutUser, getCurrentUser } from '../lib/auth';
import { loadCart } from '../lib/cart';
import { loadWishlist } from '../lib/wishlist';
import { showNotification } from '../lib/notifications';
import { updateCartUI } from './cart-sidebar';
import { updateCartCount, updateWishlistCount } from './product-grid';

export async function initAuth(): Promise<void> {
  const user = await loadSession();
  if (user) {
    updateAuthUI(user.name);
    await Promise.all([loadCart(), loadWishlist()]);
    updateCartUI();
    updateCartCount();
    updateWishlistCount();
  }

  const loginBtn = qs('#login-btn') as HTMLElement | null;
  const logoutBtn = qs('#logout-btn') as HTMLElement | null;
  const submitBtn = qs('#submit-login-btn') as HTMLElement | null;
  const loginModal = qs('#login-modal') as HTMLElement | null;
  const nameInput = qs('#login-name') as HTMLInputElement | null;
  const phoneInput = qs('#login-phone') as HTMLInputElement | null;
  const errorSpan = qs('#login-error') as HTMLElement | null;

  if (loginBtn && loginModal) {
    on(loginBtn, 'click', () => {
      loginModal.classList.add('active');
      if (errorSpan) errorSpan.textContent = '';
    });
  }

  if (logoutBtn) {
    on(logoutBtn, 'click', () => {
      logoutUser();
      updateAuthUI(null);
      showNotification('Sesión cerrada');
      updateCartUI();
      updateCartCount();
      updateWishlistCount();
    });
  }

  if (loginModal) {
    on(loginModal, 'click', (e: Event) => {
      const target = e.target as HTMLElement;
      if (target === loginModal) {
        loginModal.classList.remove('active');
      }
    });
  }

  if (submitBtn && nameInput && phoneInput) {
    on(submitBtn, 'click', async () => {
      if (errorSpan) errorSpan.textContent = '';

      const name = nameInput.value.trim();
      const phone = phoneInput.value.trim();

      if (!name) {
        if (errorSpan) errorSpan.textContent = 'Ingresa tu nombre';
        return;
      }
      if (!phone) {
        if (errorSpan) errorSpan.textContent = 'Ingresa tu número de teléfono';
        return;
      }

      submitBtn.setAttribute('disabled', '');
      submitBtn.textContent = '...';

      try {
        const user = await loginUser(name, phone);
        updateAuthUI(user.name);
        if (loginModal) loginModal.classList.remove('active');
        showNotification(`✨ Bienvenido, ${user.name} ✨`);
        await Promise.all([loadCart(), loadWishlist()]);
        updateCartUI();
        updateCartCount();
        updateWishlistCount();
        nameInput.value = '';
        phoneInput.value = '';
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al iniciar sesión';
        if (errorSpan) errorSpan.textContent = message;
        showNotification('❌ Error al iniciar sesión', 'error');
      } finally {
        submitBtn.removeAttribute('disabled');
        submitBtn.textContent = 'Continuar →';
      }
    });

    phoneInput.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        submitBtn.click();
      }
    });
  }
}

export function updateAuthUI(userName: string | null): void {
  const displaySpan = document.getElementById('user-name-display');
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');

  if (displaySpan) {
    displaySpan.textContent = userName ? `✦ ${userName}` : '';
  }
  if (loginBtn) {
    loginBtn.style.display = userName ? 'none' : '';
  }
  if (logoutBtn) {
    logoutBtn.style.display = userName ? '' : 'none';
  }
}
