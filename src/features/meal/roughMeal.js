// 「ざっくり入力」：何を食べたか細かく分からないときに、だいたいの数字で記録する。
// 特定の食品ではなく、その人の目標（1日の目標 ÷ 3食）を基準にする（本人の希望。人によって量が違うため）。
// 「多め」の種類は、3食ずっとこれだと「1日の消費カロリーより1割多い」＝続けると太る量にする（1割はアプリの決め）。
// 体重は、食べる量が使う量より多いと増える（体脂肪1kg ≒ 7,000kcal：https://kennet.mhlw.go.jp/information/information/exercise/s-00-012 ）

const OVER = 1.1 // 3食続けると消費カロリーの1.1倍
const SNACK_SHARE = 0.1 // 間食のふつうの量：1日の目標の1割（アプリの決め）

export const ROUGH_TYPES = [
  { id: 'normal', label: 'ふつう', note: '目安どおりくらい' },
  { id: 'fatty', label: '脂質多め', note: '揚げ物・こってり' },
  { id: 'carby', label: '炭水化物多め', note: '大盛り・麺・甘いもの' },
  { id: 'big', label: '全部多め', note: '食べすぎた' },
  { id: 'protein', label: '高たんぱく', note: '肉・魚・卵が多め' },
  { id: 'light', label: '少なめ', note: '軽く食べた' },
]

const r1 = (n) => Math.round(n * 10) / 10

// その食事のざっくりの数字：{ kcal, protein, fat, carbs }。target は loadDailyTarget の戻り値（なければ null）
export function roughValues(typeId, time, target) {
  if (!target) return null
  const share = time === 'snack' ? SNACK_SHARE : 1 / 3
  const base = { kcal: target.kcal * share, protein: target.protein * share, fat: target.fat * share, carbs: target.carbs * share }
  // 続けると太る量（その食事の分）。消費カロリーが分からなければ目標の1.2倍
  const overKcal = (target.expenditure ?? target.kcal * 1.2) * share * OVER
  const extra = Math.max(0, overKcal - base.kcal)
  let v
  switch (typeId) {
    case 'fatty':
      v = { ...base, fat: base.fat + extra / 9 }
      break
    case 'carby':
      v = { ...base, carbs: base.carbs + extra / 4 }
      break
    case 'big': {
      const k = overKcal / base.kcal
      v = { protein: base.protein * k, fat: base.fat * k, carbs: base.carbs * k }
      break
    }
    case 'protein': {
      // カロリーは目安どおりで、たんぱく質を1.5倍にし、その分の炭水化物を減らす
      const addP = base.protein * 0.5
      v = { ...base, protein: base.protein + addP, carbs: Math.max(0, base.carbs - addP) }
      break
    }
    case 'light':
      v = { protein: base.protein / 2, fat: base.fat / 2, carbs: base.carbs / 2 }
      break
    default:
      v = base
  }
  const protein = r1(v.protein)
  const fat = r1(v.fat)
  const carbs = r1(v.carbs)
  return { kcal: Math.round(protein * 4 + fat * 9 + carbs * 4), protein, fat, carbs }
}

// 「食べていない」の記録
export const SKIPPED = { name: '食べていない', kcal: 0, protein: 0, fat: 0, carbs: 0, skipped: true }
