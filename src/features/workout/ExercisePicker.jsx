import { WORKOUT_GROUPS } from './workoutCatalog.js'

// 種目をプルダウンで選ぶ部品。自由入力はせず、一覧（workoutCatalog.js）から選ぶ。
// いちばん上に「よく使う種目」、次に体の部位ごと・有酸素、最後に前の版で自分で足した種目を並べる。
export default function ExercisePicker({ selected, onSelect, frequent, legacy }) {
  return (
    <div className="picker">
      <select id="workout-exercise" value={selected} onChange={(e) => onSelect(e.target.value)}>
        <option value="" disabled>種目を選んでください</option>
        {frequent.length > 0 && (
          <optgroup label="よく使う種目">
            {frequent.map((n) => (
              <option key={`f-${n}`} value={n}>{n}</option>
            ))}
          </optgroup>
        )}
        {WORKOUT_GROUPS.map((g) => (
          <optgroup key={g.group} label={g.group}>
            {g.items.map((i) => (
              <option key={i.name} value={i.name}>{i.name}</option>
            ))}
          </optgroup>
        ))}
        {legacy.length > 0 && (
          <optgroup label="前に追加した種目">
            {legacy.map((n) => (
              <option key={`l-${n}`} value={n}>{n}</option>
            ))}
          </optgroup>
        )}
      </select>
    </div>
  )
}
