import { useState } from 'react'
import { PHOTO_PROMPT, parseAnswer } from './photoImport.js'

// 「写真から入れる」：質問文をコピー → AI アプリに写真と一緒に送る → 答えを貼り付ける → 数字が入る。
// onPick には { name, kcal, protein, fat, carbs } を渡す（分からない値は null）
export default function PhotoImport({ onPick, onClose }) {
  const [copied, setCopied] = useState(false)
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(PHOTO_PROMPT)
      setCopied(true)
    } catch {
      setError('コピーできませんでした。下の質問文を長押しして、全部選んでコピーしてください。')
    }
  }

  // 「貼り付け」ボタン。使えないブラウザでは、入力欄に長押しで貼り付けてもらう
  async function pasteAnswer() {
    try {
      const text = await navigator.clipboard.readText()
      setAnswer(text)
      setError('')
    } catch {
      setError('貼り付けできませんでした。下の欄を長押しして「ペースト」を選んでください。')
    }
  }

  function apply() {
    const result = parseAnswer(answer)
    if (!result) {
      setError('答えからカロリーを読み取れませんでした。AI の答えを全部コピーして貼り付けてください。')
      return
    }
    onPick({ ...result, name: result.name ?? '写真の食事' })
  }

  return (
    <div className="food-search">
      <div className="food-search-head">
        <strong>写真から入れる</strong>
        <button type="button" className="food-close" onClick={onClose}>閉じる</button>
      </div>

      <p className="photo-step">① 質問文をコピーします</p>
      <button type="button" className="primary" onClick={copyPrompt}>
        {copied ? '✓ コピーしました' : '質問文をコピー'}
      </button>
      <details className="photo-prompt">
        <summary>質問文を見る</summary>
        <textarea readOnly value={PHOTO_PROMPT} rows={8} onFocus={(e) => e.target.select()} />
      </details>

      <p className="photo-step">② AI のアプリ（Claude など）で、食事の写真と質問文を送ります</p>
      <p className="meal-help">答えが返ってきたら、答えを全部コピーして、このアプリに戻ります。</p>

      <p className="photo-step">③ 答えを貼り付けます</p>
      <button type="button" className="photo-paste" onClick={pasteAnswer}>答えを貼り付け</button>
      <textarea
        className="photo-answer"
        rows={5}
        placeholder={'ここに貼り付けても大丈夫です\n料理名: …\nカロリー: …'}
        value={answer}
        onChange={(e) => { setAnswer(e.target.value); setError('') }}
      />
      {error && <p className="error">{error}</p>}
      <button type="button" className="primary" onClick={apply} disabled={!answer.trim()}>この数字を入れる</button>
      <p className="meal-help photo-note">AI の数字は写真から見た目安です。量が違うときは、入ったあとで直してください。</p>
    </div>
  )
}
