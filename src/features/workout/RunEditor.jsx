import Stepper from '../../components/Stepper.jsx'

// ランニングの入力。マシン（速度・傾斜・時間）と、外（距離・時間）を切り替えられる。
// 値は入力中の文字のまま持ち、記録するときに数字に直す。
export default function RunEditor({ run, onChange }) {
  const set = (field) => (value) => onChange({ ...run, [field]: value })

  return (
    <div className="run">
      <div className="segment" role="group" aria-label="走った場所">
        <button type="button" className={run.mode === 'machine' ? 'active' : ''} onClick={() => onChange({ ...run, mode: 'machine' })}>
          マシン
        </button>
        <button type="button" className={run.mode === 'outdoor' ? 'active' : ''} onClick={() => onChange({ ...run, mode: 'outdoor' })}>
          外
        </button>
      </div>

      {run.mode === 'machine' ? (
        <>
          <label>速度（時速 km）</label>
          <Stepper label="速度" value={run.speed} onChange={set('speed')} step={0.5} unit="km/h" placeholder="8" />
          <label>傾斜（%）</label>
          <Stepper label="傾斜" value={run.incline} onChange={set('incline')} step={0.5} unit="%" placeholder="0" />
        </>
      ) : (
        <>
          <label>距離（km）</label>
          <Stepper label="距離" value={run.distance} onChange={set('distance')} step={0.1} unit="km" placeholder="5" />
        </>
      )}
      <label>時間（分）</label>
      <Stepper label="時間" value={run.minutes} onChange={set('minutes')} step={1} unit="分" placeholder="30" inputMode="numeric" />
    </div>
  )
}
