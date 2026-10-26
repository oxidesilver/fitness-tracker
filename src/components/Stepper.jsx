import './Stepper.css'

// 数字を「−」「＋」ボタンと入力欄で入れる部品。
// 値は入力中の文字のまま（'55' や ''）で持つ。
// 空のときに −／＋ を押すと、見本の数字（placeholder）から増やす・減らす（見本が数字でなければ 0 から）。
// min より小さくはならない（例：バーベルは20kg）
export default function Stepper({ value, onChange, step, unit, placeholder, inputMode = 'decimal', label, min = 0 }) {
  function bump(diff) {
    const n = String(value).trim() === '' ? Number(placeholder) || 0 : Number(value) || 0
    const next = Math.max(min, Math.round((n + diff) * 10) / 10)
    onChange(String(next))
  }
  return (
    <div className="stepper">
      <button type="button" aria-label={`${label}を減らす`} onClick={() => bump(-step)}>−</button>
      <input
        type="text"
        inputMode={inputMode}
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button type="button" aria-label={`${label}を増やす`} onClick={() => bump(step)}>＋</button>
      <span className="stepper-unit">{unit}</span>
    </div>
  )
}
