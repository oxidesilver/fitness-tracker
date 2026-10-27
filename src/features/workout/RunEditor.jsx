import { useState } from 'react'
import Stepper from '../../components/Stepper.jsx'
import RunImport from './RunImport.jsx'

// ランニングの入力。マシン（速度・傾斜・時間）と、外（距離・時間）を切り替えられる。
// 外のときは、ランニングアプリの結果画面の文字を貼り付けて入れることもできる（RunImport）。
// 値は入力中の文字のまま持ち、記録するときに数字に直す。
export default function RunEditor({ run, onChange }) {
  const set = (field) => (value) => onChange({ ...run, [field]: value })
  const [importing, setImporting] = useState(false)

  function pick(result) {
    onChange({ ...run, mode: 'outdoor', ...result })
    setImporting(false)
  }

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
          {importing ? (
            <RunImport onPick={pick} onClose={() => setImporting(false)} />
          ) : (
            <button type="button" className="run-import-open" onClick={() => setImporting(true)}>
              📱 ランアプリの結果から入れる
            </button>
          )}
          <label>距離（km）</label>
          <Stepper label="距離" value={run.distance} onChange={set('distance')} step={0.1} unit="km" placeholder="5" />
        </>
      )}
      <label>時間</label>
      <Stepper label="時間（分）" value={run.minutes} onChange={set('minutes')} step={1} unit="分" placeholder="30" inputMode="numeric" />
      <Stepper label="時間（秒）" value={run.seconds} onChange={set('seconds')} step={1} unit="秒" placeholder="0" inputMode="numeric" />
      {run.mode === 'outdoor' && (
        <>
          <label>上りの高低差（m・分かれば）</label>
          <Stepper label="上りの高低差" value={run.elevation} onChange={set('elevation')} step={10} unit="m" placeholder="0" inputMode="numeric" />
          <p className="run-note">坂を上った分も消費カロリーに入れます。アプリの「高低差（上り）」の数字です。</p>
          <label>消費カロリー（アプリの数字・分かれば）</label>
          <Stepper label="消費カロリー" value={run.kcal} onChange={set('kcal')} step={10} unit="kcal" placeholder="" inputMode="numeric" />
          <p className="run-note">入れるとこの数字を使います。空ならこのアプリで計算します。</p>
        </>
      )}
    </div>
  )
}
