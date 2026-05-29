const SUPABASE_URL = window.__APP_CONFIG__?.supabaseUrl || '__SUPABASE_URL__';
const SUPABASE_KEY = window.__APP_CONFIG__?.supabaseKey || '__SUPABASE_ANON_KEY__';

if (!SUPABASE_URL || SUPABASE_URL.startsWith('__')) {
  document.getElementById('loginError').textContent = '❌ Configuración de Supabase no inyectada';
}

const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let currentSession = null;

let loginAttempts = 0;
let loginBlockedUntil = 0;
const MAX_LOGIN_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 30000;

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function(m) {
        switch (m) {
            case '&': return '&amp;';
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '"': return '&quot;';
            case "'": return '&#x27;';
            default: return m;
        }
    });
}

function showNotification(msg, isError = false) {
    const n = document.getElementById('notification');
    n.textContent = msg;
    n.classList.add('show');
    if (isError) n.classList.add('error');
    else n.classList.remove('error');
    setTimeout(() => n.classList.remove('show'), 3000);
}

function checkLoginRateLimit() {
    const now = Date.now();
    if (now < loginBlockedUntil) {
        const remaining = Math.ceil((loginBlockedUntil - now) / 1000);
        document.getElementById('rateLimitMsg').style.display = 'block';
        document.getElementById('rateLimitMsg').textContent = `Demasiados intentos. Espera ${remaining} segundos.`;
        return false;
    }
    document.getElementById('rateLimitMsg').style.display = 'none';
    return true;
}

async function checkSession() {
    const { data: { session } } = await _supabase.auth.getSession();
    if (session) {
        currentSession = session;
        document.getElementById('loginPanel').style.display = 'none';
        document.getElementById('adminContent').style.display = 'block';
        await loadData();
    } else {
        document.getElementById('loginPanel').style.display = 'flex';
        document.getElementById('adminContent').style.display = 'none';
    }
}

async function login() {
    if (!checkLoginRateLimit()) return;

    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;
    
    if (!email || !password) {
        showNotification('❌ Completa todos los campos', true);
        return;
    }

    const loginBtn = document.getElementById('loginBtn');
    loginBtn.disabled = true;
    loginBtn.textContent = 'Ingresando...';
    
    const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
    
    loginBtn.disabled = false;
    loginBtn.textContent = 'Ingresar';
    
    if (error) {
        loginAttempts++;
        document.getElementById('loginError').textContent = 'Email o contraseña incorrectos';
        showNotification('❌ Error al iniciar sesión', true);
        
        if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
            loginBlockedUntil = Date.now() + BLOCK_DURATION_MS;
            document.getElementById('rateLimitMsg').style.display = 'block';
            document.getElementById('rateLimitMsg').textContent = 'Demasiados intentos. Espera 30 segundos.';
            
            setTimeout(() => {
                loginAttempts = 0;
                loginBlockedUntil = 0;
                document.getElementById('rateLimitMsg').style.display = 'none';
            }, BLOCK_DURATION_MS);
        }
    } else {
        loginAttempts = 0;
        document.getElementById('loginError').textContent = '';
        document.getElementById('adminPassword').value = '';
        currentSession = data.session;
        document.getElementById('loginPanel').style.display = 'none';
        document.getElementById('adminContent').style.display = 'block';
        await loadData();
        showNotification('✅ Sesión iniciada correctamente');
    }
}

async function logout() {
    await _supabase.auth.signOut();
    currentSession = null;
    document.getElementById('loginPanel').style.display = 'flex';
    document.getElementById('adminContent').style.display = 'none';
}

async function loadData() {
    await loadProducts();
    await loadStats();
    await loadCarts();
}

async function loadProducts() {
    const { data, error } = await _supabase.from('products').select('*').order('id', { ascending: false });
    if (error) { showNotification('Error cargando productos', true); return; }
    
    document.getElementById('totalProducts').textContent = data.length;
    const tbody = document.getElementById('productsList');
    tbody.innerHTML = data.map(p => {
        const safeName = escapeHtml(p.name);
        const safeImage = escapeHtml(p.image_url);
        const safeCategory = escapeHtml(p.category);
        return `
        <tr>
            <td><img src="${safeImage}" class="product-image" onerror="this.src='https://placehold.co/50x60'"></td>
            <td>${p.id}</td>
            <td>${safeName}</td>
            <td>€${p.price}</td>
            <td>${safeCategory}</td>
            <td>
                <button class="btn-edit" onclick="openEditModal(${p.id})">✏️</button>
                <button class="btn-danger" onclick="openDeleteModal(${p.id})">🗑️</button>
            </td>
        </tr>
    `}).join('');
}

async function loadStats() {
    const { count: cartCount } = await _supabase.from('cart').select('*', { count: 'exact', head: true });
    document.getElementById('totalCarts').textContent = cartCount || 0;
    const { count: userCount } = await _supabase.from('users').select('*', { count: 'exact', head: true });
    document.getElementById('totalUsers').textContent = userCount || 0;
}

async function loadCarts() {
    const { data, error } = await _supabase.from('cart').select('id, user_id, products(name, price), created_at').order('created_at', { ascending: false }).limit(20);
    if (error) { return; }
    
    const userIds = [...new Set(data.map(c => c.user_id))];
    const { data: users } = await _supabase.from('users').select('id, name, phone').in('id', userIds);
    const userMap = {};
    users?.forEach(u => userMap[u.id] = u);
    
    const tbody = document.getElementById('cartsList');
    if (!data.length) { tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hay pedidos aún</td></tr>'; return; }
    
    tbody.innerHTML = data.map(cart => {
        const user = userMap[cart.user_id] || { name: 'Usuario', phone: '-' };
        const products = cart.products ? [cart.products] : [];
        const total = products.reduce((sum, p) => sum + (p?.price || 0), 0);
        const productNames = products.map(p => p?.name).filter(Boolean).join(', ');
        const date = cart.created_at ? new Date(cart.created_at).toLocaleDateString() : '-';
        const safeName = escapeHtml(user.name || 'Usuario');
        const safePhone = escapeHtml(user.phone || '-');
        const safeProducts = escapeHtml(productNames || '-');
        return `<tr><td>${safeName}</td><td>${safePhone}</td><td>${safeProducts}</td><td>€${total}</td><td>${date}</td></tr>`;
    }).join('');
}

async function addProduct() {
    const name = document.getElementById('prodName').value.trim();
    const price = parseFloat(document.getElementById('prodPrice').value);
    const category = document.getElementById('prodCategory').value;
    const image_url = document.getElementById('prodImage').value.trim();
    
    if (!name) { showNotification('❌ El nombre es requerido', true); return; }
    if (isNaN(price) || price <= 0) { showNotification('❌ Precio inválido', true); return; }
    if (!image_url) { showNotification('❌ La URL de la imagen es requerida', true); return; }
    
    const { error } = await _supabase.from('products').insert({ name, price, category, image_url });
    if (error) { showNotification('❌ Error al añadir', true); }
    else {
        showNotification('✅ Producto añadido correctamente');
        document.getElementById('prodName').value = '';
        document.getElementById('prodPrice').value = '';
        document.getElementById('prodImage').value = '';
        await loadProducts();
        await loadStats();
    }
}

let editingProductId = null;
let deletingProductId = null;

window.openEditModal = async function(id) {
  const { data, error } = await _supabase.from('products').select('name, price').eq('id', id).single();
  if (error) { showNotification('❌ Error al cargar producto', true); return; }
  editingProductId = id;
  document.getElementById('editName').value = data.name || '';
  document.getElementById('editPrice').value = data.price || '';
  document.getElementById('editModal').style.display = 'flex';
};

window.closeEditModal = function() {
  editingProductId = null;
  document.getElementById('editModal').style.display = 'none';
};

window.saveEdit = async function() {
  if (!editingProductId) return;
  const name = document.getElementById('editName').value.trim();
  const price = parseFloat(document.getElementById('editPrice').value);
  if (!name) { showNotification('❌ El nombre es requerido', true); return; }
  if (isNaN(price) || price <= 0) { showNotification('❌ Precio inválido', true); return; }
  const { error } = await _supabase.from('products').update({ name, price }).eq('id', editingProductId);
  if (error) { showNotification('❌ Error al editar', true); }
  else { showNotification('✅ Producto editado correctamente'); await loadProducts(); }
  closeEditModal();
};

window.openDeleteModal = function(id) {
  deletingProductId = id;
  document.getElementById('deleteModal').style.display = 'flex';
};

window.closeDeleteModal = function() {
  deletingProductId = null;
  document.getElementById('deleteModal').style.display = 'none';
};

window.confirmDelete = async function() {
  if (!deletingProductId) return;
  const { error } = await _supabase.from('products').delete().eq('id', deletingProductId);
  if (error) { showNotification('❌ Error al eliminar', true); }
  else { showNotification('✅ Producto eliminado'); await loadProducts(); await loadStats(); }
  closeDeleteModal();
};

document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    document.getElementById('loginBtn').onclick = login;
    document.getElementById('logoutBtn').onclick = logout;
    document.getElementById('addProductBtn').onclick = addProduct;
    document.getElementById('adminPassword').addEventListener('keypress', (e) => { if (e.key === 'Enter') login(); });
});
