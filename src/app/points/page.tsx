"use client";
import {Shell,SectionHead} from "@/components/shell";import {num,points as defaultPoints} from "@/lib/data";import {ArrowDownRight,ArrowUpRight,Edit3,Save} from "lucide-react";import {useEffect,useMemo,useState} from "react";import {createClient} from "@/lib/supabase/client";

type PointItem=(typeof defaultPoints)[number]&{id?:string;lastUpdatedAt?:string};
type AccountRow={id:string;program_name:string;balance:number|string|null;target_balance:number|string|null;last_updated_at:string|null};

function toNumber(value:number|string|null|undefined,fallback=0){const n=Number(value);return Number.isFinite(n)?n:fallback}
function storageKey(){return "kazuaki-life-hub-points-v1"}

export default function Points(){
  const [items,setItems]=useState<PointItem[]>(defaultPoints);
  const [editing,setEditing]=useState<string|null>(null);
  const [balance,setBalance]=useState("");
  const [target,setTarget]=useState("");
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    let alive=true;
    async function load(){
      const stored=typeof window!=="undefined"?window.localStorage.getItem(storageKey()):null;
      if(stored){try{setItems(JSON.parse(stored))}catch{}}
      const supabase=createClient();
      if(!supabase){setLoading(false);return}
      const {data,error}=await supabase.from("points_accounts").select("id,program_name,balance,target_balance,last_updated_at").order("program_name");
      if(!alive)return;
      if(error){setMessage("ポイント残高を読み込めませんでした。ローカル表示を使っています。");setLoading(false);return}
      const rows=(data??[]) as AccountRow[];
      const merged=defaultPoints.map((p)=>{
        const row=rows.find((r)=>r.program_name===p.name);
        return row?{...p,id:row.id,balance:toNumber(row.balance,p.balance),target:toNumber(row.target_balance,p.target),lastUpdatedAt:row.last_updated_at??undefined}:p;
      });
      setItems(merged);
      window.localStorage.setItem(storageKey(),JSON.stringify(merged));
      setLoading(false);
    }
    load();
    return ()=>{alive=false};
  },[]);

  const summary=useMemo(()=>items.reduce((acc,p)=>acc+p.balance,0),[items]);

  function startEdit(p:PointItem){
    setEditing(p.name);
    setBalance(String(p.balance));
    setTarget(String(p.target));
    setMessage("");
  }

  async function savePoint(p:PointItem){
    const nextBalance=toNumber(balance,p.balance);
    const nextTarget=toNumber(target,p.target);
    const updatedAt=new Date().toISOString();
    const nextItems=items.map((item)=>item.name===p.name?{...item,balance:nextBalance,target:nextTarget,lastUpdatedAt:updatedAt}:item);
    setItems(nextItems);
    window.localStorage.setItem(storageKey(),JSON.stringify(nextItems));
    setEditing(null);
    setMessage("保存しました。");

    const supabase=createClient();
    if(!supabase)return;
    const payload={balance:nextBalance,target_balance:nextTarget,last_updated_at:updatedAt};
    let result;
    if(p.id){
      result=await supabase.from("points_accounts").update(payload).eq("id",p.id);
    }else{
      const {data:{user}}=await supabase.auth.getUser();
      result=user
        ? await supabase.from("points_accounts").upsert({user_id:user.id,program_name:p.name,...payload},{onConflict:"user_id,program_name"})
        : {error:new Error("ログイン状態を確認できませんでした")};
    }
    if(result.error)setMessage("画面には保存しましたが、Supabase保存に失敗しました。少し待って再度お試しください。");
  }

  return <Shell title="ポイント・マイル" eyebrow="LOYALTY PORTFOLIO">{message&&<div className="notice" role="status" style={{marginBottom:16}}>{message}</div>}{loading&&<div className="notice" role="status" style={{marginBottom:16}}>ポイント残高を読み込んでいます。</div>}<div className="grid page-grid">{items.map((p)=><div className="card item-card" key={p.name}><div className="item-top"><div className="avatar" style={{background:p.color,color:'#fff'}}>{p.short.slice(0,2)}</div><button className="icon-btn" aria-label={`${p.name}を編集`} onClick={()=>startEdit(p)}><Edit3 size={14}/></button></div><h3>{p.name}</h3>{editing===p.name?<div className="edit-panel"><label className="card-label" htmlFor={`balance-${p.short}`}>現在の残高</label><input id={`balance-${p.short}`} className="field" inputMode="numeric" value={balance} onChange={(e)=>setBalance(e.target.value.replace(/[^\d.]/g,""))}/><label className="card-label" htmlFor={`target-${p.short}`}>目標残高</label><input id={`target-${p.short}`} className="field" inputMode="numeric" value={target} onChange={(e)=>setTarget(e.target.value.replace(/[^\d.]/g,""))}/><div style={{display:"flex",gap:8,marginTop:10}}><button className="btn primary" onClick={()=>savePoint(p)}><Save size={14} style={{display:"inline",verticalAlign:"middle"}}/> 保存</button><button className="btn" onClick={()=>setEditing(null)}>キャンセル</button></div></div>:<><div className="big">{p.name==='HGV MAX'?'保有':num(p.balance)+' pt'}</div><div className="meta">最終更新 {p.lastUpdatedAt?new Date(p.lastUpdatedAt).toLocaleDateString("ja-JP"):"未更新"}</div><div style={{display:'flex',justifyContent:'space-between',marginTop:15,fontSize:12}}><span className="muted">前月比</span><b style={{color:p.change>=0?'#477d68':'#a75858',display:'flex',gap:3}}>{p.change>=0?<ArrowUpRight size={14}/>:<ArrowDownRight size={14}/>} {p.change===0?'—':num(Math.abs(p.change))}</b></div><div className="progress" style={{background:'#e9ebee'}}><i style={{width:`${Math.min(100,p.balance/Math.max(1,p.target)*100)}%`,background:p.color}}/></div></>}</div>)}</div><div className="grid two-col"><section className="card"><SectionHead title="月別残高推移" action="12か月"/><div className="chart">{[46,53,49,61,68,73,69,77,83,88,91,96].map((h,i)=><i className="bar" style={{height:`${h}%`}} key={i}/>)}</div><div className="bar-labels"><span>8月</span><span>10月</span><span>12月</span><span>2月</span><span>4月</span><span>6月</span></div></section><section className="card"><SectionHead title="年間サマリー"/><div className="rule"><span>現在の合計残高</span><b>{num(summary)} pt</b></div><div className="rule"><span>年間獲得量</span><b>482,600 pt</b></div><div className="rule"><span>年間利用量</span><b>216,000 pt</b></div><div className="rule"><span>純増</span><b style={{color:'#477d68'}}>+266,600 pt</b></div><div className="rule"><span>推定価値</span><b>¥1,690,000</b></div></section></div></Shell>
}
