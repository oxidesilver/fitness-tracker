import { useState } from 'react'
import { formatDate, today } from '../../storage.js'
import { loadDailyTarget } from '../goal/target.js'
import FoodSearch from './FoodSearch.jsx'
import PhotoImport from './PhotoImport.jsx'
import { MEAL_TIMES, addMeal, defaultMealTime, deleteMeal, frequentFoods, loadMeals } from './mealStorage.js'
import './meal.css'

const EMPTY_FORM = { name: '', kcal: '', protein: '', fat: '', carbs: '' }

const NUTRIENTS = [
  { id: 'kcal', label: 'カロリー', unit: 'kcal' },
  { id: 'protein', label: 'たんぱく質（P）', unit: 'g' },
  { id: 'fat', label: '脂質（F）', unit: 'g' },
  { id: 'carbs', label: '炭水化物（C）', unit: 'g' },
]

// 入力欄の文字を数字に直す。空なら null、正しくなければ NaN
function toNumber(text) {
  if (String(text).trim() === '') return null
  const n = Number(text)
  return Number.isFinite(n) && n >= 0 && n < 10000 ? n : NaN
}

// その日の合計
function sumOf(meals) {
  const total = { kcal: 0, protein: 0, fat: 0, carbs: 0 }
  for (const m of meals) for (const k of Object.keys(total)) total[k] += m[k] ?? 0
  return total
}

export default function MealPage() {
  const [records, setRecords] = useState(loadMeals)
  const [target] = useState(loadDailyTarget)
  const [date, setDate] = useState(today)
  const [time, setTime] = useState(() => defaultMealTime())
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')
  // 開いている入力の手伝い：'table'（食品成分表）・'photo'（写真）・null
  const [helper, setHelper] = useState(null)

  const dayMeals = records.filter((r) => r.date === date)
  const total = sumOf(dayMeals)
  const foods = frequentFoods(records)

  function update(field, value) {
    setForm({ ...form, [field]: value })
    setSaved('')
  }

  // よく食べるものを選ぶと、名前と数字が入る
  function pickFood(name) {
    const food = foods.find((f) => f.name === name)
    if (!food) return
    const text = (n) => (n === null || n === undefined ? '' : String(n))
    setForm({ name: food.name, kcal: text(food.kcal), protein: text(food.protein), fat: text(food.fat), carbs: text(food.carbs) })
    setSaved('')
  }

  // 食品成分表や写真から出した名前と数字を入れる
  function pickFromHelper(food) {
    const text = (n) => (n === null ? '' : String(n))
    setForm({ name: food.name, kcal: text(food.kcal), protein: text(food.protein), fat: text(food.fat), carbs: text(food.carbs) })
    setHelper(null)
    setSaved('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    const name = form.name.trim()
    if (!date) return setError('日付を入れてください')
    if (!name) return setError('何を食べたかを入れてください')
    const values = {}
    for (const n of NUTRIENTS) {
      const v = toNumber(form[n.id])
      if (Number.isNaN(v)) return setError(`${n.label}を正しく入れてください`)
      values[n.id] = v
    }
    if (values.kcal === null) return setError('カロリーを入れてください')

    setRecords(addMeal({ date, time, name, ...values }))
    setForm(EMPTY_FORM)
    setError('')
    setSaved(`${name}を記録しました`)
  }

  function handleDelete(meal) {
    if (confirm(`「${meal.name}」を消しますか？`)) {
      setRecords(deleteMeal(meal.id))
    }
  }

  return (
    <section>
      <h1>食事</h1>

      <label htmlFor="meal-date">日付</label>
      <input id="meal-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />

      <div className="card meal-summary">
        <h2>{date === today() ? '今日' : formatDate(date)}の合計</h2>
        {NUTRIENTS.map((n) => {
          const goal = target?.[n.id]
          const ratio = goal ? Math.min(1, total[n.id] / goal) : 0
          const over = goal && total[n.id] > goal
          return (
            <div key={n.id} className="meal-bar">
              <div className="meal-bar-text">
                <span>{n.label}</span>
                <span>
                  <strong>{Math.round(total[n.id]).toLocaleString()}</strong>
                  {goal ? ` / ${Math.round(goal).toLocaleString()}` : ''} {n.unit}
                </span>
              </div>
              {goal && (
                <>
                  <div className="meal-bar-track">
                    <div className={over ? 'meal-bar-fill over' : 'meal-bar-fill'} style={{ width: `${ratio * 100}%` }} />
                  </div>
                  <p className={over ? 'meal-left over' : 'meal-left'}>
                    {over
                      ? `${Math.round(total[n.id] - goal).toLocaleString()}${n.unit} 多い`
                      : `あと ${Math.round(goal - total[n.id]).toLocaleString()}${n.unit}`}
                  </p>
                </>
              )}
            </div>
          )
        })}
        {!target && <p className="meal-help">プロフィールの画面で目標を入れると、目標との比較が出ます。</p>}
      </div>

      <h2>記録する</h2>
      <form className="card" onSubmit={handleSubmit}>
        <label>いつ</label>
        <div className="segment segment-4">
          {MEAL_TIMES.map((t) => (
            <button key={t.id} type="button" className={time === t.id ? 'active' : ''} onClick={() => setTime(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {foods.length > 0 && (
          <>
            <label htmlFor="meal-frequent">よく食べるものから選ぶ</label>
            <select id="meal-frequent" className="meal-select" value="" onChange={(e) => pickFood(e.target.value)}>
              <option value="" disabled>選ぶと下に数字が入ります</option>
              {foods.map((f) => (
                <option key={f.name} value={f.name}>{f.name}（{f.kcal}kcal）</option>
              ))}
            </select>
          </>
        )}

        {helper === 'table' && <FoodSearch onPick={pickFromHelper} onClose={() => setHelper(null)} />}
        {helper === 'photo' && <PhotoImport onPick={pickFromHelper} onClose={() => setHelper(null)} />}
        {helper === null && (
          <div className="helper-buttons">
            <button type="button" className="food-open" onClick={() => setHelper('table')}>🔍 食品成分表から</button>
            <button type="button" className="food-open" onClick={() => setHelper('photo')}>📷 写真から</button>
          </div>
        )}

        <label htmlFor="meal-name">何を食べたか</label>
        <input id="meal-name" type="text" placeholder="例：鶏むね肉のサラダ" value={form.name} onChange={(e) => update('name', e.target.value)} />

        <div className="meal-numbers">
          {NUTRIENTS.map((n) => (
            <div key={n.id}>
              <label htmlFor={`meal-${n.id}`}>{n.label}</label>
              <div className="meal-input">
                <input
                  id={`meal-${n.id}`}
                  type="text"
                  inputMode="decimal"
                  placeholder={n.id === 'kcal' ? '必須' : '分かれば'}
                  value={form[n.id]}
                  onChange={(e) => update(n.id, e.target.value)}
                />
                <span>{n.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {error && <p className="error">{error}</p>}
        {saved && <p className="meal-saved">✓ {saved}</p>}
        <button type="submit" className="primary">記録する</button>
      </form>

      <h2>{date === today() ? '今日' : formatDate(date)}の食事</h2>
      {dayMeals.length === 0 ? (
        <p className="meal-empty">まだ記録がありません</p>
      ) : (
        MEAL_TIMES.filter((t) => dayMeals.some((m) => m.time === t.id)).map((t) => (
          <div key={t.id} className="meal-group">
            <h3>{t.label}</h3>
            <ul className="card meal-list">
              {dayMeals.filter((m) => m.time === t.id).map((m) => (
                <li key={m.id}>
                  <div className="meal-item">
                    <span className="meal-name">{m.name}</span>
                    <span className="meal-detail">
                      {m.kcal}kcal
                      {m.protein !== null && ` ・P${m.protein}g`}
                      {m.fat !== null && ` ・F${m.fat}g`}
                      {m.carbs !== null && ` ・C${m.carbs}g`}
                    </span>
                  </div>
                  <button type="button" className="meal-delete" onClick={() => handleDelete(m)}>
                    消す
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </section>
  )
}
