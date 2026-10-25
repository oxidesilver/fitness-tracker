import { useState } from 'react'
import { formatDate, today } from '../../storage.js'
import { loadWeights } from '../weight/weightStorage.js'
import { bodyWeightOn, workoutKcal } from './calories.js'
import ExercisePicker from './ExercisePicker.jsx'
import RunEditor from './RunEditor.jsx'
import SetEditor from './SetEditor.jsx'
import { RUN_EXERCISES, addExercise, addWorkout, deleteWorkout, lastWorkout, loadExercises, loadWorkouts } from './workoutStorage.js'
import './workout.css'

const EMPTY_SET = { weight: '', reps: '' }
const EMPTY_RUN = { mode: 'machine', speed: '', incline: '', distance: '', minutes: '' }

const round1 = (n) => Math.round(n * 10) / 10

// 1セット分の表示：'55kg×10' または '自重×10'
function describeSet(s) {
  return `${s.weightKg === null ? '自重' : `${s.weightKg}kg`}×${s.reps}`
}

// 記録の中身の表示
function describe(r) {
  if (r.run) {
    const { mode, speedKmh, inclinePct, minutes, distanceKm } = r.run
    return mode === 'machine'
      ? `時速${speedKmh}km・傾斜${inclinePct}%・${minutes}分（${distanceKm}km）`
      : `${distanceKm}km・${minutes}分（時速${speedKmh}km）`
  }
  return r.sets.map(describeSet).join(' / ')
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

// 入力欄の文字を数字に直す。正しくなければ null
function toNumber(text, { min = 0, max = 1000, integer = false } = {}) {
  if (String(text).trim() === '') return null
  const n = Number(text)
  if (!Number.isFinite(n) || n < min || n >= max) return null
  if (integer && !Number.isInteger(n)) return null
  return n
}

export default function WorkoutPage() {
  const [records, setRecords] = useState(loadWorkouts)
  const [exercises, setExercises] = useState(() => loadExercises(loadWorkouts()))
  const [weights] = useState(loadWeights)
  const [date, setDate] = useState(today)
  const [exercise, setExercise] = useState('')
  const [sets, setSets] = useState([EMPTY_SET])
  const [run, setRun] = useState(EMPTY_RUN)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')

  const isRun = RUN_EXERCISES.includes(exercise)

  // 種目を選んだら、前回のその種目の内容を最初から入れておく
  function selectExercise(name) {
    setExercise(name)
    setError('')
    setSaved('')
    const last = name ? lastWorkout(records, name) : null
    if (last?.run) {
      const { mode, speedKmh, inclinePct, minutes, distanceKm } = last.run
      setRun({ mode, speed: String(speedKmh), incline: String(inclinePct), distance: String(distanceKm), minutes: String(minutes) })
    } else {
      setRun(EMPTY_RUN)
    }
    setSets(last?.sets ? last.sets.map((s) => ({ weight: s.weightKg === null ? '' : String(s.weightKg), reps: String(s.reps) })) : [EMPTY_SET])
  }

  function handleAddExercise(name) {
    addExercise(name)
    setExercises(loadExercises(records))
    selectExercise(name)
  }

  // ランニングの入力を記録の形に直す。おかしければエラーの文を返す
  function parseRun() {
    const minutes = toNumber(run.minutes, { max: 1440 })
    const noMinutes = '時間（分）を入れてください'
    if (run.mode === 'machine') {
      const speedKmh = toNumber(run.speed, { max: 40 })
      const inclinePct = run.incline.trim() === '' ? 0 : toNumber(run.incline, { max: 40 })
      if (!speedKmh) return '速度を入れてください（例：8）'
      if (inclinePct === null) return '傾斜を正しく入れてください（なければ空のまま）'
      if (!minutes) return noMinutes
      return { mode: 'machine', speedKmh, inclinePct, minutes, distanceKm: round1((speedKmh * minutes) / 60) }
    }
    const distanceKm = toNumber(run.distance, { max: 500 })
    if (!distanceKm) return '距離を入れてください（例：5）'
    if (!minutes) return noMinutes
    return { mode: 'outdoor', speedKmh: round1(distanceKm / (minutes / 60)), inclinePct: 0, minutes, distanceKm }
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!date) return setError('日付を入れてください')
    if (!exercise) return setError('種目を選んでください')

    let record
    if (isRun) {
      const parsed = parseRun()
      if (typeof parsed === 'string') return setError(parsed)
      record = { date, exercise, run: parsed }
    } else {
      const parsed = []
      for (const [i, s] of sets.entries()) {
        const weightKg = s.weight.trim() === '' ? null : toNumber(s.weight)
        const reps = toNumber(s.reps, { integer: true })
        if (s.weight.trim() !== '' && weightKg === null) return setError(`${i + 1}セット目の重さを正しく入れてください（自重なら空のまま）`)
        if (!reps) return setError(`${i + 1}セット目の回数を入れてください`)
        parsed.push({ weightKg, reps })
      }
      record = { date, exercise, sets: parsed }
    }

    const next = addWorkout(record)
    setRecords(next)
    setExercises(loadExercises(next))
    setSaved(`${exercise}を記録しました`)
    setError('')
    setExercise('')
    setSets([EMPTY_SET])
    setRun(EMPTY_RUN)
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

        <label htmlFor="workout-exercise">種目</label>
        <ExercisePicker exercises={exercises} selected={exercise} onSelect={selectExercise} onAdd={handleAddExercise} />

        {exercise && (isRun ? <RunEditor run={run} onChange={setRun} /> : <SetEditor sets={sets} onChange={setSets} />)}

        {error && <p className="error">{error}</p>}
        {saved && <p className="workout-saved">✓ {saved}</p>}
        <button type="submit" className="primary">記録する</button>
      </form>

      <h2>これまでの記録</h2>
      {records.length === 0 ? (
        <p className="workout-empty">まだ記録がありません</p>
      ) : (
        <>
          <p className="workout-note">
            {weights.length === 0
              ? '体重の画面で体重を記録すると、消費カロリーの目安が出ます。'
              : '消費カロリーは目安です。筋トレは1セット＝休けい込みで約3分として計算しています。'}
          </p>
          {groupByDate(records).map(([d, items]) => {
            const bodyKg = bodyWeightOn(d, weights)
            const kcals = items.map((r) => workoutKcal(r, bodyKg))
            const total = bodyKg ? Math.round(kcals.reduce((a, b) => a + b, 0)) : null
            return (
              <div key={d} className="workout-day">
                <h3>
                  <span>{formatDate(d)}</span>
                  {total !== null && <span className="workout-total">合計 約{total} kcal</span>}
                </h3>
                <ul className="card workout-list">
                  {items.map((r, i) => (
                    <li key={r.id}>
                      <div className="workout-item">
                        <span className="workout-name">{r.exercise}</span>
                        <span className="workout-detail">{describe(r)}</span>
                        {kcals[i] !== null && <span className="workout-kcal">約{Math.round(kcals[i])} kcal</span>}
                      </div>
                      <button type="button" className="workout-delete" onClick={() => handleDelete(r)}>
                        消す
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </>
      )}
    </section>
  )
}
