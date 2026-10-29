import { useState } from 'react'
import { loadList, saveList, today } from '../../storage.js'
import { SOURCES, mealScore, scoreLabel } from './mealScore.js'

// 「食べ終えた」と押した日（点数を出す日）。今日の点数は、押すまで出さない（本人の希望：点数は最後に出す）
const FINISHED_KEY = 'fitness-tracker.mealScoreDays'

// その日の食事の点数。項目ごとの点と理由、「点数のつけ方」（ルールと根拠）を出す。
// 昨日より前の日はいつでも出す。今日（とこれからの日）は「今日の食事を記録し終えた」を押してから出す
export default function ScoreCard({ total, target, meals, date }) {
  const [open, setOpen] = useState(false)
  const [finished, setFinished] = useState(() => loadList(FINISHED_KEY))
  const result = mealScore(total, target)
  if (!result) return null
  const isToday = date === today()
  const done = date < today() || finished.includes(date)

  function finish(on) {
    const next = on ? [...finished.filter((d) => d !== date), date] : finished.filter((d) => d !== date)
    saveList(FINISHED_KEY, next)
    setFinished(next)
  }

  if (!done) {
    return (
      <div className="card meal-score">
        <p className="meal-help">点数は、1日の食事を全部記録したあとに出ます。夜ごはんや間食まで記録したら押してください。</p>
        <button type="button" className="primary" onClick={() => finish(true)}>
          {isToday ? '今日' : 'この日'}の食事を記録し終えた（点数を見る）
        </button>
      </div>
    )
  }
  const missingPfc = meals.some((m) => m.protein === null || m.fat === null || m.carbs === null)
  const used = [...new Set(result.items.flatMap((i) => i.sources))]

  return (
    <div className="card meal-score">
      <div className="meal-score-head">
        <span>{isToday ? '今日' : 'この日'}の点数</span>
        <strong>
          {result.score}
          <small>点</small>
        </strong>
        <span className="meal-score-label">{scoreLabel(result.score)}</span>
      </div>
      <ul className="meal-score-items">
        {result.items.map((i) => (
          <li key={i.id}>
            <div className="meal-score-row">
              <span>{i.label}</span>
              <span className={i.points < i.max ? 'meal-score-points down' : 'meal-score-points'}>
                {i.points}/{i.max}
              </span>
            </div>
            <p className="meal-score-note">{i.note}</p>
          </li>
        ))}
      </ul>
      {date >= today() && (
        <button type="button" className="meal-score-more" onClick={() => finish(false)}>
          まだ食べるので、点数をかくす
        </button>
      )}
      {missingPfc && <p className="meal-help">たんぱく質などが分からない食事があるので、その分は0として計算しています。</p>}
      <button type="button" className="meal-score-more" onClick={() => setOpen(!open)}>
        {open ? '点数のつけ方を閉じる' : '点数のつけ方と根拠を見る'}
      </button>
      {open && (
        <div className="meal-score-rules">
          <ul>
            {result.items.map((i) => (
              <li key={i.id}>
                <strong>{i.label}（{i.max}点）</strong>：{i.rule}
              </li>
            ))}
          </ul>
          <p className="meal-help">
            {target.mode === 'body'
              ? '「体づくり向け」の目標で採点しています。たんぱく質は多くても減点しません。脂質がカロリーの30%を超えると減点します。'
              : '「国の目安」の目標で採点しています。'}
          </p>
          <ul className="meal-score-sources">
            {used.map((k) => (
              <li key={k}>
                <a href={SOURCES[k].url} target="_blank" rel="noreferrer">{SOURCES[k].label}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
