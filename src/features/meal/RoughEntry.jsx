import { ROUGH_TYPES, roughValues } from './roughMeal.js'

// 「ざっくり入力」と「食べていない」。タップするとすぐに、選んでいる日付・いつで記録する（onRecord）
export default function RoughEntry({ time, target, onRecord }) {
  return (
    <div className="rough">
      <button type="button" className="rough-skip" onClick={() => onRecord(null)}>
        🚫 この食事は食べていない
      </button>
      {target ? (
        <>
          <p className="meal-help">
            何を食べたか細かく分からないときは、近いものを押してください。あなたの1食の目安を基準に、だいたいの数字で記録します。
            「多め」の3つは、3食ずっとそれだと太る量（1日の消費カロリーより1割多い量）にしています。
          </p>
          <div className="my-foods-list my-foods-grid">
            {ROUGH_TYPES.map((t) => {
              const v = roughValues(t.id, time, target)
              return (
                <button key={t.id} type="button" className="my-food" onClick={() => onRecord(t)}>
                  <span className="my-food-name">{t.label}</span>
                  <span className="my-food-kcal">{t.note}・約{v.kcal}kcal</span>
                </button>
              )
            })}
          </div>
        </>
      ) : (
        <p className="meal-help">プロフィールの画面で目標を入れると、ざっくり入力が使えます（あなたの1食の目安を基準にするため）。</p>
      )}
    </div>
  )
}
