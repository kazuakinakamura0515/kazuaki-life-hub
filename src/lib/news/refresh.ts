import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

type FeedConfig = { category: string; query: string; source: string };
type ParsedItem = {
  category: string;
  sourceName: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string | null;
  importance: "重要" | "高" | "中";
};

const feeds: FeedConfig[] = [
  { category: "ANA", source: "Google News", query: "ANA マイル OR 全日空 OR ANA 国内線" },
  { category: "ホテル", source: "Google News", query: "Marriott Bonvoy OR Hilton Honors OR IHG One Rewards" },
  { category: "SONY", source: "Google News", query: "SONY α1 II OR Sony Alpha カメラ レンズ" },
  { category: "AI / DX", source: "Google News", query: "生成AI DX 中小企業 補助金" },
  { category: "電気工事", source: "Google News", query: "電気工事 電設資材 価格改定" },
  { category: "旅行", source: "Google News", query: "国内旅行 航空券 ホテル キャンペーン" },
];

function textBetween(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return decodeXml(match?.[1] ?? "").trim();
}

function decodeXml(value: string) {
  return value
    .replaceAll("<![CDATA[", "")
    .replaceAll("]]>", "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function importanceFor(title: string): ParsedItem["importance"] {
  if (/重要|改定|値上げ|障害|停止|期限|発表|開始/.test(title)) return "重要";
  if (/キャンペーン|セール|ボーナス|新製品|アップデート|補助金/.test(title)) return "高";
  return "中";
}

function feedUrl(query: string) {
  const params = new URLSearchParams({ q: query, hl: "ja", gl: "JP", ceid: "JP:ja" });
  return `https://news.google.com/rss/search?${params.toString()}`;
}

async function fetchFeed(feed: FeedConfig): Promise<ParsedItem[]> {
  const response = await fetch(feedUrl(feed.query), {
    headers: { "User-Agent": "KAZUAKI-LIFE-HUB/1.0" },
    next: { revalidate: 0 },
  });
  if (!response.ok) return [];
  const xml = await response.text();
  return xml
    .split(/<item>/i)
    .slice(1, 7)
    .map((raw) => raw.split(/<\/item>/i)[0])
    .map((raw) => {
      const title = textBetween(raw, "title");
      const summary = textBetween(raw, "description");
      const url = textBetween(raw, "link");
      const pubDate = textBetween(raw, "pubDate");
      return {
        category: feed.category,
        sourceName: feed.source,
        title,
        summary,
        url,
        publishedAt: pubDate ? new Date(pubDate).toISOString() : null,
        importance: importanceFor(title),
      };
    })
    .filter((item) => item.title && item.url);
}

export async function refreshNews() {
  const supabase = createAdminClient();
  const fetched = (await Promise.all(feeds.map(fetchFeed))).flat();
  const unique = Array.from(new Map(fetched.map((item) => [item.url, item])).values()).slice(0, 30);
  if (!unique.length) return { fetched: 0, inserted: 0 };

  const urls = unique.map((item) => item.url);
  const { data: existing } = await supabase.from("news_items").select("original_url").in("original_url", urls);
  const existingUrls = new Set((existing ?? []).map((item) => item.original_url));
  const rows = unique
    .filter((item) => !existingUrls.has(item.url))
    .map((item) => ({
      user_id: null,
      source_name: item.sourceName,
      source_url: "https://news.google.com/",
      title: item.title,
      summary: item.summary,
      ai_summary: item.summary,
      published_at: item.publishedAt,
      importance: item.importance,
      original_url: item.url,
      updated_at: new Date().toISOString(),
    }));

  if (!rows.length) return { fetched: unique.length, inserted: 0 };
  const { error } = await supabase.from("news_items").insert(rows);
  if (error) throw error;
  return { fetched: unique.length, inserted: rows.length };
}
