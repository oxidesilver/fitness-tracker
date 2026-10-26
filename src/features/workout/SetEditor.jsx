import Stepper from '../../components/Stepper.jsx'

// 1セットずつ重さと回数を入れる部品。
// 値は入力中の文字のまま（'55' や ''）で持ち、記録するときに数字に直す。

const WEIGHT_STEP = 2.5

export default function SetEditor({ sets, onChange }) {
  function update(i, field, value) {
    onChange(sets.map((s, j) => (j === i ? { ...s, [field]: value } : s)))
  }

  // 1つ前のセットと同じ数字を入れた行を足す
  function addSet() {
    const last = sets[sets.length - 1] ?? { weight: '', reps: '' }
    onChange([...sets, { ...last }])
  }

  function removeSet(i) {
    onChange(sets.filter((_, j) => j !== i))
  }

  return (
    <div className="sets">
      {sets.map((s, i) => (
        <div key={i} className="set-row">
          <div className="set-head">
            <span>{i + 1}セット目</span>
            {sets.length > 1 && (
              <button type="button" className="set-remove" aria-label={`${i + 1}セット目を消す`} onClick={() => removeSet(i)}>✕</button>
            )}
          </div>
          <div className="set-inputs">
            <Stepper label="重さ" value={s.weight} onChange={(v) => update(i, 'weight', v)} step={WEIGHT_STEP} unit="kg" placeholder="自重" inputMode="decimal" />
            <Stepper label="回数" value={s.reps} onChange={(v) => update(i, 'reps', v)} step={1} unit="回" placeholder="0" inputMode="numeric" />
          </div>
        </div>
      ))}
      <button type="button" className="set-add" onClick={addSet}>＋ セットを追加</button>
    </div>
  )
}
