# KAZUAKI LIFE HUB

仕事・旅行・ポイント・カード・カメラ情報を一元化する、個人専用の日本語PWAダッシュボードです。Next.js App Router、Supabase Auth/PostgreSQL/RLS、OpenAI Responses API、Vercelを前提としています。

## 主な機能

- ANAステータス、ポイント、カード利用、税金、次回旅行のホームサマリー
- ニュース検索・保存、ポイント・カード・旅行・カメラ管理画面
- Email/Password認証、保護ルート、ログイン後の元画面復帰、ログアウト
- 認証済みユーザー専用の `/settings/system-check`
- 日本語レスポンシブUI、ダークモード、iPhone対応PWA
- OpenAI未設定時も動作するDaily Briefフォールバック

> 現在、主要画面の数値はPhase 1のデモ表示です。認証、RLS、接続診断、ユーザー別初期データはSupabaseへ接続されます。画面データの全面的なCRUD化は残課題です。

## 技術構成

- Next.js 16 / React 19 / TypeScript / App Router
- Tailwind CSS / Lucide Icons
- Supabase PostgreSQL / Auth / Row Level Security / `@supabase/ssr`
- OpenAI Responses API（Vercel Serverless Route Handler）
- Vercel / PWA manifest / Service Worker

Supabaseクライアントは用途別に分離しています。

- `src/lib/supabase/client.ts`: ブラウザ用。Publishable Keyのみ使用
- `src/lib/supabase/server.ts`: Server Component／Route Handler用。Cookieセッションを使用
- `src/lib/supabase/admin.ts`: サーバー専用。Service Role Keyを使用し、ブラウザからimport不可
- `src/proxy.ts`: セッション更新と未ログインユーザーの保護

## 必要な環境変数

`.env.example`には変数名だけを収録しています。実値をGitへコミットしないでください。

| 変数 | 用途 | 公開範囲 | Phase 1 |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | ブラウザ公開可 | 必須 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase Publishable Key | ブラウザ公開可・RLS必須 | 必須 |
| `SUPABASE_SERVICE_ROLE_KEY` | 管理処理・将来のCron | サーバー限定・絶対非公開 | 管理機能用 |
| `OPENAI_API_KEY` | ニュース要約・Daily Brief | サーバー限定・絶対非公開 | 任意 |
| `NEXT_PUBLIC_APP_URL` | アプリの正規URL | ブラウザ公開可 | 本番必須 |

`SUPABASE_SERVICE_ROLE_KEY`と`OPENAI_API_KEY`には絶対に`NEXT_PUBLIC_`を付けないでください。

## ローカル起動

Node.js 20.9以上を使用します。

```bash
cp .env.example .env.local
# .env.localへDevelopment用の値を入力
npm install
npm run dev
```

`http://localhost:3000`を開きます。Supabase未設定時は、データを誤公開せずログイン画面に説明を表示します。`.env.local`は`.gitignore`対象です。

品質確認は次の一括コマンドでも実行できます。

```bash
npm test
```

## Supabase本番設定

### 1. プロジェクト作成

1. [Supabase Dashboard](https://supabase.com/dashboard)へログインします。
2. `New project`を選び、Organization、Project name、Database password、Regionを設定します。
3. Database passwordはパスワード管理アプリへ保存し、GitやVercelの不要な欄へ入力しません。
4. 作成完了まで待ちます。

### 2. Project URLとキーの取得

プロジェクト上部の`Connect`、または`Project Settings > API Keys`を開きます。

- Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- Publishable key（`sb_publishable_...`）→ `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `Legacy API Keys`内の`service_role` → `SUPABASE_SERVICE_ROLE_KEY`

Service Role KeyはRLSを迂回できる強い権限です。Git、README、スクリーンショット、ブラウザコード、`NEXT_PUBLIC_`変数へ絶対に置かず、Vercelの暗号化された環境変数へだけ保存します。Supabaseは新しいSecret Keyへの移行を進めているため、Phase 2で変数名を`SUPABASE_SECRET_KEY`へ更新する余地を残しています。

### 3. migration適用

SQL Editorで実行する場合：

1. `SQL Editor > New query`を開きます。
2. `supabase/migrations/001_initial_schema.sql`を全文貼り付けて実行します。
3. 続けて`supabase/migrations/002_production_hardening.sql`を実行します。
4. エラーがないことを確認します。順番は変更しません。

Supabase CLIを使用する場合：

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

`YOUR_PROJECT_REF`はDashboardのProject Settingsで確認します。CLIのアクセストークンやDatabase passwordはファイルへ保存しません。

### 4. Emailログイン

1. `Authentication > Sign In / Providers > Email`を開きます。
2. Email providerを有効にします。
3. 個人専用運用では、意図しない登録を避けるため公開Sign Upは無効にし、Dashboardからユーザーを作成する運用を推奨します。
4. Email confirmationを使う場合は、送信元SMTPとメールテンプレートも本番用に確認します。

### 5. Site URLとRedirect URL

`Authentication > URL Configuration`で設定します。

- Site URL: `https://本番ドメイン`
- Redirect URLs: `https://本番ドメイン/auth/callback`
- ローカル確認用: `http://localhost:3000/auth/callback`
- Previewを使う場合: 専用Previewドメインの`/auth/callback`。ワイルドカードはPreviewだけに限定します。

本番URL確定後は、仮のVercel URLから正式なURLへSite URLを変更し、Redirect URLsへ正式URLを追加します。本番ではワイルドカードより完全一致URLを優先します。

### 6. 初回ユーザー作成

1. `Authentication > Users > Add user > Create new user`を選びます。
2. 自分のEmailと強いパスワードを入力します。
3. 必要に応じて`Auto Confirm User`を選択します。
4. 新規ユーザー作成トリガーが、本人のプロフィール、設定、カード、ポイント初期値を安全に登録します。
5. migrationより先にユーザーを作った場合も、初回ログイン時の`initialize_user_data()` RPCが不足分だけ登録します。

固定UUIDを使うseedや、最初のユーザーへ無条件に書き込むseedは使用していません。

### 7. RLS確認

1. `Database > Tables`で各テーブルのRLS表示が有効であることを確認します。
2. `Authentication > Policies`でownerのSELECT / INSERT / UPDATE / DELETEポリシーを確認します。
3. SQL EditorでSecurity Advisorを実行し、公開テーブル警告がないことを確認します。
4. ローカルでは`npm run audit:security`で19テーブルの作成、RLS対象、秘密変数のclient参照を静的監査できます。

## Vercel本番公開

Next.jsはVercelで標準対応されるため、`vercel.json`は追加していません。不必要な設定を置かず、VercelのNext.js自動検出を利用します。

### 1. GitHub接続

1. GitHubに空のリポジトリを作成し、このプロジェクトをpushします。
2. [Vercel Dashboard](https://vercel.com/dashboard)で`Add New > Project`を選びます。
3. GitHubを接続し、対象リポジトリを`Import`します。
4. Framework Presetは`Next.js`を選びます。
5. このフォルダがリポジトリ直下ならRoot Directoryは空欄です。親リポジトリ内へ置く場合だけ該当フォルダを指定します。

### 2. Environment Variables

`Project Settings > Environment Variables`で登録します。

| 変数 | Production | Preview | Development |
|---|---:|---:|---:|
| `NEXT_PUBLIC_SUPABASE_URL` | 本番Supabase | Preview専用推奨 | 開発用 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 本番Publishable | Preview専用推奨 | 開発用 |
| `SUPABASE_SERVICE_ROLE_KEY` | 本番・サーバー限定 | Preview専用推奨 | 必要時のみ |
| `OPENAI_API_KEY` | 本番 | 制限付き別キー推奨 | 任意 |
| `NEXT_PUBLIC_APP_URL` | 本番URL | 固定Preview URL | `http://localhost:3000` |

Previewへ本番Service Role Keyを流用しないでください。Preview用Supabaseプロジェクトを分けるのが安全です。環境変数を変更しても既存Deploymentには反映されないため、必ずRedeployします。

### 3. 初回デプロイ

1. まず環境変数を設定して`Deploy`します。
2. 初回に発行された`https://...vercel.app` URLを確認します。
3. そのURLを`NEXT_PUBLIC_APP_URL`へ設定し直します。
4. SupabaseのSite URL／Redirect URLも同じURLへ更新します。
5. Vercelで`Redeploy`します。
6. `/settings/system-check`ですべての診断項目を確認します。

### 4. カスタムドメイン

`Project Settings > Domains > Add`からドメインを追加し、表示されたDNSレコードをドメイン管理会社で設定します。反映後、`NEXT_PUBLIC_APP_URL`、Supabase Site URL、Redirect URLを新ドメインへ変更してRedeployします。

### 5. デプロイ失敗時

- Vercelの`Deployments > 対象Deployment > Build Logs`を確認
- Runtimeエラーは`Logs`のFunctionsタブを確認
- Environment Variablesの対象環境とスペルを確認
- migration 001→002の順番、Supabase Auth URL設定を確認
- ローカルで`npm run lint && npm run typecheck && npm run build`を再実行

### 6. iPhoneへ追加

1. iPhoneのSafariで本番URLを開きます。
2. 共有ボタンを押します。
3. `ホーム画面に追加`を選びます。
4. `KAZUAKI LIFE HUB`のアイコンと名称を確認して追加します。

PWAはPNG 192/512、Apple touch icon、standalone表示、オフライン案内を実装しています。認証済みページやAPI応答はService Workerへキャッシュしません。

## 本番前・公開後チェックリスト

- [ ] migration 001、002が成功
- [ ] 全19テーブルでRLS有効
- [ ] Email providerと初回ユーザー設定済み
- [ ] Vercelの5環境変数をProductionへ設定
- [ ] Service Role/OpenAIキーがGitとclient bundleにない
- [ ] Supabase Site URL／Redirect URLが本番URLと一致
- [ ] 未ログインで`/`、`/news`、`/points`、`/cards`、`/trips`、`/settings`へ入れない
- [ ] ログイン後に元の画面へ戻る
- [ ] `/settings/system-check`でDB read/write成功
- [ ] `/`、`/news`、`/points`、`/cards`、`/trips`、`/camera`、`/settings`を確認
- [ ] OpenAI未設定でもDaily Briefカードが表示される
- [ ] iPhone Safariで横スクロールがなく、ホーム画面へ追加できる
- [ ] ライト／ダークモード双方で文字が読める

## システムチェック

ログイン後に`/settings/system-check`を開くと、次を安全に確認できます。

- Supabase接続、ログインユーザー（Emailはマスク）、DB read/write
- OpenAI設定有無（キー自体は非表示）
- PWA manifest、本番URL、最終Daily Brief、バージョン、環境

診断APIは`Cache-Control: no-store`で、パスワード、JWT、キー、完全なUser IDを返しません。

## OpenAI API

`OPENAI_API_KEY`は`/api/ai/brief`のNode.js Route Handlerだけで読み込みます。Routeは認証を再確認し、100KBの入力上限を設けています。未設定時はルールベース要約へフォールバックし、アプリ全体は停止しません。

## Phase 2: CronとPush通知

- `/api/cron/news`をNode.js Route Handlerとして追加済み。Vercel Cronで毎日 07:00 JST に実行されます。
- 手動確認はニュース画面の「今すぐ更新」から実行できます。
- 任意で`CRON_SECRET`をVercelのEnvironment Variablesに設定すると、Cron URLをBearer tokenで保護できます。
- `/api/cron/daily-brief`はPhase 2で追加予定です。
- Vercel Cronから`CRON_SECRET`付きで呼び、署名不一致は401
- Cron内だけでadminクライアントを生成し、Service Roleをブラウザへ渡さない
- 公式RSS/API取得→重複排除→OpenAI要約→`news_items`／`daily_briefs`保存
- Web Push用購読テーブルをRLS付きで追加し、VAPID秘密鍵はサーバー限定
- PreviewではCron停止、本番だけで実行。再実行可能な冪等設計と監査ログを用意

## 変更ファイルの要約

- Auth/接続: `src/proxy.ts`、`src/lib/supabase/*`、`src/app/auth/callback/route.ts`
- 診断: `src/app/api/system-check/route.ts`、`src/app/settings/system-check/page.tsx`
- DB: `supabase/migrations/002_production_hardening.sql`、`supabase/seed.sql`
- PWA: `public/manifest.webmanifest`、`public/sw.js`、PNG icons、`public/offline.html`
- デプロイ/安全性: `.env.example`、`.gitignore`、`next.config.ts`、`scripts/audit-security.mjs`

## 残課題

- 主要画面のデモ値をSupabase CRUDへ全面移行
- 実Supabase上で2ユーザーを使ったRLS統合テスト
- 本番OpenAIキー設定後のResponses API疎通確認
- カード明細CSV、ニュース自動更新、Daily Brief定期生成、Push通知

## 品質確認記録

2026-07-06に`chore/production-setup`ブランチで確認しました。

| コマンド／確認 | 結果 |
|---|---|
| `npm run lint` | 成功 |
| `npm run typecheck` | 成功 |
| `npm run build` | 成功 |
| RLS静的監査 | 成功。19テーブル中19テーブルでRLS設定を確認 |
| PWA静的ファイル | 成功。manifest、Service Worker、icons、offline.htmlがログインリダイレクトされず200で配信 |
| iPhone 375px | 成功。ログイン画面で横スクロールなし |
| 未ログイン保護 | 成功。`/`、`/news`、`/points`、`/cards`、`/trips`、`/settings`、`/settings/system-check`が`/login?next=...`へリダイレクト |
| 環境変数未設定時 | 成功。ログイン画面に説明的な設定不足メッセージを表示 |
| 秘密情報露出チェック | 成功。Service Role/OpenAIキー参照はserver/API側のみ、`.next/static`への混入なし |

補足: 実Supabaseプロジェクト未接続のため、2ユーザーを使ったRLS統合テストと本番OpenAI疎通確認は、Supabase/Vercel設定後の公開前チェックで実施してください。
