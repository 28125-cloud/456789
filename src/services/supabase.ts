import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'meatshop_supabase_url';
const STORAGE_KEY_KEY = 'meatshop_supabase_key';

export function getSupabaseCredentials(): { url: string; key: string; isConfigured: boolean } {
  // Check localStorage first (user configured via UI), then fallback to Vite environment variable
  const localUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) : null;
  const localKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_KEY) : null;

  const url = localUrl || (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const key = localKey || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  const isConfigured = Boolean(url && key && url.trim().startsWith('http') && key.trim().length > 10);

  return { url, key, isConfigured };
}

export function saveSupabaseCredentials(url: string, key: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
    localStorage.setItem(STORAGE_KEY_KEY, key.trim());
    // Invalidate cached client
    cachedClient = null;
  }
}

export function clearSupabaseCredentials(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_KEY);
    cachedClient = null;
  }
}

let cachedClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const { url, key, isConfigured } = getSupabaseCredentials();

  if (!isConfigured) {
    return null;
  }

  if (!cachedClient) {
    try {
      cachedClient = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (err) {
      console.error('Error creating Supabase client:', err);
      return null;
    }
  }

  return cachedClient;
}

export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
  try {
    const testClient = createClient(url, key);
    const { data, error } = await testClient.from('products').select('id').limit(1);
    if (error) {
      // If table doesn't exist yet, it's connected but needs schema.sql run
      if (error.code === '42P01') {
        return {
          success: true,
          message: 'เชื่อมต่อ Supabase สำเร็จ! (หมายเหตุ: ยังไม่พบตารางข้อมูล กรุณากดรันคำสั่งใน supabase/schema.sql)',
        };
      }
      return { success: false, message: `Supabase ตอบกลับ error: ${error.message}` };
    }
    return { success: true, message: `เชื่อมต่อ Supabase สำเร็จ! ตรวจพบตารางข้อมูลเรียบร้อย` };
  } catch (err: any) {
    return { success: false, message: `เกิดข้อผิดพลาดในการเชื่อมต่อ: ${err.message || err}` };
  }
}

export function getSupabaseConfig(): { url: string; anonKey: string; isConfigured: boolean } {
  const creds = getSupabaseCredentials();
  return { url: creds.url, anonKey: creds.key, isConfigured: creds.isConfigured };
}

export function setSupabaseConfig(url: string, key: string): void {
  if (!url.trim() && !key.trim()) {
    clearSupabaseCredentials();
  } else {
    saveSupabaseCredentials(url, key);
  }
}

export async function checkSupabaseConnection(): Promise<{ success: boolean; error?: string }> {
  const { url, key } = getSupabaseCredentials();
  if (!url || !key) return { success: false, error: 'ยังไม่ได้ระบุ URL หรือ Anon Key' };
  const res = await testSupabaseConnection(url, key);
  return { success: res.success, error: res.success ? undefined : res.message };
}

