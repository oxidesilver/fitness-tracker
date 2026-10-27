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
  // 英語の文字のデータ（数字と km・m を読めればよいので、小さい英語のものを使う）
  ['node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz', 'eng.traineddata.gz'],
]
for (const [from, to] of files) copyFileSync(from, `${out}/${to}`)
