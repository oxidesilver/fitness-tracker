import Stepper from '../../components/Stepper.jsx'
import { EQUIPMENT, isWeightOptional } from './workoutCatalog.js'

// 1セットずつ重さと回数を入れる部品。
// 値は入力中の文字のまま（'55' や ''）で持ち、記録するときに数字に直す。
// info は workoutInfo の戻り値。道具の種類で、重さの最低・きざみ・欄の名前が変わる
export default function SetEditor({ sets, onChange, info }) {
  const eq = EQUIPMENT[info.equipment]
  const optional = isWeightOptional(info.equipment)

  function update(i, field, value) {
    onChange(sets.map((s, j) => (j === i ? { ...s, [field]: value } : s)))
  }

  // 1つ前のセットと同じ数字を入れた行を足す
  function addSet() {
    const last = sets[sets.length - 1] ?? { weight: '', reps: '10' }
    onChange([...sets, { ...last }])
  }

  function removeSet(i) {
    onChange(sets.filter((_, j) => j !== i))
  }

  return (
    <div className="sets">
      {eq.note && <p className="workout-note">{eq.note}</p>}
      {sets.map((s, i) => (
        <div key={i} className="set-row">
          <div className="set-head">
            <span>{i + 1}セット目</span>
            {sets.length > 1 && (
              <button type="button" className="set-remove" aria-label={`${i + 1}セット目を消す`} onClick={() => removeSet(i)}>✕</button>
            )}
          </div>
          <div className="set-labels">
            <span>{eq.weightLabel}</span>
            <span>回数</span>
          </div>
          <div className="set-inputs">
            <Stepper
              label={eq.weightLabel}
              value={s.weight}
              onChange={(v) => update(i, 'weight', v)}
              step={eq.step}
              min={optional ? 0 : eq.min}
              unit="kg"
              placeholder={optional ? 'なし' : String(eq.min)}
              inputMode="decimal"
            />
            <Stepper label="回数" value={s.reps} onChange={(v) => update(i, 'reps', v)} step={1} min={1} unit="回" placeholder="10" inputMode="numeric" />
          </div>
        </div>
      ))}
      <button type="button" className="set-add" onClick={addSet}>＋ セットを追加</button>
    </div>
  )
}
