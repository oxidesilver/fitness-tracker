import { useState } from 'react'

const NEW_OPTION = '__new__'

// 種目をプルダウンで選ぶ部品。一覧にない種目は「＋ 新しい種目を追加」から追加する。
export default function ExercisePicker({ exercises, selected, onSelect, onAdd }) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')

  function handleChange(e) {
    if (e.target.value === NEW_OPTION) {
      setAdding(true)
      onSelect('')
    } else {
      setAdding(false)
      onSelect(e.target.value)
    }
  }

  function handleAdd() {
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setName('')
    setAdding(false)
  }

  return (
    <div className="picker">
      <select id="workout-exercise" value={adding ? NEW_OPTION : selected} onChange={handleChange}>
        <option value="" disabled>種目を選んでください</option>
        {exercises.map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
        <option value={NEW_OPTION}>＋ 新しい種目を追加</option>
      </select>
      {adding && (
        <div className="picker-add">
          <input
            type="text"
            placeholder="例：懸垂"
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAdd()
              }
            }}
          />
          <button type="button" className="picker-add-ok" onClick={handleAdd}>追加</button>
          <button type="button" className="picker-add-cancel" onClick={() => { setAdding(false); setName('') }}>やめる</button>
        </div>
      )}
    </div>
  )
}
