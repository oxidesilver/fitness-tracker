import { useState } from 'react'
import { parseRunResult } from './runImport.js'

// 「ランニングアプリの結果から入れる」：結果画面のスクリーンショットの文字をコピーして貼り付けると、
// 距離・時間・上りの高低差が入る。onPick には parseRunResult の戻り値を渡す
export default function RunImport({ onPick, onClose }) {
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  async function paste() {
    try {
      setText(await navigator.clipboard.readText())
      setError('')
    } catch {
      setError('貼り付けできませんでした。下の欄を長押しして「ペースト」を選んでください。')
    }
  }

  function apply() {
    const result = parseRunResult(text)
    if (!result) return setError('距離（km）と時間（56:49 の形）を読み取れませんでした。結果画面の文字を全部コピーして貼り付けてください。')
    onPick(result)
  }

  return (
    <div className="run-import">
      <div className="run-import-head">
        <strong>アプリの結果から入れる</strong>
        <button type="button" className="run-import-close" onClick={onClose}>閉じる</button>
      </div>
      <ol className="run-import-steps">
        <li>Nike Run Club などの結果画面のスクリーンショットを撮る</li>
        <li>写真アプリでそのスクリーンショットを開き、右下の「テキスト認識表示」のボタン（四角の中に線のマーク）を押す</li>
        <li>文字を長押しして「すべてを選択」→「コピー」</li>
        <li>このアプリに戻って、下の「貼り付け」を押す</li>
      </ol>
      <button type="button" className="run-import-paste" onClick={paste}>貼り付け</button>
      <textarea
        className="run-import-text"
        rows={4}
        placeholder={'ここに貼り付けても大丈夫です\n6.56 KM … 56:49 時間 … 116 m'}
        value={text}
        onChange={(e) => { setText(e.target.value); setError('') }}
      />
      {error && <p className="error">{error}</p>}
      <button type="button" className="primary" onClick={apply} disabled={!text.trim()}>この数字を入れる</button>
    </div>
  )
}
