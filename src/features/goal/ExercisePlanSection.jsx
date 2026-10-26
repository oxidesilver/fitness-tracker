import { useState } from 'react'
import Stepper from '../../components/Stepper.jsx'
import { INTENSITY_LEVELS, allExercises } from './exercisePlan.js'

const round = (n) => Math.round(n)

// 運動の計画の入力と、提案の表示。
// plan と onChange は GoalSection から受け取る。result は exerciseKcal の戻り値。deficit は1日に減らすカロリー
export default function ExercisePlanSection({ plan, onChange, result, deficit, activity }) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [level, setLevel] = useState('moderate')

  const update = (field, value) => onChange({ ...plan, [field]: value })

  function toggle(id) {
    update('selected', plan.selected.includes(id) ? plan.selected.filter((s) => s !== id) : [...plan.selected, id])
  }

  function addCustom() {
    const trimmed = name.trim()
    if (!trimmed) return
    const id = `custom-${Date.now()}`
    onChange({ ...plan, custom: [...plan.custom, { id, name: trimmed, level }], selected: [...plan.selected, id] })
    setName('')
    setAdding(false)
  }

  function removeCustom(id) {
    if (!confirm('この種目を一覧から消しますか？')) return
    onChange({ ...plan, custom: plan.custom.filter((c) => c.id !== id), selected: plan.selected.filter((s) => s !== id) })
  }

  const fromExercise = result ? Math.min(result.daily, deficit) : 0

  return (
    <>
      <h2>運動の計画</h2>
      <div className="card goal-form">
        <label>週に何回運動できるか</label>
        <Stepper label="週の回数" value={plan.sessions} onChange={(v) => update('sessions', v)} step={1} unit="回" placeholder="3" inputMode="numeric" />
        <label>1回に何分できるか</label>
        <Stepper label="1回の時間" value={plan.minutes} onChange={(v) => update('minutes', v)} step={5} unit="分" placeholder="60" inputMode="numeric" />

        <label className="goal-gap">やりたい種目（いくつでも）</label>
        <div className="plan-options">
          {allExercises(plan).map((e) => {
            const custom = plan.custom.find((c) => c.id === e.id)
            return (
              <div key={e.id} className="plan-option-row">
                <button
                  type="button"
                  className={plan.selected.includes(e.id) ? 'plan-option active' : 'plan-option'}
                  onClick={() => toggle(e.id)}
                >
                  <span className="plan-check">{plan.selected.includes(e.id) ? '✓' : ''}</span>
                  {e.name}
                  {custom && <span className="plan-level">（{INTENSITY_LEVELS.find((l) => l.id === custom.level).label}）</span>}
                </button>
                {custom && (
                  <button type="button" className="plan-remove" aria-label={`${e.name}を消す`} onClick={() => removeCustom(e.id)}>✕</button>
                )}
              </div>
            )
          })}
        </div>

        {adding ? (
          <div className="plan-add">
            <input type="text" placeholder="例：水泳" value={name} autoFocus onChange={(e) => setName(e.target.value)} />
            <label>強さ</label>
            <div className="segment segment-3">
              {INTENSITY_LEVELS.map((l) => (
                <button key={l.id} type="button" className={level === l.id ? 'active' : ''} onClick={() => setLevel(l.id)}>
                  {l.label}
                </button>
              ))}
            </div>
            <p className="goal-help">{INTENSITY_LEVELS.find((l) => l.id === level).description}くらいの運動</p>
            <div className="plan-add-buttons">
              <button type="button" className="primary" onClick={addCustom}>追加</button>
              <button type="button" className="plan-cancel" onClick={() => { setAdding(false); setName('') }}>やめる</button>
            </div>
          </div>
        ) : (
          <button type="button" className="plan-add-open" onClick={() => setAdding(true)}>＋ 種目を追加</button>
        )}

        {activity === 'high' && (
          <p className="goal-warning goal-gap">
            ⚠️ プロフィールの活動量が「高い」になっています。「高い」にはふだんの運動の分も入っているので、運動の分を二重に数えて多めに出ます。運動の計画を使うときは「ふつう」か「低い」にしてください。
          </p>
        )}
      </div>

      {result && (
        <div className="card plan-result">
          <h3>{result.recommended ? 'おすすめ（筋トレ＋速歩き）' : '1回の内容'}</h3>
          {result.recommended && (
            <p className="goal-help">種目を選んでいないので、筋肉を残すための筋トレと、体への負担が少ない速歩きの組み合わせで計算しました。上で種目を選ぶと、それで計算し直します。</p>
          )}
          <ul className="plan-items">
            {result.items.map((it) => (
              <li key={it.name}>
                <span>{it.name}</span>
                <span>{it.minutes}分・約{round(it.kcal)}kcal</span>
              </li>
            ))}
          </ul>
          <div className="plan-total">
            <span>1回で</span>
            <strong>約 {round(result.perSession)} kcal</strong>
          </div>
          <div className="plan-total">
            <span>1週間で（{plan.sessions}回）</span>
            <strong>約 {round(result.weekly).toLocaleString()} kcal</strong>
          </div>
          <div className="plan-total">
            <span>1日あたり</span>
            <strong>約 {round(result.daily)} kcal</strong>
          </div>
          {deficit > 0 && (
            <p className="goal-help goal-gap">
              {result.daily >= deficit
                ? `1日に減らす約${round(deficit)}kcalを、運動だけでまかなえます。そのぶん食事を減らさなくて大丈夫です。`
                : `1日に減らす約${round(deficit)}kcalのうち、運動で約${round(fromExercise)}kcal、食事で約${round(deficit - fromExercise)}kcal 減らします。`}
            </p>
          )}
          <p className="goal-help">運動の分は、安静にしているときの分を引いて計算しています（目安）。</p>
        </div>
      )}
    </>
  )
}
