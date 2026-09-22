# home_memo

家庭の月々の支払いを見える化して分析する React 19 + React Router + TypeScript 7 + Vite 製 SPA です。  
コミット済み CSV を使うデモと、Google スプレッドシートをログイン後に読み込む本番ページを GitHub Pages で公開できます。

## 主な機能

- すべての CSV を統合した支払いリスト
- 固定費のサマリー
- 変動費のサマリー
- 支払い者別のサマリー
- カテゴリ別のサマリー
- サブスクのサマリー
- 趣味代のサマリー
- Chart.js による月次推移 / カテゴリ構成比の可視化
- Google Identity Services と Google Sheets API による非公開シートの読み取り

## CSV 配置場所

CSV は `src/data/<支払い者>/<YYYY-MM>.csv` に配置します。

ヘッダー:

```csv
date,category,detail,costType,amount,subscription,hobby
```

- `costType`: `fixed` または `variable`
- `subscription`: `true` / `false`
- `hobby`: `true` / `false`

## 開発

```bash
npm install
npm run dev
```

CSV デモは Google の環境変数を設定しなくても動作します。本番ページは `#/production` です。

## Google スプレッドシートの設定

1. Google Cloud プロジェクトで **Google Sheets API** を有効にします。
2. OAuth 同意画面を構成し、**ウェブアプリケーション**の OAuth 2.0 クライアント ID を作成します。
3. OAuth クライアントの「承認済みの JavaScript 生成元」に、ローカル開発 URL（例: `http://localhost:5173`）と GitHub Pages の公開 URL を追加します。
4. 対象スプレッドシートを、利用者がログインする Google アカウントと共有します。リンクを知っている全員への公開共有は不要です。
5. シートに CSV と同じヘッダーを 1 行目に設定し、`支払い!A:G` にデータを置きます。

```csv
date,category,detail,costType,amount,subscription,hobby
```

シートからの読み込みでは支払い者を `スプレッドシート` として扱います。支払い者別の集計が必要な場合は、支払い者ごとにシートを分けるか、範囲を拡張して `payer` 列を追加してください。

## 環境変数

`.env.example` を参考にローカル専用の `.env` を作成します。`.env` はコミットしません。

```env
VITE_GOOGLE_CLIENT_ID=
VITE_GOOGLE_SPREADSHEET_ID=
VITE_GOOGLE_SHEET_RANGE=支払い!A:G
VITE_PRODUCTION_URL=
```

GitHub Pages では、リポジトリまたは `github-pages` Environment の Actions Variables に同名の `VITE_` 変数を設定します。`VITE_PRODUCTION_URL` が空なら、デモからの本番リンクは同一 SPA の `#/production` を開きます。

## セキュリティ上の制約

- OAuth クライアント ID とスプレッドシート ID はブラウザに公開される識別子です。秘密情報ではありません。
- クライアントシークレット、サービスアカウント秘密鍵、refresh token は使用・保存しません。
- 本番データはリポジトリや `src/data` に追加しません。Google ログインで得た読み取り専用アクセストークンをその場の API 呼び出しにのみ使用します。
- ログアウトすると、取得済みの本番データを画面から破棄します。

## ビルド

```bash
npm run build
```
