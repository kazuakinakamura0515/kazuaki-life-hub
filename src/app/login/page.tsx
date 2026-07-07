"use client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

function safeNext(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export default function Login() {
  const params = useSearchParams();
  const destination = safeNext(params.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(
    params.get("reason") === "setup"
      ? "Supabaseの環境変数が未設定です。管理者が本番設定を完了するまでログインできません。"
      : "",
  );
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const supabase = createClient();
    if (!supabase) {
      setMessage("Supabase接続情報が設定されていません。");
      setBusy(false);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage("メールアドレスまたはパスワードを確認してください。");
      setBusy(false);
      return;
    }
    await supabase.rpc("initialize_user_data");
    window.location.assign(destination);
  }

  return <div className="login"><section className="login-art"><div><div className="brand-kicker">PERSONAL CONCIERGE</div><h1 style={{fontFamily:"Georgia",fontSize:40}}>KAZUAKI<br/>LIFE HUB</h1><p style={{color:"#bfcbd9"}}>Business / Travel / Points / Camera Dashboard</p></div><p style={{maxWidth:500,lineHeight:1.8}}>仕事も旅も、人生の大切な数字も。<br/>静かに整い、次の一手が見える場所。</p></section><main className="login-box"><div className="eyebrow">WELCOME BACK</div><h2 className="page-title">ログイン</h2><p className="muted" style={{fontSize:13}}>登録済みのメールアドレスでログインしてください。</p><form onSubmit={submit}><label className="card-label" htmlFor="email">メールアドレス</label><input id="email" className="field" type="email" value={email} onChange={(event)=>setEmail(event.target.value)} placeholder="name@example.com" autoComplete="email" required/><label className="card-label" htmlFor="password">パスワード</label><input id="password" className="field" type="password" value={password} onChange={(event)=>setPassword(event.target.value)} autoComplete="current-password" required/><button className="btn primary" type="submit" disabled={busy}>{busy?"確認中…":"ログイン"}</button></form>{message&&<div className="notice" role="alert">{message}</div>}<p className="meta" style={{textAlign:"center",marginTop:25}}>認証情報はSupabase Authで安全に管理されます</p></main></div>;
}
