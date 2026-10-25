import WeightPage from './features/weight/WeightPage.jsx'

// アプリ全体の入れ物。今は体重の画面だけ。
// 筋トレ・食事の画面を作ったら、ここで切り替えられるようにする。
export default function App() {
  return (
    <main className="app">
      <WeightPage />
    </main>
  )
}
