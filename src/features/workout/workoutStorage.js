// 筋トレの記録を保存・読み込みする。
import { loadList, saveList } from '../../storage.js'

const STORAGE_KEY = 'fitness-tracker.workouts'

// 記録の形：{ id, date: '2026-10-25', exercise: 'ベンチプレス', weightKg: 60, reps: 10, sets: 3 }
// weightKg が null のときは自重（重りなし）
export function loadWorkouts() {
  return loadList(STORAGE_KEY)
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

// これまでに記録した種目の名前（入力の候補に使う）
export function exerciseNames(records) {
  return [...new Set(records.map((r) => r.exercise))]
}
