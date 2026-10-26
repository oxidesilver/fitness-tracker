// 筋トレのおすすめメニューを作る。
// 考え方（初心者向け）：
// - 全身の大きな筋肉（脚・胸・背中・肩・おなか）を、週2回以上鍛える
//   参考：ACSM（アメリカスポーツ医学会）2026年の筋トレの指針 https://www.sciencedaily.com/releases/2026/03/260319074552.htm
// - 1つの種目は「10回前後（8〜12回）で限界になる重さ」で3セット
//   参考：ACSM 2009年の指針（初心者は8〜12回で限界になる重さ）https://sfu.ca/~ryand/kin343/ACSMresistance.pdf
// - 1種目の時間は、準備と軽い1セット2分＋3セット（各1分）＋セットの間の休み1.5分×2 ＝ 約8分
import { exerciseKcal } from '../goal/exercisePlan.js'
import { startingWeight, workoutInfo, EQUIPMENT } from './workoutCatalog.js'
import { lastWorkout } from './workoutStorage.js'

export const PLACES = [
  { id: 'gym', label: 'ジム' },
  { id: 'home', label: '自宅' },
]

// 鍛える場所の順番（大きな筋肉から）。ジムははじめてでも安全なマシン中心、自宅は器具なし
const MENUS = {
  gym: ['レッグプレス', 'チェストプレス（マシン）', 'ラットプルダウン', 'ショルダープレス', 'アブドミナル（マシン）', 'シーテッドロウ（マシン）'],
  home: ['自重スクワット', '腕立て伏せ', 'バックエクステンション', '腹筋（クランチ）', 'カーフレイズ', 'レッグレイズ'],
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
export function recommendMenu({ place, minutes, records, bodyKg, sex }) {
  const count = Math.min(MENUS[place].length, Math.max(2, Math.floor(minutes / MINUTES_PER_EXERCISE)))
  return MENUS[place].slice(0, count).map((name) => {
    const info = workoutInfo(name)
    const last = lastWorkout(records, name)
    const lastWeight = last?.sets?.[0]?.weightKg
    const weight = lastWeight != null ? String(lastWeight) : startingWeight(info, bodyKg, sex)
    return { name, weight, bodyweight: info.equipment === 'bodyweight', unitLabel: EQUIPMENT[info.equipment].weightLabel, fromLast: lastWeight != null, sets: SETS, minutes: MINUTES_PER_EXERCISE }
  })
}
