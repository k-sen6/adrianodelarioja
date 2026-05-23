// js/ui.js
let notificationTimeout = null;

// Crear elemento de notificación
function ensureNotificationElement() {
  let notif = document.getElementById('notificationAdvanced');
  if (notif) return notif;
  
  notif = document.createElement('div');
  notif.id = 'notificationAdvanced';
  notif.className = 'notification-advanced';
  notif.innerHTML = `
    <div class="notification-content">
      <img id="notifImg" class="notification-img" src="" alt="">
      <div class="notification-text">
        <strong id="notifTitle"></strong>
        <span id="notifMessage"></span>
      </div>
      <button id="notifUndo" class="notification-undo">↩️ Deshacer</button>
    </div>
    <div class="notification-progress"></div>
  `;
  document.body.appendChild(notif);
  
  if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      .notification-advanced {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #0A0A0A;
        border: 1px solid #D4AF37;
        border-radius: 12px;
        padding: 12px;
        z-index: 10003;
        transform: translateX(450px);
        transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        min-width: 320px;
        max-width: 400px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        backdrop-filter: blur(10px);
      }
      .notification-advanced.show {
        transform: translateX(0);
      }
      .notification-content {
        display: flex;
        gap: 12px;
        align-items: center;
      }
      .notification-img {
        width: 50px;
        height: 60px;
        object-fit: cover;
        border-radius: 8px;
      }
      .notification-text {
        flex: 1;
      }
      .notification-text strong {
        color: #D4AF37;
        display: block;
        font-size: 0.9rem;
      }
      .notification-text span {
        font-size: 0.75rem;
        color: #C0C0C0;
      }
      .notification-undo {
        background: rgba(212, 175, 55, 0.2);
        border: 1px solid #D4AF37;
        color: #D4AF37;
        padding: 6px 12px;
        border-radius: 20px;
        cursor: pointer;
        font-size: 0.7rem;
        font-family: inherit;
      }
      .notification-undo:hover {
        background: #D4AF37;
        color: #050505;
      }
      .notification-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 2px;
        background: #D4AF37;
        width: 100%;
        animation: shrink 3s linear forwards;
        border-radius: 0 0 0 12px;
      }
      @keyframes shrink {
        from { width: 100%; }
        to { width: 0%; }
      }
      @media (max-width: 480px) {
        .notification-advanced {
          left: 20px;
          right: 20px;
          min-width: auto;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  return notif;
}

// Mostrar notificación
export function showNotification(product, action, onUndo = null) {
  const notif = ensureNotificationElement();
  const img = document.getElementById('notifImg');
  const title = document.getElementById('notifTitle');
  const message = document.getElementById('notifMessage');
  const undoBtn = document.getElementById('notifUndo');
  
  const messages = {
    added: 'añadido al carrito ✨',
    removed: 'eliminado del carrito 🗑️',
    error: 'Error en la operación',
    already_exists: 'ya está en el carrito',
    login_required: 'Inicia sesión primero'
  };
  
  if (!product || !product.name) {
    title.textContent = action === 'error' ? '❌ Error' : '✨';
    message.textContent = typeof product === 'string' ? product : messages[action] || 'Operación completada';
    if (img) img.style.display = 'none';
  } else {
    if (img) {
      img.src = product.image_url || 'https://i.postimg.cc/6QSkBPyF/Hero.webp';
      img.style.display = 'block';
    }
    title.textContent = product.name;
    message.textContent = messages[action] || 'actualizado';
  }
  
  if (onUndo && (action === 'added' || action === 'removed')) {
    undoBtn.style.display = 'flex';
    undoBtn.onclick = () => {
      onUndo();
      notif.classList.remove('show');
      if (notificationTimeout) clearTimeout(notificationTimeout);
    };
  } else {
    undoBtn.style.display = 'none';
  }
  
  notif.classList.add('show');
  
  if (notificationTimeout) clearTimeout(notificationTimeout);
  notificationTimeout = setTimeout(() => {
    notif.classList.remove('show');
  }, 3000);
}

// Notificación simple
export function showSimpleNotification(message, type = 'info') {
  showNotification({ name: message }, type);
}
