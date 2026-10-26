import { useState } from 'react'
import { loadExercisePlan } from '../goal/exercisePlan.js'
import BodyMap from './BodyMap.jsx'
import { MINUTES_PER_EXERCISE, PLACES, SPLIT_DAYS, STYLES, nextSplitDay, recommendMenu, recommendedStyle, strengthMinutes } from './recommend.js'
import { GUIDE, videoSearchUrl } from './workoutGuide.js'

const PLACE_KEY = 'fitness-tracker.trainingPlace'
// 全身法・分割法を自分で選んだときだけ覚える（選んでいなければ、週の回数から自動で決める）
const STYLE_KEY = 'fitness-tracker.trainingStyle'

function loadSetting(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function saveSetting(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // 覚えられなくても切り替えはできる
  }
}

// 筋トレの画面の上に出す「おすすめメニュー」。
// プロフィールの体重・性別・運動の計画（筋トレの時間）から、種目・重さ・セット数・時間を出す。
// onUse(name, weight, sets) で、その種目を下の記録の欄に入れる
export default function RecommendCard({ records, bodyKg, sex, onUse }) {
  const [place, setPlace] = useState(() => (loadSetting(PLACE_KEY) === 'home' ? 'home' : 'gym'))
  const [plan] = useState(loadExercisePlan)
  const autoStyle = recommendedStyle(plan.sessions)
  const [style, setStyle] = useState(() => {
    const saved = loadSetting(STYLE_KEY)
    return saved === 'full' || saved === 'split' ? saved : autoStyle
  })
  const [splitDay, setSplitDay] = useState(() => nextSplitDay(records, GUIDE))
  const [open, setOpen] = useState(null)

  function changePlace(id) {
    setPlace(id)
    setOpen(null)
    saveSetting(PLACE_KEY, id)
  }

  function changeStyle(id) {
    setStyle(id)
    setOpen(null)
    saveSetting(STYLE_KEY, id)
  }

  const { minutes, fromPlan } = strengthMinutes(plan, bodyKg)
  const day = style === 'split' ? splitDay : 'full'
  const menu = recommendMenu({ place, day, minutes, records, bodyKg, sex })
  const total = menu.reduce((a, m) => a + m.minutes, 0)

  return (
    <details className="card recommend" open>
      <summary>
        <span>おすすめメニュー</span>
        <span className="recommend-time">全{menu.length}種目・約{total}分</span>
      </summary>

      <div className="segment recommend-place" role="group" aria-label="場所">
        {PLACES.map((p) => (
          <button key={p.id} type="button" className={place === p.id ? 'active' : ''} onClick={() => changePlace(p.id)}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="segment recommend-place" role="group" aria-label="やり方">
        {STYLES.map((st) => (
          <button key={st.id} type="button" className={style === st.id ? 'active' : ''} onClick={() => changeStyle(st.id)}>
            {st.label}
            {st.id === autoStyle && <small className="recommend-badge">おすすめ</small>}
          </button>
        ))}
      </div>
      <p className="workout-note">
        {style === 'full'
          ? '全身法：1回で全身を鍛えます。週3回までならこちらがおすすめです。'
          : '分割法：上半身の日と下半身の日を交互に行います。週4回以上ならこちらがおすすめです。'}
        {plan.sessions ? `（運動の計画：週${plan.sessions}回）` : '（プロフィールで運動の計画を入れると、週の回数からおすすめを出します）'}
      </p>
      {style === 'split' && (
        <div className="segment recommend-place" role="group" aria-label="今日の日">
          {SPLIT_DAYS.map((d) => (
            <button key={d.id} type="button" className={splitDay === d.id ? 'active' : ''} onClick={() => { setSplitDay(d.id); setOpen(null) }}>
              {d.label}
              {d.id === nextSplitDay(records, GUIDE) && <small className="recommend-badge">次はこちら</small>}
            </button>
          ))}
        </div>
      )}

      <p className="workout-note">
        {menu.some((m) => !m.bodyweight)
          ? '「限界まで」は、10回前後でこれ以上できなくなる重さのことです。軽すぎる・重すぎるときは、記録するときに重さを変えてください（次から反映されます）。'
          : '「限界まで」は、これ以上できなくなるまでくり返すことです。'}
        セットの間は1〜2分休みます。
        {fromPlan ? `プロフィールの運動の計画（筋トレ約${minutes}分）に合わせています。` : 'プロフィールで運動の計画を入れると、その時間に合わせます。'}
      </p>

      <ol className="recommend-list">
        {menu.map((m, i) => {
          const guide = GUIDE[m.name]
          return (
            <li key={m.name}>
              <div className="recommend-head">
                <span className="recommend-no">{i + 1}</span>
                <div className="recommend-body">
                  <strong>{m.name}</strong>
                  <span className="recommend-detail">
                    {m.bodyweight ? '自重' : `${m.weight}kg${m.unitLabel === '片手の重さ' ? '（片手）' : ''}`}
                    で限界まで（{m.bodyweight ? '目安10〜15回' : '10回前後'}）× {m.sets}セット・約{m.minutes}分
                  </span>
                  {!m.bodyweight && <span className="recommend-sub">{m.fromLast ? '前回の重さ' : '体重から出した最初の目安'}</span>}
                </div>
              </div>
              <div className="recommend-buttons">
                <button type="button" onClick={() => setOpen(open === m.name ? null : m.name)}>
                  {open === m.name ? 'やり方を閉じる' : 'やり方を見る'}
                </button>
                <button type="button" onClick={() => onUse(m.name, m.weight, m.sets)}>記録に使う</button>
              </div>
              {open === m.name && guide && (
                <div className="recommend-guide">
                  <BodyMap muscles={guide.muscles} />
                  <ol className="guide-steps">
                    {guide.steps.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ol>
                  <p className="workout-note">⚠️ {guide.tip}</p>
                  <a className="guide-video" href={videoSearchUrl(m.name)} target="_blank" rel="noreferrer">
                    ▶ YouTube でやり方の動画を探す
                  </a>
                </div>
              )}
            </li>
          )
        })}
      </ol>
      <p className="workout-note">1種目は、準備と軽い1セット・3セット・セットの間の休みで約{MINUTES_PER_EXERCISE}分として計算しています。</p>
    </details>
  )
}
