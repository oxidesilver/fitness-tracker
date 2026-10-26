// 運動の計画（週に何回・1回何分・やりたい種目）の保存と、運動で使うカロリーの計算。
import { loadObject, saveObject } from '../../storage.js'
import { STRENGTH_METS, runMets } from '../workout/calories.js'

const STORAGE_KEY = 'fitness-tracker.exercisePlan'

// 最初から選べる種目。METs の根拠は workout/calories.js を参照
export const PRESET_EXERCISES = [
  { id: 'strength', name: '筋トレ', mets: STRENGTH_METS },
  { id: 'run', name: 'ランニング（時速8km）', mets: runMets(8, 0) },
  { id: 'walk', name: '速歩き（時速5.6km）', mets: runMets(5.6, 0) },
]

// 自分で足す種目の強さ。中くらいの強さは3〜6 METs、強い運動は6 METs以上とされる
// 参考：https://kennet.mhlw.go.jp/information/information/exercise/s-00-002
export const INTENSITY_LEVELS = [
  { id: 'light', label: '軽い', description: '息が少し上がる', mets: 3 },
  { id: 'moderate', label: 'ふつう', description: '話はできるが息が上がる', mets: 5 },
  { id: 'hard', label: 'きつい', description: '話すのが難しい', mets: 8 },
]

// 何も選んでいないときのおすすめ：筋肉を残すための筋トレ＋体への負担が少ない有酸素運動
export const RECOMMENDED = ['strength', 'walk']

// 形：{ sessions: '3', minutes: '60', selected: ['strength', 'walk'], custom: [{ id, name, level }] }
const DEFAULT = { sessions: '', minutes: '', selected: [], custom: [] }

export function loadExercisePlan() {
  return { ...DEFAULT, ...loadObject(STORAGE_KEY) }
}

export function saveExercisePlan(plan) {
  saveObject(STORAGE_KEY, plan)
}

// 選べる種目の一覧（最初からある種目＋自分で足した種目）
export function allExercises(plan) {
  return [
    ...PRESET_EXERCISES,
    ...plan.custom.map((c) => ({ id: c.id, name: c.name, mets: INTENSITY_LEVELS.find((l) => l.id === c.level).mets })),
  ]
}

// 運動の計画から、1回の内容と、運動で使うカロリーを出す。
// 1回の時間を、選んだ種目で同じくらいに分ける（5分きざみ）。
// 1日の消費カロリーにはすでに安静時の分（1 METs）が入っているので、運動の分は（METs − 1）で数える。
// 戻り値：{ items: [{ name, minutes, kcal }], perSession, weekly, daily, recommended }（計算できないときは null）
export function exerciseKcal(plan, weightKg) {
  const sessions = Number(plan.sessions)
  const minutes = Number(plan.minutes)
  if (!(sessions > 0 && sessions <= 14 && minutes > 0 && minutes <= 300 && weightKg > 0)) return null

  const list = allExercises(plan)
  const recommended = plan.selected.length === 0
  const chosen = list.filter((e) => (recommended ? RECOMMENDED : plan.selected).includes(e.id))
  if (chosen.length === 0) return null

  const each = Math.max(5, Math.round(minutes / chosen.length / 5) * 5)
  const items = chosen.map((e, i) => {
    // 5分きざみで分けたときの余りは最後の種目に足す
    const m = i === chosen.length - 1 ? Math.max(5, minutes - each * (chosen.length - 1)) : each
    return { name: e.name, minutes: m, kcal: (e.mets - 1) * weightKg * (m / 60) * 1.05 }
  })
  const perSession = items.reduce((a, b) => a + b.kcal, 0)
  return { items, perSession, weekly: perSession * sessions, daily: (perSession * sessions) / 7, recommended }
}
