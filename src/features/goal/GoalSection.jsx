import { useState } from 'react'
import Stepper from '../../components/Stepper.jsx'
import { formatDate, today } from '../../storage.js'
import ExercisePlanSection from './ExercisePlanSection.jsx'
import { exerciseKcal, loadExercisePlan, saveExercisePlan } from './exercisePlan.js'
import { loadGoal, saveGoal } from './goalStorage.js'
import { goalPlan } from './nutrition.js'
import './goal.css'

const round = (n) => Math.round(n)

// 目標の入力と、1日・1食あたりの目標摂取カロリーと PFC の表示。
// プロフィールの画面の下に出す。energy は energyFromProfile の戻り値
export default function GoalSection({ energy, activity }) {
  const [goal, setGoal] = useState(loadGoal)
  const [exercisePlan, setExercisePlan] = useState(loadExercisePlan)

  // 入力するたびに自動で保存する
  function update(field, value) {
    const next = { ...goal, [field]: value }
    setGoal(next)
    saveGoal(next)
  }

  function updateExercisePlan(next) {
    setExercisePlan(next)
    saveExercisePlan(next)
  }

  const exercise = exerciseKcal(exercisePlan, energy.weightKg)
  const { problem, loseKg, days, plan, pfc } = goalPlan(energy, goal, today(), exercise?.daily ?? 0)

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

  const rows = pfc && [
    ['1日', 1],
    ['1食（3食の場合）', 3],
    ['1食（2食の場合）', 2],
  ]

  return (
    <>
      <h2>目標</h2>
      <div className="card goal-form">
        <label>減らしたい体重（kg）</label>
        <Stepper label="減らしたい体重" value={goal.loseKg} onChange={(v) => update('loseKg', v)} step={0.5} unit="kg" placeholder="0" />
        {energy.weightKg !== null && loseKg > 0 && (
          <p className="goal-help">目標体重：約{(energy.weightKg - loseKg).toFixed(1)}kg</p>
        )}

        <label htmlFor="goal-date">いつまでに</label>
        <input id="goal-date" type="date" value={goal.targetDate} onChange={(e) => update('targetDate', e.target.value)} />

        <label>PFC（たんぱく質・脂質・炭水化物）の決め方</label>
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
            <Stepper label="たんぱく質" value={goal.proteinPerKg} onChange={(v) => update('proteinPerKg', v)} step={0.1} unit="g/kg" />
            <label className="goal-gap">脂質（1日 g）</label>
            <Stepper label="脂質" value={goal.fatG} onChange={(v) => update('fatG', v)} step={5} unit="g" />
            <p className="goal-help goal-gap">炭水化物は、残りのカロリーから自動で決まります。</p>
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
            {loseKg > 0 && (
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
            {loseKg > 0
              ? `${formatDate(goal.targetDate)}まで${days}日。1日あたり約${round(plan.deficit).toLocaleString()}kcal 減らします（体脂肪1kg＝約7,000kcal）。`
              : '減らしたい体重が0なので、今の体重を保つカロリーです。'}
          </p>

          {warnings.map((w) => (
            <p key={w} className="goal-warning">⚠️ {w}</p>
          ))}

          <table className="goal-table">
            <thead>
              <tr>
                <th></th>
                <th>カロリー</th>
                <th>P</th>
                <th>F</th>
                <th>C</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, n]) => (
                <tr key={label}>
                  <th>{label}</th>
                  <td>{round(plan.intake / n).toLocaleString()}</td>
                  <td>{round(pfc.protein / n)}g</td>
                  <td>{round(pfc.fat / n)}g</td>
                  <td>{round(Math.max(0, pfc.carbs) / n)}g</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="goal-help">P＝たんぱく質、F＝脂質、C＝炭水化物。カロリーの単位は kcal です。</p>
        </div>
      )}
    </>
  )
}
