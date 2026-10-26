import { useState } from 'react'
import { today } from '../../storage.js'
import BackupSection from '../backup/BackupSection.jsx'
import GoalSection from '../goal/GoalSection.jsx'
import { loadWeights } from '../weight/weightStorage.js'
import { ACTIVITY_LEVELS, energyFromProfile } from './energy.js'
import { loadProfile, saveProfile } from './profileStorage.js'
import './profile.css'

export default function ProfilePage() {
  const [profile, setProfile] = useState(loadProfile)
  const [weights] = useState(loadWeights)

  // 入力するたびに自動で保存する
  function update(field, value) {
    const next = { ...profile, [field]: value }
    setProfile(next)
    saveProfile(next)
  }

  const energy = energyFromProfile(profile, weights, today())
  const { missing, age, weight } = energy

  return (
    <section>
      <h1>プロフィール</h1>
      <p className="profile-note">入力すると自動で保存されます。</p>

      <div className="card">
        <label>性別</label>
        <div className="segment">
          {[['male', '男性'], ['female', '女性']].map(([id, label]) => (
            <button key={id} type="button" className={profile.sex === id ? 'active' : ''} onClick={() => update('sex', id)}>
              {label}
            </button>
          ))}
        </div>

        <label htmlFor="profile-birth">生年月日</label>
        <input id="profile-birth" type="date" value={profile.birthDate} onChange={(e) => update('birthDate', e.target.value)} />

        <label htmlFor="profile-height">身長（cm）</label>
        <input
          id="profile-height"
          type="text"
          inputMode="decimal"
          placeholder="例：170"
          value={profile.heightCm}
          onChange={(e) => update('heightCm', e.target.value)}
        />

        <label>ふだんの活動量</label>
        <div className="activity-options">
          {ACTIVITY_LEVELS.map((l) => (
            <button
              key={l.id}
              type="button"
              className={profile.activity === l.id ? 'activity-option active' : 'activity-option'}
              onClick={() => update('activity', l.id)}
            >
              <span className="activity-label">{l.label}</span>
              <span className="activity-desc">{l.description}</span>
            </button>
          ))}
        </div>

        <p className="profile-weight">
          体重：{weight ? `${weight.weightKg.toFixed(1)} kg（体重の画面の最新の記録）` : 'まだ記録がありません'}
        </p>
      </div>

      <h2>1日の消費カロリー</h2>
      {missing.length === 0 ? (
        <div className="card energy">
          <div className="energy-row">
            <span>基礎代謝</span>
            <strong>約 {Math.round(energy.basal).toLocaleString()} kcal</strong>
          </div>
          <p className="energy-help">何もせずに横になっていても、1日に使うカロリー</p>
          <div className="energy-row">
            <span>1日の消費カロリー</span>
            <strong>約 {Math.round(energy.daily).toLocaleString()} kcal</strong>
          </div>
          <p className="energy-help">基礎代謝に、ふだんの活動量の分を足したもの（{age}歳として計算）</p>
        </div>
      ) : (
        <p className="profile-missing">計算するには、次を入れてください：{missing.join('、')}</p>
      )}
      <p className="profile-note">数字は計算式による目安です。</p>

      <GoalSection energy={energy} activity={profile.activity} heightCm={profile.heightCm} />

      <BackupSection />
    </section>
  )
}
