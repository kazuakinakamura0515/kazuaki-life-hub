"use client";
import { Bookmark, Inbox } from "lucide-react";
import { useState } from "react";
import { news } from "@/lib/data";

export function NewsList({ limit }: { limit?: number }) {
  const [saved, setSaved] = useState<number[]>([]);
  const items = news.slice(0, limit);
  if (!items.length) return <div className="empty"><Inbox size={28}/><p>表示できるニュースはまだありません。</p><small>ニュースを登録すると、ここに表示されます。</small></div>;
  return <div>{items.map((item) => <article className="news-item" key={item.id}>
    <div className="news-cat">{item.cat}</div>
    <div><div style={{display:"flex",gap:8,alignItems:"center"}}><span className="tag">{item.importance}</span><span className="news-title">{item.title}</span></div><div className="news-summary">{item.summary}</div><div className="meta">{item.source} ・ {item.date}</div></div>
    <button className="icon-btn" onClick={() => setSaved((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current,item.id])} aria-label={`${item.title}を保存`}><Bookmark size={16} fill={saved.includes(item.id)?"#b59457":"none"}/></button>
  </article>)}</div>;
}
