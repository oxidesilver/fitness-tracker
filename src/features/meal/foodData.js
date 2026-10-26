// 日本食品標準成分表のデータ（public/foods.json）の読み込みと検索。
// データは scripts/convert_foods.py で作る。

export const FOOD_SOURCE = '日本食品標準成分表（八訂）増補2023年から引用'
export const FOOD_SOURCE_URL = 'https://www.mext.go.jp/a_menu/syokuhinseibun/index.htm'

let cache = null

// 食品の一覧を読み込む（最初に使うときだけ読み込み、あとは覚えておく）
// 戻り値：[{ code, name, kcal, protein, fat, carbs }]（可食部100gあたり）
export async function loadFoods() {
  if (!cache) {
    cache = fetch(`${import.meta.env.BASE_URL}foods.json`)
      .then((res) => {
        if (!res.ok) throw new Error('食品データを読み込めませんでした')
        return res.json()
      })
      .then((rows) => rows.map(([code, name, kcal, protein, fat, carbs]) => ({ code, name, kcal, protein, fat, carbs, key: normalize(name) })))
      .catch((e) => {
        cache = null
        throw e
      })
  }
  return cache
}

// カタカナをひらがなに、全角英数を半角にそろえて、検索しやすくする
function normalize(text) {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
}

// ふだんの呼び方 → 成分表での呼び方
const SYNONYMS = {
  ご飯: '水稲めし 精白米 うるち米',
  ごはん: '水稲めし 精白米 うるち米',
  白米: '水稲めし 精白米 うるち米',
  玄米: '水稲めし 玄米',
  卵: '鶏卵',
  たまご: '鶏卵',
  鶏肉: 'にわとり',
  とりにく: 'にわとり',
  鶏むね: 'にわとり 若どり むね',
  鶏もも: 'にわとり 若どり もも',
  ささみ: 'にわとり 若どり ささみ',
  豚肉: 'ぶた',
  ぶたにく: 'ぶた',
  牛肉: 'うし',
  ぎゅうにく: 'うし',
  鮭: 'さけ',
  牛乳: '普通牛乳',
  納豆: '糸引き納豆',
  食パン: '角形食パン 食パン',
}

// 検索：空白で区切った言葉が全部入っている食品を、名前が短い順に返す
export function searchFoods(foods, query, limit = 30) {
  const raw = query.trim()
  if (!raw) return []
  const words = raw
    .split(/\s+/)
    .flatMap((w) => (SYNONYMS[w] ?? w).split(' '))
    .map(normalize)
  return foods
    .filter((f) => words.every((w) => f.key.includes(w)))
    .sort((a, b) => a.name.length - b.name.length)
    .slice(0, limit)
}

// 画面に出す名前。分類（＜鳥肉類＞ など）を外す。料理（食品番号18〜）は「肉じゃが（和風料理）」の形にする
export function displayName(food) {
  if (food.code.startsWith('18')) {
    const [category, , ...rest] = food.name.split(' ')
    return `${rest.join(' ')}（${category}）`
  }
  return food.name.replace(/^＜[^＞]*＞\s*/, '')
}

// 料理（食品番号18〜）を「和風料理」「洋風料理」などのまとまりに分ける：[['和風料理', [食品, ...]], ...]
export function dishGroups(foods) {
  const groups = new Map()
  for (const f of foods.filter((x) => x.code.startsWith('18'))) {
    const category = f.name.split(' ')[0]
    if (!groups.has(category)) groups.set(category, [])
    groups.get(category).push(f)
  }
  return [...groups]
}

// 食品と量（g）から、その量のカロリーと栄養を出す（分からない値は null）
export function scaleFood(food, grams) {
  const scaled = (v) => (v === null ? null : Math.round((v * grams) / 10) / 10)
  return {
    code: food.code,
    name: displayName(food),
    grams,
    kcal: Math.round((food.kcal * grams) / 100),
    protein: scaled(food.protein),
    fat: scaled(food.fat),
    carbs: scaled(food.carbs),
  }
}
