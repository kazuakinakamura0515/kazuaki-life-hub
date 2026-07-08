"use client";
import { Bookmark, Inbox } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { news as fallbackNews } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";

type NewsItem = {
  id: string | number;
  cat: string;
  title: string;
  source: string;
  date: string;
  summary: string;
  importance: string;
  url?: string;
};
type NewsRow = {
  id: string;
  source_name: string | null;
  title: string;
  summary: string | null;
  ai_summary: string | null;
  published_at: string | null;
  importance: string | null;
  original_url: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "日付未設定";
  return new Date(value).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
}

function inferCategory(title: string) {
  if (/ANA|全日空|マイル/i.test(title)) return "ANA";
  if (/Marriott|Bonvoy|Hilton|IHG|ホテル/i.test(title)) return "ホテル";
  if (/SONY|Sony|α|カメラ|レンズ/i.test(title)) return "SONY";
  if (/AI|DX|生成AI|補助金/i.test(title)) return "AI / DX";
  if (/電気工事|電設|資材/i.test(title)) return "電気工事";
  return "旅行";
}

function normalize(row: NewsRow): NewsItem {
  return {
    id: row.id,
    cat: inferCategory(row.title),
    title: row.title,
    source: row.source_name ?? "ニュース",
    date: formatDate(row.published_at),
    summary: row.ai_summary || row.summary || "概要を取得中です。",
    importance: row.importance ?? "中",
    url: row.original_url ?? undefined,
  };
}

export function NewsList({ limit, query = "", refreshKey = 0 }: { limit?: number; query?: string; refreshKey?: number }) {
  const [saved, setSaved] = useState<Array<string | number>>([]);
  const [items, setItems] = useState<NewsItem[]>(fallbackNews);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      const supabase = createClient();
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data, error: loadError } = await supabase
        .from("news_items")
        .select("id,source_name,title,summary,ai_summary,published_at,importance,original_url")
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(40);
      if (!active) return;
      if (loadError) {
        setError("ニュースを読み込めませんでした。固定ニュースを表示しています。");
      } else if (data && data.length > 0) {
        setItems((data as NewsRow[]).map(normalize));
      }
      setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const shown = useMemo(() => {
    const filtered = query.trim()
      ? items.filter((item) => `${item.title} ${item.summary} ${item.cat}`.toLowerCase().includes(query.trim().toLowerCase()))
      : items;
    return filtered.slice(0, limit);
  }, [items, limit, query]);

  if (!shown.length && !loading) return <div className="empty"><Inbox size={28}/><p>表示できるニュースはまだありません。</p><small>「今すぐ更新」を押すと最新ニュースを取得します。</small></div>;
  return <div>{loading&&<div className="notice" role="status">ニュースを読み込んでいます。</div>}{error&&<div className="notice" role="alert">{error}</div>}{shown.map((item) => <article className="news-item" key={item.id}>
    <div className="news-cat">{item.cat}</div>
    <div><div style={{display:"flex",gap:8,alignItems:"center"}}><span className="tag">{item.importance}</span>{item.url?<a className="news-title" href={item.url} target="_blank" rel="noreferrer">{item.title}</a>:<span className="news-title">{item.title}</span>}</div><div className="news-summary">{item.summary}</div><div className="meta">{item.source} ・ {item.date}</div></div>
    <button className="icon-btn" onClick={() => setSaved((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current,item.id])} aria-label={`${item.title}を保存`}><Bookmark size={16} fill={saved.includes(item.id)?"#b59457":"none"}/></button>
  </article>)}</div>;
}
