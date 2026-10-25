// スマホのブラウザの中（localStorage）に記録を保存・読み込みする共通の処理。
// 各機能の 〜Storage.js から使う。

export function loadList(key) {
  try {
    const text = localStorage.getItem(key)
    const list = text ? JSON.parse(text) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export function saveList(key, list) {
  localStorage.setItem(key, JSON.stringify(list))
}

// 今日の日付を '2026-10-25' の形で返す（スマホの時計の日付）
export function today() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// '2026-10-25' を '2026年10月25日（日）' の形にする
export function formatDate(date) {
  const [y, m, d] = date.split('-').map(Number)
  const week = '日月火水木金土'[new Date(y, m - 1, d).getDay()]
  return `${y}年${m}月${d}日（${week}）`
}
