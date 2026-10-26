import Stepper from '../../components/Stepper.jsx'
import { findExercise } from './exerciseCatalog.js'
import { unselectedExercises } from './exercisePlan.js'

const round = (n) => Math.round(n)

// 運動の計画の入力と、提案の表示。
// plan と onChange は GoalSection から受け取る。result は exerciseKcal の戻り値。deficit は1日に減らすカロリー
// 種目は一覧から選び、種目ごとに強さを選ぶ（強さは種目によって変わるため）
export default function ExercisePlanSection({ plan, onChange, result, deficit, activity }) {
  const update = (field, value) => onChange({ ...plan, [field]: value })

  function addItem(id) {
    if (!id) return
    update('items', [...plan.items, { id, level: findExercise(id).default }])
  }

  function setLevel(index, level) {
    update('items', plan.items.map((it, i) => (i === index ? { ...it, level } : it)))
  }

  function removeItem(index) {
    update('items', plan.items.filter((_, i) => i !== index))
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
        {plan.items.length > 0 && (
          <ul className="plan-items-edit">
            {plan.items.map((it, i) => {
              const e = findExercise(it.id)
              if (!e) return null
              return (
                <li key={it.id}>
                  <div className="plan-item-head">
                    <strong>{e.name}</strong>
                    <button type="button" className="plan-remove" aria-label={`${e.name}を外す`} onClick={() => removeItem(i)}>✕</button>
                  </div>
                  {e.levels.length > 1 ? (
                    <select
                      className="plan-level-select"
                      aria-label={`${e.name}の強さ`}
                      value={it.level}
                      onChange={(ev) => setLevel(i, Number(ev.target.value))}
                    >
                      {e.levels.map((l, li) => (
                        <option key={l.code} value={li}>{l.label}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="goal-help plan-one-level">{e.levels[0].label}</p>
                  )}
                </li>
              )
            })}
          </ul>
        )}
        {unselectedExercises(plan).length > 0 && (
          <select className="plan-add-select" aria-label="種目を追加" value="" onChange={(ev) => addItem(ev.target.value)}>
            <option value="" disabled>＋ 種目を追加する</option>
            {unselectedExercises(plan).map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        )}
        <p className="goal-help">種目を選ぶと、その種目の強さを選べます。強さの数字は国の研究所のメッツ表から取っています。</p>

        {activity === 'high' && (
          <p className="goal-warning goal-gap">
            ⚠️ プロフィールの活動量が「高い」になっています。「高い」にはふだんの運動の分も入っているので、運動の分を二重に数えて多めに出ます。運動の計画を使うときは「ふつう」か「低い」にしてください。
          </p>
        )}
      </div>

      {result && (
        <div className="card plan-result">
          <h3>{result.recommended ? 'おすすめ（筋トレ＋ウォーキング）' : '1回の内容'}</h3>
          {result.recommended && (
            <p className="goal-help">種目を選んでいないので、筋肉を残すための筋トレと、体への負担が少ないウォーキング（速歩き）の組み合わせで計算しました。上で種目を選ぶと、それで計算し直します。</p>
          )}
          <ul className="plan-items">
            {result.items.map((it) => (
              <li key={it.name}>
                <span>
                  {it.name}
                  <small className="plan-item-level">{it.level}</small>
                </span>
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
