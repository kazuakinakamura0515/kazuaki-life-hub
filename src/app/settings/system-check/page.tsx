"use client";
import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { Shell } from "@/components/shell";

type CheckData = {
  supabase:{configured:boolean;connected:boolean}; user:{id:string;email:string};
  database:{read:boolean;write:boolean;accountCount:number}; openai:{configured:boolean};
  appUrl:{configured:boolean;value:string}; lastDailyBriefAt:string|null; version:string; environment:string;
};

function Row({label,value,ok,help}:{label:string;value:string;ok:boolean;help?:string}){return <div className="check-row"><span className={`check-dot ${ok?"ok":"warn"}`}/><div><b>{label}</b>{help&&<div className="check-help">{help}</div>}</div><span className="check-value">{value}</span></div>}

export default function SystemCheck(){
  const [data,setData]=useState<CheckData|null>(null);const [error,setError]=useState("");const [loading,setLoading]=useState(true);const [manifest,setManifest]=useState(false);
  async function load(){setLoading(true);setError("");try{const [response,manifestResponse]=await Promise.all([fetch("/api/system-check",{cache:"no-store"}),fetch("/manifest.webmanifest",{cache:"no-store"})]);setManifest(manifestResponse.ok);const payload=await response.json();if(!response.ok)throw new Error(payload.error||"診断に失敗しました");setData(payload)}catch(cause){setError(cause instanceof Error?cause.message:"診断に失敗しました")}finally{setLoading(false)}}
  useEffect(()=>{let active=true;Promise.all([fetch("/api/system-check",{cache:"no-store"}),fetch("/manifest.webmanifest",{cache:"no-store"})]).then(async([response,manifestResponse])=>{const payload=await response.json();if(!response.ok)throw new Error(payload.error||"診断に失敗しました");if(active){setManifest(manifestResponse.ok);setData(payload)}}).catch((cause)=>{if(active)setError(cause instanceof Error?cause.message:"診断に失敗しました")}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[]);
  return <Shell title="システムチェック" eyebrow="PRODUCTION READINESS"><div className="card"><div className="section-head"><div><div className="section-title"><ShieldCheck size={19} style={{display:"inline",verticalAlign:"middle",marginRight:8}}/>安全な接続診断</div><p className="muted" style={{fontSize:12,marginBottom:0}}>秘密鍵やパスワードは表示しません。</p></div><button className="btn" onClick={load} disabled={loading}><RefreshCw size={14} style={{display:"inline"}}/> {loading?"確認中…":"再チェック"}</button></div>{loading&&!data&&<div className="empty" role="status"><span className="spinner"/><p>本番設定を確認しています。</p></div>}{error&&<div className="notice" role="alert">{error}</div>}{data&&<div className="check-grid"><Row label="Supabase接続状態" value={data.supabase.connected?"接続済み":"要確認"} ok={data.supabase.connected}/><Row label="現在ログイン中のユーザー" value={data.user.email} ok={Boolean(data.user.id)} help={`User ID: ${data.user.id}…`}/><Row label="Database読み込み確認" value={data.database.read?`成功（${data.database.accountCount}件）`:"失敗"} ok={data.database.read}/><Row label="Database書き込み確認" value={data.database.write?"成功":"失敗"} ok={data.database.write}/><Row label="OpenAI API設定状態" value={data.openai.configured?"設定済み":"未設定（任意）"} ok={data.openai.configured}/><Row label="PWA manifest確認" value={manifest?"配信済み":"要確認"} ok={manifest}/><Row label="本番URL設定確認" value={data.appUrl.value} ok={data.appUrl.configured}/><Row label="最終Daily Brief生成日時" value={data.lastDailyBriefAt?new Date(data.lastDailyBriefAt).toLocaleString("ja-JP"):"未生成"} ok={Boolean(data.lastDailyBriefAt)}/><Row label="アプリバージョン" value={data.version} ok={true}/><Row label="環境" value={data.environment} ok={true}/></div>}</div></Shell>;
}
