// ============================================
// SUPABASE CONFIG - Claves inyectadas por GitHub Actions via config.js
// ============================================

const SUPABASE_URL = window.__APP_CONFIG__?.supabaseUrl || '__SUPABASE_URL__';
const SUPABASE_KEY = window.__APP_CONFIG__?.supabaseKey || '__SUPABASE_ANON_KEY__';

if (!SUPABASE_URL || SUPABASE_URL.startsWith('__')) {
    console.error('❌ SUPABASE_URL no configurada — esperando inyección de GitHub Actions');
}
if (!SUPABASE_KEY || SUPABASE_KEY.startsWith('__')) {
    console.error('❌ SUPABASE_ANON_KEY no configurada — esperando inyección de GitHub Actions');
}

const sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
console.log('🔒 Usando configuración inyectada (build:', window.__APP_CONFIG__?.buildRun || 'N/A', ')');

// ============================================
// ESTADO GLOBAL
// ============================================
let currentUser = null;
let allProducts = [];
let cart = [];
let wishlist = [];
let currentFilter = 'all';
let currentSearch = '';
let currentPage = 1;
const ITEMS_PER_PAGE = 6;

try {
    const savedUser = localStorage.getItem('adriano_user');
    if (savedUser) currentUser = JSON.parse(savedUser);
} catch(e) { console.error(e); }

// ============================================
// FUNCIONES GLOBALES
// ============================================
function showNotification(msg) {
    const n = document.getElementById('notification');
    n.textContent = msg;
    n.classList.add('show');
    setTimeout(() => n.classList.remove('show'), 2500);
}// ============================================
// CARGAR DATOS
// ============================================
async function loadCart() {
    if (!currentUser) { cart = []; updateCartUI(); document.getElementById('cartCount').textContent = '0'; return; }
    const { data } = await sbClient.from('cart').select('id,product_id,products(id,name,price,image_url,category)').eq('user_id', currentUser.id);
    cart = data || [];
    updateCartUI();
    document.getElementById('cartCount').textContent = cart.length;
}

async function loadWishlist() {
    if (!currentUser) { wishlist = []; document.getElementById('wishlistCount').textContent = '0'; renderProducts(); return; }
    const { data } = await sbClient.from('wishlist').select('product_id').eq('user_id', currentUser.id);
    wishlist = data?.map(w => w.product_id) || [];
    document.getElementById('wishlistCount').textContent = wishlist.length;
    renderProducts();
}

window.addToCart = async function(productId, productName, productPrice) {
    if (!currentUser) {
        showNotification('🔐 Inicia sesión primero');
        document.getElementById('loginModal').classList.add('active');
        return;
    }
    const exists = cart.find(i => i.product_id === productId);
    if (exists) { showNotification('⚠️ Producto ya está en el carrito'); return; }
    const { error } = await sbClient.from('cart').insert({ user_id: currentUser.id, product_id: productId });
    if (!error) { await loadCart(); showNotification(`✨ ${productName} añadido`); }
    else showNotification('❌ Error al añadir');
};

window.removeFromCart = async function(cartId, productName) {
    await sbClient.from('cart').delete().eq('id', cartId);
    await loadCart();
    showNotification(`${productName} eliminado`);
};

window.toggleWishlist = async function(productId) {
    if (!currentUser) {
        showNotification('🔐 Inicia sesión primero');
        document.getElementById('loginModal').classList.add('active');
        return;
    }
    const exists = wishlist.includes(productId);
    if (exists) {
        await sbClient.from('wishlist').delete().eq('user_id', currentUser.id).eq('product_id', productId);
        wishlist = wishlist.filter(id => id !== productId);
        showNotification('❤️ Eliminado de favoritos');
    } else {
        await sbClient.from('wishlist').insert({ user_id: currentUser.id, product_id: productId });
        wishlist.push(productId);
        showNotification('✨ Añadido a favoritos');
    }
    document.getElementById('wishlistCount').textContent = wishlist.length;
    renderProducts();
};

function updateCartUI() {
    const container = document.getElementById('cartItems');
    const totalSpan = document.getElementById('cartTotal');
    if (!cart.length) { container.innerHTML = '<div class="loading">✨ Tu carrito está vacío ✨</div>'; totalSpan.textContent = '€0'; return; }
    let total = 0;
    container.innerHTML = cart.map(item => {
        total += item.products.price;
        const safeName = escapeHtml(item.products.name);
        const safeImage = escapeHtml(item.products.image_url);
        const safeNameAttr = safeName.replace(/'/g, "\\'");
        return `<div class="cart-item">
            <img class="cart-item-image" src="${safeImage}" onerror="this.src='https://i.postimg.cc/6QSkBPyF/Hero.webp'">
            <div class="cart-item-details"><div class="cart-item-name">${safeName}</div><div class="cart-item-price">€${item.products.price}</div></div>
            <button class="cart-item-remove" onclick="removeFromCart(${item.id}, '${safeNameAttr}')">🗑️</button>
        </div>`;
    }).join('');
    totalSpan.textContent = `€${total}`;
}

async function loadProducts() {
    const container = document.getElementById('productGrid');
    container.innerHTML = '<div class="loading">Cargando productos...</div>';
    const { data, error } = await sbClient.from('products').select('*');
    if (error) { container.innerHTML = `<div class="loading">Error: ${error.message}</div>`; return; }
    if (!data || data.length === 0) { container.innerHTML = '<div class="loading">No hay productos.</div>'; return; }
    allProducts = data;
    currentPage = 1;
    renderProducts();
}

function getFiltered() {
    let filtered = currentFilter === 'all' ? allProducts : allProducts.filter(p => p.category === currentFilter);
    if (currentSearch.trim()) {
        const q = currentSearch.trim().toLowerCase();
        filtered = filtered.filter(p => p.name.toLowerCase().includes(q));
    }
    return filtered;
}

function renderProducts() {
    const filtered = getFiltered();
    const container = document.getElementById('productGrid');
    if (!filtered.length) {
        container.innerHTML = '<div class="loading">✨ No hay productos en esta categoría ✨</div>';
        renderPagination(0);
        return;
    }

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageItems = filtered.slice(start, start + ITEMS_PER_PAGE);

    container.innerHTML = pageItems.map(p => {
        const safeName = escapeHtml(p.name);
        const safeImage = escapeHtml(p.image_url);
        const safeNameAttr = safeName.replace(/'/g, "\\'");
        return `
        <div class="product-card">
            <img src="${safeImage}" alt="${safeName}" loading="lazy" onerror="this.src='https://i.postimg.cc/6QSkBPyF/Hero.webp'">
            <div class="product-info">
                <div class="product-name">${safeName}</div>
                <div class="product-price">€${p.price}</div>
                <div class="product-actions">
                    <button class="product-btn ${wishlist.includes(p.id) ? 'wishlist-active' : ''}" onclick="toggleWishlist(${p.id})">
                        <svg class="icon" viewBox="0 0 24 24" fill="${wishlist.includes(p.id) ? 'var(--gold)' : 'none'}" stroke="currentColor" stroke-width="2" width="18" height="18">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                    </button>
                    <button class="product-btn" onclick="addToCart(${p.id}, '${safeNameAttr}', ${p.price})">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                            <circle cx="9" cy="21" r="1"/>
                            <circle cx="20" cy="21" r="1"/>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `}).join('');

    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--x', ((e.clientX - rect.left) / rect.width) * 100 + '%');
            card.style.setProperty('--y', ((e.clientY - rect.top) / rect.height) * 100 + '%');
        });
    });

    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    const container = document.getElementById('paginationControls');
    if (!container) return;
    if (totalPages <= 1) { container.innerHTML = ''; return; }
    container.innerHTML = `
        <div class="pagination">
            <button class="page-btn" onclick="goToPage(${currentPage - 1})" ${currentPage <= 1 ? 'disabled' : ''}>‹ Anterior</button>
            <span class="page-info">Página ${currentPage} de ${totalPages}</span>
            <button class="page-btn" onclick="goToPage(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''}>Siguiente ›</button>
        </div>
    `;
}

function goToPage(page) {
    const totalPages = Math.ceil(getFiltered().length / ITEMS_PER_PAGE);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderProducts();
    document.getElementById('productGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str).replace(/[&<>"']/g, function(m) {
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

// ============================================
// LOGIN/LOGOUT
// ============================================
async function login() {
    const name = document.getElementById('loginName').value.trim();
    const phone = document.getElementById('loginPhone').value.trim();
    if (!name) { alert('Ingresa tu nombre'); return; }
    if (!phone) { alert('Ingresa tu número de teléfono'); return; }
    currentUser = { id: phone, name: name, phone: phone };
    localStorage.setItem('adriano_user', JSON.stringify(currentUser));
    await sbClient.from('users').upsert({ id: phone, name: name, phone: phone });
    document.getElementById('userNameDisplay').textContent = `✦ ${name}`;
    document.getElementById('loginBtn').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'flex';
    document.getElementById('loginModal').classList.remove('active');
    await loadCart();
    await loadWishlist();
    showNotification(`✨ Bienvenido, ${name} ✨`);
}

function logout() {
    currentUser = null;
    localStorage.removeItem('adriano_user');
    cart = []; wishlist = [];
    document.getElementById('userNameDisplay').textContent = '';
    document.getElementById('loginBtn').style.display = 'flex';
    document.getElementById('logoutBtn').style.display = 'none';
    updateCartUI();
    document.getElementById('cartCount').textContent = '0';
    document.getElementById('wishlistCount').textContent = '0';
    renderProducts();
    showNotification('Sesión cerrada');
}

// ============================================
// WHATSAPP
// ============================================
function enviarWhatsApp() {
    if (!cart.length) { showNotification('⚠️ Agrega productos al carrito primero'); return; }
    const items = cart.map(item => `• ${item.products.name} - €${item.products.price}`).join('%0A');
    const total = cart.reduce((sum, item) => sum + (item.products?.price || 0), 0);
    const userName = currentUser ? currentUser.name : 'Cliente';
    const userPhone = currentUser ? currentUser.phone : 'No registrado';
    const waNumber = window.__APP_CONFIG__?.whatsappNumber || '5350979465';
    const mensaje = `✨ *PEDIDO - ADRIANO DE LA RIOJA* ✨%0A%0A👤 *Cliente:* ${userName}%0A📱 *WhatsApp:* ${userPhone}%0A%0A📦 *PRODUCTOS:*%0A${items}%0A%0A💰 *TOTAL:* €${total}%0A%0A📍 *Retiro:* Obispo #508, La Habana Vieja`;
    window.open(`https://wa.me/${waNumber}?text=${mensaje}`, '_blank');
}

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    
    document.getElementById('loginBtn').onclick = () => document.getElementById('loginModal').classList.add('active');
    document.getElementById('logoutBtn').onclick = logout;
    document.getElementById('submitLoginBtn').onclick = login;
    document.getElementById('cartBtn').onclick = () => document.getElementById('cartSidebar').classList.add('open');
    document.getElementById('closeCartBtn').onclick = () => document.getElementById('cartSidebar').classList.remove('open');
    document.getElementById('whatsappBtn').onclick = enviarWhatsApp;
    document.getElementById('backToTop').onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            currentPage = 1;
            renderProducts();
        };
    });
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => {
                currentSearch = searchInput.value;
                currentPage = 1;
                renderProducts();
            }, 300);
        });
    }
    
    document.getElementById('menuIcon').onclick = () => document.getElementById('navLinks').classList.toggle('active');
    
    if (currentUser) {
        document.getElementById('userNameDisplay').textContent = `✦ ${currentUser.name}`;
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('logoutBtn').style.display = 'flex';
        loadCart();
        loadWishlist();
    }
    
    setTimeout(() => {
        const loader = document.getElementById('loadingPlaceholder');
        if (loader) { loader.classList.add('hidden'); setTimeout(() => loader.style.display = 'none', 500); }
    }, 800);
    
    // Scroll reveal
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => e.isIntersecting && e.target.classList.add('visible'));
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    
    // Header scroll
    window.addEventListener('scroll', () => {
        const header = document.getElementById('stickyHeader');
        if (window.scrollY > 30) header.classList.add('scrolled');
        else header.classList.remove('scrolled');
        const backBtn = document.getElementById('backToTop');
        if (window.scrollY > 500) backBtn.classList.add('visible');
        else backBtn.classList.remove('visible');
    });
    
    // Typed text
    const typedElement = document.getElementById('typedText');
    if (typedElement) {
        const phrases = ["Vestir con oficio...", "durar sin prisa.", "Artesanía contemporánea.", "Alta costura cubana.", "Elegancia atemporal.", "Hecho a mano en La Habana."];
        let i = 0, j = 0, deleting = false;
        function type() {
            const current = phrases[i];
            if (deleting) { typedElement.textContent = current.substring(0, j - 1); j--; }
            else { typedElement.textContent = current.substring(0, j + 1); j++; }
            if (!deleting && j === current.length) { deleting = true; setTimeout(type, 2000); return; }
            if (deleting && j === 0) { deleting = false; i = (i + 1) % phrases.length; setTimeout(type, 300); return; }
            setTimeout(type, deleting ? 50 : 80);
        }
        type();
    }
    
    // Stats
    const statsSection = document.getElementById('statsSection');
    if (statsSection) {
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    document.querySelectorAll('.stat-number[data-target]').forEach(el => {
                        const target = parseInt(el.dataset.target, 10);
                        let current = 0;
                        const timer = setInterval(() => {
                            current += target / 50;
                            if (current >= target) { el.textContent = target; clearInterval(timer); }
                            else el.textContent = Math.floor(current);
                        }, 30);
                    });
                    statsObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        statsObserver.observe(statsSection);
    }
    
    // Lightbox
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');
    const lightboxCounter = document.getElementById('lightboxCounter');
    let galleryImages = [], currentIndex = 0;
    function updateGallery() {
        const allImages = [...document.querySelectorAll('.gallery-item img'), ...document.querySelectorAll('#editorialGrid .product-card img')];
        galleryImages = allImages.map(img => img.src);
        allImages.forEach((img, idx) => {
            img.onclick = () => {
                currentIndex = idx;
                lightboxImg.src = galleryImages[currentIndex];
                lightboxCounter.textContent = `${currentIndex+1}/${galleryImages.length}`;
                lightbox.classList.add('active');
                document.body.style.overflow = 'hidden';
            };
        });
    }
    updateGallery();
    if (lightboxClose) lightboxClose.addEventListener('click', () => { lightbox.classList.remove('active'); document.body.style.overflow = ''; });
    if (lightboxPrev) lightboxPrev.addEventListener('click', () => { currentIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length; lightboxImg.src = galleryImages[currentIndex]; lightboxCounter.textContent = `${currentIndex+1}/${galleryImages.length}`; });
    if (lightboxNext) lightboxNext.addEventListener('click', () => { currentIndex = (currentIndex + 1) % galleryImages.length; lightboxImg.src = galleryImages[currentIndex]; lightboxCounter.textContent = `${currentIndex+1}/${galleryImages.length}`; });
    
    // Hero image
    const heroImg = document.getElementById('heroImage');
    const heroPh = document.getElementById('heroPlaceholder');
    if (heroImg) {
        heroImg.onload = () => { heroImg.classList.add('loaded'); if (heroPh) heroPh.style.opacity = '0'; };
        if (heroImg.complete) heroImg.classList.add('loaded');
    }
    
    // Custom cursor
    const cursor = document.getElementById('customCursor');
    if (cursor && window.matchMedia('(pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        cursor.style.display = 'block';
        document.addEventListener('mousemove', (e) => {
            if (cursor.style.display !== 'none') cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
        });
        let lastParticleTime = 0;
        document.addEventListener('mousemove', (e) => {
            const now = Date.now();
            if (now - lastParticleTime > 60) {
                const particle = document.createElement('div');
                particle.className = 'cursor-particle';
                particle.style.left = e.clientX + 'px';
                particle.style.top = e.clientY + 'px';
                document.body.appendChild(particle);
                setTimeout(() => particle.remove(), 600);
                lastParticleTime = now;
            }
        });
        const interactiveElements = 'a, button, .product-btn, .filter-btn, .header-icon, .social-btn, .modal-content button, .close-cart, .cart-item-remove, .location-link, .nav-links a, .gallery-item, .back-to-top, .whatsapp-btn';
        document.querySelectorAll(interactiveElements).forEach(el => {
            el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
            el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
            el.addEventListener('mousedown', () => cursor.classList.add('click'));
            el.addEventListener('mouseup', () => cursor.classList.remove('click'));
        });
        const mutationObserver = new MutationObserver(() => {
            document.querySelectorAll(interactiveElements).forEach(el => {
                if (!el._cursorEventsAdded) {
                    el._cursorEventsAdded = true;
                    el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
                    el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
                    el.addEventListener('mousedown', () => cursor.classList.add('click'));
                    el.addEventListener('mouseup', () => cursor.classList.remove('click'));
                }
            });
        });
        mutationObserver.observe(document.body, { childList: true, subtree: true });
    } else if (cursor) cursor.style.display = 'none';
});
