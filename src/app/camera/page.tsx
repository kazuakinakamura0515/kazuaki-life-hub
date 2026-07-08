"use client";
import {Shell,SectionHead} from "@/components/shell";import {NewsList} from "@/components/news-list";import {Aperture,Camera,Edit3,Plus,Save,Settings2} from "lucide-react";import {useEffect,useMemo,useState} from "react";import {createClient} from "@/lib/supabase/client";

type GearType="camera"|"lens"|"accessory";
type GearItem={id?:string;gear_type:GearType;maker:string;model:string;serial_number:string;purchased_at:string;notes:string};
type GearRow={id:string;gear_type:GearType|null;maker:string|null;model:string;serial_number:string|null;purchased_at:string|null;notes:string|null};

const defaultGear:GearItem[]=[
  {gear_type:"camera",maker:"SONY",model:"α1 II",serial_number:"",purchased_at:"",notes:"メインカメラ"},
  {gear_type:"lens",maker:"SONY",model:"FE 24-70mm F2.8 GM II",serial_number:"",purchased_at:"",notes:"標準ズーム"},
  {gear_type:"lens",maker:"SONY",model:"FE 70-200mm F2.8 GM OSS II",serial_number:"",purchased_at:"",notes:"望遠ズーム"},
  {gear_type:"lens",maker:"SONY",model:"FE 16-35mm F2.8 GM II",serial_number:"",purchased_at:"",notes:"広角ズーム"},
];
const emptyGear:GearItem={gear_type:"lens",maker:"SONY",model:"",serial_number:"",purchased_at:"",notes:""};
const cats=['α1 II','α7 V','α7Rシリーズ','GMレンズ','ファームウェア','新製品','撮影ノウハウ','星景','子供撮影','旅行撮影','オペラ・舞台撮影'];

function storageKey(){return "kazuaki-life-hub-camera-gear-v1"}
function label(type:GearType){return type==="camera"?"カメラ":type==="lens"?"レンズ":"アクセサリー"}
function normalize(row:GearRow):GearItem{return {id:row.id,gear_type:row.gear_type??"accessory",maker:row.maker??"SONY",model:row.model,serial_number:row.serial_number??"",purchased_at:row.purchased_at??"",notes:row.notes??""}}

export default function CameraPage(){
  const [gear,setGear]=useState<GearItem[]>(defaultGear);
  const [editing,setEditing]=useState<string|null>(null);
  const [draft,setDraft]=useState<GearItem>(emptyGear);
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    let alive=true;
    async function load(){
      const stored=window.localStorage.getItem(storageKey());
      if(stored){try{setGear(JSON.parse(stored))}catch{}}
      const supabase=createClient();
      if(!supabase){setLoading(false);return}
      const {data,error}=await supabase.from("camera_gear").select("id,gear_type,maker,model,serial_number,purchased_at,notes").order("created_at");
      if(!alive)return;
      if(error){setMessage("カメラ所有情報を読み込めませんでした。ローカル表示を使っています。");setLoading(false);return}
      const rows=(data??[]) as GearRow[];
      if(rows.length>0){
        const next=rows.map(normalize);
        setGear(next);
        window.localStorage.setItem(storageKey(),JSON.stringify(next));
      }
      setLoading(false);
    }
    load();
    return ()=>{alive=false};
  },[]);

  const stats=useMemo(()=>{
    const cameras=gear.filter((item)=>item.gear_type==="camera");
    const lenses=gear.filter((item)=>item.gear_type==="lens");
    return {main:cameras[0],lensCount:lenses.length,gmCount:lenses.filter((item)=>item.model.toLowerCase().includes("gm")).length};
  },[gear]);

  function startAdd(){
    setEditing("new");
    setDraft(emptyGear);
    setMessage("");
  }

  function startEdit(item:GearItem){
    setEditing(item.id??item.model);
    setDraft({...item});
    setMessage("");
  }

  async function saveGear(){
    if(!draft.model.trim()){setMessage("モデル名を入力してください。");return}
    const key=editing;
    const nextDraft={...draft,model:draft.model.trim(),maker:draft.maker.trim()||"SONY"};
    const nextGear=key==="new"||!key
      ? [...gear,nextDraft]
      : gear.map((item)=>(item.id??item.model)===key?nextDraft:item);
    setGear(nextGear);
    window.localStorage.setItem(storageKey(),JSON.stringify(nextGear));
    setEditing(null);
    setMessage("カメラ所有情報を保存しました。");

    const supabase=createClient();
    if(!supabase)return;
    const payload={gear_type:nextDraft.gear_type,maker:nextDraft.maker,model:nextDraft.model,serial_number:nextDraft.serial_number||null,purchased_at:nextDraft.purchased_at||null,notes:nextDraft.notes||null,updated_at:new Date().toISOString()};
    let saveError:{message?:string}|null=null;
    if(nextDraft.id){
      const {error}=await supabase.from("camera_gear").update(payload).eq("id",nextDraft.id);
      saveError=error;
    }else{
      const {data:{user}}=await supabase.auth.getUser();
      if(!user){saveError=new Error("ログイン状態を確認できませんでした");}
      else{
        const {data,error}=await supabase.from("camera_gear").insert({user_id:user.id,...payload}).select("id").single();
        saveError=error;
        if(data?.id){
          const withId=nextGear.map((item)=>item===nextDraft?{...item,id:data.id}:item);
          setGear(withId);
          window.localStorage.setItem(storageKey(),JSON.stringify(withId));
        }
      }
    }
    if(saveError)setMessage("画面には保存しましたが、Supabase保存に失敗しました。少し待って再度お試しください。");
  }

  return <Shell title="カメラ・SONY" eyebrow="CREATIVE GEAR">{message&&<div className="notice" role="status" style={{marginBottom:16}}>{message}</div>}{loading&&<div className="notice" role="status" style={{marginBottom:16}}>カメラ所有情報を読み込んでいます。</div>}<div className="grid stats3"><div className="card hero-card"><div className="card-label" style={{color:'#b8c4d4'}}><Camera size={14}/>MAIN CAMERA</div><div className="metric">{stats.main?`${stats.main.maker} ${stats.main.model}`:"未登録"}</div><div className="meta" style={{color:'#b8c4d4'}}>{stats.main?.notes||"所有カメラを登録してください"}</div></div><div className="card"><div className="card-label"><Aperture size={14}/>所有レンズ</div><div className="metric">{stats.lensCount} <small>本</small></div><div className="meta">GMレンズ {stats.gmCount}本</div></div><div className="card"><div className="card-label"><Settings2 size={14}/>お気に入り設定</div><div className="metric">12 <small>プリセット</small></div><div className="meta">次フェーズでプリセット登録を拡張予定</div></div></div><section className="card" style={{marginTop:16}}><div className="section-head"><div className="section-title">所有カメラ・レンズ</div><button className="btn primary" onClick={startAdd}><Plus size={14} style={{display:"inline",verticalAlign:"middle"}}/> 所有機材を追加</button></div>{editing&&<div className="edit-panel form-panel"><div className="form-grid"><label className="card-label" htmlFor="gear-type">種類</label><select id="gear-type" className="field" value={draft.gear_type} onChange={(e)=>setDraft({...draft,gear_type:e.target.value as GearType})}><option value="camera">カメラ</option><option value="lens">レンズ</option><option value="accessory">アクセサリー</option></select><label className="card-label" htmlFor="gear-maker">メーカー</label><input id="gear-maker" className="field" value={draft.maker} onChange={(e)=>setDraft({...draft,maker:e.target.value})}/><label className="card-label" htmlFor="gear-model">モデル名</label><input id="gear-model" className="field" value={draft.model} onChange={(e)=>setDraft({...draft,model:e.target.value})} placeholder="例：α1 II / FE 24-70mm F2.8 GM II"/><label className="card-label" htmlFor="gear-serial">シリアル番号</label><input id="gear-serial" className="field" value={draft.serial_number} onChange={(e)=>setDraft({...draft,serial_number:e.target.value})}/><label className="card-label" htmlFor="gear-purchased">購入日</label><input id="gear-purchased" className="field" type="date" value={draft.purchased_at} onChange={(e)=>setDraft({...draft,purchased_at:e.target.value})}/><label className="card-label" htmlFor="gear-notes">メモ</label><textarea id="gear-notes" className="field" value={draft.notes} onChange={(e)=>setDraft({...draft,notes:e.target.value})} rows={3}/></div><div style={{display:"flex",gap:8,marginTop:10}}><button className="btn primary" onClick={saveGear}><Save size={14} style={{display:"inline",verticalAlign:"middle"}}/> 保存</button><button className="btn" onClick={()=>setEditing(null)}>キャンセル</button></div></div>}<div className="grid page-grid">{gear.map((item)=><article className="card item-card" key={item.id??item.model} style={{boxShadow:"none"}}><div className="item-top"><span className="tag">{label(item.gear_type)}</span><button className="icon-btn" aria-label={`${item.model}を編集`} onClick={()=>startEdit(item)}><Edit3 size={14}/></button></div><h3>{item.maker} {item.model}</h3><div className="meta">シリアル：{item.serial_number||"未登録"}</div><div className="rule"><span>購入日</span><b>{item.purchased_at||"未登録"}</b></div><div className="rule"><span>メモ</span><b>{item.notes||"—"}</b></div></article>)}</div></section><div className="filters" style={{marginTop:16}}>{cats.map(c=><button className="btn" key={c}>{c}</button>)}</div><section className="card"><SectionHead title="SONY・撮影ニュース" action="保存済みを見る"/><NewsList limit={5}/></section></Shell>
}
