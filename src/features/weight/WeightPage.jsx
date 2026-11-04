import { useState } from 'react'
import { formatDate, today } from '../../storage.js'
import { addDays } from '../charts/dates.js'
import { addWeight, deleteWeight, loadWeights } from './weightStorage.js'
import './weight.css'

export default function WeightPage() {
  const [records, setRecords] = useState(loadWeights)
  const [date, setDate] = useState(today)
  const [weight, setWeight] = useState('')
  const [error, setError] = useState('')
  const latest = records.reduce((a, r) => (!a || r.date > a.date ? r : a), null)
  const todayDone = records.some((r) => r.date === today())
  const yesterday = addDays(today(), -1)

  function handleSubmit(e) {
    e.preventDefault()
    const weightKg = Number(weight)
    if (!date) {
      setError('日付を入れてください')
      return
    }
    if (!weight || !(weightKg > 0 && weightKg < 500)) {
      setError('体重を正しく入れてください（例：65.2）')
      return
    }
    if (records.some((r) => r.date === date) && !confirm(`${formatDate(date)}の記録はすでにあります。上書きしますか？`)) {
      return
    }
    setRecords(addWeight({ date, weightKg: Math.round(weightKg * 10) / 10 }))
    setWeight('')
    setError('')
  }

  function handleDelete(record) {
    if (confirm(`${formatDate(record.date)}の記録（${record.weightKg} kg）を消しますか？`)) {
      setRecords(deleteWeight(record.date))
    }
  }

  return (
    <section>
      <h1>体重</h1>

      {records.length > 0 && !todayDone && (
        <div className="card weight-reminder">
          <strong>今日はまだ測っていません</strong>
          <p>
            前回は{formatDate(latest.date)}の{latest.weightKg.toFixed(1)}kgです。朝起きてトイレのあと、食べる前に測ると、毎日同じ条件でくらべられます。
          </p>
          <p>
            測り忘れた日は、空けたままで大丈夫です（思い出した数字や予想の数字は入れないでください）。グラフと週の振り返りは、測った日の平均でくらべます。
          </p>
        </div>
      )}

      <form className="card" onSubmit={handleSubmit}>
        <label htmlFor="weight-date">日付</label>
        <input id="weight-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <div className="weight-days">
          <button type="button" className={date === today() ? 'active' : ''} onClick={() => setDate(today())}>今日</button>
          <button type="button" className={date === yesterday ? 'active' : ''} onClick={() => setDate(yesterday)}>
            昨日の分
          </button>
        </div>

        <label htmlFor="weight-kg">体重（kg）</label>
        <input
          id="weight-kg"
          type="number"
          inputMode="decimal"
          step="0.1"
          placeholder="例：65.2"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />

        {error && <p className="error">{error}</p>}
        <button type="submit" className="primary">記録する</button>
      </form>

      <h2>これまでの記録</h2>
      {records.length === 0 ? (
        <p className="weight-empty">まだ記録がありません</p>
      ) : (
        <ul className="card weight-list">
          {records.map((r) => (
            <li key={r.date}>
              <span className="weight-date">{formatDate(r.date)}</span>
              <span className="weight-value">{r.weightKg.toFixed(1)} kg</span>
              <button type="button" className="weight-delete" onClick={() => handleDelete(r)}>
                消す
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
