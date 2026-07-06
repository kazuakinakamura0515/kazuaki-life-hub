# KAZUAKI LIFE HUB

仕事・旅行・ポイント・カード・カメラ情報を一元化する、個人専用の日本語PWAダッシュボードです。Phase 1はAPIキーなしでも全画面を確認できるMVPで、Supabaseを設定すると個人データへ移行できる構造です。

## 主な機能

- ANAステータス、ポイント、カード利用、税金、次回旅行のホームサマリー
- ニュース検索・カテゴリ/重要度絞り込み・保存UI、Daily Brief
- ポイント残高・増減・目標・履歴グラフ
- クレジットカード一覧、年会費回収評価、支払い先早見表
- 旅行一覧、予算、ポイント利用、写真・メモ領域
- SONY/撮影ニュースと将来の機材・プリセット管理モデル
- Email認証、レスポンシブUI、ダークモード、PWA

## 技術スタックと構成

Next.js 16（App Router）、TypeScript、Tailwind CSS、Lucide Icons、Supabase（PostgreSQL/Auth/RLS）、OpenAI Responses API、Vercelを使用します。`src/app`に8画面とAI Route Handler、`src/components`に共通UI、`src/lib`にデータ層、`supabase`にmigrationとseedを配置しています。UI部品はshadcn/uiの設計原則（小さな合成可能コンポーネントとCSS変数）に沿ったローカル実装です。

## ローカル起動

必要環境はNode.js 20.9以上です。npmまたはpnpmを利用できます。

```bash
cp .env.example .env.local
npm install
npm run dev
```

pnpmを利用する場合は `pnpm install`、`pnpm dev` に読み替えてください。本番公開前は `npm test` でlint・型・RLS構成・本番ビルドを一括確認できます。

ブラウザで `http://localhost:3000` を開きます。初期値の `NEXT_PUBLIC_REQUIRE_AUTH=false` ではデモデータで確認できます。

## Supabase設定

1. Supabaseで新規プロジェクトを作成します。
2. SQL Editorで `supabase/migrations/001_initial_schema.sql` を実行します。
3. Authentication > ProvidersでEmailを有効にし、ユーザーを作成します。
4. `supabase/seed.sql` 冒頭のUUIDを作成したAuth User IDへ置換し、実行します。
5. Project Settings > APIのURLとAnon keyを `.env.local` へ設定します。
6. 動作確認後、`NEXT_PUBLIC_REQUIRE_AUTH=true` に変更します。

RLSは全個人テーブルで `auth.uid()` と `user_id`（profileのみ`id`）を照合します。共有ニュースは`user_id is null`のみ読み取り可能です。

## OpenAI API設定

`.env.local` の `OPENAI_API_KEY` にサーバー用キーを設定します。キーはRoute Handler内だけで読み、ブラウザへ公開しません。`OPENAI_MODEL` は既定で `gpt-5-mini`。未設定時はルールベースのDaily Briefへ安全にフォールバックします。

## 環境変数

| 変数 | 用途 | 公開範囲 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | ブラウザ可 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | RLS前提のAnon key | ブラウザ可 |
| `SUPABASE_SERVICE_ROLE_KEY` | 将来のCron処理 | サーバー限定 |
| `OPENAI_API_KEY` | 要約・分類・重要度判定 | サーバー限定 |
| `OPENAI_MODEL` | 使用モデル | サーバー限定 |
| `NEXT_PUBLIC_REQUIRE_AUTH` | デモ/認証必須切替 | ブラウザ可 |

## Vercelデプロイ

1. GitリポジトリをVercelへImportします。
2. Framework PresetはNext.js、Root Directoryはこのアプリのディレクトリを指定します。
3. Environment Variablesへ `.env.local` と同じ値を登録します。本番では `NEXT_PUBLIC_REQUIRE_AUTH=true` にします。
4. Deploy後のURLをSupabase Authentication > URL ConfigurationのSite URLとRedirect URLsへ追加します。

## iPhoneへ追加

Safariで本番URLを開き、共有ボタンから「ホーム画面に追加」を選びます。standalone表示、Apple touch icon、manifest、最低限のオフラインキャッシュを実装済みです。Service Worker更新時はSafariを再起動すると反映が早くなります。

## ニュース自動更新の将来実装

公式RSS/APIを利用規約に沿って取得するサーバー処理を追加し、Vercel CronまたはGitHub Actionsから署名付きエンドポイントを定期実行します。取得→重複排除→OpenAIで日本語要約/分類/重要度判定→`news_items`保存→朝の`daily_briefs`生成、という流れです。Service Role keyはCronのサーバー環境だけで扱います。

## セキュリティ

- Service Role keyとOpenAI keyを`NEXT_PUBLIC_`付き変数へ保存しないでください。
- 本番は認証必須にし、RLSを無効化しないでください。
- 外部記事本文を保存する場合は各提供元の利用規約と著作権を確認してください。
- Cron endpointには署名検証、レート制限、監査ログを追加してください。

## ロードマップ

Phase 2: 公式フィード自動取得、Vercel Cron、朝のBrief、Push通知、Google Calendar/Gmail、ANA PP計算、明細CSV、月次分析。

Phase 3: 旅行プランAI、カメラ設定提案、電気工事会社DX、弥生会計CSV、家族共有、Apple/Googleログイン。

## Phase 1監査結果（2026年7月6日）

### 検出事項と対応（優先度順）

1. **Critical・修正済み：認証ガードが未実装** — `src/proxy.ts`を追加し、認証必須モードでは未ログインの全管理画面とAI APIをログインへ転送します。Supabase未設定時も保護側へ倒れます。デモ表示は明示的に`NEXT_PUBLIC_REQUIRE_AUTH=false`を設定した場合だけ許可されます。
2. **High・修正済み：ロード／エラー／404表示が未実装** — App Router用の`loading.tsx`、`error.tsx`、`not-found.tsx`とニュース空状態を追加しました。
3. **High・修正済み：seedのAuth UUID手動置換が危険** — 最初のAuthユーザーを安全に選択し、再実行しても重複しないseedへ変更しました。
4. **High・修正済み：RLSの継続監査が手作業** — 指定18テーブルの作成とRLS対象漏れを検出する`npm run audit:security`を追加しました。
5. **Medium・修正済み：`updated_at`が更新されない／ユーザー検索用index不足** — 全18テーブルの更新トリガーと、該当17テーブルの`user_id` indexをmigrationへ追加しました。
6. **Medium・修正済み：ダークモード設定が表示だけで動作しない** — system／light／darkを即時切替し、端末内に保存するよう変更。暗色時の補助文字、タグ、通知、フォームのコントラストも改善しました。
7. **Medium・修正済み：AI APIの入力・エラー処理が弱い** — 100KB上限、不正JSONの400、外部API失敗時の502を追加しました。秘密鍵は引き続きサーバー限定です。
8. **Low・修正済み：lint警告とセキュリティヘッダー不足** — 未使用importを除去し、警告をエラー扱いに変更。nosniff、DENY frame、Referrer Policy、Permissions Policyを追加しました。

### 実行したテスト

| 項目 | 結果 |
|---|---|
| ESLint（`npm run lint`と同一スクリプト、警告上限0） | 成功・0 errors / 0 warnings |
| TypeScript `tsc --noEmit` | 成功 |
| Next.js production build | 成功・全10画面＋API＋Proxy生成 |
| migration静的監査 | 成功・18/18テーブル作成、18/18 RLS対象 |
| 未ログインアクセス | 成功・`/`から`/login`へ転送 |
| AI/OpenAI秘密識別子のclient bundle検索 | 0件 |
| iPhone 390×844 | 成功・横スクロールなし、モバイルナビ表示、サイドバー非表示 |
| ダークモード | 成功・背景/本文/カード/補助文字を実表示確認、横崩れなし |
| セキュリティヘッダー | 成功・4ヘッダーをHTTP応答で確認 |

監査環境にはnpm実行ファイルが含まれていなかったため、npmが呼び出す各ローカル実行ファイルを直接使って検証しました。`package.json`のnpm scriptsと実行内容は同一です。一般的なNode.js環境では上記の`npm`コマンドをそのまま利用できます。

### 残課題

- migrationはSQL構文とRLS対象を静的監査済みですが、実Supabaseプロジェクトへの適用・ポリシー統合テストは、接続情報設定後に実施が必要です。
- OpenAI APIはキー非公開とフォールバックを確認済みです。実API応答はキー設定後に確認が必要です。
- 現在の主要数値はデモデータです。Supabaseからの読み書き、編集フォーム、CSV取込は次の実装範囲です。
- Service Workerは最低限のキャッシュです。完全なオフライン編集・再同期はPhase 2対象です。
