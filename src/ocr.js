// 画像（スクリーンショット）の文字を読み取る。Tesseract.js を使い、スマホの中だけで動く（画像はどこにも送らず、保存もしない）
// 参考：https://github.com/naptha/tesseract.js
// 道具のファイルは public/ocr/ に置いてある（scripts/copy_ocr.js）。使うときに初めて読み込む
// lang：'eng'（英語・数字。ランアプリの結果）か 'jpn'（日本語。栄養成分表示）
export async function readImageText(file, lang = 'eng') {
  const { createWorker } = await import('tesseract.js')
  const base = `${import.meta.env.BASE_URL}ocr/`
  const worker = await createWorker(lang, 1, { workerPath: `${base}worker.min.js`, corePath: base, langPath: base })
  try {
    const { data } = await worker.recognize(file)
    return data.text
  } finally {
    await worker.terminate()
  }
}
