"use client";
import {Shell,SectionHead} from "@/components/shell";import {NewsList} from "@/components/news-list";import {CalendarDays,CreditCard,Plane,TrendingUp,WalletCards} from "lucide-react";import {cards as defaultCards,num,points as defaultPoints,trips as defaultTrips,yen} from "@/lib/data";import {useEffect,useMemo,useState} from "react";import {createClient} from "@/lib/supabase/client";

type PointItem=(typeof defaultPoints)[number]&{id?:string;lastUpdatedAt?:string};
type CardItem=(typeof defaultCards)[number]&{id?:string};
type TripStatus="considering"|"booked"|"traveling"|"completed";
type TripItem={id?:string;name:string;destination:string;departure_date:string;return_date:string;hotel:string;airline:string;flight_number:string;budget:number;points_used:number;miles_used:number;status:TripStatus;notes:string};
type PointRow={id:string;program_name:string;balance:number|string|null;target_balance:number|string|null;last_updated_at:string|null};
type CardRow={id:string;name:string;monthly_spend:number|string|null;annual_spend:number|string|null;annual_fee:number|string|null};
type TripRow={id:string;name:string;destination:string|null;departure_date:string|null;return_date:string|null;hotel:string|null;airline:string|null;flight_number:string|null;budget:number|string|null;points_used:number|string|null;miles_used:number|string|null;status:TripStatus|null;notes:string|null};

const cardAliases:Record<string,string[]>={
  "アメックス・プラチナ":["アメリカン・エキスプレス・プラチナ"],
  "アメックス・ビジネス・プラチナ":["アメリカン・エキスプレス・ビジネス・プラチナ"],
  "LC ゴールド Business":["ラグジュアリーカード ゴールド Business"],
  "阪急外商 VISA":["阪急外商VISAカード"],
  "ANA SFC JCB 一般":["ANA SFC JCB一般カード"],
};
const initialTrips:TripItem[]=defaultTrips.map((trip)=>({name:trip.name,destination:trip.place,departure_date:trip.from,return_date:trip.to,hotel:trip.hotel,airline:"ANA",flight_number:trip.flight,budget:trip.budget,points_used:0,miles_used:0,status:trip.status==="予約済み"?"booked":"considering",notes:""}));

function toNumber(value:number|string|null|undefined,fallback=0){const n=Number(value);return Number.isFinite(n)?n:fallback}
function pointStorageKey(){return "kazuaki-life-hub-points-v1"}
function cardStorageKey(){return "kazuaki-life-hub-cards-v1"}
function tripStorageKey(){return "kazuaki-life-hub-trips-v1"}
function matchesCard(rowName:string,cardName:string){return rowName===cardName || (cardAliases[cardName]??[]).includes(rowName)}
function normalizeTrip(row:TripRow):TripItem{return {id:row.id,name:row.name,destination:row.destination??"",departure_date:row.departure_date??"",return_date:row.return_date??"",hotel:row.hotel??"",airline:row.airline??"",flight_number:row.flight_number??"",budget:toNumber(row.budget),points_used:toNumber(row.points_used),miles_used:toNumber(row.miles_used),status:row.status??"considering",notes:row.notes??""}}
function dateShort(value:string){return value?value.replaceAll("-","."):"未定"}
function daysUntil(value:string){if(!value)return null;const today=new Date();today.setHours(0,0,0,0);const target=new Date(`${value}T00:00:00`);return Math.ceil((target.getTime()-today.getTime())/86400000)}

export default function Home(){
  const [points,setPoints]=useState<PointItem[]>(defaultPoints);
  const [cards,setCards]=useState<CardItem[]>(defaultCards);
  const [trips,setTrips]=useState<TripItem[]>(initialTrips);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    let alive=true;
    async function load(){
      const storedPoints=window.localStorage.getItem(pointStorageKey());
      const storedCards=window.localStorage.getItem(cardStorageKey());
      const storedTrips=window.localStorage.getItem(tripStorageKey());
      if(storedPoints){try{setPoints(JSON.parse(storedPoints))}catch{}}
      if(storedCards){try{setCards(JSON.parse(storedCards))}catch{}}
      if(storedTrips){try{setTrips(JSON.parse(storedTrips))}catch{}}

      const supabase=createClient();
      if(!supabase){setLoading(false);return}

      const [pointResult,cardResult,tripResult]=await Promise.all([
        supabase.from("points_accounts").select("id,program_name,balance,target_balance,last_updated_at").order("program_name"),
        supabase.from("cards").select("id,name,monthly_spend,annual_spend,annual_fee").order("name"),
        supabase.from("trips").select("id,name,destination,departure_date,return_date,hotel,airline,flight_number,budget,points_used,miles_used,status,notes").order("departure_date"),
      ]);
      if(!alive)return;

      if(!pointResult.error){
        const rows=(pointResult.data??[]) as PointRow[];
        const merged=defaultPoints.map((p)=>{
          const row=rows.find((r)=>r.program_name===p.name);
          return row?{...p,id:row.id,balance:toNumber(row.balance,p.balance),target:toNumber(row.target_balance,p.target),lastUpdatedAt:row.last_updated_at??undefined}:p;
        });
        setPoints(merged);
        window.localStorage.setItem(pointStorageKey(),JSON.stringify(merged));
      }

      if(!cardResult.error){
        const rows=(cardResult.data??[]) as CardRow[];
        const merged=defaultCards.map((card)=>{
          const row=rows.find((r)=>matchesCard(r.name,card.name));
          return row?{...card,id:row.id,month:toNumber(row.monthly_spend,card.month),year:toNumber(row.annual_spend,card.year),fee:toNumber(row.annual_fee,card.fee)}:card;
        });
        setCards(merged);
        window.localStorage.setItem(cardStorageKey(),JSON.stringify(merged));
      }

      if(!tripResult.error){
        const rows=(tripResult.data??[]) as TripRow[];
        if(rows.length>0){
          const next=rows.map(normalizeTrip);
          setTrips(next);
          window.localStorage.setItem(tripStorageKey(),JSON.stringify(next));
        }
      }
      setLoading(false);
    }
    load();
    return ()=>{alive=false};
  },[]);

  const monthlyCardSpend=useMemo(()=>cards.reduce((sum,card)=>sum+card.month,0),[cards]);
  const totalPointBalance=useMemo(()=>points.reduce((sum,point)=>sum+point.balance,0),[points]);
  const estimatedPointValue=Math.round(totalPointBalance*1.4);
  const nextTrip=useMemo(()=>trips.filter((trip)=>trip.status!=="completed").sort((a,b)=>(a.departure_date||"9999").localeCompare(b.departure_date||"9999"))[0], [trips]);
  const nextDays=daysUntil(nextTrip?.departure_date??"");

  return <Shell title="おはようございます、Kazuakiさん">{loading&&<div className="notice" role="status" style={{marginBottom:16}}>最新のポイント・カード・旅行情報を読み込んでいます。</div>}<div className="grid summary"><div className="card hero-card"><div className="card-label" style={{color:'#b8c4d4'}}>ANA PREMIUM MEMBER</div><div className="status-row"><div><div className="diamond">DIAMOND</div><small style={{color:'#b8c4d4'}}>Super Flyers Card 保有</small></div><div style={{textAlign:'right'}}><b>64,280 PP</b><div style={{fontSize:10,color:'#b8c4d4'}}>目標 100,000 PP</div></div></div><div className="progress"><i/></div></div>{points.slice(0,4).map(p=><div className="card" key={p.name}><div className="card-label"><WalletCards size={14}/>{p.name}</div><div className="metric">{num(p.balance)} <small>pt</small></div><div className="meta" style={{color:p.change>=0?'#477d68':'#a75858'}}>前月比 {p.change>=0?'+':''}{num(p.change)}</div></div>)}</div><div className="card trip-banner"><div><div className="card-label" style={{color:'#c9d4e1'}}><Plane size={14}/>NEXT JOURNEY</div><h3 style={{margin:'8px 0 4px'}}>{nextTrip?.name??"旅行を登録してください"}</h3><small style={{color:'#c9d4e1'}}>{nextTrip?`${dateShort(nextTrip.departure_date)} — ${dateShort(nextTrip.return_date)} ・ ${nextTrip.hotel||"ホテル未定"}`:"旅行画面から次の予定を登録できます"}</small></div><div style={{textAlign:'right'}}><div className="days">{nextDays===null?"—":`あと${Math.max(0,nextDays)}日`}</div><small>出発まで</small></div></div><div className="grid stats3"><div className="card"><div className="card-label"><CreditCard size={14}/>今月のカード利用額</div><div className="metric">{yen(monthlyCardSpend)}</div><div className="meta">6枚合計 ・ 入力値を反映</div></div><div className="card"><div className="card-label"><CalendarDays size={14}/>今月の税金支払い予定</div><div className="metric">{yen(1250000)}</div><div className="meta">納付期限 7月10日</div></div><div className="card"><div className="card-label"><TrendingUp size={14}/>総ポイント価値（概算）</div><div className="metric">{yen(estimatedPointValue)}</div><div className="meta">ポイント・マイル合計から概算</div></div></div><div className="grid two-col"><section className="card"><SectionHead title="今日のニュース"/><NewsList limit={5}/></section><section className="card brief"><SectionHead title="Daily Brief" action="再生成"/><div className="eyebrow">AI CONCIERGE ・ 7月6日 7:00</div><p style={{fontFamily:'Georgia,serif',fontSize:18,lineHeight:1.6}}>おはようございます。<br/>今日、押さえておきたい情報です。</p><div className="brief-list"><div className="brief-line"><b>ANA</b><span>国内線タイムセールが開始。宮古島便の対象運賃を確認できます。</span></div><div className="brief-line"><b>ホテル</b><span>Hiltonポイント購入100%ボーナス。旅程との比較がおすすめです。</span></div><div className="brief-line"><b>SONY</b><span>α1 IIの新ファームウェアが公開されました。</span></div><div className="brief-line"><b>会社</b><span>税金納付期限まであと4日。予定額は125万円です。</span></div><div className="brief-line"><b>旅行</b><span>次回の旅行予定をホームと旅行画面で確認できます。</span></div></div><div className="notice">APIキー未設定時はルールベース要約を表示します。</div></section></div></Shell>
}
