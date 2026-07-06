import { NextResponse } from "next/server";
import { createClient, isSupabaseServerConfigured } from "@/lib/supabase/server";
import { APP_VERSION } from "@/lib/version";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function maskedEmail(email?: string) {
  if (!email) return "確認できません";
  const [name, domain] = email.split("@");
  return `${name.slice(0,2)}***@${domain ?? "***"}`;
}

export async function GET() {
  if (!isSupabaseServerConfigured()) {
    return NextResponse.json({ error: "Supabase環境変数が設定されていません" }, { status: 503 });
  }
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabaseへ接続できません" }, { status: 503 });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  await supabase.rpc("initialize_user_data");
  const readResult = await supabase.from("points_accounts").select("id", { count: "exact", head: true });
  const writeResult = await supabase.from("system_checks").upsert(
    { user_id: user.id, checked_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );
  const briefResult = await supabase.from("daily_briefs").select("created_at").order("created_at", { ascending: false }).limit(1).maybeSingle();

  return NextResponse.json({
    supabase: { configured: true, connected: !authError },
    user: { id: user.id.slice(0, 8), email: maskedEmail(user.email) },
    database: { read: !readResult.error, write: !writeResult.error, accountCount: readResult.count ?? 0 },
    openai: { configured: Boolean(process.env.OPENAI_API_KEY) },
    appUrl: { configured: Boolean(process.env.NEXT_PUBLIC_APP_URL), value: process.env.NEXT_PUBLIC_APP_URL ? "設定済み" : "未設定" },
    lastDailyBriefAt: briefResult.data?.created_at ?? null,
    version: APP_VERSION,
    environment: process.env.VERCEL_ENV ?? (process.env.NODE_ENV === "production" ? "Production (local)" : "Development"),
  }, { headers: { "Cache-Control": "no-store" } });
}
