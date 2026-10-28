// 筋トレのおすすめメニューを作る。
// 考え方（初心者向け）：
// - 全身の大きな筋肉（脚・胸・背中・肩・おなか）を、週2回以上鍛える
//   参考：ACSM（アメリカスポーツ医学会）2026年の筋トレの指針 https://www.sciencedaily.com/releases/2026/03/260319074552.htm
// - 1つの種目は「10回前後（8〜12回）で限界になる重さ」で3セット
//   参考：ACSM 2009年の指針（初心者は8〜12回で限界になる重さ）https://sfu.ca/~ryand/kin343/ACSMresistance.pdf
// - 1種目の時間は、準備と軽い1セット2分＋3セット（各1分）＋セットの間の休み1.5分×2 ＝ 約8分
// - 全身法と分割法：週の量が同じなら、筋肉の増え方や強さの伸びにほぼ差はない
//   参考：Ramos-Campo ら 2024年 https://doi.org/10.1519/JSC.0000000000004774
//   ただし同じ筋肉は週2回鍛える方がよい（Schoenfeld ら 2016年 https://pubmed.ncbi.nlm.nih.gov/27102172/ ）ので、
//   週3回までは全身法、週4回からは上半身と下半身の2分割をおすすめにする
import { exerciseKcal } from '../goal/exercisePlan.js'
import { startingWeight, workoutInfo, EQUIPMENT } from './workoutCatalog.js'
import { lastWorkout } from './workoutStorage.js'

export const PLACES = [
  { id: 'gym', label: 'ジム' },
  { id: 'home', label: '自宅' },
]

// 鍛える場所の順番（大きな筋肉から）。ジムははじめてでも安全なマシン中心、自宅は器具なし
// full：全身法、upper：分割法の上半身の日、lower：分割法の下半身の日
const MENUS = {
  gym: {
    full: ['レッグプレス', 'チェストプレス（マシン）', 'ラットプルダウン', 'ショルダープレス', 'アブドミナル（マシン）', 'シーテッドロウ（マシン）'],
    upper: ['チェストプレス（マシン）', 'ラットプルダウン', 'ショルダープレス', 'シーテッドロウ（マシン）', 'ペックフライ（マシン）', 'トライセプスプッシュダウン', 'ダンベルカール'],
    lower: ['レッグプレス', 'レッグカール', 'レッグエクステンション', 'アダクション・アブダクション（マシン）', 'アブドミナル（マシン）', 'カーフレイズ'],
  },
  home: {
    full: ['自重スクワット', '腕立て伏せ', 'バックエクステンション', '腹筋（クランチ）', 'カーフレイズ', 'レッグレイズ'],
    upper: ['腕立て伏せ', 'バックエクステンション', '腹筋（クランチ）', 'レッグレイズ'],
    lower: ['自重スクワット', '自重ランジ', 'ヒップリフト', 'カーフレイズ'],
  },
}

export const STYLES = [
  { id: 'full', label: '全身法' },
  { id: 'split', label: '分割法' },
]

export const SPLIT_DAYS = [
  { id: 'upper', label: '上半身の日' },
  { id: 'lower', label: '下半身の日' },
]

// 週の回数からおすすめのやり方：週3回までは全身法、4回からは分割法
export function recommendedStyle(sessionsPerWeek) {
  return Number(sessionsPerWeek) >= 4 ? 'split' : 'full'
}

const LOWER_MUSCLES = ['quads', 'hamstrings', 'glutes', 'calves']

// 分割法で次にやる日：いちばん最近に筋トレした日が下半身中心なら上半身、そうでなければ下半身
// guide は workoutGuide.js の GUIDE
export function nextSplitDay(records, guide) {
  const strength = records.filter((r) => r.sets && guide[r.exercise])
  if (strength.length === 0) return 'upper'
  const lastDate = strength.reduce((d, r) => (r.date > d ? r.date : d), '')
  const day = strength.filter((r) => r.date === lastDate)
  const lower = day.filter((r) => guide[r.exercise].muscles.some((m) => LOWER_MUSCLES.includes(m)) && !guide[r.exercise].muscles.some((m) => ['chest', 'chestUpper', 'chestMiddle', 'chestLower', 'back', 'shoulders', 'biceps', 'triceps'].includes(m))).length
  return lower > day.length / 2 ? 'upper' : 'lower'
}

export const SETS = 3
export const MINUTES_PER_EXERCISE = 8
const DEFAULT_STRENGTH_MINUTES = 40

// 筋トレに使える時間（分）。プロフィールの運動の計画があれば、その中の筋トレの時間を使う
export function strengthMinutes(exercisePlan, bodyKg) {
  const result = exerciseKcal(exercisePlan, bodyKg || 60)
  const item = result?.items.find((i) => i.name === '筋トレ')
  return { minutes: item?.minutes ?? DEFAULT_STRENGTH_MINUTES, fromPlan: Boolean(item) }
}

// おすすめメニュー：[{ name, weight: '22.5'（自重は ''）, bodyweight, sets, minutes }]
// day は 'full'・'upper'・'lower'
export function recommendMenu({ place, day, minutes, records, bodyKg, sex }) {
  const list = MENUS[place][day]
  const count = Math.min(list.length, Math.max(2, Math.floor(minutes / MINUTES_PER_EXERCISE)))
  return list.slice(0, count).map((name) => {
    const info = workoutInfo(name)
    const last = lastWorkout(records, name)
    const lastWeight = last?.sets?.[0]?.weightKg
    const weight = lastWeight != null ? String(lastWeight) : startingWeight(info, bodyKg, sex)
    return { name, weight, bodyweight: info.equipment === 'bodyweight', unitLabel: EQUIPMENT[info.equipment].weightLabel, fromLast: lastWeight != null, sets: SETS, minutes: MINUTES_PER_EXERCISE }
  })
}
