import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface SavedAddress {
  id: string;
  user_id?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
  type?: 'home' | 'work';
}

/**
 * Fetch saved delivery addresses for the authenticated user
 */
export async function getSavedAddresses(userId: string): Promise<SavedAddress[]> {
  if (!isSupabaseConfigured || !userId) {
    return [];
  }

  try {
    const { data, error } = await (supabase as any)
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('Could not fetch addresses from Supabase:', error?.message);
      return [];
    }

    return (data as any[]).map((row) => ({
      id: row.id,
      user_id: row.user_id,
      fullName: row.full_name,
      phone: row.phone,
      addressLine1: row.address_line1,
      addressLine2: row.address_line2 || '',
      city: row.city,
      state: row.state,
      pincode: row.pincode,
      country: row.country,
      isDefault: row.is_default,
    }));
  } catch (err) {
    console.error('Failed to get saved addresses', err);
    return [];
  }
}

/**
 * Save or update address for authenticated user
 */
export async function saveAddress(userId: string, address: Omit<SavedAddress, 'id'>, addressId?: string): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!isSupabaseConfigured || !userId) {
    return { success: false, error: 'Database not connected or user unauthenticated' };
  }

  try {
    if (addressId) {
      const { error } = await (supabase as any)
        .from('addresses')
        .update({
          full_name: address.fullName,
          phone: address.phone,
          address_line1: address.addressLine1,
          address_line2: address.addressLine2 || null,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          country: address.country || 'India',
          is_default: address.isDefault,
        })
        .eq('id', addressId)
        .eq('user_id', userId);

      if (error) return { success: false, error: error.message };
      return { success: true, id: addressId };
    }

    const { data, error } = await (supabase as any)
      .from('addresses')
      .insert({
        user_id: userId,
        full_name: address.fullName,
        phone: address.phone,
        address_line1: address.addressLine1,
        address_line2: address.addressLine2 || null,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: address.country || 'India',
        is_default: address.isDefault,
      })
      .select('id')
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, id: data?.id };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  }
}
