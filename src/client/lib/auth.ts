import { supabase } from './supabase';
import type { UserSession } from '../types';

const STORAGE_KEY = 'adriano_user';

let currentUser: UserSession | null = null;

function generateUUID(): string {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function setSessionToken(token: string): Promise<void> {
  try {
    await supabase().rpc('set_session_token', { token });
  } catch {
    // Non-critical: RLS will fall back gracefully
  }
}

export async function loginUser(name: string, phone: string): Promise<UserSession> {
  const cleanName = name.trim().slice(0, 100);
  const cleanPhone = phone.trim().replace(/\s/g, '').slice(0, 20);

  if (!cleanName) {
    throw new Error('El nombre es requerido');
  }
  if (!cleanPhone) {
    throw new Error('El teléfono es requerido');
  }

  const userId = `${generateUUID()}_${Date.now()}`;
  const sessionToken = generateUUID();
  const now = new Date().toISOString();

  const user: UserSession = {
    id: userId,
    name: cleanName,
    phone: cleanPhone,
    session_token: sessionToken,
    created_at: now,
    last_login: now,
  };

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase().from('users') as any).upsert({
      id: userId,
      name: cleanName,
      phone: cleanPhone,
      session_token: sessionToken,
      last_login: now,
    }, { onConflict: 'id' });

    if (error) {
      // If upsert failed (e.g., missing columns in DB), try a simpler insert
      const { error: insertError } = await supabase()
        .from('users')
        .insert({ id: userId, name: cleanName, phone: cleanPhone });

      if (insertError) {
        throw new Error('Error al guardar usuario');
      }
    }

    await setSessionToken(sessionToken);
    persistUser(user);
    currentUser = user;
    return user;
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Error al iniciar sesión');
  }
}

export async function logoutUser(): Promise<void> {
  currentUser = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
    await supabase().rpc('set_session_token', { token: '' });
  } catch {
    // localStorage may be unavailable
  }
}

export async function loadSession(): Promise<UserSession | null> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved) as UserSession;
    if (!parsed.id) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    // Try to validate session by id; session_token column may not exist
    const { data, error } = await supabase()
      .from('users')
      .select('id, name, phone')
      .eq('id', parsed.id)
      .single();

    if (error || !data) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    await setSessionToken(parsed.session_token);
    currentUser = {
      ...parsed,
      name: (data as { name: string }).name,
      phone: (data as { phone: string }).phone,
    };
    return currentUser;
  } catch {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    return null;
  }
}

export function getCurrentUser(): UserSession | null {
  return currentUser;
}

export function isAuthenticated(): boolean {
  return currentUser !== null;
}

function persistUser(user: UserSession): void {
  try {
    const toStore = { ...user };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch {
    // localStorage full or unavailable
  }
}
