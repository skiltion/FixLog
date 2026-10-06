import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

/**
 * FixLog은 로그인 기능을 사용하지 않으며 모든 DB 작업을 Next.js 서버에서 수행합니다.
 * SUPABASE_SECRET_KEY는 브라우저에 절대 노출하면 안 됩니다.
 */
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL 환경변수가 설정되지 않았습니다.");
  }
  if (!supabaseSecretKey) {
    throw new Error("SUPABASE_SECRET_KEY 환경변수가 설정되지 않았습니다.");
  }

  if (!adminClient) {
    adminClient = createClient(supabaseUrl, supabaseSecretKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  return adminClient;
}
