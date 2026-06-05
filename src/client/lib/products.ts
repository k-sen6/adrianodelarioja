import { supabase } from './supabase';
import type { Product } from '../types';

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase()
    .from('products')
    .select('*')
    .order('id', { ascending: false });

  if (error) {
    throw new Error('Error al cargar productos');
  }

  return (data ?? []) as Product[];
}

export async function createProduct(product: Omit<Product, 'id' | 'created_at'>): Promise<void> {
  const { error } = await supabase()
    .from('products')
    .insert({
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      category: product.category,
    });

  if (error) {
    throw new Error('Error al crear producto');
  }
}

export async function updateProduct(id: number, updates: Partial<Pick<Product, 'name' | 'price' | 'image_url' | 'category'>>): Promise<void> {
  const { error } = await supabase()
    .from('products')
    .update(updates)
    .eq('id', id);

  if (error) {
    throw new Error('Error al actualizar producto');
  }
}

export async function deleteProduct(id: number): Promise<void> {
  const { error } = await supabase()
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error('Error al eliminar producto');
  }
}
