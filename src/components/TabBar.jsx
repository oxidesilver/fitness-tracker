import './TabBar.css'

// 画面の下に固定するタブ。親指で押しやすい位置に置く。
export default function TabBar({ tabs, current, onChange }) {
  return (
    <nav className="tabbar">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          className={t.id === current ? 'tabbar-item active' : 'tabbar-item'}
          onClick={() => onChange(t.id)}
        >
          <span className="tabbar-icon" aria-hidden="true">{t.icon}</span>
          {t.label}
        </button>
      ))}
    </nav>
  )
}
