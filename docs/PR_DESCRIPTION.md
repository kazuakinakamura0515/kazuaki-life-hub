## 概要

KAZUAKI LIFE HUBをSupabase＋Vercelへ本番公開するための接続、認証、RLS、PWA、診断、ドキュメントを整備します。

## 変更内容

- Supabase browser／server／adminクライアントを分離
- Publishable Keyへ移行し、Service Role/OpenAIキーをserver-only化
- Cookieセッション更新、保護ルート、ログイン後の元URL復帰、ログアウトを実装
- 明示的なCRUD RLSと安全なユーザー別初期データ作成を追加
- 認証済み専用`/settings/system-check`と安全な診断APIを追加
- Vercel標準デプロイ、環境別変数、Supabase管理画面の手順をREADMEへ追加
- PWA PNG icons、Apple touch icon、安全なオフライン動作を追加
- security audit、lint、typecheck、buildをデプロイ前テストへ追加

## セキュリティ

- 秘密値はコミットしていません。
- `.env.local`を含む`.env*`は無視し、空の`.env.example`だけを追跡します。
- 認証済みページ/APIはService Workerへキャッシュしません。
- adminクライアントは`server-only`で、Service RoleはRoute Handler等からのみ利用可能です。

## Supabaseで行うこと

1. 本番プロジェクト作成とキー取得
2. migration 001→002を順に適用
3. Email provider、Site URL、Redirect URLを設定
4. Dashboardから初回ユーザーを作成
5. RLSとSecurity Advisorを確認

## Vercelで行うこと

1. GitHubリポジトリをImportし、Framework PresetをNext.jsに設定
2. README記載の5環境変数をProductionへ設定
3. 初回Deploy後、発行URLをApp URLとSupabase Auth URLへ反映
4. Redeploy後、`/settings/system-check`と公開後チェックリストを確認

## テスト

- `npm run lint` 成功
- `npm run typecheck` 成功
- `npm run build` 成功
- `node scripts/audit-security.mjs` 成功
- PWA静的ファイル配信確認: manifest、Service Worker、icons、offline.htmlが200
- 未ログイン保護確認: 主要保護ルートが`/login?next=...`へリダイレクト
- iPhone 375px確認: ログイン画面で横スクロールなし、設定不足メッセージ表示

## 残課題 / Phase 2

- 主要画面データのSupabase CRUD化
- Vercel Cronによるニュース／Daily Brief生成
- 署名付きCron endpoint、Web Push購読、VAPID鍵、監査ログ
