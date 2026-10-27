import { useEffect, useState } from 'react'
import Stepper from '../../components/Stepper.jsx'
import { FOOD_SOURCE, FOOD_SOURCE_URL, dishGroups, displayName, loadFoods, scaleFood, searchFoods } from './foodData.js'

// 食品成分表から食品や料理を選び、食べた量（g）を入れて、献立に追加する部品。
// 「探す」（名前で探す）と「料理から選ぶ」（和風料理・洋風料理などの一覧）を切り替えられる。
// onAdd には scaleFood の戻り値 { code, name, grams, kcal, protein, fat, carbs } を渡す。続けて追加できる
export default function FoodSearch({ onAdd, onClose }) {
  const [foods, setFoods] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [tab, setTab] = useState('search')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(null)
  const [food, setFood] = useState(null)
  const [grams, setGrams] = useState('100')
  const [added, setAdded] = useState('')

  useEffect(() => {
    loadFoods().then(setFoods).catch((e) => setLoadError(e.message))
  }, [])

  const results = foods ? searchFoods(foods, query) : []
  const groups = foods ? dishGroups(foods) : []
  const g = Number(grams)
  const preview = food && g > 0 ? scaleFood(food, g) : null

  function choose(f) {
    setFood(f)
    setGrams('100')
    setAdded('')
  }

  function add() {
    if (!preview) return
    onAdd(preview)
    setAdded(`${preview.name} ${preview.grams}g を追加しました。続けて追加できます。`)
    setFood(null)
    setQuery('')
  }

  const list = (items) => (
    <ul className="food-results">
      {items.map((f) => (
        <li key={f.code}>
          <button type="button" onClick={() => choose(f)}>
            <span>{displayName(f)}</span>
            <span className="food-kcal">{f.kcal}kcal/100g</span>
          </button>
        </li>
      ))}
    </ul>
  )

  return (
    <div className="food-search">
      <div className="food-search-head">
        <strong>食品・料理を追加</strong>
        <button type="button" className="food-close" onClick={onClose}>閉じる</button>
      </div>

      {food ? (
        <>
          <p className="food-picked">{displayName(food)}</p>
          <label>食べた量（g）</label>
          <Stepper label="食べた量" value={grams} onChange={setGrams} step={10} min={1} unit="g" placeholder="100" />
          {preview && (
            <p className="food-values">
              {preview.kcal}kcal
              {preview.protein !== null && ` ・たんぱく質${preview.protein}g`}
              {preview.fat !== null && ` ・脂質${preview.fat}g`}
              {preview.carbs !== null && ` ・炭水化物${preview.carbs}g`}
            </p>
          )}
          <div className="food-buttons">
            <button type="button" className="primary" onClick={add} disabled={!preview}>献立に追加</button>
            <button type="button" className="food-back" onClick={() => setFood(null)}>選び直す</button>
          </div>
        </>
      ) : (
        <>
          {added && <p className="meal-saved">✓ {added}</p>}
          <div className="segment food-tabs" role="group" aria-label="選び方">
            <button type="button" className={tab === 'search' ? 'active' : ''} onClick={() => setTab('search')}>名前で探す</button>
            <button type="button" className={tab === 'dish' ? 'active' : ''} onClick={() => setTab('dish')}>料理から選ぶ</button>
          </div>
          {loadError && <p className="error">{loadError}</p>}
          {!foods && !loadError && <p className="meal-help">食品のデータを読み込んでいます…</p>}

          {tab === 'search' && (
            <>
              <input
                type="search"
                placeholder="例：ご飯、鶏むね、バナナ"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {foods && query.trim() && results.length === 0 && (
                <p className="meal-help">
                  見つかりませんでした。別の呼び方や、短い言葉でも探してみてください。
                  国の成分表にない料理は、材料を1つずつ足すと作れます（例：タコライス＝ご飯・ひき肉・レタス・トマト・チーズ）。よく食べるなら、記録したあとに「☆ 登録」しておくと次から1回で入ります。
                </p>
              )}
              {results.length > 0 && list(results)}
            </>
          )}

          {tab === 'dish' && foods && (
            <>
              <div className="food-categories">
                {groups.map(([name, items]) => (
                  <button key={name} type="button" className={category === name ? 'active' : ''} onClick={() => setCategory(name)}>
                    {name}（{items.length}）
                  </button>
                ))}
              </div>
              {category ? list(groups.find(([name]) => name === category)?.[1] ?? []) : <p className="meal-help">上から料理の種類を選んでください。量は100gあたりで出ています。</p>}
            </>
          )}
        </>
      )}

      <p className="food-source">
        <a href={FOOD_SOURCE_URL} target="_blank" rel="noreferrer">{FOOD_SOURCE}</a>
      </p>
    </div>
  )
}
