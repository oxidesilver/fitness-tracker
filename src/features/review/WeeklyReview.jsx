import { useEffect, useState } from 'react'
import { today } from '../../storage.js'
import { short, weekStart } from '../charts/dates.js'
import { loadExercisePlan } from '../goal/exercisePlan.js'
import { AREAS, SOURCES, lastWeekStart, markReviewSeen, weeklyReview } from './weeklyReview.js'
import './review.css'

const WEEKS = [
  { id: 'last', label: '先週' },
  { id: 'this', label: '今週（途中）' },
]

// グラフの画面のいちばん上に出す「週の振り返り」。先週（月〜日）を評価して、良かったことと改善策を出す
export default function WeeklyReview({ workouts, meals, weights, target, goal }) {
  const [which, setWhich] = useState('last')
  const [plan] = useState(loadExercisePlan)
  const [open, setOpen] = useState(null)

  useEffect(() => markReviewSeen(today()), [])

  const start = which === 'last' ? lastWeekStart(today()) : weekStart(today())
  const r = weeklyReview({ start, workouts, meals, weights, target, plan, goal })
  const empty = r.stats.trainingDays === 0 && r.stats.mealDays === 0 && r.stats.weightChange === null

  return (
    <div className="card review">
      <div className="review-head">
        <h2>週の振り返り</h2>
        <span className="review-range">{short(r.start)}（月）〜{short(r.end)}（日）</span>
      </div>
      <div className="segment" role="group" aria-label="どの週">
        {WEEKS.map((w) => (
          <button key={w.id} type="button" className={which === w.id ? 'active' : ''} onClick={() => setWhich(w.id)}>
            {w.label}
          </button>
        ))}
      </div>

      {empty ? (
        <p className="meal-help">この週の記録がありません。</p>
      ) : (
        <>
          <ul className="review-stats">
            <li><span>運動した日</span><strong>{r.stats.trainingDays}日</strong></li>
            <li><span>食事の点数（平均）</span><strong>{r.stats.avgScore ?? '−'}{r.stats.avgScore != null && '点'}</strong></li>
            <li><span>たんぱく質（平均）</span><strong>{r.stats.avgProtein ?? '−'}{r.stats.avgProtein != null && 'g'}</strong></li>
            <li>
              <span>体重の変化</span>
              <strong>{r.stats.weightChange == null ? '−' : `${r.stats.weightChange > 0 ? '+' : ''}${r.stats.weightChange}kg`}</strong>
            </li>
          </ul>
          {r.stats.trainingDays > 0 && (
            <p className="review-sets">
              週のセット数：{AREAS.map((a) => `${a.label} ${r.stats.sets[a.id]}`).join('・')}（目安は各10セット以上）
            </p>
          )}

          {r.good.length > 0 && (
            <>
              <h3 className="review-sub">良かったこと</h3>
              <ul className="review-good">
                {r.good.map((g) => (
                  <li key={g}>✓ {g}</li>
                ))}
              </ul>
            </>
          )}

          <h3 className="review-sub">改善策</h3>
          {r.advice.length === 0 ? (
            <p className="meal-help">この週は、目立った改善点はありません。この調子で続けましょう。</p>
          ) : (
            <ol className="review-advice">
              {r.advice.map((a, i) => (
                <li key={a.title}>
                  <strong>{a.title}</strong>
                  <p>{a.detail}</p>
                  {a.note && <p className="review-note">{a.note}</p>}
                  {a.sources.length > 0 && (
                    <>
                      <button type="button" className="review-source-toggle" onClick={() => setOpen(open === i ? null : i)}>
                        {open === i ? '根拠を閉じる' : '根拠を見る'}
                      </button>
                      {open === i && (
                        <ul className="review-sources">
                          {a.sources.map((k) => (
                            <li key={k}>
                              <a href={SOURCES[k].url} target="_blank" rel="noreferrer">{SOURCES[k].label}</a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ol>
          )}
          {which === 'this' && <p className="meal-help">今週はまだ途中なので、週が終わると結果が変わります。</p>}
        </>
      )}
    </div>
  )
}
