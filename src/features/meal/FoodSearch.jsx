import { useEffect, useState } from 'react'
import Stepper from '../../components/Stepper.jsx'
import { FOOD_SOURCE, FOOD_SOURCE_URL, loadFoods, searchFoods } from './foodData.js'

const round1 = (n) => Math.round(n * 10) / 10

// 名前の頭にある分類（＜鳥肉類＞ など）を外して、短くする
function shortName(name) {
  return name.replace(/^＜[^＞]*＞\s*/, '')
}

// 食品成分表から食品を探し、食べた量（g）を入れると、カロリーと PFC を計算して onPick に渡す。
// onPick には { name, kcal, protein, fat, carbs } を渡す（分からない値は null）
export default function FoodSearch({ onPick, onClose }) {
  const [foods, setFoods] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [query, setQuery] = useState('')
  const [food, setFood] = useState(null)
  const [grams, setGrams] = useState('100')

  useEffect(() => {
    loadFoods().then(setFoods).catch((e) => setLoadError(e.message))
  }, [])

  const results = foods ? searchFoods(foods, query) : []
  const g = Number(grams)
  const scaled = (v) => (v === null ? null : round1((v * g) / 100))

  function pick() {
    if (!(g > 0)) return
    onPick({
      name: `${shortName(food.name)} ${g}g`,
      kcal: Math.round((food.kcal * g) / 100),
      protein: scaled(food.protein),
      fat: scaled(food.fat),
      carbs: scaled(food.carbs),
    })
  }

  return (
    <div className="food-search">
      <div className="food-search-head">
        <strong>食品成分表から探す</strong>
        <button type="button" className="food-close" onClick={onClose}>閉じる</button>
      </div>

      {food ? (
        <>
          <p className="food-picked">{shortName(food.name)}</p>
          <label>食べた量（g）</label>
          <Stepper label="食べた量" value={grams} onChange={setGrams} step={10} unit="g" placeholder="100" />
          {g > 0 && (
            <p className="food-values">
              {Math.round((food.kcal * g) / 100)}kcal
              {food.protein !== null && ` ・たんぱく質${scaled(food.protein)}g`}
              {food.fat !== null && ` ・脂質${scaled(food.fat)}g`}
              {food.carbs !== null && ` ・炭水化物${scaled(food.carbs)}g`}
            </p>
          )}
          <div className="food-buttons">
            <button type="button" className="primary" onClick={pick} disabled={!(g > 0)}>この数字を入れる</button>
            <button type="button" className="food-back" onClick={() => setFood(null)}>選び直す</button>
          </div>
        </>
      ) : (
        <>
          <input
            type="search"
            placeholder="例：ご飯、鶏むね、バナナ"
            value={query}
            autoFocus
            onChange={(e) => setQuery(e.target.value)}
          />
          {loadError && <p className="error">{loadError}</p>}
          {!foods && !loadError && <p className="meal-help">食品のデータを読み込んでいます…</p>}
          {foods && query.trim() && results.length === 0 && (
            <p className="meal-help">見つかりませんでした。ひらがな・カタカナや、別の呼び方でも探してみてください。言葉を短くすると見つかりやすくなります。</p>
          )}
          {results.length > 0 && (
            <ul className="food-results">
              {results.map((f) => (
                <li key={f.code}>
                  <button type="button" onClick={() => { setFood(f); setGrams('100') }}>
                    <span>{shortName(f.name)}</span>
                    <span className="food-kcal">{f.kcal}kcal/100g</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <p className="food-source">
        <a href={FOOD_SOURCE_URL} target="_blank" rel="noreferrer">{FOOD_SOURCE}</a>
      </p>
    </div>
  )
}
