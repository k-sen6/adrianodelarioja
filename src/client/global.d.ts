// Type declarations for Supabase UMD client loaded via script tag
interface SupabaseClientOptions {
  auth?: {
    autoRefreshToken?: boolean;
    persistSession?: boolean;
    detectSessionInUrl?: boolean;
  };
}

interface SupabaseAuthSession {
  user: {
    id: string;
    email?: string;
  };
  access_token: string;
  refresh_token: string;
  expires_at?: number;
}

interface SupabaseResponse {
  data: unknown;
  error: unknown;
  count?: number;
}

interface SupabaseFilter {
  eq(column: string, value: unknown): this;
  in(column: string, values: unknown[]): this;
  order(column: string, opts?: { ascending?: boolean }): this;
  limit(count: number): this;
  single(): Promise<SupabaseResponse>;
  then<TResult1 = SupabaseResponse, TResult2 = never>(
    onfulfilled?: ((value: SupabaseResponse) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2>;
}

interface SupabaseQueryBuilder {
  select(columns?: string, opts?: { count?: 'exact'; head?: boolean }): SupabaseFilter;
  insert(values: Record<string, unknown>, opts?: { onConflict?: string }): Promise<SupabaseResponse>;
  update(values: Record<string, unknown>): SupabaseFilter;
  delete(): SupabaseFilter;
}

interface SupabaseClient {
  auth: {
    getSession(): Promise<{ data: { session: SupabaseAuthSession | null }; error: unknown }>;
    signInWithPassword(params: { email: string; password: string }): Promise<{ data: unknown; error: unknown }>;
    signOut(): Promise<{ error: unknown }>;
  };
  from(table: string): SupabaseQueryBuilder;
  rpc(fn: string, params?: Record<string, unknown>): Promise<SupabaseResponse>;
}

interface Window {
  supabase: {
    createClient(url: string, key: string, options?: SupabaseClientOptions): SupabaseClient;
  };
  __APP_CONFIG__?: {
    supabaseUrl: string;
    supabaseKey: string;
    whatsappNumber?: string;
    buildRun?: string;
    buildDate?: string;
  };
}
