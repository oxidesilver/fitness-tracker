// 筋トレの記録と種目の一覧を保存・読み込みする。
import { loadList, saveList } from '../../storage.js'

const STORAGE_KEY = 'fitness-tracker.workouts'
const EXERCISES_KEY = 'fitness-tracker.exercises'

// 最初から一覧に並べる種目
const DEFAULT_EXERCISES = ['ベンチプレス', 'スクワット', 'デッドリフト', 'ラットプルダウン', 'ショルダープレス', 'ランニング']

// 速度・時間で記録する種目（それ以外はセットで記録する）
export const RUN_EXERCISES = ['ランニング']

// 記録の形
// 筋トレ：{ id, date: '2026-10-25', exercise: 'ベンチプレス', sets: [{ weightKg: 55, reps: 10 }, ...] }
//   weightKg が null のときは自重（重りなし）
// ランニング：{ id, date, exercise: 'ランニング', run: { mode: 'machine' | 'outdoor', speedKmh, inclinePct, minutes, distanceKm } }
export function loadWorkouts() {
  return loadList(STORAGE_KEY).map(upgrade)
}

// 古い形 { weightKg, reps, sets: 3 } の記録を、1セットずつの形に直す
function upgrade(r) {
  if (r.run || Array.isArray(r.sets)) return r
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

// 一覧に並べる種目。よく記録している種目ほど前に来る。
// 自分で足した種目だけを保存しておき、最初からある種目と合わせて並べる。
export function loadExercises(records) {
  const names = [...new Set([...DEFAULT_EXERCISES, ...loadList(EXERCISES_KEY), ...records.map((r) => r.exercise)])]
  const count = (name) => records.filter((r) => r.exercise === name).length
  return names.map((name, i) => ({ name, i })).sort((a, b) => count(b.name) - count(a.name) || a.i - b.i).map((x) => x.name)
}

export function addExercise(name) {
  const saved = loadList(EXERCISES_KEY)
  if (!saved.includes(name) && !DEFAULT_EXERCISES.includes(name)) saveList(EXERCISES_KEY, [...saved, name])
}

// その種目の、いちばん最近の記録（なければ null）
// 同じ日付の中では後ろにあるほど新しいので、日付が同じなら後ろの記録を選ぶ。
export function lastWorkout(records, exercise) {
  return records
    .filter((r) => r.exercise === exercise)
    .reduce((latest, r) => (latest === null || r.date >= latest.date ? r : latest), null)
}
