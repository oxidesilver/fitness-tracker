// ランニングアプリ（Nike Run Club など）の結果画面の文字から、距離・時間・上りの高低差を読み取る。
// 文字は iPhone の「テキスト認識表示」でスクリーンショットからコピーしてもらう。
// 例：'6.56\nKM\n8\'40"\n平均ペース\n56:49\n時間\n419\n消費カロリー\n116 m\n高低差\n（上り）'

// 時間の形（'56:49'・'1:05:12'）
const TIME = /(?:(\d+):)?(\d{1,2}):(\d{2})(?!\d)/g

// { distance, minutes, seconds, elevation, kcal }（文字のまま）を返す。距離か時間が見つからなければ null
export function parseRunResult(text) {
  const t = text.normalize('NFKC')

  const dist = t.match(/(\d+(?:\.\d+)?)\s*km/i)

  // 画面には時刻（'20:28'・'今日 - 18:36'）も写るので、「時間」の文字のすぐ前（なければすぐ後ろ）を使う
  const times = [...t.matchAll(TIME)].map((m) => ({ start: m.index, end: m.index + m[0].length, m }))
  const label = t.indexOf('時間')
  let time = null
  if (label >= 0) {
    time = times.filter((x) => x.end <= label).at(-1) ?? times.find((x) => x.start >= label) ?? null
  }
  time ??= times.at(-1) ?? null

  // 上りの高低差：'116 m'（'km' は除く）
  const elev = t.match(/(\d+(?:\.\d+)?)[ \t]*m(?![a-z])/i)

  // 消費カロリー：'419\n消費カロリー'・'419 kcal'
  const kcal = t.match(/(\d+(?:\.\d+)?)\s*(?:kcal|(?:消費)?カロリー)/i)

  if (!dist || !time) return null
  const [, h, m, s] = time.m
  return {
    distance: dist[1],
    minutes: String(Number(h ?? 0) * 60 + Number(m)),
    seconds: String(Number(s)),
    elevation: elev ? elev[1] : '',
    kcal: kcal ? kcal[1] : '',
  }
}

// スクリーンショットを読み取った文字から、距離・時間・消費カロリー・上りの高低差を取り出す。
// 英語の文字として読むので、日本語の「時間」などは読めない。そのため画面の並びで決める：
// いちばん上の大きな数字＝距離、その下の「ペース 時間 消費カロリー」の行、'116 m'＝上りの高低差
export function parseRunScreenshot(text) {
  const withLabels = parseRunResult(text)
  if (withLabels?.kcal) return withLabels

  const lines = text
    .normalize('NFKC')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  const distIndex = lines.findIndex((l) => /^\d{1,3}[.,]\d{1,2}(?!\d)/.test(l))
  if (distIndex < 0) return withLabels
  const distance = lines[distIndex].match(/^\d{1,3}[.,]\d{1,2}/)[0].replace(',', '.')

  // 距離より下で、時間の形（56:49）がある最初の行
  const rest = lines.slice(distIndex + 1)
  const statsIndex = rest.findIndex((l) => /\d:\d{2}/.test(l))
  if (statsIndex < 0) return withLabels
  const stats = rest[statsIndex]
  const time = [...stats.matchAll(TIME)][0]
  const [, h, m, s] = time
  // 時間のすぐ後ろの数字が消費カロリー
  const kcal = stats.slice(time.index + time[0].length).match(/\d+/)
  const elev = rest.slice(statsIndex + 1).join('\n').match(/(\d+(?:\.\d+)?)[ \t]*m(?![a-z])/i)

  return {
    distance,
    minutes: String(Number(h ?? 0) * 60 + Number(m)),
    seconds: String(Number(s)),
    elevation: elev ? elev[1] : '',
    kcal: kcal ? kcal[0] : '',
  }
}
