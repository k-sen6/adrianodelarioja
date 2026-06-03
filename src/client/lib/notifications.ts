import type { NotificationType } from '../types';

let timeoutId: ReturnType<typeof setTimeout> | null = null;

export function showNotification(
  message: string,
  type: NotificationType = 'info'
): void {
  const el = document.getElementById('notification');
  if (!el) return;

  if (timeoutId !== null) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }

  el.textContent = message;
  el.className = 'notification';

  if (type === 'error') {
    el.classList.add('error');
  } else if (type === 'success') {
    el.classList.add('success');
  }

  el.classList.add('show');

  timeoutId = setTimeout(() => {
    el.classList.remove('show');
    timeoutId = null;
  }, 3000);
}

export function showError(message: string): void {
  showNotification(message, 'error');
}

export function showSuccess(message: string): void {
  showNotification(message, 'success');
}
