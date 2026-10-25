// 体重の記録を、スマホのブラウザの中（localStorage）に保存・読み込みする。
// 保存のしかたを変えたくなったら、このファイルだけ直せばよい。

const STORAGE_KEY = 'fitness-tracker.weights'

// 記録の形：{ date: '2026-10-25', weightKg: 65.2 }
export function loadWeights() {
  try {
    const text = localStorage.getItem(STORAGE_KEY)
    const records = text ? JSON.parse(text) : []
    return Array.isArray(records) ? records : []
  } catch {
    return []
  }
}

function saveWeights(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

// 同じ日付の記録がすでにあれば上書きする（1日1件）。新しい日付が上に来るよう並べる。
export function addWeight(record) {
  const others = loadWeights().filter((r) => r.date !== record.date)
  const records = [...others, record].sort((a, b) => b.date.localeCompare(a.date))
  saveWeights(records)
  return records
}

export function deleteWeight(date) {
  const records = loadWeights().filter((r) => r.date !== date)
  saveWeights(records)
  return records
}
