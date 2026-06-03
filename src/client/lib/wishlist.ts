import { supabase } from './supabase';
import { getCurrentUser } from './auth';

let wishlist: number[] = [];

export async function loadWishlist(): Promise<number[]> {
  const user = getCurrentUser();
  if (!user) {
    wishlist = [];
    return wishlist;
  }

  try {
    const { data, error } = await supabase()
      .from('wishlist')
      .select('product_id')
      .eq('user_id', user.id);

    if (error) {
      wishlist = [];
      return wishlist;
    }

    wishlist = ((data ?? []) as { product_id: number }[]).map((w) => w.product_id);
    return wishlist;
  } catch {
    wishlist = [];
    return wishlist;
  }
}

export async function toggleWishlist(productId: number): Promise<boolean> {
  const user = getCurrentUser();
  if (!user) return false;

  const exists = wishlist.includes(productId);

  try {
    if (exists) {
      const { error } = await supabase()
        .from('wishlist')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) return false;

      wishlist = wishlist.filter((id) => id !== productId);
    } else {
      const { error } = await supabase()
        .from('wishlist')
        .insert({ user_id: user.id, product_id: productId });

      if (error) return false;

      wishlist.push(productId);
    }

    return true;
  } catch {
    return false;
  }
}

export function isInWishlist(productId: number): boolean {
  return wishlist.includes(productId);
}

export function getWishlistCount(): number {
  return wishlist.length;
}
