"use client";
import {Shell,SectionHead} from "@/components/shell";import {cards as defaultCards,rules,yen} from "@/lib/data";import {CreditCard,Edit3,Save} from "lucide-react";import {useEffect,useMemo,useState} from "react";import {createClient} from "@/lib/supabase/client";

type CardItem=(typeof defaultCards)[number]&{id?:string};
type CardRow={id:string;name:string;card_type:string|null;primary_use:string|null;annual_fee:number|string|null;monthly_spend:number|string|null;annual_spend:number|string|null;recovery_rating:string|null};

const aliases:Record<string,string[]>={
  "アメックス・プラチナ":["アメリカン・エキスプレス・プラチナ"],
  "アメックス・ビジネス・プラチナ":["アメリカン・エキスプレス・ビジネス・プラチナ"],
  "LC ゴールド Business":["ラグジュアリーカード ゴールド Business"],
  "阪急外商 VISA":["阪急外商VISAカード"],
  "ANA SFC JCB 一般":["ANA SFC JCB一般カード"],
};

function storageKey(){return "kazuaki-life-hub-cards-v1"}
function toNumber(value:number|string|null|undefined,fallback=0){const n=Number(value);return Number.isFinite(n)?n:fallback}
function cardType(type:string|null|undefined,fallback:string){return type==="business"?"法人":type==="personal"?"個人":fallback}
function dbType(type:string){return type==="法人"?"business":"personal"}
function matches(rowName:string,cardName:string){return rowName===cardName || (aliases[cardName]??[]).includes(rowName)}

export default function Cards(){
  const [items,setItems]=useState<CardItem[]>(defaultCards);
  const [editing,setEditing]=useState<string|null>(null);
  const [month,setMonth]=useState("");
  const [year,setYear]=useState("");
  const [fee,setFee]=useState("");
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    let alive=true;
    async function load(){
      const stored=typeof window!=="undefined"?window.localStorage.getItem(storageKey()):null;
      if(stored){try{setItems(JSON.parse(stored))}catch{}}
      const supabase=createClient();
      if(!supabase){setLoading(false);return}
      const {data,error}=await supabase.from("cards").select("id,name,card_type,primary_use,annual_fee,monthly_spend,annual_spend,recovery_rating").order("name");
      if(!alive)return;
      if(error){setMessage("カード利用額を読み込めませんでした。ローカル表示を使っています。");setLoading(false);return}
      const rows=(data??[]) as CardRow[];
      const merged=defaultCards.map((card)=>{
        const row=rows.find((r)=>matches(r.name,card.name));
        return row?{...card,id:row.id,type:cardType(row.card_type,card.type),use:row.primary_use??card.use,month:toNumber(row.monthly_spend,card.month),year:toNumber(row.annual_spend,card.year),fee:toNumber(row.annual_fee,card.fee),rating:row.recovery_rating??card.rating}:card;
      });
      setItems(merged);
      window.localStorage.setItem(storageKey(),JSON.stringify(merged));
      setLoading(false);
    }
    load();
    return ()=>{alive=false};
  },[]);

  const totals=useMemo(()=>items.reduce((acc,c)=>({month:acc.month+c.month,year:acc.year+c.year,fee:acc.fee+c.fee}),{month:0,year:0,fee:0}),[items]);

  function startEdit(card:CardItem){
    setEditing(card.name);
    setMonth(String(card.month));
    setYear(String(card.year));
    setFee(String(card.fee));
    setMessage("");
  }

  async function saveCard(card:CardItem){
    const monthlySpend=toNumber(month,card.month);
    const annualSpend=toNumber(year,card.year);
    const annualFee=toNumber(fee,card.fee);
    const nextItems=items.map((item)=>item.name===card.name?{...item,month:monthlySpend,year:annualSpend,fee:annualFee}:item);
    setItems(nextItems);
    window.localStorage.setItem(storageKey(),JSON.stringify(nextItems));
    setEditing(null);
    setMessage("カード利用額を保存しました。");

    const supabase=createClient();
    if(!supabase)return;
    const payload={monthly_spend:monthlySpend,annual_spend:annualSpend,annual_fee:annualFee,updated_at:new Date().toISOString()};
    let saveError: {message?:string}|null=null;
    if(card.id){
      const {error}=await supabase.from("cards").update(payload).eq("id",card.id);
      saveError=error;
    }else{
      const {data:{user}}=await supabase.auth.getUser();
      if(!user){
        saveError=new Error("ログイン状態を確認できませんでした");
      }else{
        const {data,error}=await supabase.from("cards").insert({user_id:user.id,name:card.name,card_type:dbType(card.type),primary_use:card.use,recovery_rating:card.rating,...payload}).select("id").single();
        saveError=error;
        if(data?.id){
        const withId=nextItems.map((item)=>item.name===card.name?{...item,id:data.id}:item);
        setItems(withId);
        window.localStorage.setItem(storageKey(),JSON.stringify(withId));
        }
      }
    }
    if(saveError)setMessage("画面には保存しましたが、Supabase保存に失敗しました。少し待って再度お試しください。");
  }

  return <Shell title="クレジットカード" eyebrow="CARD PORTFOLIO">{message&&<div className="notice" role="status" style={{marginBottom:16}}>{message}</div>}{loading&&<div className="notice" role="status" style={{marginBottom:16}}>カード利用額を読み込んでいます。</div>}<div className="grid stats3"><div className="card"><div className="card-label">今月の利用額</div><div className="metric">{yen(totals.month)}</div><div className="meta">予算 ¥6,000,000</div></div><div className="card"><div className="card-label">年間利用額</div><div className="metric">{yen(totals.year)}</div><div className="meta">目安達成率 72%</div></div><div className="card"><div className="card-label">年会費合計</div><div className="metric">{yen(totals.fee)}</div><div className="meta">特典回収見込 148%</div></div></div><section className="card" style={{marginTop:16}}><SectionHead title="カード一覧" action="カードを追加"/><div className="table-wrap"><table className="table"><thead><tr><th>カード</th><th>区分 / 主な用途</th><th>今月利用</th><th>年間利用</th><th>年会費</th><th>回収評価</th><th></th></tr></thead><tbody>{items.map((c,i)=><tr key={c.name}><td><div style={{display:'flex',gap:10,alignItems:'center'}}><span className="avatar" style={{borderRadius:8,background:i<2?'#8f8171':i<4?'#171a20':'#53677d'}}><CreditCard size={17}/></span><b>{c.name}</b></div>{editing===c.name&&<div className="edit-panel card-edit-panel"><label className="card-label" htmlFor={`month-${i}`}>今月利用</label><input id={`month-${i}`} className="field" inputMode="numeric" value={month} onChange={(e)=>setMonth(e.target.value.replace(/[^\d.]/g,""))}/><label className="card-label" htmlFor={`year-${i}`}>年間利用</label><input id={`year-${i}`} className="field" inputMode="numeric" value={year} onChange={(e)=>setYear(e.target.value.replace(/[^\d.]/g,""))}/><label className="card-label" htmlFor={`fee-${i}`}>年会費</label><input id={`fee-${i}`} className="field" inputMode="numeric" value={fee} onChange={(e)=>setFee(e.target.value.replace(/[^\d.]/g,""))}/><div style={{display:"flex",gap:8,marginTop:10}}><button className="btn primary" onClick={()=>saveCard(c)}><Save size={14} style={{display:"inline",verticalAlign:"middle"}}/> 保存</button><button className="btn" onClick={()=>setEditing(null)}>キャンセル</button></div></div>}</td><td><span className="tag">{c.type}</span><div className="meta">{c.use}</div></td><td>{yen(c.month)}</td><td>{yen(c.year)}</td><td>{yen(c.fee)}</td><td><span className="tag">{c.rating}</span></td><td><button className="icon-btn" aria-label={`${c.name}を編集`} onClick={()=>startEdit(c)}><Edit3 size={14}/></button></td></tr>)}</tbody></table></div></section><section className="card" style={{marginTop:16}}><SectionHead title="この支払いはこのカード" action="ルールを編集"/><div className="grid two-col" style={{marginTop:0}}>{[0,1].map(col=><div key={col}>{rules.slice(col*4,col*4+4).map(([a,b])=><div className="rule" key={a}><span>{a}</span><b>{b}</b></div>)}</div>)}</div></section></Shell>
}
