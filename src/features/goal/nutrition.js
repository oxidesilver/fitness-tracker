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
// exerciseDaily は運動の計画で1日あたりに使うカロリー。運動した分だけ食べてよい量が増える
// （食べる量 −（消費カロリー＋運動）＝ −減らす量 になるようにする）
export function intakePlan({ dailyEnergy, loseKg, days, weightKg, exerciseDaily = 0 }) {
  const deficit = loseKg > 0 ? (loseKg * KCAL_PER_KG_FAT) / days : 0
  const weeklyKg = loseKg > 0 ? (loseKg / days) * 7 : 0
  return { intake: dailyEnergy - deficit + exerciseDaily, deficit, weeklyKg, weeklyPercent: (weeklyKg / weightKg) * 100 }
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

// 目標体重（kg）。「減らしたい体重」を入れたときの体重から決める（なければ今の体重を使う）。目標がなければ null
export function targetWeight(goal, currentWeightKg) {
  const loseKg = Number(goal.loseKg)
  if (!(loseKg > 0)) return null
  const startKg = Number(goal.startWeightKg) > 0 ? Number(goal.startWeightKg) : currentWeightKg
  return startKg ? startKg - loseKg : null
}

// 体重を減らすペースのおすすめ
// 体づくり向け：1週間に体重の0.5〜1%（筋肉を残しやすい。真ん中の0.75%を使う）
//   参考：https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4033492/
// ゆっくり（国・自治体の目安）：1か月に約1kg
//   参考：https://www.pref.kanagawa.jp/docs/mv4/kenken/contents13.html
const BODY_PACE_PERCENT = 0.75
const GENTLE_KG_PER_MONTH = 1
// BMI 18.5 未満は低体重とされるので、それより下になるおすすめは出さない
//   参考：https://www.ajinomoto.co.jp/company/jp/rd/miraikondate/column/article_052/
const LOW_BMI = 18.5

const floorHalf = (n) => Math.floor(n * 2) / 2

// 目標の日までに、それぞれのペースで減らせる体重（kg、0.5きざみ）
// 戻り値：{ body, gentle, limited: BMI 18.5 で少なくしたか }。計算できなければ null
export function suggestLoss({ currentKg, heightCm, days }) {
  if (!(currentKg > 0 && days > 0)) return null
  const weeks = days / 7
  let body = currentKg * (BODY_PACE_PERCENT / 100) * weeks
  let gentle = (GENTLE_KG_PER_MONTH * days) / 30
  let limited = false
  if (heightCm > 0) {
    const maxLoss = currentKg - LOW_BMI * (heightCm / 100) ** 2
    if (body > maxLoss || gentle > maxLoss) limited = true
    body = Math.min(body, Math.max(0, maxLoss))
    gentle = Math.min(gentle, Math.max(0, maxLoss))
  }
  return { body: floorHalf(body), gentle: floorHalf(gentle), limited }
}

// 体づくり向けの PFC の自動の値
// たんぱく質：運動する人は体重1kgあたり1.4〜2.0g。減量中は筋肉を残すため多めの2.0g、体重を保つときは1.6g
//   参考：https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5477153/ ・ https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4033492/
export function autoProteinPerKg(deficit) {
  return deficit > 0 ? 2.0 : 1.6
}

// 脂質：体づくりではカロリーの15〜30%、国の目安では20〜30%。両方に入る20%を使う（5gきざみ）
export function autoFatG(intake) {
  return Math.round((intake * 0.2) / 9 / 5) * 5
}

// 目標の入力から、目標摂取カロリーと PFC をまとめて出す。
// energy は energyFromProfile の戻り値。goal は goalStorage の形。date は今日の日付
// exerciseDaily は運動の計画で1日あたりに使うカロリー（なければ 0）
// 1日に減らすカロリーは「目標体重まであと何kg」から計算する（減った分だけ少なくなる）
// 体づくり向けのたんぱく質・脂質は、空なら自動の値を使う
// 戻り値：{ problem, loseKg, targetKg, remainingKg, days, plan, pfc, proteinPerKg, fatG }
//   problem は計算できない理由（なければ null）。proteinPerKg・fatG は実際に使った値
export function goalPlan(energy, goal, date, exerciseDaily = 0) {
  const loseKg = goal.loseKg.trim() === '' ? 0 : Number(goal.loseKg)
  const days = goal.targetDate ? daysBetween(date, goal.targetDate) : null
  const manualProtein = goal.proteinPerKg.trim() === '' ? null : Number(goal.proteinPerKg)
  const manualFat = goal.fatG.trim() === '' ? null : Number(goal.fatG)

  let problem = null
  if (energy.daily === null) problem = 'プロフィールを入れると計算できます'
  else if (!(loseKg >= 0 && loseKg < 100)) problem = '減らしたい体重を正しく入れてください'
  else if (loseKg > 0 && !goal.targetDate) problem = 'いつまでに減らしたいか（日付）を入れてください'
  else if (loseKg > 0 && days <= 0) problem = '目標の日付は明日以降にしてください'
  else if (goal.pfcMode === 'body' && ((manualProtein !== null && !(manualProtein > 0)) || (manualFat !== null && !(manualFat > 0)))) {
    problem = 'たんぱく質と脂質の量を正しく入れてください'
  }
  if (problem) return { problem, loseKg, targetKg: null, remainingKg: 0, days, plan: null, pfc: null, proteinPerKg: null, fatG: null }

  const targetKg = targetWeight(goal, energy.weightKg)
  const remainingKg = targetKg === null ? 0 : Math.max(0, energy.weightKg - targetKg)
  const plan = intakePlan({ dailyEnergy: energy.daily, loseKg: remainingKg, days, weightKg: energy.weightKg, exerciseDaily })
  const proteinPerKg = manualProtein ?? autoProteinPerKg(plan.deficit)
  const fatG = manualFat ?? autoFatG(plan.intake)
  const pfc = pfcGrams({ intake: plan.intake, mode: goal.pfcMode, weightKg: energy.weightKg, proteinPerKg, fatG })
  return { problem, loseKg, targetKg, remainingKg, days, plan, pfc, proteinPerKg, fatG }
}
