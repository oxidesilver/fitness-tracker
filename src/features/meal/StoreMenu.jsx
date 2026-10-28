import { useState } from 'react'
import LabelScan from './LabelScan.jsx'
import { addStoreMenu, loadStoreMenus, nutritionUrl, removeStoreMenu, storeList } from './storeMenus.js'

const EMPTY = { name: '', kcal: '', protein: '', fat: '', carbs: '' }
const NUTRIENTS = [
  { id: 'kcal', label: 'カロリー', unit: 'kcal' },
  { id: 'protein', label: 'たんぱく質', unit: 'g' },
  { id: 'fat', label: '脂質', unit: 'g' },
  { id: 'carbs', label: '炭水化物', unit: 'g' },
]

function toNumber(text) {
  if (String(text).trim() === '') return null
  const n = Number(text)
  return Number.isFinite(n) && n >= 0 && n < 10000 ? n : NaN
}

// 「お店から」：お店を選び、登録したメニューをタップすると献立に入る（onAdd）。
// 初めてのメニューは、公式ページの数字を見て1回だけ登録する（自分のスマホの中にだけ保存）
export default function StoreMenu({ onAdd }) {
  const [menus, setMenus] = useState(loadStoreMenus)
  const [extraStores, setExtraStores] = useState([])
  const [storeName, setStoreName] = useState(null)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [newStore, setNewStore] = useState('')
  const [error, setError] = useState('')
  const [added, setAdded] = useState('')

  const stores = storeList(menus, extraStores)
  const store = stores.find((s) => s.name === storeName)
  const storeMenus = menus.filter((m) => m.store === storeName)

  function selectStore(name) {
    setStoreName(name)
    setAdding(false)
    setEditing(false)
    setError('')
    setAdded('')
  }

  function addStore() {
    const name = newStore.trim()
    if (!name) return
    setExtraStores((list) => [...list, name])
    setNewStore('')
    selectStore(name)
    setAdding(true)
  }

  function pick(menu) {
    onAdd({ code: 'store', name: `${menu.store} ${menu.name}`, grams: null, kcal: menu.kcal, protein: menu.protein, fat: menu.fat, carbs: menu.carbs })
    setAdded(`${menu.name}を献立に入れました`)
  }

  function save() {
    const name = form.name.trim()
    if (!name) return setError('メニューの名前を入れてください')
    const values = {}
    for (const n of NUTRIENTS) {
      const v = toNumber(form[n.id])
      if (Number.isNaN(v)) return setError(`${n.label}を正しく入れてください`)
      values[n.id] = v
    }
    if (values.kcal === null) return setError('カロリーを入れてください')
    setMenus(addStoreMenu({ store: storeName, name, ...values }))
    setForm(EMPTY)
    setAdding(false)
    setError('')
    setAdded(`${name}を登録しました。タップすると献立に入ります`)
  }

  const text = (n) => (n === null ? '' : String(n))

  return (
    <div className="store-menu">
      <p className="meal-help">お店を選んで、登録したメニューをタップすると下の献立に入ります。数字は公式ページを見て、自分で1回だけ登録します（このスマホの中にだけ保存されます）。</p>
      <div className="food-categories">
        {stores.map((s) => (
          <button key={s.id} type="button" className={storeName === s.name ? 'active' : ''} onClick={() => selectStore(s.name)}>
            {s.name}
          </button>
        ))}
      </div>
      <div className="store-add">
        <input type="text" placeholder="ほかのお店の名前" value={newStore} onChange={(e) => setNewStore(e.target.value)} aria-label="ほかのお店の名前" />
        <button type="button" onClick={addStore} disabled={!newStore.trim()}>追加</button>
      </div>

      {store && (
        <div className="store-detail">
          <div className="store-head">
            <strong>{store.name}</strong>
            <a href={nutritionUrl(store)} target="_blank" rel="noreferrer">公式の栄養成分を見る ↗</a>
          </div>
          {added && <p className="meal-saved">✓ {added}</p>}

          {storeMenus.length === 0 ? (
            <p className="meal-help">まだメニューがありません。下の「＋ メニューを登録」から登録してください。</p>
          ) : (
            <>
              <div className="my-foods-head">
                <label>登録したメニュー（タップで献立に入る）</label>
                <button type="button" className="my-foods-edit" onClick={() => setEditing(!editing)}>{editing ? '終わる' : '編集'}</button>
              </div>
              <div className="my-foods-list">
                {storeMenus.map((m) =>
                  editing ? (
                    <button
                      key={m.name}
                      type="button"
                      className="my-food removing"
                      onClick={() => confirm(`「${m.name}」を消しますか？（これまでの記録は消えません）`) && setMenus(removeStoreMenu(m))}
                    >
                      <span className="my-food-name">✕ {m.name}</span>
                    </button>
                  ) : (
                    <button key={m.name} type="button" className="my-food" onClick={() => pick(m)}>
                      <span className="my-food-name">{m.name}</span>
                      <span className="my-food-kcal">{m.kcal}kcal</span>
                    </button>
                  ),
                )}
              </div>
            </>
          )}

          {adding ? (
            <div className="store-form">
              <p className="photo-step">{store.name}のメニューを登録</p>
              <p className="meal-help">「公式の栄養成分を見る」で数字を見て入れます。スクリーンショットから読み取ることもできます（読めないときは手で入れてください）。</p>
              <p className="meal-help store-tip">
                {store.tip ?? '表が横に長くて1枚に収まらないときは、メニューの名前をタップして、そのメニューだけのページを撮ってください。'}
              </p>
              <LabelScan
                label="📷 スクショから読み取る"
                onPick={(v) => setForm((f) => ({ ...f, kcal: text(v.kcal), protein: text(v.protein), fat: text(v.fat), carbs: text(v.carbs) }))}
              />
              <label htmlFor="store-menu-name">メニューの名前</label>
              <input id="store-menu-name" type="text" placeholder="例：牛丼 並盛" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <div className="meal-numbers">
                {NUTRIENTS.map((n) => (
                  <div key={n.id}>
                    <label htmlFor={`store-${n.id}`}>{n.label}</label>
                    <div className="meal-input">
                      <input
                        id={`store-${n.id}`}
                        type="text"
                        inputMode="decimal"
                        placeholder={n.id === 'kcal' ? '必須' : '分かれば'}
                        value={form[n.id]}
                        onChange={(e) => setForm({ ...form, [n.id]: e.target.value })}
                      />
                      <span>{n.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
              {error && <p className="error">{error}</p>}
              <div className="food-buttons">
                <button type="button" className="primary" onClick={save}>登録する</button>
                <button type="button" className="food-back" onClick={() => { setAdding(false); setError('') }}>やめる</button>
              </div>
            </div>
          ) : (
            <button type="button" className="food-open" onClick={() => { setAdding(true); setAdded('') }}>＋ メニューを登録</button>
          )}
        </div>
      )}
    </div>
  )
}
