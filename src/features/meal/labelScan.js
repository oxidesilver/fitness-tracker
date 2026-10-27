// 栄養成分表示の写真を読み取った文字から、カロリー・たんぱく質・脂質・炭水化物を取り出す。
// 読み取りの文字は「た ん ぱく 質 7.19」のように、すき間が入ったり g が 9 に化けたりするので、それを直してから読む

const LABELS = {
  kcal: ['エネルギー', '熱量'],
  protein: ['たんぱく質', 'タンパク質', '蛋白質', 'たん白質'],
  fat: ['脂質'],
  carbs: ['炭水化物'],
  sugar: ['糖質'],
  fiber: ['食物繊維'],
}

// 見出しのすぐ後ろの数字（文字のまま）と、その後ろの1文字
function valueAfter(text, words) {
  for (const w of words) {
    const m = text.match(new RegExp(`${w}[:：]?(\\d+(?:\\.\\d+)?)(.?)`))
    if (m) return { raw: m[1], next: m[2] }
  }
  return null
}

// g の数字を直す：小数は1けたまで（'7.19' は '7.1g' の g が 9 に化けたもの）、
// 小数でなく後ろに g がなく 9 で終わるときも 9 を外す（'159' → 15）
function grams(v) {
  if (!v) return null
  let s = v.raw
  if (s.includes('.')) s = s.replace(/(\.\d)\d*$/, '$1')
  else if (v.next !== 'g' && s.length >= 2 && s.endsWith('9')) s = s.slice(0, -1)
  return Number(s)
}

// { kcal, protein, fat, carbs, per }（分からない値は null。per は '1個当たり' など）を返す。カロリーが読めなければ null
export function parseLabel(text) {
  const t = text.normalize('NFKC').replace(/\s+/g, '').replace(/[ー－‐-](?=糖質|食物繊維)/g, '')
  const kcalV = valueAfter(t, LABELS.kcal)
  if (!kcalV) return null
  let carbs = grams(valueAfter(t, LABELS.carbs))
  if (carbs === null) {
    const sugar = grams(valueAfter(t, LABELS.sugar))
    const fiber = grams(valueAfter(t, LABELS.fiber))
    if (sugar !== null) carbs = Math.round((sugar + (fiber ?? 0)) * 10) / 10
  }
  const per = t.match(/[(（]?([^()（）]{1,15}当[たり]*)[)）]?/)
  return {
    kcal: Math.round(Number(kcalV.raw)),
    protein: grams(valueAfter(t, LABELS.protein)),
    fat: grams(valueAfter(t, LABELS.fat)),
    carbs,
    per: per ? per[1].replace(/^栄養成分表示/, '') : null,
  }
}
