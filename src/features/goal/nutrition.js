// 目標摂取カロリーと PFC（たんぱく質・脂質・炭水化物）の計算。

// 体脂肪1kgを減らすのに必要なカロリー（約7,000kcal）
// 参考：https://kennet.mhlw.go.jp/information/information/exercise/s-00-012
export const KCAL_PER_KG_FAT = 7000

// 1gあたりのカロリー：たんぱく質・炭水化物 4kcal、脂質 9kcal
const KCAL_PER_G = { protein: 4, fat: 9, carbs: 4 }

// 国の目安（日本人の食事摂取基準）のカロリーに占める割合。範囲のおおよそ真ん中を使う
// たんぱく質 13〜20%、脂質 20〜30%、炭水化物 50〜65%
export const NATIONAL_RATIO = { protein: 0.15, fat: 0.25, carbs: 0.6 }

// 2つの日付（'2026-10-26'）の間の日数
export function daysBetween(from, to) {
  const toTime = (d) => {
    const [y, m, day] = d.split('-').map(Number)
    return Date.UTC(y, m - 1, day)
  }
  return Math.round((toTime(to) - toTime(from)) / 86400000)
}

// 目標から1日の目標摂取カロリーを出す
// 戻り値：{ intake, deficit, weeklyKg, weeklyPercent }
export function intakePlan({ dailyEnergy, loseKg, days, weightKg }) {
  const deficit = loseKg > 0 ? (loseKg * KCAL_PER_KG_FAT) / days : 0
  const weeklyKg = loseKg > 0 ? (loseKg / days) * 7 : 0
  return { intake: dailyEnergy - deficit, deficit, weeklyKg, weeklyPercent: (weeklyKg / weightKg) * 100 }
}

// PFC のグラム数を出す
// body：たんぱく質＝体重×g、脂質＝g、炭水化物＝残り
// national：国の目安の割合
export function pfcGrams({ intake, mode, weightKg, proteinPerKg, fatG }) {
  if (mode === 'national') {
    return {
      protein: (intake * NATIONAL_RATIO.protein) / KCAL_PER_G.protein,
      fat: (intake * NATIONAL_RATIO.fat) / KCAL_PER_G.fat,
      carbs: (intake * NATIONAL_RATIO.carbs) / KCAL_PER_G.carbs,
    }
  }
  const protein = weightKg * proteinPerKg
  const carbs = (intake - protein * KCAL_PER_G.protein - fatG * KCAL_PER_G.fat) / KCAL_PER_G.carbs
  return { protein, fat: fatG, carbs }
}

// 目標の入力から、目標摂取カロリーと PFC をまとめて出す。
// energy は energyFromProfile の戻り値。goal は goalStorage の形。date は今日の日付
// 戻り値：{ problem: 計算できない理由（なければ null）, loseKg, days, plan, pfc }
export function goalPlan(energy, goal, date) {
  const loseKg = goal.loseKg.trim() === '' ? 0 : Number(goal.loseKg)
  const days = goal.targetDate ? daysBetween(date, goal.targetDate) : null
  const proteinPerKg = Number(goal.proteinPerKg)
  const fatG = Number(goal.fatG)

  let problem = null
  if (energy.daily === null) problem = 'プロフィールを入れると計算できます'
  else if (!(loseKg >= 0 && loseKg < 100)) problem = '減らしたい体重を正しく入れてください'
  else if (loseKg > 0 && !goal.targetDate) problem = 'いつまでに減らしたいか（日付）を入れてください'
  else if (loseKg > 0 && days <= 0) problem = '目標の日付は明日以降にしてください'
  else if (goal.pfcMode === 'body' && !(proteinPerKg > 0 && fatG > 0)) problem = 'たんぱく質と脂質の量を入れてください'
  if (problem) return { problem, loseKg, days, plan: null, pfc: null }

  const plan = intakePlan({ dailyEnergy: energy.daily, loseKg, days, weightKg: energy.weightKg })
  const pfc = pfcGrams({ intake: plan.intake, mode: goal.pfcMode, weightKg: energy.weightKg, proteinPerKg, fatG })
  return { problem, loseKg, days, plan, pfc }
}
