import { supabase } from './client';

export async function testSupabaseConnection() {
  try {
    console.log('🔍 Testing Supabase connection...');

    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('❌ Connection error:', error.message);
      return false;
    }

    console.log('✅ Supabase connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
}