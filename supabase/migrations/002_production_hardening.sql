-- Production hardening: explicit CRUD RLS, safe per-user bootstrap, diagnostics.
create table if not exists public.system_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  checked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.system_checks enable row level security;
create index if not exists system_checks_user_id_idx on public.system_checks(user_id);
create trigger set_system_checks_updated_at before update on public.system_checks for each row execute function public.set_updated_at();

-- Replace broad ALL policies with auditable per-operation policies.
do $$ declare t text; begin
  foreach t in array array['cards','card_transactions','card_benefits','points_accounts','points_transactions','trips','trip_members','travel_bookings','news_categories','news_sources','news_items','saved_news','daily_briefs','camera_gear','camera_presets','app_settings','notifications'] loop
    execute format('drop policy if exists "owner_all" on public.%I',t);
    execute format('create policy "owner_select" on public.%I for select to authenticated using (user_id = (select auth.uid()))',t);
    execute format('create policy "owner_insert" on public.%I for insert to authenticated with check (user_id = (select auth.uid()))',t);
    execute format('create policy "owner_update" on public.%I for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))',t);
    execute format('create policy "owner_delete" on public.%I for delete to authenticated using (user_id = (select auth.uid()))',t);
  end loop;
end $$;

drop policy if exists "owner_profile" on public.profiles;
create policy "owner_select" on public.profiles for select to authenticated using (id=(select auth.uid()));
create policy "owner_insert" on public.profiles for insert to authenticated with check (id=(select auth.uid()));
create policy "owner_update" on public.profiles for update to authenticated using (id=(select auth.uid())) with check (id=(select auth.uid()));
create policy "owner_delete" on public.profiles for delete to authenticated using (id=(select auth.uid()));

create policy "owner_select" on public.system_checks for select to authenticated using (user_id=(select auth.uid()));
create policy "owner_insert" on public.system_checks for insert to authenticated with check (user_id=(select auth.uid()));
create policy "owner_update" on public.system_checks for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy "owner_delete" on public.system_checks for delete to authenticated using (user_id=(select auth.uid()));

create or replace function public.initialize_user_data_for(target_user uuid)
returns void language plpgsql security definer set search_path=public as $$ begin
  insert into profiles(id,display_name) values(target_user,'Kazuaki') on conflict(id) do nothing;
  insert into app_settings(user_id) values(target_user) on conflict(user_id) do nothing;
  insert into points_accounts(user_id,program_name,balance,target_balance) values
    (target_user,'ANAマイル',200000,300000),(target_user,'Amex Membership Rewards',200000,300000),
    (target_user,'Marriott Bonvoy',150000,250000),(target_user,'IHG One Rewards',550000,600000),
    (target_user,'Hilton Honors',100000,200000),(target_user,'HGV MAX',1,1)
  on conflict(user_id,program_name) do nothing;
  insert into cards(user_id,name,card_type,primary_use)
  select target_user,v.name,v.card_type,v.primary_use from (values
    ('アメリカン・エキスプレス・プラチナ','personal','個人旅行・ホテル・個人利用'),
    ('アメリカン・エキスプレス・ビジネス・プラチナ','business','会社経費のメイン'),
    ('ラグジュアリーカード ゴールド Business','business','税金支払い'),
    ('ラグジュアリーカード ブラック','personal','レストラン・コンシェルジュ'),
    ('阪急外商VISAカード','personal','阪急百貨店'),
    ('ANA SFC JCB一般カード','personal','SFC維持・ANA関連')) as v(name,card_type,primary_use)
  where not exists(select 1 from cards c where c.user_id=target_user and c.name=v.name);
end; $$;
revoke all on function public.initialize_user_data_for(uuid) from public, anon, authenticated;

create or replace function public.initialize_user_data()
returns boolean language plpgsql security definer set search_path=public as $$ declare uid uuid := auth.uid(); begin
  if uid is null then raise exception 'Authentication required'; end if;
  perform public.initialize_user_data_for(uid);
  return true;
end; $$;
revoke all on function public.initialize_user_data() from public, anon;
grant execute on function public.initialize_user_data() to authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$ begin
  perform public.initialize_user_data_for(new.id);
  update profiles set display_name=coalesce(new.raw_user_meta_data->>'display_name',split_part(new.email,'@',1),'Kazuaki') where id=new.id;
  return new;
end; $$;
