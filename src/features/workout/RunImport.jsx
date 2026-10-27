import { useState } from 'react'
import { readImageText } from '../../ocr.js'
import { parseRunResult, parseRunScreenshot } from './runImport.js'

// 「ランアプリの結果から入れる」：Nike Run Club などの結果画面のスクリーンショットを選ぶと、
// 距離・時間・消費カロリー・上りの高低差が入る（画像は読み取りにだけ使い、保存しない）。
// うまく読めないときは、テキスト認識表示でコピーした文字を貼り付けることもできる。
// onPick には { distance, minutes, seconds, elevation, kcal }（文字のまま）を渡す
export default function RunImport({ onPick, onClose }) {
  const [text, setText] = useState('')
  const [reading, setReading] = useState(false)
  const [error, setError] = useState('')

  async function readScreenshot(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // 同じ画像をもう一度選んでも動くように
    if (!file) return
    setReading(true)
    setError('')
    try {
      const result = parseRunScreenshot(await readImageText(file))
      if (result) onPick(result)
      else setError('距離と時間を読み取れませんでした。結果画面全体が写ったスクリーンショットを選ぶか、下の「文字を貼り付けて入れる」を使ってください。')
    } catch {
      setError('読み取りの準備ができませんでした。インターネットにつながっているか確かめて、もう一度選んでください。')
    } finally {
      setReading(false)
    }
  }

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
      <p className="run-note">Nike Run Club などの結果画面のスクリーンショットを選ぶと、数字が入ります。画像は読み取りにだけ使い、保存しません。</p>
      <label className={reading ? 'run-import-pick disabled' : 'run-import-pick'}>
        {reading ? '読み取り中…' : '📷 スクリーンショットを選ぶ'}
        <input type="file" accept="image/*" onChange={readScreenshot} disabled={reading} hidden />
      </label>
      {reading && <p className="run-note">はじめて使うときは、読み取りの準備（約7MB）に少し時間がかかります。</p>}
      {error && <p className="error">{error}</p>}
      <p className="run-note">読み取った数字は、入ったあとで確かめてください。</p>

      <details className="run-import-text-box">
        <summary>文字を貼り付けて入れる</summary>
        <ol className="run-import-steps">
          <li>写真アプリでスクリーンショットを開き、右下の「テキスト認識表示」のボタン（四角の中に線のマーク）を押す</li>
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
        <button type="button" className="primary" onClick={apply} disabled={!text.trim()}>この数字を入れる</button>
      </details>
    </div>
  )
}
