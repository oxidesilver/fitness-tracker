import { useState } from 'react'
import TabBar from './components/TabBar.jsx'
import MealPage from './features/meal/MealPage.jsx'
import ProfilePage from './features/profile/ProfilePage.jsx'
import WeightPage from './features/weight/WeightPage.jsx'
import WorkoutPage from './features/workout/WorkoutPage.jsx'

// 画面の一覧。新しい機能を作ったら、ここに1行足す。
const TABS = [
  { id: 'workout', label: '筋トレ', icon: '💪', Page: WorkoutPage },
  { id: 'meal', label: '食事', icon: '🍚', Page: MealPage },
  { id: 'weight', label: '体重', icon: '⚖️', Page: WeightPage },
  { id: 'profile', label: 'プロフィール', icon: '👤', Page: ProfilePage },
]

const TAB_KEY = 'fitness-tracker.tab'

// 最後に開いていた画面を覚えておく
function loadTab() {
  try {
    const saved = localStorage.getItem(TAB_KEY)
    return TABS.some((t) => t.id === saved) ? saved : TABS[0].id
  } catch {
    return TABS[0].id
  }
}

export default function App() {
  const [tab, setTab] = useState(loadTab)
  const { Page } = TABS.find((t) => t.id === tab)

  function changeTab(id) {
    setTab(id)
    try {
      localStorage.setItem(TAB_KEY, id)
    } catch {
      // 保存できなくても画面の切り替えはできる
    }
    window.scrollTo(0, 0)
  }

  return (
    <>
      <main className="app">
        <Page />
      </main>
      <TabBar tabs={TABS} current={tab} onChange={changeTab} />
    </>
  )
}
