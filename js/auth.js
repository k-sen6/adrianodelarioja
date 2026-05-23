// js/auth.js
import { supabase } from './supabase-client.js';

let currentUser = null;

// Generar UUID v4
function generateUUID() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Login con ID único
export async function login(name, phone) {
  if (!name || !name.trim()) {
    throw new Error('El nombre es requerido');
  }
  
  if (!phone || !phone.trim()) {
    throw new Error('El teléfono es requerido');
  }
  
  const cleanPhone = phone.trim().replace(/\s/g, '');
  const cleanName = name.trim();
  const userId = `${generateUUID()}_${Date.now()}`;
  const sessionToken = generateUUID();
  
  const user = {
    id: userId,
    name: cleanName,
    phone: cleanPhone,
    session_token: sessionToken,
    created_at: new Date().toISOString(),
    last_login: new Date().toISOString()
  };
  
  try {
    localStorage.setItem('adriano_user', JSON.stringify(user));
    
    const { error } = await supabase
      .from('users')
      .upsert({
        id: userId,
        name: cleanName,
        phone: cleanPhone,
        session_token: sessionToken,
        last_login: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error guardando usuario:', error);
    }
    
    currentUser = user;
    console.log('✅ Login exitoso:', cleanName);
    return user;
    
  } catch (error) {
    console.error('Error en login:', error);
    throw new Error('Error al iniciar sesión');
  }
}

// Logout
export function logout() {
  currentUser = null;
  localStorage.removeItem('adriano_user');
  console.log('👋 Sesión cerrada');
}

// Cargar sesión guardada
export function loadSession() {
  try {
    const saved = localStorage.getItem('adriano_user');
    if (saved) {
      currentUser = JSON.parse(saved);
      console.log('🔄 Sesión cargada:', currentUser.name);
      return currentUser;
    }
  } catch (error) {
    console.error('Error cargando sesión:', error);
    localStorage.removeItem('adriano_user');
  }
  return null;
}

// Obtener usuario actual
export function getCurrentUser() {
  return currentUser;
}

// Verificar autenticación
export function isAuthenticated() {
  return currentUser !== null;
}
