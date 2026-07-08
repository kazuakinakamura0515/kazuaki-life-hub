"use client";
import {Shell} from "@/components/shell";import {trips as defaultTrips,yen} from "@/lib/data";import {CalendarDays,Camera,Edit3,MapPin,Plus,Save} from "lucide-react";import {useEffect,useMemo,useState} from "react";import {createClient} from "@/lib/supabase/client";

type TripStatus="considering"|"booked"|"traveling"|"completed";
type TripItem={id?:string;name:string;destination:string;departure_date:string;return_date:string;hotel:string;airline:string;flight_number:string;budget:number;points_used:number;miles_used:number;status:TripStatus;notes:string};
type TripRow={id:string;name:string;destination:string|null;departure_date:string|null;return_date:string|null;hotel:string|null;airline:string|null;flight_number:string|null;budget:number|string|null;points_used:number|string|null;miles_used:number|string|null;status:TripStatus|null;notes:string|null};

const emptyTrip:TripItem={name:"",destination:"",departure_date:"",return_date:"",hotel:"",airline:"",flight_number:"",budget:0,points_used:0,miles_used:0,status:"considering",notes:""};
const initialTrips:TripItem[]=defaultTrips.map((trip)=>({name:trip.name,destination:trip.place,departure_date:trip.from,return_date:trip.to,hotel:trip.hotel,airline:"ANA",flight_number:trip.flight,budget:trip.budget,points_used:0,miles_used:0,status:trip.status==="予約済み"?"booked":"considering",notes:""}));

function storageKey(){return "kazuaki-life-hub-trips-v1"}
function toNumber(value:number|string|null|undefined,fallback=0){const n=Number(value);return Number.isFinite(n)?n:fallback}
function statusLabel(status:TripStatus){return status==="booked"?"予約済み":status==="traveling"?"旅行中":status==="completed"?"完了":"検討中"}
function normalize(row:TripRow):TripItem{return {id:row.id,name:row.name,destination:row.destination??"",departure_date:row.departure_date??"",return_date:row.return_date??"",hotel:row.hotel??"",airline:row.airline??"",flight_number:row.flight_number??"",budget:toNumber(row.budget),points_used:toNumber(row.points_used),miles_used:toNumber(row.miles_used),status:row.status??"considering",notes:row.notes??""}}
function dateShort(value:string){return value?value.slice(5).replace("-","/"):"未定"}
function daysUntil(value:string){if(!value)return null;const today=new Date();today.setHours(0,0,0,0);const target=new Date(`${value}T00:00:00`);return Math.ceil((target.getTime()-today.getTime())/86400000)}
function tripKey(trip:TripItem){return trip.id??trip.name}

export default function Trips(){
  const [items,setItems]=useState<TripItem[]>(initialTrips);
  const [editing,setEditing]=useState<string|null>(null);
  const [memoEditing,setMemoEditing]=useState<string|null>(null);
  const [memo,setMemo]=useState("");
  const [draft,setDraft]=useState<TripItem>(emptyTrip);
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    let alive=true;
    async function load(){
      const stored=window.localStorage.getItem(storageKey());
      if(stored){try{setItems(JSON.parse(stored))}catch{}}
      const supabase=createClient();
      if(!supabase){setLoading(false);return}
      const {data,error}=await supabase.from("trips").select("id,name,destination,departure_date,return_date,hotel,airline,flight_number,budget,points_used,miles_used,status,notes").order("departure_date");
      if(!alive)return;
      if(error){setMessage("旅行情報を読み込めませんでした。ローカル表示を使っています。");setLoading(false);return}
      const rows=(data??[]) as TripRow[];
      if(rows.length>0){
        const next=rows.map(normalize);
        setItems(next);
        window.localStorage.setItem(storageKey(),JSON.stringify(next));
      }
      setLoading(false);
    }
    load();
    return ()=>{alive=false};
  },[]);

  const nextTrip=useMemo(()=>items.filter((trip)=>trip.status!=="completed").sort((a,b)=>(a.departure_date||"9999").localeCompare(b.departure_date||"9999"))[0], [items]);
  const totals=useMemo(()=>items.reduce((acc,trip)=>({budget:acc.budget+trip.budget,points:acc.points+trip.points_used+trip.miles_used,count:acc.count+1}),{budget:0,points:0,count:0}),[items]);
  const nextDays=daysUntil(nextTrip?.departure_date??"");

  function startAdd(){
    setEditing("new");
    setMemoEditing(null);
    setDraft(emptyTrip);
    setMessage("");
  }

  function startEdit(trip:TripItem){
    setEditing(tripKey(trip));
    setMemoEditing(null);
    setDraft({...trip});
    setMessage("");
  }

  function startMemo(trip:TripItem){
    setMemoEditing(tripKey(trip));
    setEditing(null);
    setMemo(trip.notes);
    setMessage("");
  }

  async function persistTrip(nextTrip:TripItem, successMessage:string){
    const nextItems=items.map((item)=>tripKey(item)===tripKey(nextTrip)?nextTrip:item);
    setItems(nextItems);
    window.localStorage.setItem(storageKey(),JSON.stringify(nextItems));
    setMessage(successMessage);

    const supabase=createClient();
    if(!supabase)return;
    const payload={name:nextTrip.name,destination:nextTrip.destination||null,departure_date:nextTrip.departure_date||null,return_date:nextTrip.return_date||null,hotel:nextTrip.hotel||null,airline:nextTrip.airline||null,flight_number:nextTrip.flight_number||null,budget:nextTrip.budget,points_used:nextTrip.points_used,miles_used:nextTrip.miles_used,status:nextTrip.status,notes:nextTrip.notes||null,updated_at:new Date().toISOString()};
    const {error}=await supabase.from("trips").update(payload).eq("id",nextTrip.id);
    if(error)setMessage("画面には保存しましたが、Supabase保存に失敗しました。少し待って再度お試しください。");
  }

  async function saveTrip(){
    if(!draft.name.trim()){setMessage("旅行名を入力してください。");return}
    const key=editing;
    const nextDraft={...draft,name:draft.name.trim(),destination:draft.destination.trim(),budget:toNumber(draft.budget),points_used:toNumber(draft.points_used),miles_used:toNumber(draft.miles_used)};
    const nextItems=key==="new"||!key
      ? [...items,nextDraft]
      : items.map((item)=>tripKey(item)===key?nextDraft:item);
    setItems(nextItems);
    window.localStorage.setItem(storageKey(),JSON.stringify(nextItems));
    setEditing(null);
    setMessage("旅行情報を保存しました。");

    const supabase=createClient();
    if(!supabase)return;
    const payload={name:nextDraft.name,destination:nextDraft.destination||null,departure_date:nextDraft.departure_date||null,return_date:nextDraft.return_date||null,hotel:nextDraft.hotel||null,airline:nextDraft.airline||null,flight_number:nextDraft.flight_number||null,budget:nextDraft.budget,points_used:nextDraft.points_used,miles_used:nextDraft.miles_used,status:nextDraft.status,notes:nextDraft.notes||null,updated_at:new Date().toISOString()};
    let saveError:{message?:string}|null=null;
    if(nextDraft.id){
      const {error}=await supabase.from("trips").update(payload).eq("id",nextDraft.id);
      saveError=error;
    }else{
      const {data:{user}}=await supabase.auth.getUser();
      if(!user){saveError=new Error("ログイン状態を確認できませんでした");}
      else{
        const {data,error}=await supabase.from("trips").insert({user_id:user.id,...payload}).select("id").single();
        saveError=error;
        if(data?.id){
          const withId=nextItems.map((item)=>item===nextDraft?{...item,id:data.id}:item);
          setItems(withId);
          window.localStorage.setItem(storageKey(),JSON.stringify(withId));
        }
      }
    }
    if(saveError)setMessage("画面には保存しましたが、Supabase保存に失敗しました。少し待って再度お試しください。");
  }

  async function saveMemo(trip:TripItem){
    const nextTrip={...trip,notes:memo};
    setMemoEditing(null);
    await persistTrip(nextTrip,"写真・メモを保存しました。");
  }

  return <Shell title="旅行プラン" eyebrow="TRAVEL CONCIERGE">{message&&<div className="notice" role="status" style={{marginBottom:16}}>{message}</div>}{loading&&<div className="notice" role="status" style={{marginBottom:16}}>旅行情報を読み込んでいます。</div>}<div className="card trip-banner"><div><div className="eyebrow">NEXT JOURNEY</div><h2 style={{margin:'8px 0'}}>{nextTrip?.name??"旅行を登録してください"}</h2><div style={{fontSize:13,color:'#ced8e5'}}>{nextTrip?`${dateShort(nextTrip.departure_date)} — ${dateShort(nextTrip.return_date)} ・ ${nextTrip.hotel||"ホテル未定"} ・ ${nextTrip.flight_number||"便未定"}`:"次の旅程が未登録です"}</div></div><div style={{textAlign:'right'}}><div className="days">{nextDays===null?"—":Math.max(0,nextDays)}</div><small>DAYS TO GO</small></div></div><div className="grid stats3"><div className="card"><div className="card-label"><CalendarDays size={14}/>今年の旅行</div><div className="metric">{totals.count} <small>回</small></div></div><div className="card"><div className="card-label">年間旅行予算</div><div className="metric">{yen(totals.budget)}</div></div><div className="card"><div className="card-label">利用予定ポイント・マイル</div><div className="metric">{totals.points.toLocaleString("ja-JP")} <small>pt</small></div></div></div><section className="card" style={{marginTop:16}}><div className="section-head"><div className="section-title">今後の旅行</div><button className="btn primary" onClick={startAdd}><Plus size={14} style={{display:'inline',verticalAlign:'middle'}}/> 旅行を登録</button></div>{editing&&<div className="edit-panel form-panel"><div className="form-grid"><label className="card-label" htmlFor="trip-name">旅行名</label><input id="trip-name" className="field" value={draft.name} onChange={(e)=>setDraft({...draft,name:e.target.value})} placeholder="例：家族で宮古島サマーバケーション"/><label className="card-label" htmlFor="trip-destination">行き先</label><input id="trip-destination" className="field" value={draft.destination} onChange={(e)=>setDraft({...draft,destination:e.target.value})}/><label className="card-label" htmlFor="trip-from">出発日</label><input id="trip-from" className="field" type="date" value={draft.departure_date} onChange={(e)=>setDraft({...draft,departure_date:e.target.value})}/><label className="card-label" htmlFor="trip-to">帰着日</label><input id="trip-to" className="field" type="date" value={draft.return_date} onChange={(e)=>setDraft({...draft,return_date:e.target.value})}/><label className="card-label" htmlFor="trip-hotel">ホテル</label><input id="trip-hotel" className="field" value={draft.hotel} onChange={(e)=>setDraft({...draft,hotel:e.target.value})}/><label className="card-label" htmlFor="trip-airline">航空会社</label><input id="trip-airline" className="field" value={draft.airline} onChange={(e)=>setDraft({...draft,airline:e.target.value})}/><label className="card-label" htmlFor="trip-flight">便名</label><input id="trip-flight" className="field" value={draft.flight_number} onChange={(e)=>setDraft({...draft,flight_number:e.target.value})}/><label className="card-label" htmlFor="trip-budget">予算</label><input id="trip-budget" className="field" inputMode="numeric" value={String(draft.budget)} onChange={(e)=>setDraft({...draft,budget:toNumber(e.target.value.replace(/[^\d.]/g,""))})}/><label className="card-label" htmlFor="trip-points">利用予定ポイント</label><input id="trip-points" className="field" inputMode="numeric" value={String(draft.points_used)} onChange={(e)=>setDraft({...draft,points_used:toNumber(e.target.value.replace(/[^\d.]/g,""))})}/><label className="card-label" htmlFor="trip-miles">利用予定マイル</label><input id="trip-miles" className="field" inputMode="numeric" value={String(draft.miles_used)} onChange={(e)=>setDraft({...draft,miles_used:toNumber(e.target.value.replace(/[^\d.]/g,""))})}/><label className="card-label" htmlFor="trip-status">ステータス</label><select id="trip-status" className="field" value={draft.status} onChange={(e)=>setDraft({...draft,status:e.target.value as TripStatus})}><option value="considering">検討中</option><option value="booked">予約済み</option><option value="traveling">旅行中</option><option value="completed">完了</option></select><label className="card-label" htmlFor="trip-notes">メモ</label><textarea id="trip-notes" className="field" value={draft.notes} onChange={(e)=>setDraft({...draft,notes:e.target.value})} rows={3}/></div><div style={{display:"flex",gap:8,marginTop:10}}><button className="btn primary" onClick={saveTrip}><Save size={14} style={{display:"inline",verticalAlign:"middle"}}/> 保存</button><button className="btn" onClick={()=>setEditing(null)}>キャンセル</button></div></div>}<div className="grid page-grid">{items.map(t=><article className="card item-card" key={tripKey(t)} style={{boxShadow:'none'}}><div className="item-top"><span className="tag">{statusLabel(t.status)}</span><button className="icon-btn" aria-label={`${t.name}を編集`} onClick={()=>startEdit(t)}><Edit3 size={14}/></button></div><h3>{t.name}</h3><div className="meta"><MapPin size={12} style={{display:'inline'}}/> {t.destination||"行き先未定"}</div><div className="rule"><span>日程</span><b>{dateShort(t.departure_date)} — {dateShort(t.return_date)}</b></div><div className="rule"><span>ホテル</span><b>{t.hotel||"未定"}</b></div><div className="rule"><span>便名</span><b>{[t.airline,t.flight_number].filter(Boolean).join(" ")||"未定"}</b></div><div className="rule"><span>予算</span><b>{yen(t.budget)}</b></div><div className="rule"><span>ポイント・マイル</span><b>{(t.points_used+t.miles_used).toLocaleString("ja-JP")} pt</b></div>{t.notes&&<p className="meta">{t.notes}</p>}{memoEditing===tripKey(t)&&<div className="edit-panel" style={{marginTop:12}}><label className="card-label" htmlFor={`memo-${tripKey(t)}`}>写真・メモ</label><textarea id={`memo-${tripKey(t)}`} className="field" value={memo} onChange={(e)=>setMemo(e.target.value)} rows={4} placeholder="写真撮影メモ、持ち物、現地で撮りたい場所など"/><div style={{display:"flex",gap:8}}><button className="btn primary" onClick={()=>saveMemo(t)}><Save size={14} style={{display:"inline",verticalAlign:"middle"}}/> 保存</button><button className="btn" onClick={()=>setMemoEditing(null)}>キャンセル</button></div></div>}<button className="btn" style={{width:'100%',marginTop:12}} onClick={()=>startMemo(t)}><Camera size={14} style={{display:'inline',verticalAlign:'middle'}}/> 写真・メモ</button></article>)}</div></section></Shell>
}
