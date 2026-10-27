import { useState } from 'react'

// 登録した食品のボタン。タップするとすぐに記録する（onRecord）。「編集」で登録を外せる（onRemove）
export default function MyFoods({ foods, onRecord, onRemove }) {
  const [editing, setEditing] = useState(false)

  return (
    <div className="my-foods">
      <div className="my-foods-head">
        <label>登録した食品（タップで記録）</label>
        {foods.length > 0 && (
          <button type="button" className="my-foods-edit" onClick={() => setEditing(!editing)}>
            {editing ? '終わる' : '編集'}
          </button>
        )}
      </div>
      {foods.length === 0 ? (
        <p className="meal-help">
          プロテインなど、同じものをよく食べるときは、下の「今日の食事」の「☆ 登録」を押すと、ここからタップ1回で記録できます。
        </p>
      ) : (
        <div className="my-foods-list">
          {foods.map((f) =>
            editing ? (
              <button
                key={f.name}
                type="button"
                className="my-food removing"
                aria-label={`${f.name}の登録を外す`}
                onClick={() => confirm(`「${f.name}」の登録を外しますか？（これまでの記録は消えません）`) && onRemove(f.name)}
              >
                <span className="my-food-name">✕ {f.name}</span>
              </button>
            ) : (
              <button key={f.name} type="button" className="my-food" onClick={() => onRecord(f)}>
                <span className="my-food-name">{f.name}</span>
                <span className="my-food-kcal">{f.kcal}kcal</span>
              </button>
            ),
          )}
        </div>
      )}
    </div>
  )
}
