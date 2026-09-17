# home_memo

家庭の月々の支払いを見える化して分析する React 19 + React Router + TypeScript 7 + Vite 製 SPA です。  
プロジェクトにコミットされた CSV を支払い者・月単位でまとめて読み込み、一覧とサマリーを GitHub Pages で公開できます。

## 主な機能

- すべての CSV を統合した支払いリスト
- 固定費のサマリー
- 変動費のサマリー
- 支払い者別のサマリー
- カテゴリ別のサマリー
- サブスクのサマリー
- 趣味代のサマリー
- Chart.js による月次推移 / カテゴリ構成比の可視化

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

## ビルド

```bash
npm run build
```
