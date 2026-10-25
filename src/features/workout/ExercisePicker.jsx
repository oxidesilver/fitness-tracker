import { useState } from 'react'

// 種目をボタンで選ぶ部品。一覧にない種目は「＋ 新しい種目」から追加する。
export default function ExercisePicker({ exercises, selected, onSelect, onAdd }) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')

  function handleAdd() {
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setName('')
    setAdding(false)
  }

  return (
    <div className="picker">
      <div className="picker-chips">
        {exercises.map((n) => (
          <button
            key={n}
            type="button"
            className={n === selected ? 'chip active' : 'chip'}
            onClick={() => onSelect(n === selected ? '' : n)}
          >
            {n}
          </button>
        ))}
        {!adding && (
          <button type="button" className="chip chip-add" onClick={() => setAdding(true)}>
            ＋ 新しい種目
          </button>
        )}
      </div>
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
