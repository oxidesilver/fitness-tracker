import { useState } from 'react'
import { today } from '../../storage.js'
import { addWeight } from '../weight/weightStorage.js'

// 体重の記録がまだないときに、プロフィールの画面の一番上に出す。
// 1日の消費カロリーや目標の計算に体重が必要なので、ここでそのまま記録できるようにする。
export default function FirstWeight({ onSaved }) {
  const [weight, setWeight] = useState('')
  const [error, setError] = useState('')

  function save(e) {
    e.preventDefault()
    const kg = Number(weight)
    if (!(kg > 0 && kg < 500)) return setError('体重を正しく入れてください（例：65.2）')
    addWeight({ date: today(), weightKg: Math.round(kg * 10) / 10 })
    onSaved()
  }

  return (
    <form className="card first-weight" onSubmit={save}>
      <p className="first-weight-title">はじめに、今の体重を記録してください</p>
      <p className="profile-note">1日の消費カロリーや、目標のおすすめを計算するのに使います。あとは「体重」の画面で記録していきます。</p>
      <div className="first-weight-row">
        <input
          type="text"
          inputMode="decimal"
          aria-label="今の体重（kg）"
          placeholder="例：65.2"
          value={weight}
          onChange={(e) => { setWeight(e.target.value); setError('') }}
        />
        <span>kg</span>
        <button type="submit" className="primary">記録する</button>
      </div>
      {error && <p className="error">{error}</p>}
    </form>
  )
}
