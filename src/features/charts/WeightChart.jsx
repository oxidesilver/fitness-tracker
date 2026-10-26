import { formatDate } from '../../storage.js'
import { targetWeight } from '../goal/nutrition.js'
import LineChart from './LineChart.jsx'

// 体重のグラフと、最新・期間の変化・目標までの数字。
// weights は体重の全記録、goal は目標、from・to は表示する期間
export default function WeightChart({ weights, goal, from, to }) {
  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date))
  const inRange = sorted.filter((w) => w.date >= from && w.date <= to)
  const latest = sorted[sorted.length - 1]
  const target = latest ? targetWeight(goal, latest.weightKg) : null

  if (inRange.length === 0) {
    return <p className="chart-empty">この期間の体重の記録がありません。体重の画面で記録すると、ここにグラフが出ます。</p>
  }

  const first = inRange[0]
  const change = latest.weightKg - first.weightKg
  const sign = change > 0 ? '+' : change < 0 ? '−' : '±'

  return (
    <>
      <div className="stat-tiles">
        <div className="stat-tile">
          <span className="stat-label">最新</span>
          <span className="stat-value">{latest.weightKg.toFixed(1)}<small>kg</small></span>
          <span className="stat-sub">{latest.date.slice(5).replace('-', '/')}</span>
        </div>
        <div className="stat-tile">
          <span className="stat-label">期間の変化</span>
          <span className="stat-value">{sign}{Math.abs(change).toFixed(1)}<small>kg</small></span>
          <span className="stat-sub">{first.date.slice(5).replace('-', '/')}から</span>
        </div>
        {target !== null && (
          <div className="stat-tile">
            <span className="stat-label">目標まで</span>
            <span className="stat-value">
              {latest.weightKg > target ? (latest.weightKg - target).toFixed(1) : '0.0'}<small>kg</small>
            </span>
            <span className="stat-sub">目標 {target.toFixed(1)}kg</span>
          </div>
        )}
      </div>

      <div className="card chart-card">
        <h2>体重の変化（kg）</h2>
        <LineChart
          points={inRange.map((w) => ({ date: w.date, value: w.weightKg }))}
          from={from}
          to={to}
          unit="kg"
          reference={target !== null ? { value: target, label: `目標 ${target.toFixed(1)}kg` } : null}
          label={`体重のグラフ。${first.date}の${first.weightKg}kgから、${latest.date}の${latest.weightKg}kgまで`}
        />
        <p className="chart-hint">グラフを指でなぞると、その日の体重が出ます。</p>
        <details className="chart-table">
          <summary>数字の一覧を見る</summary>
          <table>
            <tbody>
              {[...inRange].reverse().map((w) => (
                <tr key={w.date}>
                  <th>{formatDate(w.date)}</th>
                  <td>{w.weightKg.toFixed(1)}kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </div>
    </>
  )
}
