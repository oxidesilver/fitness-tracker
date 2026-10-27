// 食事の記録を保存・読み込みする。
import { loadList, saveList } from '../../storage.js'

const STORAGE_KEY = 'fitness-tracker.meals'

// いつ食べたか
export const MEAL_TIMES = [
  { id: 'breakfast', label: '朝' },
  { id: 'lunch', label: '昼' },
  { id: 'dinner', label: '夜' },
  { id: 'snack', label: '間食' },
]

// 記録の形：{ id, date: '2026-10-26', time: 'breakfast', name: '鶏むね肉のサラダ', kcal: 350, protein: 30, fat: 10, carbs: 20 }
// P・F・C は分からなければ null
// 「選んで作る」で記録したときは items（献立の中身：[{ code, name, grams, kcal, protein, fat, carbs }]）も持つ
export function loadMeals() {
  return loadList(STORAGE_KEY)
}

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function addMeal(record) {
  const records = [...loadMeals(), { id: newId(), ...record }]
  saveList(STORAGE_KEY, records)
  return records
}

export function deleteMeal(id) {
  const records = loadMeals().filter((r) => r.id !== id)
  saveList(STORAGE_KEY, records)
  return records
}

// これまでに食べたもの（同じ名前は1つにまとめ、いちばん新しい数字を使う）。よく食べるものほど前に来る
export function frequentFoods(records) {
  const byName = new Map()
  for (const r of records) {
    const prev = byName.get(r.name)
    byName.set(r.name, { ...r, count: (prev?.count ?? 0) + 1 })
  }
  return [...byName.values()].sort((a, b) => b.count - a.count)
}

// 時間帯から、いつの食事かを決める（入力の最初の値に使う）
export function defaultMealTime(hour = new Date().getHours()) {
  if (hour >= 4 && hour < 10) return 'breakfast'
  if (hour >= 10 && hour < 15) return 'lunch'
  if (hour >= 17 && hour < 23) return 'dinner'
  return 'snack'
}

// 登録した食品（プロテインなど、同じものをくり返し食べるときにタップ1回で記録する）
// 形：{ name, kcal, protein, fat, carbs, items? }。同じ名前は1つだけ。並びは登録した順
const MY_FOODS_KEY = 'fitness-tracker.myFoods'

export function loadMyFoods() {
  return loadList(MY_FOODS_KEY)
}

export function addMyFood(meal) {
  const { name, kcal, protein, fat, carbs, items } = meal
  const food = { name, kcal, protein, fat, carbs, ...(items?.length ? { items } : {}) }
  const list = [...loadMyFoods().filter((f) => f.name !== name), food]
  saveList(MY_FOODS_KEY, list)
  return list
}

export function removeMyFood(name) {
  const list = loadMyFoods().filter((f) => f.name !== name)
  saveList(MY_FOODS_KEY, list)
  return list
}
