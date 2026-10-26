import { useEffect, useState } from 'react'
import Stepper from '../../components/Stepper.jsx'
import { formatDate, today } from '../../storage.js'
import ExercisePlanSection from './ExercisePlanSection.jsx'
import { exerciseKcal, loadExercisePlan, saveExercisePlan } from './exercisePlan.js'
import { loadGoal, saveGoal } from './goalStorage.js'
import { daysBetween, goalPlan, suggestLoss, targetWeight } from './nutrition.js'
import './goal.css'

const round = (n) => Math.round(n)

// 自動で決めた値か、自分で変えた値かを示す。自分で変えたときは「自動に戻す」を出す
function AutoNote({ auto, text, onReset }) {
  return auto ? (
    <p className="goal-help">{text}。−／＋で変えられます。</p>
  ) : (
    <p className="goal-help">
      自分で決めた値です。
      <button type="button" className="goal-reset" onClick={onReset}>自動に戻す</button>
    </p>
  )
}

// 目標の入力と、1日・1食あたりの目標摂取カロリーと PFC の表示。
// プロフィールの画面の下に出す。energy は energyFromProfile の戻り値、heightCm は身長（文字のまま）
// editing が false のときは入力欄を出さず、目標のまとめだけを出す。
// editing が true のときは「1日の目標」の下に「これでOK」を出す（canConfirm が false なら押せない）
export default function GoalSection({ energy, activity, heightCm, editing = true, canConfirm, onConfirm }) {
  const [goal, setGoal] = useState(loadGoal)
  const [exercisePlan, setExercisePlan] = useState(loadExercisePlan)

  // 入力するたびに自動で保存する
  const currentKg = energy.weight?.weightKg ?? null

  function update(field, value) {
    updateMany({ [field]: value })
  }

  function updateMany(fields) {
    const next = { ...goal, ...fields }
    // 減らしたい体重を入れたときの体重を覚えておき、目標体重を固定する
    if ('loseKg' in fields && currentKg !== null) next.startWeightKg = currentKg
    setGoal(next)
    saveGoal(next)
  }

  // 前の版で入れた目標には、入れたときの体重がないので、今の体重を入れておく
  useEffect(() => {
    if (Number(goal.loseKg) > 0 && !goal.startWeightKg && currentKg !== null) update('startWeightKg', currentKg)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function updateExercisePlan(next) {
    setExercisePlan(next)
    saveExercisePlan(next)
  }

  const exercise = exerciseKcal(exercisePlan, energy.weightKg)
  const { problem, loseKg, targetKg, remainingKg, days, plan, pfc, proteinPerKg, fatG } = goalPlan(energy, goal, today(), exercise?.daily ?? 0)
  const suggestion = goal.targetDate
    ? suggestLoss({ currentKg, heightCm: Number(heightCm), days: daysBetween(today(), goal.targetDate) })
    : null

  const warnings = []
  if (plan && plan.weeklyPercent > 1) {
    warnings.push(`1週間に約${plan.weeklyKg.toFixed(1)}kg（体重の${plan.weeklyPercent.toFixed(1)}%）減らすペースです。筋肉を残すには、1週間に体重の0.5〜1%までがすすめられています。日付を延ばすか、減らす量を少なくしてください。`)
  }
  if (plan && plan.intake < energy.basal) {
    warnings.push(`目標摂取カロリーが基礎代謝（約${round(energy.basal).toLocaleString()}kcal）を下回っています。体に負担がかかるので、日付を延ばすか、減らす量を少なくしてください。`)
  }
  if (pfc && pfc.carbs < 0) {
    warnings.push('たんぱく質と脂質だけで目標カロリーを超えています。たんぱく質か脂質の量を減らしてください。')
  }

  // 表の列：1日分、1日3食のときの1食分、1日2食のときの1食分
  const rows = pfc && [
    ['1日', 1],
    ['1食（3食）', 3],
    ['1食（2食）', 2],
  ]

  return (
    <>
      {editing ? (
        <>
      <h2>目標</h2>
      <div className="card goal-form">
        <label htmlFor="goal-date">いつまでに</label>
        <input id="goal-date" type="date" value={goal.targetDate} onChange={(e) => update('targetDate', e.target.value)} />

        {suggestion && (
          <div className="goal-suggest">
            <p className="goal-suggest-title">この日までのおすすめ（タップすると下に入ります）</p>
            <button type="button" onClick={() => updateMany({ loseKg: String(suggestion.body), pfcMode: 'body' })}>
              <span className="goal-suggest-name">体づくり向け</span>
              <strong>約 {suggestion.body}kg</strong>
              <span className="goal-suggest-desc">1週間に体重の約0.75%。筋肉を残しやすいペース</span>
            </button>
            <button type="button" onClick={() => updateMany({ loseKg: String(suggestion.gentle), pfcMode: 'national' })}>
              <span className="goal-suggest-name">ゆっくり（国の目安）</span>
              <strong>約 {suggestion.gentle}kg</strong>
              <span className="goal-suggest-desc">1か月に約1kg。無理のないペース</span>
            </button>
            {suggestion.limited && (
              <p className="goal-help">BMI 18.5（低体重の境目）を下回らないよう、少なめにしています。</p>
            )}
          </div>
        )}
        {!suggestion && currentKg === null && <p className="goal-help">体重を記録すると、おすすめの量が出ます。</p>}

        <label>減らしたい体重（kg）</label>
        <Stepper label="減らしたい体重" value={goal.loseKg} onChange={(v) => update('loseKg', v)} step={0.5} unit="kg" placeholder="0" />
        {currentKg !== null && targetWeight(goal, currentKg) !== null && (
          <p className="goal-help">
            目標体重：約{targetWeight(goal, currentKg).toFixed(1)}kg（今の体重 {currentKg.toFixed(1)}kg、あと
            {Math.max(0, currentKg - targetWeight(goal, currentKg)).toFixed(1)}kg）
          </p>
        )}

        <label>たんぱく質・脂質・炭水化物の決め方</label>
        <div className="segment">
          <button type="button" className={goal.pfcMode === 'body' ? 'active' : ''} onClick={() => update('pfcMode', 'body')}>
            体づくり向け
          </button>
          <button type="button" className={goal.pfcMode === 'national' ? 'active' : ''} onClick={() => update('pfcMode', 'national')}>
            国の目安
          </button>
        </div>

        {goal.pfcMode === 'body' ? (
          <>
            <label>たんぱく質（体重1kgあたり g）</label>
            <Stepper
              label="たんぱく質"
              value={goal.proteinPerKg}
              onChange={(v) => update('proteinPerKg', v)}
              step={0.1}
              unit="g/kg"
              placeholder={proteinPerKg !== null ? proteinPerKg.toFixed(1) : '2.0'}
            />
            <AutoNote
              auto={goal.proteinPerKg === ''}
              text={`自動：${proteinPerKg !== null ? proteinPerKg.toFixed(1) : '—'}g/kg（体重を減らすときは2.0、保つときは1.6）${proteinPerKg !== null && energy.weightKg ? `＝1日 約${round(proteinPerKg * energy.weightKg)}g` : ''}`}
              onReset={() => update('proteinPerKg', '')}
            />
            <label>脂質（1日 g）</label>
            <Stepper
              label="脂質"
              value={goal.fatG}
              onChange={(v) => update('fatG', v)}
              step={5}
              unit="g"
              placeholder={fatG !== null ? String(fatG) : '50'}
            />
            <AutoNote
              auto={goal.fatG === ''}
              text={`自動：${fatG !== null ? fatG : '—'}g（目標カロリーの約20%）`}
              onReset={() => update('fatG', '')}
            />
            <p className="goal-help">炭水化物は、残りのカロリーから自動で決まります。</p>
          </>
        ) : (
          <p className="goal-help">カロリーのうち、たんぱく質15%・脂質25%・炭水化物60%で計算します（国の目安の範囲のおおよそ真ん中）。</p>
        )}
      </div>

      <ExercisePlanSection
        plan={exercisePlan}
        onChange={updateExercisePlan}
        result={exercise}
        deficit={plan?.deficit ?? 0}
        activity={activity}
      />

        </>
      ) : (
        <>
          <h2>目標</h2>
          <div className="card profile-summary">
            <dl>
              <dt>目標体重</dt>
              <dd>
                {targetKg !== null ? `約${targetKg.toFixed(1)}kg（${formatDate(goal.targetDate)}まで）` : '今の体重を保つ'}
              </dd>
              <dt>栄養の決め方</dt>
              <dd>
                {goal.pfcMode === 'body'
                  ? `体づくり向け（たんぱく質 ${proteinPerKg?.toFixed(1) ?? '—'}g/kg・脂質 ${fatG ?? '—'}g）`
                  : '国の目安'}
              </dd>
              <dt>運動の計画</dt>
              <dd>
                {exercise
                  ? `週${exercisePlan.sessions}回・1回${exercisePlan.minutes}分（${exercise.items.map((i) => i.name).join('・')}）`
                  : 'なし'}
              </dd>
            </dl>
          </div>
        </>
      )}

      <h2>1日の目標</h2>
      {problem ? (
        <p className="goal-problem">{problem}</p>
      ) : (
        <div className="card">
          <div className="goal-summary">
            <div>
              <span>消費カロリー</span>
              <strong>約 {round(energy.daily).toLocaleString()} kcal</strong>
            </div>
            {exercise && (
              <div>
                <span>運動の分（1日あたり）</span>
                <strong>＋ 約 {round(exercise.daily).toLocaleString()} kcal</strong>
              </div>
            )}
            {plan.deficit > 0 && (
              <div>
                <span>減らす分</span>
                <strong>− 約 {round(plan.deficit).toLocaleString()} kcal</strong>
              </div>
            )}
            <div>
              <span>目標摂取カロリー</span>
              <strong className="goal-intake">約 {round(plan.intake).toLocaleString()} kcal</strong>
            </div>
          </div>
          <p className="goal-help">
            {loseKg === 0
              ? '減らしたい体重が0なので、今の体重を保つカロリーです。'
              : remainingKg > 0
                ? `目標体重 約${targetKg.toFixed(1)}kg まであと${remainingKg.toFixed(1)}kg。${formatDate(goal.targetDate)}まで${days}日なので、1日あたり約${round(plan.deficit).toLocaleString()}kcal 減らします（体脂肪1kg＝約7,000kcal）。`
                : `目標体重 約${targetKg.toFixed(1)}kg に届いています🎉 今の体重を保つカロリーです。`}
          </p>

          {warnings.map((w) => (
            <p key={w} className="goal-warning">⚠️ {w}</p>
          ))}

          <table className="goal-table">
            <thead>
              <tr>
                <th></th>
                {rows.map(([label]) => (
                  <th key={label}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['カロリー', plan.intake, 'kcal'],
                ['たんぱく質', pfc.protein, 'g'],
                ['脂質', pfc.fat, 'g'],
                ['炭水化物', Math.max(0, pfc.carbs), 'g'],
              ].map(([name, value, unit]) => (
                <tr key={name}>
                  <th>{name}</th>
                  {rows.map(([label, n]) => (
                    <td key={label}>
                      {round(value / n).toLocaleString()}
                      <small>{unit}</small>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && (
        <div className="goal-confirm">
          <button type="button" className="primary" onClick={onConfirm} disabled={!canConfirm || problem !== null}>
            これでOK
          </button>
          <p className="goal-help">
            {canConfirm && problem === null
              ? '押すと入力欄がたたまれて、まとめだけになります。あとで「修正する」から直せます。'
              : '上の入力がそろうと押せるようになります。'}
          </p>
        </div>
      )}
    </>
  )
}
