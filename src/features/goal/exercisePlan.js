// 運動の計画（週に何回・1回何分・やりたい種目と強さ）の保存と、運動で使うカロリーの計算。
// 種目と強さ（METs）は exerciseCatalog.js の一覧から選ぶ。
import { loadObject, saveObject } from '../../storage.js'
import { EXERCISE_CATALOG, findExercise } from './exerciseCatalog.js'

const STORAGE_KEY = 'fitness-tracker.exercisePlan'

// 何も選んでいないときのおすすめ：筋肉を残すための筋トレ＋体への負担が少ないウォーキング（それぞれ最初の強さ）
export const RECOMMENDED = ['strength', 'walk']

// 形：{ sessions: '3', minutes: '60', items: [{ id: 'swim', level: 1 }], version: 2 }
// level は exerciseCatalog.js の levels の何番目か
const DEFAULT = { sessions: '', minutes: '', items: [], version: 2 }

// 前の版の形 { selected: ['strength', 'run', 'walk', 'custom-…'], custom: [...] } を新しい形に直す。
// 自分で足した種目（custom）は一覧にないので、ここで外す
const OLD_TO_NEW = { strength: { id: 'strength', level: 0 }, run: { id: 'run', level: 2 }, walk: { id: 'walk', level: 2 } }

export function loadExercisePlan() {
  const saved = loadObject(STORAGE_KEY) ?? {}
  const plan = { ...DEFAULT, ...saved }
  if (!saved.version) {
    plan.items = (saved.selected ?? []).map((id) => OLD_TO_NEW[id]).filter(Boolean)
    delete plan.selected
    delete plan.custom
    plan.version = 2
  }
  return plan
}

export function saveExercisePlan(plan) {
  saveObject(STORAGE_KEY, plan)
}

// まだ選んでいない種目（よく行われている順）
export function unselectedExercises(plan) {
  return EXERCISE_CATALOG.filter((e) => !plan.items.some((i) => i.id === e.id))
}

// 運動の計画から、1回の内容と、運動で使うカロリーを出す。
// 1回の時間を、選んだ種目で同じくらいに分ける（5分きざみ）。
// 1日の消費カロリーにはすでに安静時の分（1 METs）が入っているので、運動の分は（METs − 1）で数える。
// 戻り値：{ items: [{ name, level, minutes, kcal }], perSession, weekly, daily, recommended }（計算できないときは null）
export function exerciseKcal(plan, weightKg) {
  const sessions = Number(plan.sessions)
  const minutes = Number(plan.minutes)
  if (!(sessions > 0 && sessions <= 14 && minutes > 0 && minutes <= 300 && weightKg > 0)) return null

  const recommended = plan.items.length === 0
  const chosen = (recommended ? RECOMMENDED.map((id) => ({ id, level: findExercise(id).default })) : plan.items)
    .map((i) => {
      const e = findExercise(i.id)
      const level = e?.levels[i.level] ?? e?.levels[e.default]
      return e && level ? { name: e.name, level: level.label, mets: level.mets } : null
    })
    .filter(Boolean)
  if (chosen.length === 0) return null

  const each = Math.max(5, Math.round(minutes / chosen.length / 5) * 5)
  const items = chosen.map((e, i) => {
    // 5分きざみで分けたときの余りは最後の種目に足す
    const m = i === chosen.length - 1 ? Math.max(5, minutes - each * (chosen.length - 1)) : each
    return { name: e.name, level: e.level, minutes: m, kcal: (e.mets - 1) * weightKg * (m / 60) * 1.05 }
  })
  const perSession = items.reduce((a, b) => a + b.kcal, 0)
  return { items, perSession, weekly: perSession * sessions, daily: (perSession * sessions) / 7, recommended }
}
