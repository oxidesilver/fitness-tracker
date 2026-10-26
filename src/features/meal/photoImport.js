// 「写真から入れる」で使う、AI への質問文と、AI の答えの読み取り。
// 写真の判別そのものは、本人が使っている AI のチャットアプリ（Claude など）にしてもらう。

export const PHOTO_PROMPT = `この写真の食事のカロリーとPFC（たんぱく質・脂質・炭水化物）を推定してください。
料理が複数あるときは、全部を合わせた合計にしてください。
答えは説明を書かずに、次の5行の形だけで書いてください。数字は1つだけにして（「〜」で範囲にしない）、単位は書かないでください。

料理名: 鶏の照り焼き定食
カロリー: 650
たんぱく質: 35
脂質: 20
炭水化物: 80

（上は書き方の例です。写真の食事について書いてください）`

// 行の頭の言葉 → 入力欄の名前
const LABELS = [
  { field: 'name', words: ['料理名', '名前', 'メニュー'] },
  { field: 'kcal', words: ['カロリー', 'エネルギー', 'kcal'] },
  { field: 'protein', words: ['たんぱく質', 'タンパク質', '蛋白質', 'p'] },
  { field: 'fat', words: ['脂質', 'f'] },
  { field: 'carbs', words: ['炭水化物', '糖質', 'c'] },
]

// 「600〜700」のような範囲なら真ん中、そうでなければ最初の数字
function firstNumber(text) {
  const range = text.match(/(\d+(?:\.\d+)?)\s*[〜~\-ー－]\s*(\d+(?:\.\d+)?)/)
  if (range) return (Number(range[1]) + Number(range[2])) / 2
  const m = text.match(/\d+(?:\.\d+)?/)
  return m ? Number(m[0]) : null
}

// AI の答えから { name, kcal, protein, fat, carbs } を取り出す。
// 見つからない項目は null。カロリーが見つからなければ null を返す
export function parseAnswer(answer) {
  const result = { name: null, kcal: null, protein: null, fat: null, carbs: null }
  const lines = answer
    .normalize('NFKC') // 全角の数字やコロンを半角にそろえる
    .split(/\r?\n/)
    .map((l) => l.replace(/[*#`>]/g, '').replace(/^[\s・\-]+/, '').trim())
  for (const line of lines) {
    const m = line.match(/^([^:：]+)[:：]\s*(.+)$/)
    if (!m) continue
    const label = m[1].trim().toLowerCase()
    const value = m[2].trim()
    const hit = LABELS.find((l) => l.words.some((w) => label === w || (w.length > 1 && label.startsWith(w))))
    if (!hit || result[hit.field] !== null) continue
    if (hit.field === 'name') result.name = value
    else {
      const n = firstNumber(value)
      if (n !== null) result[hit.field] = Math.round(n * 10) / 10
    }
  }
  return result.kcal === null ? null : result
}
