import { formatDate } from '../../storage.js'
import BarChart from './BarChart.jsx'
import { addDays, short, weeksBetween } from './dates.js'

const NUTRIENTS = [
  { id: 'protein', label: 'たんぱく質（P）' },
  { id: 'fat', label: '脂質（F）' },
  { id: 'carbs', label: '炭水化物（C）' },
]

// 日付ごとの合計：Map('2026-10-26' → { kcal, protein, fat, carbs })
function dailyTotals(meals) {
  const days = new Map()
  for (const m of meals) {
    const t = days.get(m.date) ?? { kcal: 0, protein: 0, fat: 0, carbs: 0 }
    for (const k of Object.keys(t)) t[k] += m[k] ?? 0
    days.set(m.date, t)
  }
  return days
}

// 食事のグラフ：摂取カロリー（1か月は毎日、それより長いときは週ごとの1日平均）と、直近7日の PFC の平均。
// target は今の1日の目標（{ kcal, protein, fat, carbs }、なければ null）
export default function MealCharts({ meals, target, from, to, daily }) {
  if (meals.length === 0) {
    return <p className="chart-empty">食事の記録がまだありません。食事の画面で記録すると、ここにグラフが出ます。</p>
  }

  const totals = dailyTotals(meals)
  const recorded = [...totals.keys()].filter((d) => d >= from && d <= to)
  const over = (kcal) => target !== null && kcal > target.kcal

  let bars
  if (daily) {
    bars = []
    for (let d = from; d <= to; d = addDays(d, 1)) {
      const t = totals.get(d)
      bars.push({
        key: d,
        label: short(d),
        value: t?.kcal ?? 0,
        over: t ? over(t.kcal) : false,
        empty: !t,
        title: formatDate(d),
        note: !t ? null : target ? (over(t.kcal) ? `目標より ${Math.round(t.kcal - target.kcal)}kcal 多い` : `目標まで あと${Math.round(target.kcal - t.kcal)}kcal`) : null,
      })
    }
  } else {
    bars = weeksBetween(from, to).map((w) => {
      const end = addDays(w, 6)
      const days = [...totals].filter(([d]) => d >= w && d <= end)
      const avg = days.length ? days.reduce((sum, [, t]) => sum + t.kcal, 0) / days.length : 0
      return {
        key: w,
        label: short(w),
        value: avg,
        over: days.length > 0 && over(avg),
        empty: days.length === 0,
        title: `${short(w)}〜${short(end)}の週の1日平均`,
        note: days.length ? `記録した日 ${days.length}日` : null,
      }
    })
  }

  const kcalAvg = recorded.length ? recorded.reduce((sum, d) => sum + totals.get(d).kcal, 0) / recorded.length : 0
  const overDays = recorded.filter((d) => over(totals.get(d).kcal)).length

  // 直近7日（今日をふくむ）のうち、記録した日の PFC の平均
  const last7 = [...totals].filter(([d]) => d > addDays(to, -7) && d <= to)
  const pfcAvg = Object.fromEntries(NUTRIENTS.map((n) => [n.id, last7.length ? last7.reduce((sum, [, t]) => sum + t[n.id], 0) / last7.length : 0]))

  return (
    <>
      <div className="card chart-card">
        <h2>{daily ? '毎日の摂取カロリー（kcal）' : '週ごとの摂取カロリー（1日平均・kcal）'}</h2>
        <div className="chart-inline-stats">
          <span>
            記録した日の平均 <strong>{Math.round(kcalAvg).toLocaleString()}kcal</strong>
            {target && <>（目標 {Math.round(target.kcal).toLocaleString()}）</>}
          </span>
          {target && (
            <span className="chart-inline-sub">
              目標を超えた日 <strong>{overDays}日</strong> ／ 記録した {recorded.length}日
            </span>
          )}
        </div>
        <BarChart
          bars={bars}
          unit="kcal"
          reference={target ? { value: target.kcal, label: `目標 ${Math.round(target.kcal).toLocaleString()}kcal` } : null}
          label={daily ? '毎日の摂取カロリーの棒グラフ' : '週ごとの摂取カロリーの1日平均の棒グラフ'}
        />
        {target ? (
          <p className="chart-hint">
            <span className="chart-key chart-key-line" aria-hidden="true" />灰色の線は目標（今の目標）、
            <span className="chart-key chart-key-over" aria-hidden="true" />赤い棒は目標より多い{daily ? '日' : '週'}です。棒をタップすると数字が出ます。
          </p>
        ) : (
          <p className="chart-hint">プロフィールの画面で目標を入れると、目標の線が出ます。</p>
        )}
        <details className="chart-table">
          <summary>数字の一覧を見る</summary>
          <table>
            <tbody>
              {[...bars].reverse().filter((b) => !b.empty).map((b) => (
                <tr key={b.key}>
                  <th>{b.title}</th>
                  <td>
                    {Math.round(b.value).toLocaleString()}kcal{b.over ? '（多い）' : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </div>

      <div className="card chart-card">
        <h2>直近7日の PFC の平均</h2>
        {last7.length === 0 ? (
          <p className="chart-empty">直近7日の食事の記録がありません。</p>
        ) : (
          <>
            <p className="chart-hint">記録した {last7.length}日の1日あたりの平均です。</p>
            {NUTRIENTS.map((n) => {
              const goal = target?.[n.id]
              const ratio = goal ? Math.min(1, pfcAvg[n.id] / goal) : 0
              const isOver = goal && pfcAvg[n.id] > goal
              return (
                <div key={n.id} className="pfc-row">
                  <div className="pfc-text">
                    <span>{n.label}</span>
                    <span>
                      <strong>{Math.round(pfcAvg[n.id])}</strong>
                      {goal ? ` / ${Math.round(goal)}` : ''} g
                    </span>
                  </div>
                  {goal ? (
                    <>
                      <div className="pfc-track">
                        <div className={isOver ? 'pfc-fill over' : 'pfc-fill'} style={{ width: `${ratio * 100}%` }} />
                      </div>
                      <p className={isOver ? 'pfc-note over' : 'pfc-note'}>
                        目標の {Math.round((pfcAvg[n.id] / goal) * 100)}%{isOver ? '（多い）' : ''}
                      </p>
                    </>
                  ) : null}
                </div>
              )
            })}
            <p className="chart-hint">P・F・C を入れていない食事は 0g として数えています。</p>
          </>
        )}
      </div>
    </>
  )
}
