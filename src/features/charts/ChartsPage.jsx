import { useState } from 'react'
import { today } from '../../storage.js'
import { loadGoal } from '../goal/goalStorage.js'
import { loadDailyTarget } from '../goal/target.js'
import { loadMeals } from '../meal/mealStorage.js'
import { loadWeights } from '../weight/weightStorage.js'
import { loadWorkouts } from '../workout/workoutStorage.js'
import WeeklyReview from '../review/WeeklyReview.jsx'
import MealCharts from './MealCharts.jsx'
import WeightChart from './WeightChart.jsx'
import WorkoutCharts from './WorkoutCharts.jsx'
import './charts.css'

const RANGES = [
  { id: '1m', label: '1か月', days: 30 },
  { id: '3m', label: '3か月', days: 90 },
  { id: 'all', label: 'すべて', days: null },
]
const RANGE_KEY = 'fitness-tracker.chartRange'

function daysAgo(date, days) {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d - days)).toISOString().slice(0, 10)
}

// グラフの画面。上の期間の切り替えは、この画面のグラフ全部に効く。
// 体重・筋トレ・食事のグラフを順に並べる。
export default function ChartsPage() {
  const [weights] = useState(loadWeights)
  const [goal] = useState(loadGoal)
  const [workouts] = useState(loadWorkouts)
  const [meals] = useState(loadMeals)
  const [target] = useState(loadDailyTarget)
  const [range, setRange] = useState(() => {
    try {
      return RANGES.some((r) => r.id === localStorage.getItem(RANGE_KEY)) ? localStorage.getItem(RANGE_KEY) : '1m'
    } catch {
      return '1m'
    }
  })

  function changeRange(id) {
    setRange(id)
    try {
      localStorage.setItem(RANGE_KEY, id)
    } catch {
      // 覚えられなくても切り替えはできる
    }
  }

  const to = today()
  const days = RANGES.find((r) => r.id === range).days
  const oldest = [...weights, ...workouts, ...meals].reduce((min, w) => (w.date < min ? w.date : min), to)
  const from = days === null ? (oldest < to ? oldest : daysAgo(to, 7)) : daysAgo(to, days)

  return (
    <section>
      <h1>グラフ</h1>
      <WeeklyReview workouts={workouts} meals={meals} weights={weights} target={target} goal={goal} />

      <div className="segment segment-3 chart-range" role="group" aria-label="表示する期間">
        {RANGES.map((r) => (
          <button key={r.id} type="button" className={range === r.id ? 'active' : ''} onClick={() => changeRange(r.id)}>
            {r.label}
          </button>
        ))}
      </div>

      <h2 className="chart-section">体重</h2>
      <WeightChart weights={weights} goal={goal} from={from} to={to} />

      <h2 className="chart-section">筋トレ</h2>
      <WorkoutCharts workouts={workouts} weights={weights} from={from} to={to} />

      <h2 className="chart-section">食事</h2>
      <MealCharts meals={meals} target={target} from={from} to={to} daily={range === '1m'} />
    </section>
  )
}
