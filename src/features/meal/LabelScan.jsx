import { useState } from 'react'
import { readImageText } from '../../ocr.js'
import { parseLabel } from './labelScan.js'

// 「栄養成分表示を撮って入れる」：袋や箱の栄養成分表示の写真から、カロリー・たんぱく質・脂質・炭水化物を入れる。
// スマホの中だけで読み取り、写真は保存しない。onPick には parseLabel の戻り値を渡す
export default function LabelScan({ onPick }) {
  const [reading, setReading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function read(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // 同じ写真をもう一度選んでも動くように
    if (!file) return
    setReading(true)
    setError('')
    setMessage('')
    try {
      const result = parseLabel(await readImageText(file, 'jpn'))
      if (!result) {
        setError('カロリー（エネルギー）を読み取れませんでした。栄養成分表示の枠だけが大きく、まっすぐ写るように撮り直してください。')
        return
      }
      onPick(result)
      setMessage(`${result.per ? `「${result.per}」の` : ''}数字を入れました。食べた量が違うときや、読み間違いがあるときは直してください。`)
    } catch {
      setError('読み取りの準備ができませんでした。インターネットにつながっているか確かめて、もう一度選んでください。')
    } finally {
      setReading(false)
    }
  }

  return (
    <div className="label-scan">
      <label className={reading ? 'label-scan-pick disabled' : 'label-scan-pick'}>
        {reading ? '読み取り中…' : '📷 栄養成分表示を撮って入れる'}
        <input type="file" accept="image/*" onChange={read} disabled={reading} hidden />
      </label>
      {reading && <p className="meal-help">はじめて使うときは、読み取りの準備（約6MB）に少し時間がかかります。</p>}
      {message && <p className="meal-saved">✓ {message}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  )
}
