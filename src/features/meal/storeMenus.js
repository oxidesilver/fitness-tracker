// お店のメニュー（マイメニュー）。お店の栄養成分の数字は、各お店の利用規約で転載が禁じられていることが多いので、
// アプリには入れず、使う人が公式ページを見て自分のスマホの中にだけ登録する（私的使用）。
import { loadList, saveList } from '../../storage.js'

// 最初から並べるお店。url は公式の栄養成分のページ（確かめられたもの）。ないお店は検索のページを開く。
// tip はスクショの撮り方のこつ（マクドナルドの一覧の表は横に長く、1枚に収まらないため）
export const STORES = [
  {
    id: 'mcdonalds',
    name: 'マクドナルド',
    url: 'https://www.mcdonalds.co.jp/quality/allergy_Nutrition/nutrient/',
    tip: '一覧の表は横に長いので、表のメニューの名前をタップしてください。そのメニューだけのページが開くので、下のほうの「栄養情報」（エネルギー〜炭水化物）を1枚に撮ると読み取れます。',
  },
  { id: 'sukiya', name: 'すき家', url: 'https://www.sukiya.jp/menu/' },
  { id: 'yoshinoya', name: '吉野家' },
  { id: 'aw', name: 'A&W' },
  { id: 'jef', name: 'ジェフ' },
  { id: 'mos', name: 'モスバーガー' },
  { id: 'kfc', name: 'ケンタッキー' },
  { id: 'hottomotto', name: 'ほっともっと' },
  { id: 'cocoichi', name: 'CoCo壱番屋' },
]

// 公式の栄養成分を見るページ。分からないお店は「お店の名前 栄養成分」で検索する
export function nutritionUrl(store) {
  return store.url ?? `https://www.google.com/search?q=${encodeURIComponent(`${store.name} 栄養成分`)}`
}

// 登録したメニュー：[{ store: 'すき家', name: '牛丼 並盛', kcal, protein, fat, carbs }]（お店は名前で持つ。自分で足したお店も同じ形）
const KEY = 'fitness-tracker.storeMenus'

export function loadStoreMenus() {
  return loadList(KEY)
}

// 同じお店・同じ名前は上書きする
export function addStoreMenu(menu) {
  const list = [...loadStoreMenus().filter((m) => !(m.store === menu.store && m.name === menu.name)), menu]
  saveList(KEY, list)
  return list
}

export function removeStoreMenu(menu) {
  const list = loadStoreMenus().filter((m) => !(m.store === menu.store && m.name === menu.name))
  saveList(KEY, list)
  return list
}

// 並べるお店：最初からのお店＋自分で足したお店（登録したメニューにある名前）
export function storeList(menus, extra = []) {
  const names = new Set(STORES.map((s) => s.name))
  const custom = [...new Set([...menus.map((m) => m.store), ...extra])].filter((n) => !names.has(n)).map((name) => ({ id: name, name }))
  return [...STORES, ...custom]
}
