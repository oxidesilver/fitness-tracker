import { useState } from 'react'
import { formatDate, today } from '../../storage.js'
import { findExercise } from '../goal/exerciseCatalog.js'
import { loadProfile } from '../profile/profileStorage.js'
import { loadWeights } from '../weight/weightStorage.js'
import { bodyWeightOn, workoutKcal } from './calories.js'
import CardioEditor from './CardioEditor.jsx'
import ExercisePicker from './ExercisePicker.jsx'
import RunEditor from './RunEditor.jsx'
import SetEditor from './SetEditor.jsx'
import { EQUIPMENT, WORKOUT_GROUPS, isWeightOptional, startingWeight, workoutInfo } from './workoutCatalog.js'
import { addWorkout, deleteWorkout, frequentExercises, lastWorkout, legacyExerciseNames, loadWorkouts } from './workoutStorage.js'
import './workout.css'

const EMPTY_SET = { weight: '', reps: '10' }
const EMPTY_RUN = { mode: 'machine', speed: '', incline: '', distance: '', minutes: '' }

const round1 = (n) => Math.round(n * 10) / 10

const KNOWN = new Set(WORKOUT_GROUPS.flatMap((g) => g.items.map((i) => i.name)))

// 1セット分の表示：'55kg×10'、自重の種目は '自重×10' または '自重+10kg×8'
function describeSet(s, bodyweight) {
  if (s.weightKg === null) return `自重×${s.reps}`
  return `${bodyweight ? `自重+${s.weightKg}kg` : `${s.weightKg}kg`}×${s.reps}`
}

// 記録の中身の表示
function describe(r) {
  if (r.cardio) {
    const level = findExercise(r.cardio.catalogId)?.levels[r.cardio.level]
    return `${level ? `${level.label}・` : ''}${r.cardio.minutes}分`
  }
  if (r.run) {
    const { mode, speedKmh, inclinePct, minutes, distanceKm } = r.run
    return mode === 'machine'
      ? `時速${speedKmh}km・傾斜${inclinePct}%・${minutes}分（${distanceKm}km）`
      : `${distanceKm}km・${minutes}分（時速${speedKmh}km）`
  }
  const bodyweight = workoutInfo(r.exercise).equipment === 'bodyweight'
  return r.sets.map((s) => describeSet(s, bodyweight)).join(' / ')
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
  const [weights] = useState(loadWeights)
  const [sex] = useState(() => loadProfile().sex)
  const [date, setDate] = useState(today)
  const [exercise, setExercise] = useState('')
  const [sets, setSets] = useState([EMPTY_SET])
  const [run, setRun] = useState(EMPTY_RUN)
  const [cardio, setCardio] = useState({ level: 0, minutes: '30' })
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')

  const info = exercise ? workoutInfo(exercise) : null

  // 種目を選んだら、前回のその種目の内容を最初から入れておく。
  // はじめての種目なら、体重から出した軽めの重さを入れておく
  function selectExercise(name) {
    setExercise(name)
    setError('')
    setSaved('')
    if (!name) return
    const next = workoutInfo(name)
    const last = lastWorkout(records, name)
    if (next.kind === 'run') {
      if (last?.run) {
        const { mode, speedKmh, inclinePct, minutes, distanceKm } = last.run
        setRun({ mode, speed: String(speedKmh), incline: String(inclinePct), distance: String(distanceKm), minutes: String(minutes) })
      } else setRun(EMPTY_RUN)
    } else if (next.kind === 'cardio') {
      setCardio(last?.cardio ? { level: last.cardio.level, minutes: String(last.cardio.minutes) } : { level: findExercise(next.catalogId).default, minutes: '30' })
    } else if (last?.sets) {
      setSets(last.sets.map((s) => ({ weight: s.weightKg === null ? '' : String(s.weightKg), reps: String(s.reps) })))
    } else {
      const bodyKg = bodyWeightOn(today(), weights)
      setSets([{ weight: startingWeight(next, bodyKg, sex), reps: '10' }])
    }
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
    if (info.kind === 'run') {
      const parsed = parseRun()
      if (typeof parsed === 'string') return setError(parsed)
      record = { date, exercise, run: parsed }
    } else if (info.kind === 'cardio') {
      const minutes = toNumber(cardio.minutes, { min: 1, max: 1440, integer: true })
      if (!minutes) return setError('時間（分）を入れてください')
      const level = findExercise(info.catalogId).levels[cardio.level]
      record = { date, exercise, cardio: { catalogId: info.catalogId, level: cardio.level, minutes, mets: level.mets } }
    } else {
      const eq = EQUIPMENT[info.equipment]
      const optional = isWeightOptional(info.equipment)
      const parsed = []
      for (const [i, s] of sets.entries()) {
        const weightKg = s.weight.trim() === '' ? null : toNumber(s.weight)
        const reps = toNumber(s.reps, { integer: true })
        if (weightKg === null && (!optional || s.weight.trim() !== '')) {
          return setError(`${i + 1}セット目の${eq.weightLabel}を${optional ? '正しく入れてください（重りなしなら空のまま）' : '入れてください'}`)
        }
        if (!optional && weightKg < eq.min) return setError(`${i + 1}セット目：この種目は${eq.min}kgより軽くできません`)
        if (!reps) return setError(`${i + 1}セット目の回数を入れてください`)
        parsed.push({ weightKg, reps })
      }
      record = { date, exercise, sets: parsed }
    }

    const next = addWorkout(record)
    setRecords(next)
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
        <ExercisePicker
          selected={exercise}
          onSelect={selectExercise}
          frequent={frequentExercises(records)}
          legacy={legacyExerciseNames(records, (n) => KNOWN.has(n))}
        />

        {info?.kind === 'run' && <RunEditor run={run} onChange={setRun} />}
        {info?.kind === 'cardio' && <CardioEditor catalogId={info.catalogId} value={cardio} onChange={setCardio} />}
        {info?.kind === 'sets' && <SetEditor sets={sets} onChange={setSets} info={info} />}

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
              : '消費カロリーは目安です。筋トレは1セット＝休憩込みで約3分として計算しています。有酸素・スポーツは強さと時間から計算しています。'}
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
