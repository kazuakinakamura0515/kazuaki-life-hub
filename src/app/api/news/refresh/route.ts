import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { refreshNews } from "@/lib/news/refresh";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  const claims = supabase ? await supabase.auth.getClaims() : null;
  if (!claims?.data?.claims?.sub) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  try {
    const result = await refreshNews();
    return NextResponse.json({ ok: true, ...result, updatedAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "ニュース更新に失敗しました" },
      { status: 500 },
    );
  }
}
