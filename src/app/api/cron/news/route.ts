import { NextResponse } from "next/server";
import { refreshNews } from "@/lib/news/refresh";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (token !== secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
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
