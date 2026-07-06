"use client";
import {Shell,SectionHead} from "@/components/shell";
import {Bell,Download,Moon} from "lucide-react";
import {useState} from "react";

export default function Settings(){
  const [brief,setBrief]=useState(true);
  const [theme,setTheme]=useState(()=>typeof window==="undefined"?"system":localStorage.getItem("life-hub-theme")||"system");
  function changeTheme(value:string){setTheme(value);localStorage.setItem("life-hub-theme",value);document.documentElement.dataset.theme=value}
  return <Shell title="設定" eyebrow="PREFERENCES">
    <div className="grid two-col" style={{marginTop:0}}><section className="card"><SectionHead title="プロフィール" action="編集"/><div style={{display:'flex',gap:14,alignItems:'center'}}><span className="avatar" style={{width:54,height:54}}>K</span><div><b>Kazuaki Nakamura</b><div className="meta">大阪府 ・ 電気工事会社経営</div><span className="tag">ANA Diamond / SFC</span></div></div></section><section className="card"><SectionHead title="接続状況"/><div className="rule"><span>Supabase</span><b style={{color:'#a27d36'}}>環境変数待ち</b></div><div className="rule"><span>OpenAI API</span><b style={{color:'#a27d36'}}>環境変数待ち</b></div></section></div>
    <section className="card" style={{marginTop:16}}><SectionHead title="アプリ設定" action="保存"/><div className="grid two-col" style={{marginTop:0}}><div><label className="rule"><span><Bell size={15} style={{display:'inline'}}/> Daily Briefを受信</span><input type="checkbox" checked={brief} onChange={e=>setBrief(e.target.checked)}/></label><label className="rule"><span>受信時刻</span><input className="field" type="time" defaultValue="07:00"/></label><label className="rule"><span>重要ニュース通知</span><input type="checkbox" defaultChecked/></label></div><div><label className="rule"><span><Moon size={15} style={{display:'inline'}}/> ダークモード</span><select aria-label="表示テーマ" className="field" value={theme} onChange={e=>changeTheme(e.target.value)}><option value="system">端末の設定に合わせる</option><option value="light">ライト</option><option value="dark">ダーク</option></select></label><div className="rule"><span>ニュースカテゴリ</span><b>11カテゴリ</b></div><div className="rule"><span>通知</span><b>重要のみ</b></div></div></div></section>
    <section className="card" style={{marginTop:16}}><SectionHead title="PWAインストール"/><div style={{display:'flex',gap:16,alignItems:'center'}}><div className="avatar" style={{width:55,height:55,borderRadius:14}}>K</div><div style={{flex:1}}><b>iPhoneのホーム画面に追加</b><p className="muted" style={{fontSize:12,margin:'5px 0'}}>Safariの共有ボタンから「ホーム画面に追加」を選ぶと、アプリのように使えます。</p></div><button className="btn"><Download size={14} style={{display:'inline'}}/> 手順を見る</button></div></section>
  </Shell>
}
