// 保存してあるプロフィール・体重・目標から、1日の目標（カロリーと PFC）を出す。
// 食事の画面など、プロフィールの画面以外で目標を使うときに使う。
import { today } from '../../storage.js'
import { energyFromProfile } from '../profile/energy.js'
import { loadProfile } from '../profile/profileStorage.js'
import { loadWeights } from '../weight/weightStorage.js'
import { exerciseKcal, loadExercisePlan } from './exercisePlan.js'
import { loadGoal } from './goalStorage.js'
import { goalPlan } from './nutrition.js'

// 戻り値：{ kcal, protein, fat, carbs, mode, weightKg, basal, age, expenditure }（計算できないときは null）
// expenditure は1日の消費カロリー（ふだんの活動量＋運動の計画の分）。週の振り返りで、どれだけ足りないかを見るのに使う
// mode は PFC の決め方（'body'：体づくり向け、'national'：国の目安）。食事の点数で使う
export function loadDailyTarget() {
  const energy = energyFromProfile(loadProfile(), loadWeights(), today())
  const exercise = exerciseKcal(loadExercisePlan(), energy.weightKg)
  const goal = loadGoal()
  const { plan, pfc } = goalPlan(energy, goal, today(), exercise?.daily ?? 0)
  if (!plan) return null
  return {
    kcal: plan.intake,
    protein: pfc.protein,
    fat: pfc.fat,
    carbs: Math.max(0, pfc.carbs),
    mode: goal.pfcMode,
    weightKg: energy.weightKg,
    basal: energy.basal,
    age: energy.age,
    expenditure: energy.daily + (exercise?.daily ?? 0),
  }
}
