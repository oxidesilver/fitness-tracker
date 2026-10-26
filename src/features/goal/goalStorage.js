// 目標（何kgをいつまでに減らすか）と PFC の決め方を保存・読み込みする。
import { loadObject, saveObject } from '../../storage.js'

const STORAGE_KEY = 'fitness-tracker.goal'

// 形：{ loseKg: '5', startWeightKg: 67, targetDate: '2027-03-31', pfcMode: 'body' | 'national', proteinPerKg: '2', fatG: '45' }
// startWeightKg は「減らしたい体重」を入れたときの体重。目標体重 ＝ startWeightKg − loseKg で固定する
// 値は入力中の文字のまま持つ
const DEFAULT = { loseKg: '', startWeightKg: '', targetDate: '', pfcMode: 'body', proteinPerKg: '2', fatG: '45' }

export function loadGoal() {
  return { ...DEFAULT, ...loadObject(STORAGE_KEY) }
}

export function saveGoal(goal) {
  saveObject(STORAGE_KEY, goal)
}
