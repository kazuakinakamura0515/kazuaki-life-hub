-- Create at least one Auth user first. This seed targets the oldest user safely.
do $$ declare uid uuid; begin
select id into uid from auth.users order by created_at asc limit 1;
if uid is null then raise exception 'Authユーザーがありません。先にAuthenticationでユーザーを作成してください。'; end if;

insert into points_accounts(user_id,program_name,balance,target_balance) values
(uid,'ANAマイル',200000,300000),(uid,'Amex Membership Rewards',200000,300000),(uid,'Marriott Bonvoy',150000,250000),(uid,'IHG One Rewards',550000,600000),(uid,'Hilton Honors',100000,200000),(uid,'HGV MAX',1,1)
on conflict(user_id,program_name) do update set balance=excluded.balance,target_balance=excluded.target_balance;

insert into cards(user_id,name,card_type,primary_use)
select uid,v.name,v.card_type,v.primary_use from (values
('アメリカン・エキスプレス・プラチナ','personal','個人旅行・ホテル・個人利用'),
('アメリカン・エキスプレス・ビジネス・プラチナ','business','会社経費のメイン'),
('ラグジュアリーカード ゴールド Business','business','税金支払い'),
('ラグジュアリーカード ブラック','personal','レストラン・コンシェルジュ'),
('阪急外商VISAカード','personal','阪急百貨店'),
('ANA SFC JCB一般カード','personal','SFC維持・ANA関連')) as v(name,card_type,primary_use)
where not exists(select 1 from cards c where c.user_id=uid and c.name=v.name);

insert into trips(user_id,name,departure_date,return_date,destination,companions,airline,flight_number,hotel,budget,status)
select uid,'家族で宮古島サマーバケーション','2026-09-02','2026-09-06','沖縄県・宮古島',array['家族'],'ANA','ANA 1747','イラフ SUI ラグジュアリーコレクション',1200000,'booked'
where not exists(select 1 from trips where user_id=uid and name='家族で宮古島サマーバケーション');
end $$;
