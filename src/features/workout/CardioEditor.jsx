import Stepper from '../../components/Stepper.jsx'
import { findExercise } from '../goal/exerciseCatalog.js'

// 有酸素・スポーツ（ランニング以外）の入力：強さと時間（分）。
// 強さの選び方と METs は、プロフィールの運動の計画と同じ一覧（goal/exerciseCatalog.js）を使う。
// value：{ level: 1, minutes: '30' }
export default function CardioEditor({ catalogId, value, onChange }) {
  const e = findExercise(catalogId)
  return (
    <div className="run">
      <label>強さ</label>
      {e.levels.length > 1 ? (
        <select
          className="cardio-level"
          aria-label="強さ"
          value={value.level}
          onChange={(ev) => onChange({ ...value, level: Number(ev.target.value) })}
        >
          {e.levels.map((l, i) => (
            <option key={l.code} value={i}>{l.label}</option>
          ))}
        </select>
      ) : (
        <p className="workout-note">{e.levels[0].label}</p>
      )}
      <label>時間（分）</label>
      <Stepper label="時間" value={value.minutes} onChange={(v) => onChange({ ...value, minutes: v })} step={5} min={5} unit="分" placeholder="30" inputMode="numeric" />
    </div>
  )
}
