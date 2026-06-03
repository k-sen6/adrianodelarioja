export interface Product {
  id: number;
  name: string;
  price: number;
  image_url: string;
  category: string;
  created_at?: string;
}

export interface CartItem {
  id: number;
  user_id: string;
  product_id: number;
  created_at: string;
  products: Pick<Product, 'id' | 'name' | 'price' | 'image_url' | 'category'>;
}

export interface UserSession {
  id: string;
  name: string;
  phone: string;
  session_token: string;
  created_at?: string;
  last_login?: string;
}

export interface AppConfig {
  supabaseUrl: string;
  supabaseKey: string;
  whatsappNumber: string;
  buildRun?: string;
  buildDate?: string;
}

export type FilterCategory = 'all' | 'vestidos' | 'chaquetas' | 'calzado';

export type NotificationType = 'success' | 'error' | 'info';
