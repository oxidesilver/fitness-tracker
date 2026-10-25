// 消費カロリーの目安を計算する。
// 消費カロリー（kcal）≒ METs × 体重（kg）× 時間（時間）× 1.05
// 参考：https://www.tyojyu.or.jp/net/kenkou-tyoju/undou-kiso/undou-energy.html

// 筋トレ：「複数の種目を8〜15回、さまざまな重さで行う」の値（3.5 METs）
// 参考：https://pacompendium.com/conditioning-exercise （コード 02054）
const STRENGTH_METS = 3.5
// 筋トレは時間を記録していないので、1セット＝休けい込みで約3分とみなす
const MINUTES_PER_SET = 3

function kcal(mets, bodyKg, minutes) {
  return mets * bodyKg * (minutes / 60) * 1.05
}

// ランニング・ウォーキングの METs を速度と傾斜から求める（ACSM の計算式）
// 参考：https://pmc.ncbi.nlm.nih.gov/articles/PMC3743617/
// 時速8km未満は歩きの式、8km以上は走りの式を使う
function runMets(speedKmh, inclinePct) {
  const speed = (speedKmh * 1000) / 60 // 分速（m）
  const grade = inclinePct / 100
  const vo2 = speedKmh < 8 ? 0.1 * speed + 1.8 * speed * grade + 3.5 : 0.2 * speed + 0.9 * speed * grade + 3.5
  return vo2 / 3.5
}

// 1件の記録の消費カロリー（体重が分からなければ null）
export function workoutKcal(record, bodyKg) {
  if (!bodyKg) return null
  if (record.run) {
    const { speedKmh, inclinePct, minutes } = record.run
    return kcal(runMets(speedKmh, inclinePct), bodyKg, minutes)
  }
  return kcal(STRENGTH_METS, bodyKg, record.sets.length * MINUTES_PER_SET)
}

// その日の体重：その日以前でいちばん新しい記録。なければいちばん古い記録。
export function bodyWeightOn(date, weights) {
  if (weights.length === 0) return null
  const before = weights.filter((w) => w.date <= date)
  if (before.length > 0) return before.reduce((a, b) => (b.date > a.date ? b : a)).weightKg
  return weights.reduce((a, b) => (b.date < a.date ? b : a)).weightKg
}
