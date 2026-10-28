// 1日の食事の点数（100点満点）。項目ごとに根拠のある範囲で採点する。
// カロリー 40点・たんぱく質 30点・脂質 20点・炭水化物 10点。
// 「良い方向」には減点しない（例：体づくりでたんぱく質が目標より多い）、「悪い方向」は減点する（例：脂質がカロリーの30%を超える）。

export const SOURCES = {
  kijun: {
    label: '日本人の食事摂取基準（2025年版）エネルギー産生栄養素バランス（厚生労働省）',
    url: 'https://www.mhlw.go.jp/content/10904750/001316465.pdf',
  },
  morton: {
    label: 'Morton ほか 2018（たんぱく質は体重×1.6gで筋肉の増え方が頭打ち）',
    url: 'https://pubmed.ncbi.nlm.nih.gov/28698222/',
  },
  issn: {
    label: '国際スポーツ栄養学会 2017（運動する人のたんぱく質）',
    url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5477153/',
  },
  helms: {
    label: 'Helms ほか 2014（減らしすぎると筋肉が落ちやすい）',
    url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4033492/',
  },
}

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n))
const pct = (grams, kcalPerGram, totalKcal) => (grams * kcalPerGram * 100) / totalKcal

// 食事摂取基準のたんぱく質の下限（%エネルギー）。18〜49歳 13、50〜64歳 14、65歳以上 15
function proteinLowerPct(age) {
  if (age >= 65) return 15
  if (age >= 50) return 14
  return 13
}

// カロリー（40点）：目標の ±10% なら満点。外れるほど減り、±40% で0点。
// ±10% は記録の誤差を見込んだアプリの決め。基礎代謝より少ないときは10点まで
function energyScore(total, target) {
  const diff = total.kcal / target.kcal - 1
  const off = Math.abs(diff)
  let points = off <= 0.1 ? 40 : Math.round(40 * clamp((0.4 - off) / 0.3, 0, 1))
  let note = off <= 0.1 ? '目標の±10%以内' : `目標より${Math.round(off * 100)}%${diff > 0 ? '多い' : '少ない'}`
  const sources = []
  if (target.basal && total.kcal < target.basal) {
    points = Math.min(points, 10)
    note += `。基礎代謝（約${Math.round(target.basal)}kcal）より少ないので、筋肉が落ちやすい`
    sources.push('helms')
  }
  return { id: 'kcal', label: 'カロリー', points, max: 40, note, rule: '目標の±10%で満点（±10%は記録の誤差を見込んだアプリの決め）', sources }
}

// たんぱく質（30点）
// 体づくり：目標以上で満点（多くても減点しない）。体重×1.6g以上あれば25点は残す（Morton 2018）
// 国の目安：カロリーの13〜20%（年齢で下限が変わる）
function proteinScore(total, target) {
  if (target.mode === 'body') {
    const perKg = total.protein / target.weightKg
    let points = Math.round(30 * clamp(total.protein / target.protein, 0, 1))
    if (perKg >= 1.6) points = Math.max(points, 25)
    const note =
      total.protein >= target.protein
        ? `目標（${Math.round(target.protein)}g）以上・体重×${perKg.toFixed(1)}g`
        : `体重×${perKg.toFixed(1)}g（目標 ${Math.round(target.protein)}g まであと${Math.round(target.protein - total.protein)}g）`
    return { id: 'protein', label: 'たんぱく質', points, max: 30, note, rule: '目標以上で満点・多くても減点しない。体重×1.6g以上なら25点以上', sources: ['morton', 'issn'] }
  }
  const p = pct(total.protein, 4, total.kcal)
  const lower = proteinLowerPct(target.age)
  let points = 30
  if (p < lower) points = Math.round((30 * p) / lower)
  else if (p > 20) points = Math.max(20, 30 - Math.round(p - 20))
  return {
    id: 'protein',
    label: 'たんぱく質',
    points,
    max: 30,
    note: `カロリーの${Math.round(p)}%（目安 ${lower}〜20%）`,
    rule: `カロリーの${lower}〜20%で満点`,
    sources: ['kijun'],
  }
}

// 脂質（20点）：カロリーの20〜30%で満点。外れると1%ごとに2点減る（どちらの決め方でも同じ）
function fatScore(total) {
  const p = pct(total.fat, 9, total.kcal)
  const out = p > 30 ? p - 30 : p < 20 ? 20 - p : 0
  const points = Math.max(0, 20 - Math.round(out * 2))
  const note = `カロリーの${Math.round(p)}%（目安 20〜30%）${p > 30 ? '・脂質が多い' : p < 20 ? '・脂質が少ない' : ''}`
  return { id: 'fat', label: '脂質', points, max: 20, note, rule: 'カロリーの20〜30%で満点。外れると1%ごとに−2点', sources: ['kijun'] }
}

// 炭水化物（10点）
// 国の目安：カロリーの50〜65%。外れると1%ごとに1点減る
// 体づくり：目標（たんぱく質と脂質の残り）の ±20% で満点（アプリの決め）。外れるほど減り、±60%で0点
function carbsScore(total, target) {
  if (target.mode === 'body') {
    const diff = target.carbs > 0 ? total.carbs / target.carbs - 1 : 0
    const off = Math.abs(diff)
    const points = off <= 0.2 ? 10 : Math.round(10 * clamp((0.6 - off) / 0.4, 0, 1))
    const note = off <= 0.2 ? `目標（${Math.round(target.carbs)}g）に近い` : `目標より${Math.round(off * 100)}%${diff > 0 ? '多い' : '少ない'}`
    return { id: 'carbs', label: '炭水化物', points, max: 10, note, rule: '目標の±20%で満点（±20%はアプリの決め）', sources: [] }
  }
  const p = pct(total.carbs, 4, total.kcal)
  const out = p > 65 ? p - 65 : p < 50 ? 50 - p : 0
  const points = Math.max(0, 10 - Math.round(out))
  return { id: 'carbs', label: '炭水化物', points, max: 10, note: `カロリーの${Math.round(p)}%（目安 50〜65%）`, rule: 'カロリーの50〜65%で満点', sources: ['kijun'] }
}

// その日の点数：{ score, items: [{ id, label, points, max, note, rule, sources }] }。目標がないか、食事がなければ null
export function mealScore(total, target) {
  if (!target || !(target.kcal > 0) || !(total.kcal > 0)) return null
  const items = [energyScore(total, target), proteinScore(total, target), fatScore(total), carbsScore(total, target)]
  return { score: items.reduce((a, i) => a + i.points, 0), items }
}

// 点数のひとこと
export function scoreLabel(score) {
  if (score >= 90) return 'とても良い'
  if (score >= 75) return '良い'
  if (score >= 60) return 'もう少し'
  return '見直しどころあり'
}
