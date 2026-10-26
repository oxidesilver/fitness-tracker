// 目標（何kgをいつまでに減らすか）と PFC の決め方を保存・読み込みする。
import { loadObject, saveObject } from '../../storage.js'

const STORAGE_KEY = 'fitness-tracker.goal'

// 形：{ loseKg: '5', startWeightKg: 67, targetDate: '2027-03-31', pfcMode: 'body' | 'national', proteinPerKg: '2', fatG: '45', pfcVersion: 2 }
// startWeightKg は「減らしたい体重」を入れたときの体重。目標体重 ＝ startWeightKg − loseKg で固定する
// proteinPerKg・fatG が空のときは自動で決める（nutrition.js の autoProteinPerKg・autoFatG）
// 値は入力中の文字のまま持つ
const DEFAULT = { loseKg: '', startWeightKg: '', targetDate: '', pfcMode: 'body', proteinPerKg: '', fatG: '', pfcVersion: 2 }

export function loadGoal() {
  const saved = loadObject(STORAGE_KEY)
  const goal = { ...DEFAULT, ...saved }
  // 前の版では最初から「2」「45」が入っていた。そのままなら自動に切りかえる
  if (saved && !saved.pfcVersion) {
    if (goal.proteinPerKg === '2') goal.proteinPerKg = ''
    if (goal.fatG === '45') goal.fatG = ''
    goal.pfcVersion = 2
  }
  return goal
}

export function saveGoal(goal) {
  saveObject(STORAGE_KEY, goal)
}
