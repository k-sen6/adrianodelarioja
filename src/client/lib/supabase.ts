import type { AppConfig } from '../types';

let sbClient: ReturnType<typeof window.supabase.createClient> | null = null;

function getConfig(): AppConfig {
  const cfg = (window as unknown as Record<string, unknown>).__APP_CONFIG__ as AppConfig | undefined;
  return cfg ?? {
    supabaseUrl: '',
    supabaseKey: '',
    whatsappNumber: '5350979465',
  };
}

export function getSupabaseClient() {
  if (sbClient) return sbClient;

  const config = getConfig();

  if (!config.supabaseUrl || !config.supabaseKey) {
    throw new Error('Supabase configuration missing');
  }

  sbClient = window.supabase.createClient(config.supabaseUrl, config.supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  return sbClient;
}

export function getWhatsAppNumber(): string {
  return getConfig().whatsappNumber || '5350979465';
}

export const supabase = () => getSupabaseClient();

// Expose globally for console debugging (F12)
(window as unknown as Record<string, unknown>).supabaseClient = supabase;
