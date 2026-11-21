import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export interface SavedAddress {
  id: string;
  type: 'Home' | 'Work';
  recipientName: string;
  phone: string;
  houseNo: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

const STORAGE_KEY = 'nilora_saved_addresses_v2';

export async function loadCustomerAddresses(userId?: string): Promise<SavedAddress[]> {
  // Guests must NEVER load saved addresses belonging to other patrons
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return [];
  }

  // If authenticated with live Supabase
  if (userId && isSupabaseConfigured && !userId.startsWith('cust-') && userId !== 'admin-master') {
    try {
      const { data, error } = await (supabase as any)
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false });

      if (data && !error && data.length > 0) {
        return data.map((a: any) => ({
          id: a.id,
          type: 'Home',
          recipientName: a.full_name || '',
          phone: a.phone || '',
          houseNo: '',
          addressLine1: a.address_line1 || '',
          addressLine2: a.address_line2 || '',
          city: a.city || '',
          state: a.state || '',
          pincode: a.pincode || '',
          isDefault: Boolean(a.is_default),
        }));
      }
    } catch (err) {
      console.warn('Could not read addresses from Supabase, checking local cache:', err);
    }
  }

  // Fallback to localStorage cache
  if (typeof window !== 'undefined') {
    try {
      const userKey = `${STORAGE_KEY}_${userId}`;
      const raw = localStorage.getItem(userKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((a: any) => ({
            id: a.id || `addr-${Date.now()}`,
            type: a.type || 'Home',
            recipientName: a.recipientName || a.fullName || a.full_name || '',
            phone: a.phone || '',
            houseNo: a.houseNo || '',
            addressLine1: a.addressLine1 || a.address_line1 || '',
            addressLine2: a.addressLine2 || a.address_line2 || '',
            city: a.city || '',
            state: a.state || '',
            pincode: a.pincode || '',
            isDefault: Boolean(a.isDefault || a.is_default),
          }));
        }
      }
    } catch {}
  }

  return [];
}

export async function saveCustomerAddress(
  userId: string | undefined,
  address: SavedAddress
): Promise<SavedAddress[]> {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return [];
  }

  const userKey = `${STORAGE_KEY}_${userId}`;
  let existing: SavedAddress[] = [];

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(userKey);
      if (raw) existing = JSON.parse(raw);
    } catch {}
  }

  const idx = existing.findIndex((a) => a.id === address.id);
  let updated: SavedAddress[];

  if (idx !== -1) {
    updated = existing.map((a) => (a.id === address.id ? address : address.isDefault ? { ...a, isDefault: false } : a));
  } else {
    if (address.isDefault) {
      existing = existing.map((a) => ({ ...a, isDefault: false }));
    }
    updated = [address, ...existing];
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(userKey, JSON.stringify(updated));
    } catch {}
  }

  // Live Supabase sync
  if (userId && isSupabaseConfigured && !userId.startsWith('cust-') && userId !== 'admin-master') {
    try {
      await (supabase as any).from('addresses').upsert({
        id: address.id.includes('-') && address.id.length > 20 ? address.id : undefined,
        user_id: userId,
        full_name: address.recipientName,
        phone: address.phone,
        address_line1: `${address.houseNo ? address.houseNo + ', ' : ''}${address.addressLine1}`,
        address_line2: address.addressLine2 || null,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: 'India',
        is_default: address.isDefault,
      });
    } catch (e) {
      console.warn('Failed to upsert address in Supabase:', e);
    }
  }

  return updated;
}
