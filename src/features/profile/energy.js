// 基礎代謝と1日の消費カロリーの計算。

// 基礎代謝（kcal/日）：国立健康・栄養研究所の式（日本人のデータから作られた式）
// (0.0481×体重kg + 0.0234×身長cm − 0.0138×年齢 − 定数) × 1000 ÷ 4.186
// 定数は男性 0.4235、女性 0.9708
// 参考：https://allabout.co.jp/gm/gc/494426
export function basalMetabolism({ sex, weightKg, heightCm, age }) {
  const constant = sex === 'male' ? 0.4235 : 0.9708
  return ((0.0481 * weightKg + 0.0234 * heightCm - 0.0138 * age - constant) * 1000) / 4.186
}

// 身体活動レベル（日本人の食事摂取基準 2025年版。名前が「低い・ふつう・高い」になった）
// 参考：https://nakayamashoten.jp/support/books/74291_support.pdf （名前の変更）
//       https://bestcalendar.jp/tools/kiso-taisha （低い 1.50・ふつう 1.75 の例）
export const ACTIVITY_LEVELS = [
  { id: 'low', label: '低い', description: '一日の大部分を座って過ごす' },
  { id: 'normal', label: 'ふつう', description: '座っていることが多いが、通勤・家事・軽い運動などをする' },
  { id: 'high', label: '高い', description: '立ち仕事や移動が多い、または運動の習慣がある' },
]

// 年齢ごとの倍率（低い・ふつう・高い）。65歳以上の値は原典で未確認のため、使うときに確かめる
function activityFactor(activity, age) {
  const table = age >= 75 ? [1.4, 1.65, 1.65] : age >= 65 ? [1.45, 1.7, 1.95] : [1.5, 1.75, 2.0]
  return table[ACTIVITY_LEVELS.findIndex((l) => l.id === activity)]
}

// 1日の消費カロリー（kcal/日）＝ 基礎代謝 × 身体活動レベル
export function dailyEnergy(input) {
  return basalMetabolism(input) * activityFactor(input.activity, input.age)
}

// 生年月日から、ある日付の時点の年齢を出す
export function ageOn(birthDate, date) {
  const [by, bm, bd] = birthDate.split('-').map(Number)
  const [y, m, d] = date.split('-').map(Number)
  return y - by - (m < bm || (m === bm && d < bd) ? 1 : 0)
}
