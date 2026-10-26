// グラフで使う日付の計算（日付はいつも '2026-10-26' の形）

export function addDays(date, n) {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}

// その日がふくまれる週の月曜日
export function weekStart(date) {
  const [y, m, d] = date.split('-').map(Number)
  const back = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7
  return addDays(date, -back)
}

// '2026-10-05' → '10/5'
export function short(date) {
  const [, m, d] = date.split('-').map(Number)
  return `${m}/${d}`
}

// from から to までの週の月曜日の一覧
export function weeksBetween(from, to) {
  const weeks = []
  for (let w = weekStart(from); w <= to; w = addDays(w, 7)) weeks.push(w)
  return weeks
}
