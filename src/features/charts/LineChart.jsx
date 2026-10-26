import { useEffect, useRef, useState } from 'react'

// 日付ごとの数字を折れ線で描く部品（SVG）。体重以外のグラフでも使えるようにしてある。
// points：[{ date: '2026-10-26', value: 66.8 }]（日付の古い順）
// from・to：横軸の範囲（日付）。unit：単位。reference：{ value, label }（目標などの横線、なくてもよい）
// 指でなぞる（マウスを乗せる）と、いちばん近い日の値が出る。
const HEIGHT = 220
const PAD = { top: 20, right: 52, bottom: 28, left: 40 }
const DAY = 86400000

const toTime = (d) => {
  const [y, m, day] = d.split('-').map(Number)
  return Date.UTC(y, m - 1, day)
}
const shortDate = (d) => {
  const [, m, day] = d.split('-').map(Number)
  return `${m}/${day}`
}

// 目盛りの間を、きりのよい数（0.5・1・2・5・10…）にする
function niceStep(range, maxTicks) {
  const steps = [0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000]
  return steps.find((s) => range / s <= maxTicks) ?? steps[steps.length - 1]
}

export default function LineChart({ points, from, to, unit, reference, format = (v) => v.toFixed(1), label }) {
  const wrapRef = useRef(null)
  const [width, setWidth] = useState(340)
  const [active, setActive] = useState(null)

  // 画面の幅に合わせて描き直す
  useEffect(() => {
    const el = wrapRef.current
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(240, entry.contentRect.width)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const values = points.map((p) => p.value).concat(reference ? [reference.value] : [])
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  const step = niceStep(Math.max(rawMax - rawMin, 1), 4)
  const yMin = Math.floor((rawMin - step * 0.25) / step) * step
  const yMax = Math.ceil((rawMax + step * 0.25) / step) * step
  const ticks = []
  for (let v = yMin; v <= yMax + 1e-9; v += step) ticks.push(Math.round(v * 10) / 10)

  const t0 = toTime(from)
  const t1 = Math.max(toTime(to), t0 + DAY)
  const plotW = width - PAD.left - PAD.right
  const plotH = HEIGHT - PAD.top - PAD.bottom
  const x = (date) => PAD.left + ((toTime(date) - t0) / (t1 - t0)) * plotW
  const y = (v) => PAD.top + (1 - (v - yMin) / (yMax - yMin)) * plotH

  // 横軸の日付は4つまで
  const xTicks = [0, 1, 2, 3].map((i) => new Date(t0 + ((t1 - t0) * i) / 3).toISOString().slice(0, 10))

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.date).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')
  const last = points[points.length - 1]
  // 点が多いと線が点線のように見えるので、少ないときだけ全部の点を描く（最後の点はいつも描く）
  const showDots = points.length <= 12

  // 指やマウスの横の位置から、いちばん近い日の点を選ぶ
  function pick(clientX) {
    const rect = wrapRef.current.getBoundingClientRect()
    const px = clientX - rect.left
    let best = 0
    points.forEach((p, i) => {
      if (Math.abs(x(p.date) - px) < Math.abs(x(points[best].date) - px)) best = i
    })
    setActive(best)
  }

  function handleKey(e) {
    if (e.key === 'ArrowLeft') setActive((i) => Math.max(0, (i ?? points.length) - 1))
    if (e.key === 'ArrowRight') setActive((i) => Math.min(points.length - 1, (i ?? -1) + 1))
  }

  const a = active !== null ? points[active] : null

  return (
    <div className="line-chart" ref={wrapRef}>
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label={label}
        tabIndex={0}
        onPointerDown={(e) => pick(e.clientX)}
        onPointerMove={(e) => pick(e.clientX)}
        onPointerLeave={() => setActive(null)}
        onKeyDown={handleKey}
        onBlur={() => setActive(null)}
      >
        {ticks.map((v) => (
          <g key={v}>
            <line className="chart-grid" x1={PAD.left} x2={width - PAD.right} y1={y(v)} y2={y(v)} />
            <text className="chart-axis" x={PAD.left - 6} y={y(v)} textAnchor="end" dominantBaseline="middle">
              {Number.isInteger(v) ? v : v.toFixed(1)}
            </text>
          </g>
        ))}
        {xTicks.map((d, i) => (
          <text key={d + i} className="chart-axis" x={x(d)} y={HEIGHT - 8} textAnchor={i === 0 ? 'start' : i === 3 ? 'end' : 'middle'}>
            {shortDate(d)}
          </text>
        ))}

        {reference && (
          <g>
            <line className="chart-reference" x1={PAD.left} x2={width - PAD.right} y1={y(reference.value)} y2={y(reference.value)} />
            <text className="chart-reference-label" x={PAD.left + 4} y={y(reference.value) - 6}>
              {reference.label}
            </text>
          </g>
        )}

        {points.length > 1 && <path className="chart-line" d={path} />}
        {showDots && points.map((p) => <circle key={p.date} className="chart-dot" cx={x(p.date)} cy={y(p.value)} r={4} />)}
        {last && (
          <>
            <circle className="chart-dot" cx={x(last.date)} cy={y(last.value)} r={5} />
            <text className="chart-end-label" x={x(last.date) + 9} y={y(last.value)} dominantBaseline="middle">
              {format(last.value)}
            </text>
          </>
        )}

        {a && (
          <g>
            <line className="chart-crosshair" x1={x(a.date)} x2={x(a.date)} y1={PAD.top} y2={HEIGHT - PAD.bottom} />
            <circle className="chart-dot chart-dot-active" cx={x(a.date)} cy={y(a.value)} r={6} />
          </g>
        )}
      </svg>
      {a && (
        <div
          className="chart-tooltip"
          style={{ left: Math.min(Math.max(x(a.date), 60), width - 60), top: Math.max(0, y(a.value) - 58) }}
        >
          <strong>
            {format(a.value)}
            {unit}
          </strong>
          <span>{a.date.replaceAll('-', '/')}</span>
        </div>
      )}
    </div>
  )
}
