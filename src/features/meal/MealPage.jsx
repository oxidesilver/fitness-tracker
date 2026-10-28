import { useState } from 'react'
import { formatDate, today } from '../../storage.js'
import { loadDailyTarget } from '../goal/target.js'
import FoodSearch from './FoodSearch.jsx'
import LabelScan from './LabelScan.jsx'
import StoreMenu from './StoreMenu.jsx'
import MyFoods from './MyFoods.jsx'
import PhotoImport from './PhotoImport.jsx'
import {
  MEAL_TIMES,
  addMeal,
  addMyFood,
  defaultMealTime,
  deleteMeal,
  frequentFoods,
  loadMeals,
  loadMyFoods,
  removeMyFood,
} from './mealStorage.js'
import './meal.css'

const EMPTY_FORM = { name: '', kcal: '', protein: '', fat: '', carbs: '' }

// 入れ方：build（食品・料理を選んで献立を作る）、store（お店の登録したメニューから）、label（栄養成分表示を見て数字を入れる）
// build と store は同じ献立（items）に足していく
const MODES = [
  { id: 'build', label: '選んで作る' },
  { id: 'store', label: 'お店から' },
  { id: 'label', label: '成分表示から' },
]

const round1 = (n) => Math.round(n * 10) / 10

// 献立の合計。分からない値（null）は 0 として足す
function itemsTotal(items) {
  const sum = (k) => items.reduce((a, i) => a + (i[k] ?? 0), 0)
  return { kcal: Math.round(sum('kcal')), protein: round1(sum('protein')), fat: round1(sum('fat')), carbs: round1(sum('carbs')) }
}

// 献立から名前を作る：'ご飯 150g・鶏むね 100g'（3つより多いときは「ほか」）
function itemsName(items) {
  const names = items.map((i) => (i.grams ? `${i.name} ${i.grams}g` : i.name))
  return names.length > 3 ? `${names.slice(0, 3).join('・')} ほか${names.length - 3}品` : names.join('・')
}

const NUTRIENTS = [
  { id: 'kcal', label: 'カロリー', unit: 'kcal' },
  { id: 'protein', label: 'たんぱく質', unit: 'g' },
  { id: 'fat', label: '脂質', unit: 'g' },
  { id: 'carbs', label: '炭水化物', unit: 'g' },
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
  const [mode, setMode] = useState('build')
  // 献立（選んで作る）の中身：[{ code, name, grams, kcal, protein, fat, carbs }]
  const [items, setItems] = useState([])
  // 献立に入れた料理のひな形の名前（名前を空にしたときの自動の名前に使う：'タコライス・豆腐とわかめのみそ汁'）
  const [recipeNames, setRecipeNames] = useState([])
  // 開いている入力の手伝い：'table'（食品・料理を追加）・'photo'（写真）・null
  const [helper, setHelper] = useState(null)
  const [myFoods, setMyFoods] = useState(loadMyFoods)
  // 登録した食品をタップして記録したもの（取り消しに使う）
  const [quick, setQuick] = useState(null)

  const dayMeals = records.filter((r) => r.date === date)
  const total = sumOf(dayMeals)
  const foods = frequentFoods(records)
  const autoName = recipeNames.length ? [...new Set(recipeNames)].join('・') : itemsName(items)

  function update(field, value) {
    setForm({ ...form, [field]: value })
    setSaved('')
  }

  // 登録した食品をタップしたら、選んでいる日付・いつで、すぐに記録する
  function recordMyFood(food) {
    const { name, kcal, protein, fat, carbs, items } = food
    const next = addMeal({ date, time, name, kcal, protein, fat, carbs, ...(items ? { items } : {}) })
    setRecords(next)
    setQuick(next[next.length - 1])
    setSaved('')
    setError('')
  }

  function undoQuick() {
    setRecords(deleteMeal(quick.id))
    setQuick(null)
  }

  function toggleMyFood(meal) {
    if (myFoods.some((f) => f.name === meal.name)) {
      if (confirm(`「${meal.name}」の登録を外しますか？（これまでの記録は消えません）`)) setMyFoods(removeMyFood(meal.name))
    } else {
      setMyFoods(addMyFood(meal))
    }
  }

  // よく食べるものを選ぶ。献立で作った食事なら献立ごと、そうでなければ数字を入れる
  function pickFood(name) {
    const food = foods.find((f) => f.name === name)
    if (!food) return
    setSaved('')
    setError('')
    if (food.items?.length) {
      setMode('build')
      setItems(food.items)
      setRecipeNames([])
      setForm({ ...EMPTY_FORM, name: food.name })
      return
    }
    const text = (n) => (n === null || n === undefined ? '' : String(n))
    setMode('label')
    setItems([])
    setRecipeNames([])
    setForm({ name: food.name, kcal: text(food.kcal), protein: text(food.protein), fat: text(food.fat), carbs: text(food.carbs) })
  }

  // 写真から出した名前と数字を、栄養成分表示の欄に入れる
  function pickFromPhoto(food) {
    const text = (n) => (n === null ? '' : String(n))
    setForm({ name: food.name, kcal: text(food.kcal), protein: text(food.protein), fat: text(food.fat), carbs: text(food.carbs) })
    setHelper(null)
    setSaved('')
  }

  // 栄養成分表示の写真から読んだ数字を入れる（名前は読めないので、入っている名前はそのまま）
  function pickFromLabel(values) {
    const text = (n) => (n === null ? '' : String(n))
    setForm((f) => ({ ...f, kcal: text(values.kcal), protein: text(values.protein), fat: text(values.fat), carbs: text(values.carbs) }))
    setSaved('')
    setError('')
  }

  function addItem(item) {
    setItems((list) => [...list, item])
    setSaved('')
    setError('')
  }

  function removeItem(index) {
    setItems((list) => list.filter((_, i) => i !== index))
  }

  function changeMode(id) {
    setMode(id)
    setHelper(null)
    setError('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!date) return setError('日付を入れてください')

    let record
    if (mode !== 'label') {
      if (items.length === 0) {
        return setError(mode === 'store' ? 'お店を選んで、メニューをタップしてください' : '「＋ 食品・料理を追加」から、食べたものを選んでください')
      }
      const name = form.name.trim() || autoName
      record = { date, time, name, ...itemsTotal(items), items }
    } else {
      const name = form.name.trim()
      if (!name) return setError('何を食べたかを入れてください')
      const values = {}
      for (const n of NUTRIENTS) {
        const v = toNumber(form[n.id])
        if (Number.isNaN(v)) return setError(`${n.label}を正しく入れてください`)
        values[n.id] = v
      }
      if (values.kcal === null) return setError('カロリーを入れてください')
      record = { date, time, name, ...values }
    }

    setRecords(addMeal(record))
    setQuick(null)
    setForm(EMPTY_FORM)
    setItems([])
    setRecipeNames([])
    setHelper(null)
    setError('')
    setSaved(`${record.name}を記録しました`)
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

        <MyFoods foods={myFoods} onRecord={recordMyFood} onRemove={(name) => setMyFoods(removeMyFood(name))} />
        {quick && (
          <p className="meal-saved my-food-done">
            ✓ {quick.name}を{MEAL_TIMES.find((t) => t.id === quick.time).label}に記録しました
            <button type="button" className="my-food-undo" onClick={undoQuick}>取り消す</button>
          </p>
        )}

        {foods.length > 0 && (
          <>
            <label htmlFor="meal-frequent">よく食べるものから選ぶ</label>
            <select id="meal-frequent" className="meal-select" value="" onChange={(e) => pickFood(e.target.value)}>
              <option value="" disabled>選ぶと下に入ります</option>
              {foods.map((f) => (
                <option key={f.name} value={f.name}>{f.name}（{f.kcal}kcal）</option>
              ))}
            </select>
          </>
        )}

        <div className="segment meal-modes" role="group" aria-label="入れ方">
          {MODES.map((m) => (
            <button key={m.id} type="button" className={mode === m.id ? 'active' : ''} onClick={() => changeMode(m.id)}>
              {m.label}
            </button>
          ))}
        </div>

        {mode !== 'label' ? (
          <>
            {mode === 'build' && <p className="meal-help">食品や料理を選んで、1回の食事（献立）を作ります。自炊やふだんの食事に使います。</p>}
            {mode === 'store' && <StoreMenu onAdd={addItem} />}
            {items.length > 0 && (
              <ul className="meal-items">
                {items.map((it, i) => (
                  <li key={`${it.code}-${i}`}>
                    <div>
                      <span className="meal-item-name">{it.name}</span>
                      <span className="meal-detail">{it.grams ? `${it.grams}g・` : ''}{it.kcal}kcal</span>
                    </div>
                    <button type="button" className="meal-item-remove" aria-label={`${it.name}を外す`} onClick={() => removeItem(i)}>✕</button>
                  </li>
                ))}
              </ul>
            )}
            {mode === 'store' ? null : helper === 'table' ? (
              <FoodSearch
                onAdd={addItem}
                onRecipe={(name) => setRecipeNames((list) => [...list, name])}
                onClose={() => setHelper(null)}
              />
            ) : (
              <button type="button" className="food-open" onClick={() => setHelper('table')}>＋ 食品・料理を追加</button>
            )}
            {items.length > 0 && (
              <>
                <p className="meal-items-total">
                  合計 <strong>{itemsTotal(items).kcal}kcal</strong>
                  ・たんぱく質{itemsTotal(items).protein}g・脂質{itemsTotal(items).fat}g・炭水化物{itemsTotal(items).carbs}g
                </p>
                <label htmlFor="meal-name">名前（空なら自動でつけます）</label>
                <input id="meal-name" type="text" placeholder={autoName} value={form.name} onChange={(e) => update('name', e.target.value)} />
              </>
            )}
          </>
        ) : (
          <>
            <p className="meal-help">
              お店で買ったお弁当・パン・お菓子などは、袋や箱の「栄養成分表示」の数字をそのまま入れるのがいちばん正確です。外食などで表示がないときは、写真から入れられます。
            </p>
            <LabelScan onPick={pickFromLabel} />
            {helper === 'photo' ? (
              <PhotoImport onPick={pickFromPhoto} onClose={() => setHelper(null)} />
            ) : (
              <button type="button" className="food-open" onClick={() => setHelper('photo')}>📷 写真から（外食など）</button>
            )}

            <label htmlFor="meal-name">何を食べたか</label>
            <input id="meal-name" type="text" placeholder="例：コンビニのおにぎり（鮭）" value={form.name} onChange={(e) => update('name', e.target.value)} />

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
          </>
        )}

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
                      {m.protein !== null && ` ・たんぱく質${m.protein}g`}
                      {m.fat !== null && ` ・脂質${m.fat}g`}
                      {m.carbs !== null && ` ・炭水化物${m.carbs}g`}
                    </span>
                  </div>
                  <div className="meal-actions">
                    <button
                      type="button"
                      className={myFoods.some((f) => f.name === m.name) ? 'meal-register registered' : 'meal-register'}
                      onClick={() => toggleMyFood(m)}
                    >
                      {myFoods.some((f) => f.name === m.name) ? '★ 登録済み' : '☆ 登録'}
                    </button>
                    <button type="button" className="meal-delete" onClick={() => handleDelete(m)}>
                      消す
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </section>
  )
}
