import { useEffect, useRef, useState } from 'react'

// 棒グラフを描く部品（SVG）。
// bars：[{ key, label: 横軸の文字, value, title: なぞったときの見出し }]（左から順に並べる）
// unit：単位。format：数字の表示のしかた
// 棒を指でなぞる（タップ・マウスを乗せる）と、その棒の値が出る。いちばん右の棒には値を書いておく。
const HEIGHT = 200
const PAD = { top: 22, right: 8, bottom: 26, left: 40 }
const MAX_BAR = 24

function niceStep(max, maxTicks) {
  const steps = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000]
  return steps.find((s) => max / s <= maxTicks) ?? steps[steps.length - 1]
}

// 上の角だけ丸い棒（下は横軸にそろえて四角）
function barPath(x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h)
  return `M${x},${y + h} V${y + rr} Q${x},${y} ${x + rr},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h} Z`
}

export default function BarChart({ bars, unit, format = (v) => Math.round(v).toLocaleString(), label }) {
  const wrapRef = useRef(null)
  const [width, setWidth] = useState(340)
  const [active, setActive] = useState(null)

  useEffect(() => {
    const el = wrapRef.current
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(240, entry.contentRect.width)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const max = Math.max(1, ...bars.map((b) => b.value))
  const step = niceStep(max, 4)
  const yMax = Math.ceil(max / step) * step
  const ticks = []
  for (let v = 0; v <= yMax; v += step) ticks.push(v)

  const plotW = width - PAD.left - PAD.right
  const plotH = HEIGHT - PAD.top - PAD.bottom
  const band = plotW / Math.max(1, bars.length)
  const barW = Math.min(MAX_BAR, band - 2)
  const y = (v) => PAD.top + (1 - v / yMax) * plotH
  const cx = (i) => PAD.left + band * i + band / 2

  // 横軸の文字は多すぎないよう、間引いて最大5つ
  const every = Math.ceil(bars.length / 5)

  function pick(clientX) {
    const rect = wrapRef.current.getBoundingClientRect()
    const i = Math.floor((clientX - rect.left - PAD.left) / band)
    setActive(i >= 0 && i < bars.length ? i : null)
  }

  function handleKey(e) {
    if (e.key === 'ArrowLeft') setActive((i) => Math.max(0, (i ?? bars.length) - 1))
    if (e.key === 'ArrowRight') setActive((i) => Math.min(bars.length - 1, (i ?? -1) + 1))
  }

  const lastIndex = bars.length - 1
  const a = active !== null ? bars[active] : null

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
              {v >= 1000 ? `${v / 1000}K` : v}
            </text>
          </g>
        ))}
        {bars.map((b, i) => (
          <g key={b.key}>
            {b.value > 0 && (
              <path
                className={active === i ? 'chart-bar chart-bar-active' : 'chart-bar'}
                d={barPath(cx(i) - barW / 2, y(b.value), barW, y(0) - y(b.value), 4)}
              />
            )}
            {i % every === (lastIndex % every) && (
              <text className="chart-axis" x={cx(i)} y={HEIGHT - 8} textAnchor="middle">
                {b.label}
              </text>
            )}
          </g>
        ))}
        {lastIndex >= 0 && active === null && bars[lastIndex].value > 0 && (
          <text className="chart-bar-label" x={cx(lastIndex)} y={y(bars[lastIndex].value) - 6} textAnchor="middle">
            {format(bars[lastIndex].value)}
          </text>
        )}
      </svg>
      {a && (
        <div className="chart-tooltip" style={{ left: Math.min(Math.max(cx(active), 70), width - 70), top: Math.max(0, y(a.value) - 60) }}>
          <strong>
            {format(a.value)}
            {unit}
          </strong>
          <span>{a.title}</span>
        </div>
      )}
    </div>
  )
}
