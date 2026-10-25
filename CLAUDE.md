# fitness-tracker 開発メモ（Claude向け）

このファイルは、新しい会話でも開発方針を引き継ぐためのメモです。作業を始める前に必ず読んでください。

## このアプリについて

- 個人用の **筋トレ・食事・体重** を記録・管理するWebアプリ
- 使うのは開発者本人のみ（他人に公開するサービスではない）
- 主に **スマートフォンのブラウザ** から使う

## 開発の方針

- **スマホ優先**：画面幅の狭いスマホで見やすく、片手で操作しやすいデザインにする。ボタンや入力欄は指でタップしやすい大きさにする
- **続けて直しやすい構成**：機能ごとにファイルを分け、何がどこにあるか分かりやすくする。新しい仕組みやライブラリを入れるときは、理由を説明してから使う
- **小さく作って確かめる**：一度に大きく作らず、1つの機能ずつ作って動作を確認する
- 使う技術は下の「使う技術」に決めた内容がある。変えたり新しく決めたりするときは、選択肢と理由を説明し、本人に確認してから進める。決まったらこのファイルに追記する

## 開発者について

- 開発者は **Windows** を使っている。パソコンで行う手順を案内するときは Windows 向けに書く
- プログラミングの専門知識はほとんどない
- 主に **スマホの Claude アプリ（Code）** から指示を出している

## 説明のしかた

- 専門用語はできるだけ避け、使うときは短い説明をつける
- 何をしたか・次に何をすればよいかを、分かりやすく伝える
- 説明の根拠になる公式ドキュメントなどの URL を必ず示す

## 使う技術（2026-10-25 決定）

決めた理由：本人の希望が「スマホを買い替えたら手作業で記録を移せればよい」「スマホ（iPhone）だけで使う」だったため。

- **作り方**：Vite ＋ React（画面を機能ごとの部品に分けて作る）
  - https://ja.vite.dev/guide/ ／ https://ja.react.dev/
- **データの保存先**：スマホのブラウザの中（ログイン・サーバーなし）
  - 記録をファイルに書き出す／読み込む機能を付け、機種変更やバックアップに使う
  - https://developer.mozilla.org/ja/docs/Web/API/IndexedDB_API
- **ホーム画面に置けるようにする（PWA）**：iPhone の Safari は7日間開かないサイトの保存データを消すことがあるが、ホーム画面に置いたアプリは対象外のため
  - https://developer.mozilla.org/ja/docs/Web/Progressive_web_apps
  - https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/
- **公開方法**：GitHub Pages（リポジトリを Public にして無料で使う。本人が選んだ）
  - URL：https://oxidesilver.github.io/fitness-tracker/
  - `main` ブランチが更新されると `.github/workflows/deploy.yml` が自動で公開する
  - https://docs.github.com/ja/pages/getting-started-with-github-pages/about-github-pages
  - 公開したURLを知っている人は開けるが、記録は各自のブラウザの中にあるので他人には見えない
  - リポジトリは Public なので、パスワードなどの秘密や個人情報をファイルに書かない
- 開発者のスマホは **iPhone**。動作確認は iPhone の Safari を基準にする

## ファイルの置き場所

- `src/App.jsx`：アプリ全体の入れ物
- `src/index.css`：アプリ全体の見た目
- `src/features/<機能名>/`：機能ごとのフォルダ。画面（`〜Page.jsx`）、保存処理（`〜Storage.js`）、見た目（`〜.css`）を分けて置く
  - `src/features/weight/`：体重の記録
- 記録の保存は今のところ localStorage（ブラウザの中の小さな保存場所）を使う。保存処理は `〜Storage.js` にまとめてあるので、変えるときはそこだけ直す
  - https://developer.mozilla.org/ja/docs/Web/API/Window/localStorage

## GitHub での作業

- リポジトリ：`oxidesilver/fitness-tracker`（GitHub Pages のため Public にする）
- 既存のファイルを削除・大きく変更するときは、先に内容を説明して確認をとる

## 決まったこと（随時追記）

- 2026-10-25：リポジトリ作成、このメモを追加
- 2026-10-25：使う技術を決定（上の「使う技術」を参照）。最初に作る機能は体重の記録
- 2026-10-25：体重の記録機能（入力・一覧・削除）を作成。同じ日付は1件だけ（上書き確認あり）
- 2026-10-25：公開方法を Cloudflare Pages から GitHub Pages（リポジトリを Public）に変更
