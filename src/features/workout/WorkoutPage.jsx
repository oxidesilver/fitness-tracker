import { useState } from 'react'
import { formatDate, today } from '../../storage.js'
import ExercisePicker from './ExercisePicker.jsx'
import SetEditor from './SetEditor.jsx'
import { addExercise, addWorkout, deleteWorkout, lastWorkout, loadExercises, loadWorkouts } from './workoutStorage.js'
import './workout.css'

const EMPTY_SET = { weight: '', reps: '' }

// 1セット分の表示：'55kg×10' または '自重×10'
function describeSet(s) {
  return `${s.weightKg === null ? '自重' : `${s.weightKg}kg`}×${s.reps}`
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
  const [exercises, setExercises] = useState(() => loadExercises(loadWorkouts()))
  const [date, setDate] = useState(today)
  const [exercise, setExercise] = useState('')
  const [sets, setSets] = useState([EMPTY_SET])
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')

  // 種目を選んだら、前回のその種目のセットを最初から入れておく
  function selectExercise(name) {
    setExercise(name)
    setError('')
    setSaved('')
    const last = name && lastWorkout(records, name)
    setSets(last ? last.sets.map((s) => ({ weight: s.weightKg === null ? '' : String(s.weightKg), reps: String(s.reps) })) : [EMPTY_SET])
  }

  function handleAddExercise(name) {
    addExercise(name)
    setExercises(loadExercises(records))
    selectExercise(name)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!date) return setError('日付を入れてください')
    if (!exercise) return setError('種目を選んでください')
    const parsed = []
    for (const [i, s] of sets.entries()) {
      const weightKg = s.weight.trim() === '' ? null : Number(s.weight)
      const reps = Number(s.reps)
      if (weightKg !== null && !(weightKg >= 0 && weightKg < 1000)) return setError(`${i + 1}セット目の重さを正しく入れてください（自重なら空のまま）`)
      if (!(Number.isInteger(reps) && reps > 0)) return setError(`${i + 1}セット目の回数を入れてください`)
      parsed.push({ weightKg, reps })
    }

    const next = addWorkout({ date, exercise, sets: parsed })
    setRecords(next)
    setExercises(loadExercises(next))
    setSaved(`${exercise}（${parsed.length}セット）を記録しました`)
    setError('')
    setExercise('')
    setSets([EMPTY_SET])
  }

  function handleDelete(record) {
    if (confirm(`${formatDate(record.date)}の「${record.exercise}」を消しますか？`)) {
      setRecords(deleteWorkout(record.id))
    }
  }

  return (
    <section>
      <h1>筋トレ</h1>

      <form className="card" onSubmit={handleSubmit}>
        <label htmlFor="workout-date">日付</label>
        <input id="workout-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />

        <label>種目</label>
        <ExercisePicker exercises={exercises} selected={exercise} onSelect={selectExercise} onAdd={handleAddExercise} />

        {exercise && <SetEditor sets={sets} onChange={setSets} />}

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
                    <span className="workout-detail">{r.sets.map(describeSet).join(' / ')}</span>
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
