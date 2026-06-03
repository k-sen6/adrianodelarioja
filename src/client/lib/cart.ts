import { supabase } from './supabase';
import { getCurrentUser } from './auth';
import type { CartItem } from '../types';

let cart: CartItem[] = [];

export async function loadCart(): Promise<CartItem[]> {
  const user = getCurrentUser();
  if (!user) {
    cart = [];
    return cart;
  }

  try {
    const { data, error } = await supabase()
      .from('cart')
      .select('id, user_id, product_id, created_at, products(id, name, price, image_url, category)')
      .eq('user_id', user.id);

    if (error) {
      cart = [];
      return cart;
    }

    cart = (data ?? []) as CartItem[];
    return cart;
  } catch {
    cart = [];
    return cart;
  }
}

export async function addToCart(productId: number): Promise<boolean> {
  const user = getCurrentUser();
  if (!user) return false;

  const exists = cart.some((item) => item.product_id === productId);
  if (exists) return false;

  try {
    const { error } = await supabase()
      .from('cart')
      .insert({ user_id: user.id, product_id: productId });

    if (error) return false;

    await loadCart();
    return true;
  } catch {
    return false;
  }
}

export async function removeFromCart(cartId: number): Promise<boolean> {
  try {
    const { error } = await supabase()
      .from('cart')
      .delete()
      .eq('id', cartId);

    if (error) return false;

    await loadCart();
    return true;
  } catch {
    return false;
  }
}

export function getCart(): CartItem[] {
  return cart;
}

export function getCartCount(): number {
  return cart.length;
}

export function getCartTotal(): number {
  return cart.reduce((sum, item) => sum + (item.products?.price ?? 0), 0);
}
