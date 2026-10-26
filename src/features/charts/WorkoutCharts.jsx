import { useState } from 'react'
import { formatDate } from '../../storage.js'
import { bodyWeightOn, workoutKcal } from '../workout/calories.js'
import BarChart from './BarChart.jsx'
import { addDays, short, weekStart, weeksBetween } from './dates.js'
import LineChart from './LineChart.jsx'

// その種目を、1日ごとの1つの数字にする。
// 重りを使う種目：その日いちばん重かった重さ（kg）
// 自重の種目：その日いちばん多かった回数
// ランニング：その日に走った距離の合計（km）
function dailyValues(records) {
  const isRun = records.some((r) => r.run)
  const usesWeight = !isRun && records.some((r) => r.sets.some((s) => s.weightKg !== null))
  const byDate = new Map()
  for (const r of records) {
    let v
    if (isRun) v = (byDate.get(r.date) ?? 0) + r.run.distanceKm
    else if (usesWeight) v = Math.max(byDate.get(r.date) ?? 0, ...r.sets.map((s) => s.weightKg ?? 0))
    else v = Math.max(byDate.get(r.date) ?? 0, ...r.sets.map((s) => s.reps))
    byDate.set(r.date, v)
  }
  const points = [...byDate].map(([date, value]) => ({ date, value: Math.round(value * 10) / 10 })).sort((a, b) => a.date.localeCompare(b.date))
  if (isRun) return { points, unit: 'km', what: 'その日に走った距離', title: '距離（km）' }
  if (usesWeight) return { points, unit: 'kg', what: 'その日いちばん重かった重さ', title: '重さ（kg）' }
  return { points, unit: '回', what: 'その日いちばん多かった回数', title: '回数（回）' }
}

// 筋トレのグラフ：種目ごとの変化（折れ線）と、週ごとの運動量（棒）
export default function WorkoutCharts({ workouts, weights, from, to }) {
  // よく記録している種目ほど上
  const counts = new Map()
  for (const r of workouts) counts.set(r.exercise, (counts.get(r.exercise) ?? 0) + 1)
  const exercises = [...counts].sort((a, b) => b[1] - a[1]).map(([name]) => name)
  const [chosen, setChosen] = useState('')
  const exercise = exercises.includes(chosen) ? chosen : exercises[0]

  if (workouts.length === 0) {
    return <p className="chart-empty">筋トレの記録がまだありません。筋トレの画面で記録すると、ここにグラフが出ます。</p>
  }

  const series = dailyValues(workouts.filter((r) => r.exercise === exercise))
  const inRange = series.points.filter((p) => p.date >= from && p.date <= to)
  const best = series.points.reduce((a, b) => (b.value > a.value ? b : a), series.points[0])

  // 週ごとの運動量。体重の記録があれば消費カロリー、なければ運動した日数
  const useKcal = weights.length > 0
  const bars = weeksBetween(from, to).map((w) => {
    const end = addDays(w, 6)
    const items = workouts.filter((r) => r.date >= w && r.date <= end)
    const value = useKcal
      ? items.reduce((sum, r) => sum + (workoutKcal(r, bodyWeightOn(r.date, weights)) ?? 0), 0)
      : new Set(items.map((r) => r.date)).size
    return { key: w, label: short(w), value, title: `${short(w)}〜${short(end)}の週` }
  })
  const thisWeek = bars[bars.length - 1]
  const thisWeekDays = new Set(workouts.filter((r) => r.date >= weekStart(to) && r.date <= to).map((r) => r.date)).size

  return (
    <>
      <div className="card chart-card">
        <h2>種目ごとの変化</h2>
        <label htmlFor="chart-exercise" className="sr-only">種目</label>
        <select id="chart-exercise" className="chart-select" value={exercise} onChange={(e) => setChosen(e.target.value)}>
          {exercises.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>

        <div className="chart-inline-stats">
          <span>
            自己ベスト <strong>{best.value}{series.unit}</strong>（{short(best.date)}）
          </span>
        </div>

        {inRange.length === 0 ? (
          <p className="chart-empty">この期間の{exercise}の記録がありません。</p>
        ) : (
          <>
            <LineChart
              points={inRange}
              from={from}
              to={to}
              unit={series.unit}
              format={(v) => (Number.isInteger(v) ? String(v) : v.toFixed(1))}
              label={`${exercise}の${series.what}のグラフ`}
            />
            <p className="chart-hint">{series.what}を表示しています。</p>
            <details className="chart-table">
              <summary>数字の一覧を見る</summary>
              <table>
                <tbody>
                  {[...inRange].reverse().map((p) => (
                    <tr key={p.date}>
                      <th>{formatDate(p.date)}</th>
                      <td>{p.value}{series.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </>
        )}
      </div>

      <div className="card chart-card">
        <h2>{useKcal ? '週ごとの運動の消費カロリー（kcal）' : '週ごとの運動した日数（日）'}</h2>
        <div className="chart-inline-stats">
          <span>
            今週 <strong>{thisWeekDays}日</strong> 運動
            {useKcal && <>・約 <strong>{Math.round(thisWeek.value).toLocaleString()}kcal</strong></>}
          </span>
        </div>
        <BarChart
          bars={bars}
          unit={useKcal ? 'kcal' : '日'}
          label={useKcal ? '週ごとの運動の消費カロリーの棒グラフ' : '週ごとの運動した日数の棒グラフ'}
        />
        <p className="chart-hint">
          {useKcal ? '筋トレの画面と同じ計算の目安です。棒をタップすると、その週の数字が出ます。' : '体重を記録すると、消費カロリーで表示します。'}
        </p>
        <details className="chart-table">
          <summary>数字の一覧を見る</summary>
          <table>
            <tbody>
              {[...bars].reverse().map((b) => (
                <tr key={b.key}>
                  <th>{b.title}</th>
                  <td>{Math.round(b.value).toLocaleString()}{useKcal ? 'kcal' : '日'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </div>
    </>
  )
}
