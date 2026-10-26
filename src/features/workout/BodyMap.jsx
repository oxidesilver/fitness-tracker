// 体の前と後ろの簡単な絵で、鍛える筋肉の場所に色を付ける部品（SVG）。
// muscles：['chest', 'abs', ...]（名前は下の MUSCLES）
export const MUSCLES = {
  chest: '胸',
  shoulders: '肩',
  biceps: '腕の前',
  triceps: '腕の後ろ',
  abs: 'おなか',
  back: '背中',
  lowerBack: '腰',
  glutes: 'お尻',
  quads: '太ももの前',
  hamstrings: '太ももの後ろ',
  calves: 'ふくらはぎ',
}

// それぞれの場所の形（左右の2つ）。x, y, 幅, 高さ, 角の丸み
const FRONT = {
  shoulders: [[19, 40, 14, 12, 6], [67, 40, 14, 12, 6]],
  chest: [[32, 46, 17, 20, 4], [51, 46, 17, 20, 4]],
  biceps: [[18, 54, 10, 24, 5], [72, 54, 10, 24, 5]],
  abs: [[38, 68, 24, 40, 4]],
  quads: [[32, 114, 16, 44, 6], [52, 114, 16, 44, 6]],
}
const BACK = {
  shoulders: [[19, 40, 14, 12, 6], [67, 40, 14, 12, 6]],
  back: [[32, 46, 36, 38, 5]],
  triceps: [[18, 54, 10, 24, 5], [72, 54, 10, 24, 5]],
  lowerBack: [[38, 86, 24, 20, 4]],
  glutes: [[32, 108, 17, 20, 7], [51, 108, 17, 20, 7]],
  hamstrings: [[32, 130, 16, 30, 6], [52, 130, 16, 30, 6]],
  calves: [[33, 164, 14, 28, 6], [53, 164, 14, 28, 6]],
}

function Figure({ parts, muscles, label }) {
  return (
    <figure className="body-figure">
      <svg viewBox="0 0 100 200" role="img" aria-label={label}>
        {/* 体の形（色の付かない部分） */}
        <g className="body-base">
          <circle cx="50" cy="20" r="12" />
          <rect x="30" y="36" width="40" height="76" rx="10" />
          <rect x="17" y="40" width="12" height="76" rx="6" />
          <rect x="71" y="40" width="12" height="76" rx="6" />
          <rect x="31" y="108" width="18" height="88" rx="7" />
          <rect x="51" y="108" width="18" height="88" rx="7" />
        </g>
        {Object.entries(parts).map(([name, rects]) =>
          rects.map(([x, y, w, h, r], i) => (
            <rect key={`${name}-${i}`} className={muscles.includes(name) ? 'body-part active' : 'body-part'} x={x} y={y} width={w} height={h} rx={r} />
          )),
        )}
      </svg>
      <figcaption>{label}</figcaption>
    </figure>
  )
}

export default function BodyMap({ muscles }) {
  return (
    <div className="body-map">
      <div className="body-figures">
        <Figure parts={FRONT} muscles={muscles} label="前" />
        <Figure parts={BACK} muscles={muscles} label="後ろ" />
      </div>
      <p className="body-legend">
        <span className="body-legend-key" aria-hidden="true" />
        鍛える場所：{muscles.map((m) => MUSCLES[m]).join('・')}
      </p>
    </div>
  )
}
