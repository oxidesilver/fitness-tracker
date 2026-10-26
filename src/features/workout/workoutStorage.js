// 筋トレの記録と種目の一覧を保存・読み込みする。
import { loadList, saveList } from '../../storage.js'

const STORAGE_KEY = 'fitness-tracker.workouts'
const EXERCISES_KEY = 'fitness-tracker.exercises'

// 記録の形
// 筋トレ：{ id, date: '2026-10-25', exercise: 'ベンチプレス', sets: [{ weightKg: 55, reps: 10 }, ...] }
//   weightKg が null のときは自重（重りなし）
// ランニング：{ id, date, exercise: 'ランニング', run: { mode: 'machine' | 'outdoor', speedKmh, inclinePct, minutes, distanceKm } }
// 有酸素など（時間で記録）：{ id, date, exercise: '水泳', cardio: { catalogId: 'swim', level: 1, minutes: 30, mets: 5.8 } }
//   mets は記録したときの値を残す（あとで一覧の数字が変わっても、前の記録のカロリーが変わらないように）
export function loadWorkouts() {
  return loadList(STORAGE_KEY).map(upgrade)
}

// 古い形 { weightKg, reps, sets: 3 } の記録を、1セットずつの形に直す
function upgrade(r) {
  if (r.run || r.cardio || Array.isArray(r.sets)) return r
  const { weightKg, reps, sets, ...rest } = r
  return { ...rest, sets: Array.from({ length: sets }, () => ({ weightKg, reps })) }
}

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// 1日に何件でも記録できる。新しい日付が上、同じ日付の中では入れた順に並べる。
export function addWorkout(record) {
  const records = [...loadWorkouts(), { id: newId(), ...record }].sort((a, b) => b.date.localeCompare(a.date))
  saveList(STORAGE_KEY, records)
  return records
}

export function deleteWorkout(id) {
  const records = loadWorkouts().filter((r) => r.id !== id)
  saveList(STORAGE_KEY, records)
  return records
}

// よく記録している種目（多い順、limit 個まで）
export function frequentExercises(records, limit = 5) {
  const count = new Map()
  for (const r of records) count.set(r.exercise, (count.get(r.exercise) ?? 0) + 1)
  return [...count].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([name]) => name)
}

// 前の版で自分で足した種目の名前（記録や保存にあるもの）。一覧にないものだけを isKnown で外して使う
export function legacyExerciseNames(records, isKnown) {
  return [...new Set([...loadList(EXERCISES_KEY), ...records.map((r) => r.exercise)])].filter((n) => !isKnown(n))
}

// その種目の、いちばん最近の記録（なければ null）
// 同じ日付の中では後ろにあるほど新しいので、日付が同じなら後ろの記録を選ぶ。
export function lastWorkout(records, exercise) {
  return records
    .filter((r) => r.exercise === exercise)
    .reduce((latest, r) => (latest === null || r.date >= latest.date ? r : latest), null)
}
