/**
 * Environment Configuration
 * Centralized type-safe access to environment variables
 *
 * Issue: Supabase Auth統合
 */

interface Env {
  API_URL: string;
  GOOGLE_CLIENT_ID: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  // 動画生成機能の有効/無効。LangGraph Cloud稼働中は有効。
  // 既定は有効。一時停止する場合のみ VITE_GENERATION_ENABLED=false を設定する。
  GENERATION_ENABLED: boolean;
  MODE: string;
  DEV: boolean;
  PROD: boolean;
}

function getEnv(): Env {
  const apiUrl = import.meta.env.VITE_API_URL;
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Validate required environment variables
  if (!googleClientId) {
    console.error('❌ VITE_GOOGLE_CLIENT_ID is not set in .env.local');
  }
  if (!supabaseUrl) {
    console.error('❌ VITE_SUPABASE_URL is not set in .env.local');
  }
  if (!supabaseAnonKey) {
    console.error('❌ VITE_SUPABASE_ANON_KEY is not set in .env.local');
  }

  return {
    API_URL: apiUrl || 'http://localhost:8001/api',
    GOOGLE_CLIENT_ID: googleClientId || '',
    SUPABASE_URL: supabaseUrl || '',
    SUPABASE_ANON_KEY: supabaseAnonKey || '',
    GENERATION_ENABLED: import.meta.env.VITE_GENERATION_ENABLED !== 'false',
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
  };
}

export const env = getEnv();
