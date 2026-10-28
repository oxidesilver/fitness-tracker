import BodyMap from './BodyMap.jsx'
import { videoSearchUrl } from './workoutGuide.js'

// 種目のやり方（鍛える場所の絵・手順・注意・動画の検索）。おすすめメニューと記録の欄で使う
export default function ExerciseGuide({ name, guide }) {
  return (
    <div className="recommend-guide">
      <BodyMap muscles={guide.muscles} />
      <ol className="guide-steps">
        {guide.steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      <p className="workout-note">⚠️ {guide.tip}</p>
      <a className="guide-video" href={videoSearchUrl(name)} target="_blank" rel="noreferrer">
        ▶ YouTube でやり方の動画を探す
      </a>
    </div>
  )
}
