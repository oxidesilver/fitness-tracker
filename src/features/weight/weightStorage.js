// 体重の記録を保存・読み込みする。
import { loadList, saveList } from '../../storage.js'

const STORAGE_KEY = 'fitness-tracker.weights'

// 記録の形：{ date: '2026-10-25', weightKg: 65.2 }
export function loadWeights() {
  return loadList(STORAGE_KEY)
}

// 同じ日付の記録がすでにあれば上書きする（1日1件）。新しい日付が上に来るよう並べる。
export function addWeight(record) {
  const others = loadWeights().filter((r) => r.date !== record.date)
  const records = [...others, record].sort((a, b) => b.date.localeCompare(a.date))
  saveList(STORAGE_KEY, records)
  return records
}

export function deleteWeight(date) {
  const records = loadWeights().filter((r) => r.date !== date)
  saveList(STORAGE_KEY, records)
  return records
}
