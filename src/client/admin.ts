import { getSupabaseClient, getWhatsAppNumber } from './lib/supabase';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from './lib/products';
import { showNotification, showError } from './lib/notifications';
import { validatePrice } from './utils/sanitize';

let supabaseClient: ReturnType<typeof window.supabase.createClient>;
let editingProductId: number | null = null;
let deletingProductId: number | null = null;
let loginAttempts = 0;
let loginBlockedUntil = 0;
const MAX_LOGIN_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 30_000;

async function init(): Promise<void> {
  try {
    supabaseClient = getSupabaseClient();
  } catch {
    showError('Configuración de Supabase no disponible');
    return;
  }

  setupLogin();
  setupLogout();
  setupProductForm();
  setupEditModal();
  setupDeleteModal();

  await checkSession();
}

function getEl<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

// ========== AUTH ==========

function checkLoginRateLimit(): boolean {
  const now = Date.now();
  const rateMsg = getEl<HTMLElement>('rate-limit-msg');
  if (!rateMsg) return true;

  if (now < loginBlockedUntil) {
    const remaining = Math.ceil((loginBlockedUntil - now) / 1000);
    rateMsg.style.display = 'block';
    rateMsg.textContent = `Demasiados intentos. Espera ${remaining} segundos.`;
    return false;
  }

  rateMsg.style.display = 'none';
  return true;
}

async function checkSession(): Promise<void> {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
      showAdminPanel();
      await loadData();
    } else {
      showLoginPanel();
    }
  } catch {
    showLoginPanel();
  }
}

async function handleLogin(): Promise<void> {
  if (!checkLoginRateLimit()) return;

  const emailInput = getEl<HTMLInputElement>('admin-email');
  const passwordInput = getEl<HTMLInputElement>('admin-password');
  const errorEl = getEl<HTMLElement>('login-error');
  const loginBtn = getEl<HTMLButtonElement>('admin-login-btn');

  if (!emailInput || !passwordInput || !loginBtn) return;

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showError('Completa todos los campos');
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = 'Ingresando...';

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      loginAttempts++;
      if (errorEl) errorEl.textContent = 'Email o contraseña incorrectos';
      showError('Error al iniciar sesión');

      if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        loginBlockedUntil = Date.now() + BLOCK_DURATION_MS;
        const rateMsg = getEl<HTMLElement>('rate-limit-msg');
        if (rateMsg) {
          rateMsg.style.display = 'block';
          rateMsg.textContent = 'Demasiados intentos. Espera 30 segundos.';
        }
        setTimeout(() => {
          loginAttempts = 0;
          loginBlockedUntil = 0;
          if (rateMsg) rateMsg.style.display = 'none';
        }, BLOCK_DURATION_MS);
      }
      return;
    }

    loginAttempts = 0;
    if (errorEl) errorEl.textContent = '';
    passwordInput.value = '';
    showAdminPanel();
    await loadData();
    showNotification('✅ Sesión iniciada correctamente');
  } catch {
    showError('Error de conexión');
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Ingresar';
  }
}

async function handleLogout(): Promise<void> {
  await supabaseClient.auth.signOut();
  showLoginPanel();
}

function showLoginPanel(): void {
  const loginPanel = getEl<HTMLElement>('login-panel');
  const adminContent = getEl<HTMLElement>('admin-content');
  if (loginPanel) loginPanel.style.display = 'flex';
  if (adminContent) adminContent.style.display = 'none';
}

function showAdminPanel(): void {
  const loginPanel = getEl<HTMLElement>('login-panel');
  const adminContent = getEl<HTMLElement>('admin-content');
  if (loginPanel) loginPanel.style.display = 'none';
  if (adminContent) adminContent.style.display = 'block';
}

function setupLogin(): void {
  const loginBtn = getEl<HTMLButtonElement>('admin-login-btn');
  const passwordInput = getEl<HTMLInputElement>('admin-password');
  if (loginBtn) loginBtn.addEventListener('click', handleLogin);
  if (passwordInput) {
    passwordInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleLogin();
    });
  }
}

function setupLogout(): void {
  const logoutBtn = getEl<HTMLButtonElement>('admin-logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
}

// ========== DATA LOADING ==========

async function loadData(): Promise<void> {
  await Promise.all([
    loadProductsTable(),
    loadStats(),
    loadCarts(),
  ]);
}

async function loadProductsTable(): Promise<void> {
  const tbody = getEl<HTMLElement>('products-list');
  if (!tbody) return;

  try {
    const products = await fetchProducts();

    const totalEl = getEl<HTMLElement>('total-products');
    if (totalEl) totalEl.textContent = String(products.length);

    tbody.textContent = '';

    for (const p of products) {
      const tr = document.createElement('tr');

      const tdImg = document.createElement('td');
      const img = document.createElement('img');
      img.className = 'product-image';
      img.src = p.image_url;
      img.alt = p.name;
      img.addEventListener('error', () => { img.src = 'https://placehold.co/50x60'; }, { once: true });
      tdImg.appendChild(img);

      const tdId = document.createElement('td');
      tdId.textContent = String(p.id);

      const tdName = document.createElement('td');
      tdName.textContent = p.name;

      const tdPrice = document.createElement('td');
      tdPrice.textContent = `€${p.price}`;

      const tdCat = document.createElement('td');
      tdCat.textContent = p.category;

      const tdActions = document.createElement('td');

      const editBtn = document.createElement('button');
      editBtn.className = 'btn-edit';
      editBtn.textContent = '✏️';
      editBtn.addEventListener('click', () => openEditModal(p.id));
      tdActions.appendChild(editBtn);

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-danger';
      deleteBtn.textContent = '🗑️';
      deleteBtn.addEventListener('click', () => openDeleteModal(p.id));
      tdActions.appendChild(deleteBtn);

      tr.appendChild(tdImg);
      tr.appendChild(tdId);
      tr.appendChild(tdName);
      tr.appendChild(tdPrice);
      tr.appendChild(tdCat);
      tr.appendChild(tdActions);
      tbody.appendChild(tr);
    }
  } catch {
    tbody.textContent = '';
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 6;
    td.className = 'empty-message';
    td.textContent = 'Error al cargar productos';
    tr.appendChild(td);
    tbody.appendChild(tr);
  }
}

async function loadStats(): Promise<void> {
  try {
    const cartRes = await supabaseClient
      .from('cart')
      .select('*', { count: 'exact', head: true });
    const userRes = await supabaseClient
      .from('users')
      .select('*', { count: 'exact', head: true });

    const cartsEl = getEl<HTMLElement>('total-carts');
    const usersEl = getEl<HTMLElement>('total-users');

    if (cartsEl) cartsEl.textContent = String(cartRes.count ?? 0);
    if (usersEl) usersEl.textContent = String(userRes.count ?? 0);
  } catch {
    // Stats are non-critical
  }
}

async function loadCarts(): Promise<void> {
  const tbody = getEl<HTMLElement>('carts-list');
  if (!tbody) return;

  try {
    const { data: rawData } = await supabaseClient
      .from('cart')
      .select('id, user_id, products(name, price), created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    const data: Array<{ id: number; user_id: string; products: { name: string; price: number } | null; created_at: string | null }> = (rawData ?? []) as typeof data;

    if (data.length === 0) {
      tbody.textContent = '';
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 5;
      td.className = 'empty-message';
      td.textContent = 'No hay pedidos aún';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    const userIds = [...new Set(data.map((c) => c.user_id))];
    const { data: rawUsers } = await supabaseClient
      .from('users')
      .select('id, name, phone')
      .in('id', userIds);

    const users: Array<{ id: string; name: string; phone: string }> = (rawUsers ?? []) as typeof users;
    const userMap: Record<string, { name: string; phone: string }> = {};
    users.forEach((u) => {
      userMap[u.id] = u;
    });

    tbody.textContent = '';

    for (const cart of data) {
      const user = userMap[cart.user_id] ?? { name: 'Usuario', phone: '-' };
      const products = cart.products ? [cart.products] : [];
      const total = products.reduce((sum: number, p: { price?: number }) => sum + (p?.price ?? 0), 0);
      const productNames = products.map((p: { name?: string }) => p?.name).filter(Boolean).join(', ');
      const date = cart.created_at
        ? new Date(cart.created_at).toLocaleDateString()
        : '-';

      const tr = document.createElement('tr');
      const cells = [
        user.name, user.phone, productNames || '-', `€${total}`, date,
      ];
      for (const text of cells) {
        const td = document.createElement('td');
        td.textContent = text;
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
  } catch {
    tbody.textContent = '';
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.className = 'empty-message';
    td.textContent = 'Error al cargar pedidos';
    tr.appendChild(td);
    tbody.appendChild(tr);
  }
}

// ========== PRODUCT CRUD ==========

function setupProductForm(): void {
  const addBtn = getEl<HTMLButtonElement>('add-product-btn');
  if (!addBtn) return;

  addBtn.addEventListener('click', async () => {
    const nameInput = getEl<HTMLInputElement>('prod-name');
    const priceInput = getEl<HTMLInputElement>('prod-price');
    const categorySelect = getEl<HTMLSelectElement>('prod-category');
    const imageInput = getEl<HTMLInputElement>('prod-image');

    if (!nameInput || !priceInput || !categorySelect || !imageInput) return;

    const name = nameInput.value.trim();
    const price = parseFloat(priceInput.value);
    const category = categorySelect.value;
    const image_url = imageInput.value.trim();

    if (!name) { showError('❌ El nombre es requerido'); return; }
    if (!validatePrice(price)) { showError('❌ Precio inválido'); return; }
    if (!image_url) { showError('❌ La URL de la imagen es requerida'); return; }

    try {
      await createProduct({ name, price, category, image_url });
      showNotification('✅ Producto añadido correctamente');
      nameInput.value = '';
      priceInput.value = '';
      imageInput.value = '';
      await loadProductsTable();
      await loadStats();
    } catch {
      showError('❌ Error al añadir producto');
    }
  });
}

function setupEditModal(): void {
  const saveBtn = getEl<HTMLButtonElement>('save-edit-btn');
  const cancelBtn = getEl<HTMLButtonElement>('cancel-edit-btn');
  const modal = getEl<HTMLElement>('edit-modal');

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      if (!editingProductId) return;

      const nameInput = getEl<HTMLInputElement>('edit-name');
      const priceInput = getEl<HTMLInputElement>('edit-price');

      if (!nameInput || !priceInput) return;

      const name = nameInput.value.trim();
      const price = parseFloat(priceInput.value);

      if (!name) { showError('❌ El nombre es requerido'); return; }
      if (!validatePrice(price)) { showError('❌ Precio inválido'); return; }

      try {
        await updateProduct(editingProductId, { name, price });
        showNotification('✅ Producto editado correctamente');
        closeEditModal();
        await loadProductsTable();
      } catch {
        showError('❌ Error al editar');
      }
    });
  }

  if (cancelBtn) cancelBtn.addEventListener('click', closeEditModal);
  if (modal) modal.addEventListener('click', (e) => {
    if (e.target === modal) closeEditModal();
  });
}

async function openEditModal(id: number): Promise<void> {
  try {
    const { data, error } = await supabaseClient
      .from('products')
      .select('name, price')
      .eq('id', id)
      .single();

    if (error || !data) {
      showError('❌ Error al cargar producto');
      return;
    }

    const product = data as { name: string; price: number };

    editingProductId = id;
    const nameInput = getEl<HTMLInputElement>('edit-name');
    const priceInput = getEl<HTMLInputElement>('edit-price');
    if (nameInput) nameInput.value = product.name ?? '';
    if (priceInput) priceInput.value = String(product.price ?? '');

    const modal = getEl<HTMLElement>('edit-modal');
    if (modal) modal.classList.add('active');
  } catch {
    showError('❌ Error al cargar producto');
  }
}

function closeEditModal(): void {
  editingProductId = null;
  const modal = getEl<HTMLElement>('edit-modal');
  if (modal) modal.classList.remove('active');
}

function setupDeleteModal(): void {
  const confirmBtn = getEl<HTMLButtonElement>('confirm-delete-btn');
  const cancelBtn = getEl<HTMLButtonElement>('cancel-delete-btn');
  const modal = getEl<HTMLElement>('delete-modal');

  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      if (!deletingProductId) return;

      try {
        await deleteProduct(deletingProductId);
        showNotification('✅ Producto eliminado');
        closeDeleteModal();
        await loadProductsTable();
        await loadStats();
      } catch {
        showError('❌ Error al eliminar');
      }
    });
  }

  if (cancelBtn) cancelBtn.addEventListener('click', closeDeleteModal);
  if (modal) modal.addEventListener('click', (e) => {
    if (e.target === modal) closeDeleteModal();
  });
}

function openDeleteModal(id: number): void {
  deletingProductId = id;
  const modal = getEl<HTMLElement>('delete-modal');
  if (modal) modal.classList.add('active');
}

function closeDeleteModal(): void {
  deletingProductId = null;
  const modal = getEl<HTMLElement>('delete-modal');
  if (modal) modal.classList.remove('active');
}

document.addEventListener('DOMContentLoaded', () => {
  init().catch((err) => {
    console.error('[admin] Init error:', err);
  });
});
