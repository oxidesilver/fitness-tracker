import { useState } from 'react'

// いつも出しておく数。これより多いときは「ほか○件を表示」でひらく（数が増えても画面が長くならないように。本人の希望）
const SHOW = 6
// これより多いときは、ひらいたときに名前で探せる欄を出す
const SEARCH_FROM = 10

// 登録した食品のボタン。タップするとすぐに記録する（onRecord）。「編集」で登録を外せる（onRemove）。
// 並びは、よく記録するもの（records の中で同じ名前が多いもの）ほど前。同じ数なら登録が新しいほうが前
export default function MyFoods({ foods, records, onRecord, onRemove }) {
  const [editing, setEditing] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [query, setQuery] = useState('')

  const count = new Map()
  for (const r of records) count.set(r.name, (count.get(r.name) ?? 0) + 1)
  const sorted = foods
    .map((f, i) => ({ f, i }))
    .sort((a, b) => (count.get(b.f.name) ?? 0) - (count.get(a.f.name) ?? 0) || b.i - a.i)
    .map(({ f }) => f)
  const q = query.trim().toLowerCase()
  const filtered = q ? sorted.filter((f) => f.name.toLowerCase().includes(q)) : sorted
  const open = expanded || editing
  const shown = open ? filtered : sorted.slice(0, SHOW)
  const hidden = sorted.length - SHOW

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
        <>
          {open && sorted.length > SEARCH_FROM && (
            <input
              type="search"
              className="my-foods-search"
              placeholder="名前で探す"
              aria-label="登録した食品を名前で探す"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          )}
          <div className="my-foods-list my-foods-grid">
            {shown.map((f) =>
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
          {open && q && filtered.length === 0 && <p className="meal-help">見つかりませんでした。</p>}
          {hidden > 0 && !editing && (
            <button
              type="button"
              className="my-foods-more"
              onClick={() => {
                setExpanded(!expanded)
                setQuery('')
              }}
            >
              {expanded ? 'よく使うものだけにする' : `ほか${hidden}件を表示`}
            </button>
          )}
        </>
      )}
    </div>
  )
}
