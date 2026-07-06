export const points=[
 {name:"ANAマイル",short:"ANA",balance:200000,change:12400,target:300000,color:"#2367a5"},
 {name:"Amex Membership Rewards",short:"AMEX",balance:200000,change:18600,target:300000,color:"#8a7861"},
 {name:"Marriott Bonvoy",short:"MB",balance:150000,change:-8200,target:250000,color:"#7b312f"},
 {name:"IHG One Rewards",short:"IHG",balance:550000,change:33400,target:600000,color:"#49706c"},
 {name:"Hilton Honors",short:"HH",balance:100000,change:5200,target:200000,color:"#315577"},
 {name:"HGV MAX",short:"HGV",balance:1,change:0,target:1,color:"#8d713d"},
];
export const cards=[
 {name:"アメックス・プラチナ",type:"個人",use:"旅行・ホテル・個人利用",month:684200,year:4230000,fee:165000,rating:"優秀"},
 {name:"アメックス・ビジネス・プラチナ",type:"法人",use:"会社経費のメイン",month:1826500,year:12180000,fee:165000,rating:"最優先"},
 {name:"LC ゴールド Business",type:"法人",use:"法人税・消費税・各種税金",month:1250000,year:6580000,fee:220000,rating:"良好"},
 {name:"ラグジュアリーカード ブラック",type:"個人",use:"レストラン・コンシェルジュ",month:238400,year:1740000,fee:110000,rating:"良好"},
 {name:"阪急外商 VISA",type:"個人",use:"阪急百貨店",month:126800,year:835000,fee:11000,rating:"継続"},
 {name:"ANA SFC JCB 一般",type:"個人",use:"SFC維持・ANA関連",month:158000,year:760000,fee:11275,rating:"必須"},
];
export const news=[
 {id:1,cat:"ANA",title:"国内線タイムセール、7月搭乗分の対象路線を発表",source:"ANA公式",date:"7月6日",summary:"大阪発を含む国内線の期間限定運賃が公開。家族旅行の日程と重なる便を優先確認。",importance:"重要"},
 {id:2,cat:"Hilton",title:"Hilton Honors ポイント購入で最大100%ボーナス",source:"Hilton公式",date:"7月6日",summary:"期間限定の購入キャンペーン。次回のモルディブ旅行での必要ポイントと比較を。",importance:"高"},
 {id:3,cat:"SONY",title:"α1 II 最新ファームウェアを公開",source:"SONY公式",date:"7月5日",summary:"動作安定性とオートフォーカス性能を改善。撮影前の更新と設定バックアップを推奨。",importance:"高"},
 {id:4,cat:"AI / DX",title:"中小企業向けAI導入支援策が拡充",source:"デジタル庁",date:"7月5日",summary:"業務効率化ツールの導入支援に関する最新情報。電気工事業の現場管理にも活用可能。",importance:"中"},
 {id:5,cat:"電気工事",title:"電設資材価格の改定に関するお知らせ",source:"メーカー公式",date:"7月4日",summary:"主要な配線器具の価格改定予定。進行中案件の見積原価への影響を要確認。",importance:"重要"},
 {id:6,cat:"Marriott",title:"夏のリゾート滞在でボーナスポイント",source:"Marriott公式",date:"7月4日",summary:"対象ホテルの連泊でボーナスポイント。北海道・沖縄の対象施設を確認できます。",importance:"中"},
];
export const trips=[
 {name:"家族で宮古島サマーバケーション",place:"沖縄県・宮古島",from:"2026-09-02",to:"2026-09-06",hotel:"イラフ SUI ラグジュアリーコレクション",flight:"ANA 1747",status:"予約済み",budget:1200000},
 {name:"北海道・雪景色撮影旅行",place:"北海道・美瑛",from:"2026-12-18",to:"2026-12-21",hotel:"パークハイアット ニセコ",flight:"ANA 773",status:"検討中",budget:680000},
 {name:"モルディブ記念旅行",place:"モルディブ",from:"2027-03-20",to:"2027-03-27",hotel:"W Maldives",flight:"SQ 623",status:"検討中",budget:2400000},
];
export const rules=[["会社の通常経費","アメックス・ビジネス・プラチナ"],["材料費・工具・Amazon Business","アメックス・ビジネス・プラチナ"],["税金・法人税・消費税・固定資産税","LC ゴールド Business"],["ANA航空券・ANAツアー","ANA SFC JCB"],["海外・国内ホテル","アメックス・プラチナ"],["阪急百貨店","阪急外商 VISA"],["レストラン・優待","LC ブラック"],["個人の高額決済","アメックス・プラチナ / LC ブラック"]];
export const yen=(n:number)=>new Intl.NumberFormat("ja-JP",{style:"currency",currency:"JPY",maximumFractionDigits:0}).format(n);
export const num=(n:number)=>new Intl.NumberFormat("ja-JP").format(n);
