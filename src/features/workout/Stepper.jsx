// 数字を「−」「＋」ボタンと入力欄で入れる部品。
// 値は入力中の文字のまま（'55' や ''）で持つ。
export default function Stepper({ value, onChange, step, unit, placeholder, inputMode = 'decimal', label }) {
  function bump(diff) {
    const n = Number(value) || 0
    const next = Math.max(0, Math.round((n + diff) * 10) / 10)
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
