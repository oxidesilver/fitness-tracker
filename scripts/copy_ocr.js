// スクリーンショットの文字を読み取る道具（Tesseract.js）のファイルを public/ocr/ にコピーする。
// アプリといっしょに公開して、ほかのサイトから読み込まずに使うため。npm run build・dev の前に自動で動く。
// ファイルは大きいので、リポジトリには入れない（.gitignore）
import { copyFileSync, mkdirSync } from 'node:fs'

const out = 'public/ocr'
mkdirSync(out, { recursive: true })
const files = [
  ['node_modules/tesseract.js/dist/worker.min.js', 'worker.min.js'],
  ['node_modules/tesseract.js-core/tesseract-core-lstm.wasm.js', 'tesseract-core-lstm.wasm.js'],
  ['node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm.js', 'tesseract-core-simd-lstm.wasm.js'],
  // 文字のデータ。英語（ランアプリの結果）と日本語（栄養成分表示）。使う方だけ読み込む
  ['node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz', 'eng.traineddata.gz'],
  ['node_modules/@tesseract.js-data/jpn/4.0.0_best_int/jpn.traineddata.gz', 'jpn.traineddata.gz'],
]
for (const [from, to] of files) copyFileSync(from, `${out}/${to}`)
