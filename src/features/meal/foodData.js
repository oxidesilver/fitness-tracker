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

// ふだんの呼び方 → 成分表での呼び方（空白で区切った言葉が全部入っている食品が出る）
// 成分表の名前はふだんの呼び方と違うことが多いので、よく食べるものを足していく
const SYNONYMS = {
  // ご飯・パン・めん
  ご飯: '水稲めし 精白米 うるち米',
  ごはん: '水稲めし 精白米 うるち米',
  白米: '水稲めし 精白米 うるち米',
  ライス: '水稲めし 精白米 うるち米',
  玄米: '水稲めし 玄米',
  もち麦: 'おおむぎ',
  食パン: '角形食パン',
  トースト: '角形食パン 焼き',
  パスタ: 'スパゲッティ',
  ラーメン: '中華めん',
  中華そば: '中華めん',
  カップラーメン: 'カップめん',
  カップ麺: 'カップめん',
  インスタントラーメン: '即席中華めん',
  焼きそば: '蒸し中華めん',
  // 肉
  鶏肉: 'にわとり',
  とりにく: 'にわとり',
  鶏むね: 'にわとり 若どり むね',
  鶏むね肉: 'にわとり 若どり むね',
  むね肉: 'にわとり 若どり むね',
  鶏もも: 'にわとり 若どり もも',
  鶏もも肉: 'にわとり 若どり もも',
  もも肉: 'もも',
  ささみ: 'にわとり ささみ',
  サラダチキン: 'にわとり 若どり むね 皮なし',
  手羽: 'にわとり 手羽',
  唐揚げ: 'から揚げ',
  からあげ: 'から揚げ',
  鶏の唐揚げ: 'とりから揚げ',
  焼き鳥: 'にわとり',
  豚肉: 'ぶた',
  ぶたにく: 'ぶた',
  豚バラ: 'ぶた ばら',
  豚ロース: 'ぶた ロース',
  豚こま: 'ぶた かた',
  牛肉: 'うし',
  ぎゅうにく: 'うし',
  ステーキ: 'うし サーロイン',
  焼肉: 'うし 焼き',
  ひき肉: 'ひき肉',
  ミンチ: 'ひき肉',
  合い挽き: 'ひき肉',
  スパム: 'ランチョンミート',
  ポーク: 'ランチョンミート',
  ウインナー: 'ウインナーソーセージ',
  ソーセージ: 'ソーセージ',
  // 卵・大豆・乳
  卵: '鶏卵',
  たまご: '鶏卵',
  玉子: '鶏卵',
  ゆで卵: '鶏卵 全卵 ゆで',
  ゆでたまご: '鶏卵 全卵 ゆで',
  生卵: '鶏卵 全卵 生',
  目玉焼き: '目玉焼き',
  卵焼き: 'たまご焼',
  玉子焼き: 'たまご焼',
  納豆: '納豆',
  厚揚げ: '生揚げ',
  牛乳: '普通牛乳',
  ミルク: '普通牛乳',
  // 魚
  鮭: 'さけ',
  サーモン: 'さけ',
  ツナ: 'まぐろ 缶詰',
  シーチキン: 'まぐろ 缶詰',
  ツナ缶: 'まぐろ 缶詰',
  サバ缶: 'さば 缶詰',
  明太子: 'めんたいこ',
  ちくわ: '竹輪',
  // 料理（成分表に入っている料理）
  牛丼: '牛飯の具',
  豚汁: 'とん汁',
  餃子: 'ぎょうざ',
  ギョーザ: 'ぎょうざ',
  焼売: 'しゅうまい',
  シュウマイ: 'しゅうまい',
  春巻: '春巻き',
  カレーライス: 'カレー',
  // 野菜など
  ゴーヤ: 'にがうり',
  ゴーヤー: 'にがうり',
  枝豆: 'えだまめ',
  ホタテ: 'ほたて',
  // 飲み物
  日本酒: '清酒',
  焼酎: 'しょうちゅう',
  泡盛: '泡盛',
}

const SYNONYM_KEYS = new Map(Object.entries(SYNONYMS).map(([k, v]) => [normalize(k), v]))

// 調味料・香辛料は、料理や食材より後ろに並べる（「カレー」で カレー粉 より チキンカレー を先に）
const isSeasoning = (f) => /^＜(調味料類|香辛料類)＞/.test(f.name)

// 検索：空白で区切った言葉が全部入っている食品を、名前が短い順に返す
export function searchFoods(foods, query, limit = 30) {
  const raw = query.trim()
  if (!raw) return []
  const words = raw
    .split(/\s+/)
    .map(normalize)
    .flatMap((w) => (SYNONYM_KEYS.get(w) ?? w).split(' '))
    .map(normalize)
  return foods
    .filter((f) => words.every((w) => f.key.includes(w)))
    .sort((a, b) => isSeasoning(a) - isSeasoning(b) || a.name.length - b.name.length)
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
