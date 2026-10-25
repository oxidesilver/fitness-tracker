import { useState } from 'react'
import { formatDate, today } from '../../storage.js'
import { addWorkout, deleteWorkout, exerciseNames, loadWorkouts } from './workoutStorage.js'
import './workout.css'

// 1件分の表示：'60 kg × 10回 × 3セット'
function describe(r) {
  const weight = r.weightKg === null ? '自重' : `${r.weightKg} kg`
  return `${weight} × ${r.reps}回 × ${r.sets}セット`
}

// 記録を日付ごとにまとめる：[['2026-10-25', [記録, 記録]], ...]
function groupByDate(records) {
  const groups = new Map()
  for (const r of records) {
    if (!groups.has(r.date)) groups.set(r.date, [])
    groups.get(r.date).push(r)
  }
  return [...groups]
}

export default function WorkoutPage() {
  const [records, setRecords] = useState(loadWorkouts)
  const [date, setDate] = useState(today)
  const [exercise, setExercise] = useState('')
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [sets, setSets] = useState('1')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const name = exercise.trim()
    const weightKg = weight === '' ? null : Number(weight)
    const repsNum = Number(reps)
    const setsNum = Number(sets)
    if (!date) return setError('日付を入れてください')
    if (!name) return setError('種目を入れてください（例：ベンチプレス）')
    if (weightKg !== null && !(weightKg >= 0 && weightKg < 1000)) return setError('重さを正しく入れてください（自重なら空のまま）')
    if (!(Number.isInteger(repsNum) && repsNum > 0)) return setError('回数を入れてください（例：10）')
    if (!(Number.isInteger(setsNum) && setsNum > 0)) return setError('セット数を入れてください（例：3）')

    setRecords(addWorkout({ date, exercise: name, weightKg, reps: repsNum, sets: setsNum }))
    setError('')
    // 同じ種目を続けて入れやすいように、入力欄はそのまま残す
    setSaved(`${name} を記録しました`)
  }

  function handleDelete(record) {
    if (confirm(`${formatDate(record.date)}の「${record.exercise} ${describe(record)}」を消しますか？`)) {
      setRecords(deleteWorkout(record.id))
    }
  }

  return (
    <section>
      <h1>筋トレ</h1>

      <form className="card" onSubmit={handleSubmit}>
        <label htmlFor="workout-date">日付</label>
        <input id="workout-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />

        <label htmlFor="workout-exercise">種目</label>
        <input
          id="workout-exercise"
          type="text"
          list="workout-exercise-names"
          placeholder="例：ベンチプレス"
          value={exercise}
          onChange={(e) => { setExercise(e.target.value); setSaved('') }}
        />
        <datalist id="workout-exercise-names">
          {exerciseNames(records).map((n) => <option key={n} value={n} />)}
        </datalist>

        <div className="workout-numbers">
          <div>
            <label htmlFor="workout-weight">重さ（kg）</label>
            <input id="workout-weight" type="number" inputMode="decimal" step="0.5" placeholder="自重は空" value={weight} onChange={(e) => { setWeight(e.target.value); setSaved('') }} />
          </div>
          <div>
            <label htmlFor="workout-reps">回数</label>
            <input id="workout-reps" type="number" inputMode="numeric" placeholder="10" value={reps} onChange={(e) => { setReps(e.target.value); setSaved('') }} />
          </div>
          <div>
            <label htmlFor="workout-sets">セット</label>
            <input id="workout-sets" type="number" inputMode="numeric" value={sets} onChange={(e) => { setSets(e.target.value); setSaved('') }} />
          </div>
        </div>

        {error && <p className="error">{error}</p>}
        {saved && <p className="workout-saved">✓ {saved}</p>}
        <button type="submit" className="primary">記録する</button>
      </form>

      <h2>これまでの記録</h2>
      {records.length === 0 ? (
        <p className="workout-empty">まだ記録がありません</p>
      ) : (
        groupByDate(records).map(([d, items]) => (
          <div key={d} className="workout-day">
            <h3>{formatDate(d)}</h3>
            <ul className="card workout-list">
              {items.map((r) => (
                <li key={r.id}>
                  <div className="workout-item">
                    <span className="workout-name">{r.exercise}</span>
                    <span className="workout-detail">{describe(r)}</span>
                  </div>
                  <button type="button" className="workout-delete" onClick={() => handleDelete(r)}>
                    消す
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </section>
  )
}
