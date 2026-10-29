// 週の振り返り：1週間（月〜日）の筋トレ・食事・体重を評価して、改善策を出す。
// AI は使わず、下の決まり（根拠のある目安）で判断する。本人と相談して決めた（2026-10-29）
import { addDays, weekStart } from '../charts/dates.js'
import { mealScore } from '../meal/mealScore.js'
import { GUIDE } from '../workout/workoutGuide.js'

export const SOURCES = {
  volume: {
    label: 'Schoenfeld ほか 2017（週10セット以上で筋肉が最も増えた）',
    url: 'https://paulogentil.com/pdf/Dose-response%20relationship%20between%20weekly%20resistance%20training%20volume%20and%20increases%20in%20muscle%20mass%20-%20A%20systematic%20review%20and%20metaanalysis.pdf',
  },
  frequency: { label: 'Schoenfeld ほか 2016（同じ筋肉は週2回がよい）', url: 'https://pubmed.ncbi.nlm.nih.gov/27102172/' },
  protein: { label: 'Morton ほか 2018（たんぱく質は体重×1.6gで頭打ち）', url: 'https://pubmed.ncbi.nlm.nih.gov/28698222/' },
  deficit: {
    label: 'Murphy・Koehler 2022（1日約500kcal以上足りないと筋肉が増えにくい）',
    url: 'https://portal.fis.tum.de/en/publications/energy-deficiency-impairs-resistance-training-gains-in-lean-mass-/',
  },
  overload: { label: 'ACSM 2009（少しずつ重くする：2〜10%）', url: 'https://sfu.ca/~ryand/kin343/ACSMresistance.pdf' },
  rate: { label: 'Helms ほか 2014（減量が速すぎると筋肉が落ちやすい）', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4033492/' },
  kijun: { label: '日本人の食事摂取基準（2025年版）（脂質はカロリーの20〜30%）', url: 'https://www.mhlw.go.jp/content/10904750/001316465.pdf' },
}

// 部位（ユーザーが見る分け方）。種目のいちばん大きな筋肉で決める。おなかは数えない
export const AREAS = [
  { id: 'chest', label: '胸' },
  { id: 'back', label: '背中' },
  { id: 'shoulders', label: '肩' },
  { id: 'legs', label: '脚' },
  { id: 'arms', label: '腕' },
]
const AREA_OF = {
  chest: 'chest', chestUpper: 'chest', chestMiddle: 'chest', chestLower: 'chest',
  back: 'back', lowerBack: 'back',
  shoulders: 'shoulders',
  quads: 'legs', hamstrings: 'legs', glutes: 'legs', calves: 'legs',
  biceps: 'arms', triceps: 'arms',
}
const areaOf = (exercise) => AREA_OF[GUIDE[exercise]?.muscles[0]] ?? null

export const SETS_TARGET = 10 // 部位ごとの週のセット数の目安（Schoenfeld 2017）
export const PLATEAU_WEEKS = 3 // 何週続けて伸びなければ停滞とみなすか（アプリの決め）

const inWeek = (date, start) => date >= start && date <= addDays(start, 6)

// 1セットの強さ：重りのある種目は「1回だけ上げられる重さ」の推定（Epley の式：重さ ×（1 ＋ 回数 ÷ 30））、自重は回数
function setStrength(s) {
  return s.weightKg ? s.weightKg * (1 + s.reps / 30) : s.reps
}

// 種目ごと・週ごとのいちばん強いセット：Map(種目 → Map(週の月曜 → 強さ))
function weeklyBest(workouts) {
  const map = new Map()
  for (const r of workouts) {
    if (!r.sets?.length) continue
    const w = weekStart(r.date)
    const best = Math.max(...r.sets.map(setStrength))
    if (!map.has(r.exercise)) map.set(r.exercise, new Map())
    const weeks = map.get(r.exercise)
    weeks.set(w, Math.max(weeks.get(w) ?? 0, best))
  }
  return map
}

// 重量の伸び：その週に自己ベストを更新した種目と、PLATEAU_WEEKS 週続けて伸びていない種目
function progress(workouts, start) {
  const improved = []
  const stalled = []
  for (const [exercise, weeks] of weeklyBest(workouts)) {
    const recent = Array.from({ length: PLATEAU_WEEKS }, (_, i) => addDays(start, -7 * i))
    const before = [...weeks].filter(([w]) => w < recent[recent.length - 1]).map(([, v]) => v)
    const thisWeek = weeks.get(start)
    const earlier = [...weeks].filter(([w]) => w < start).map(([, v]) => v)
    if (thisWeek !== undefined && earlier.length && thisWeek > Math.max(...earlier)) improved.push(exercise)
    // 最近の週それぞれにやっていて、その前の自己ベストを一度も超えていない
    if (before.length && recent.every((w) => weeks.has(w)) && Math.max(...recent.map((w) => weeks.get(w))) <= Math.max(...before)) {
      stalled.push(exercise)
    }
  }
  return { improved, stalled }
}

// その週の食事：日ごとの合計
function mealDays(meals, start) {
  const days = new Map()
  for (const m of meals.filter((x) => inWeek(x.date, start))) {
    const d = days.get(m.date) ?? { kcal: 0, protein: 0, fat: 0, carbs: 0 }
    for (const k of Object.keys(d)) d[k] += m[k] ?? 0
    days.set(m.date, d)
  }
  return [...days.values()]
}

// その週の最後の体重（なければ null）
function lastWeight(weights, start) {
  const list = weights.filter((w) => inWeek(w.date, start)).sort((a, b) => a.date.localeCompare(b.date))
  return list.length ? list[list.length - 1].weightKg : null
}

const round = (n) => Math.round(n)
const r1 = (n) => Math.round(n * 10) / 10

// 1週間の振り返り。start は週の月曜日。
// 戻り値：{ start, end, good: [文], advice: [{ title, detail, sources: [キー] }], stats }
export function weeklyReview({ start, workouts, meals, weights, target, plan, goal }) {
  const good = []
  const advice = []
  const end = addDays(start, 6)

  // --- 筋トレ ---
  const week = workouts.filter((r) => inWeek(r.date, start))
  const strength = week.filter((r) => r.sets?.length)
  const trainingDays = new Set(week.map((r) => r.date)).size
  const sets = Object.fromEntries(AREAS.map((a) => [a.id, 0]))
  const areaDays = Object.fromEntries(AREAS.map((a) => [a.id, new Set()]))
  for (const r of strength) {
    const area = areaOf(r.exercise)
    if (!area) continue
    sets[area] += r.sets.length
    areaDays[area].add(r.date)
  }

  const planned = Number(plan?.sessions) || 0
  if (planned && trainingDays < planned) {
    advice.push({ title: `運動した日が週${trainingDays}日（計画は週${planned}日）`, detail: '計画の回数を目指しましょう。むずかしければ、プロフィールの運動の計画を、続けられる回数に直すのも大事です。', sources: [] })
  } else if (trainingDays > 0) {
    good.push(`週${trainingDays}日運動できました${planned ? `（計画は週${planned}日）` : ''}`)
  }

  if (strength.length) {
    const low = AREAS.filter((a) => sets[a.id] < SETS_TARGET)
    const once = AREAS.filter((a) => areaDays[a.id].size === 1)
    if (low.length) {
      advice.push({
        title: `週のセット数が10より少ない部位：${low.map((a) => `${a.label} ${sets[a.id]}セット`).join('・')}`,
        detail: 'それぞれの部位を週10セット以上にすると、筋肉が増えやすくなります。おすすめメニューの種目を足すか、セットを増やしましょう。',
        sources: ['volume'],
      })
    } else {
      good.push('どの部位も週10セット以上できました')
    }
    if (once.length) {
      advice.push({
        title: `週1日だけの部位：${once.map((a) => a.label).join('・')}`,
        detail: '同じセット数でも、週2日に分けたほうが筋肉が増えやすいと分かっています。',
        sources: ['frequency'],
      })
    }
  }

  // --- 食事 ---
  const days = mealDays(meals, start)
  const weightKg = target?.weightKg ?? null
  const avg = (k) => days.reduce((a, d) => a + d[k], 0) / (days.length || 1)
  const avgProtein = avg('protein')
  const proteinLow = Boolean(weightKg && days.length && avgProtein < weightKg * 1.6)
  // 消費カロリー（ふだんの活動量＋運動の計画）より 500kcal 以上少ない日。目標どおりに食べていても、減量のペースが速いとこうなる
  const deficitDays = target?.expenditure ? days.filter((d) => target.expenditure - d.kcal >= 500).length : 0
  const bigDeficit = days.length > 0 && deficitDays * 2 >= days.length
  const fatHighDays = days.filter((d) => d.kcal > 0 && (d.fat * 9 * 100) / d.kcal > 30).length
  const scores = target ? days.map((d) => mealScore(d, target)?.score).filter((s) => s != null) : []

  if (days.length && days.length < 5) {
    advice.push({ title: `食事を記録した日が7日中${days.length}日`, detail: '記録が少ないと、この振り返りがあてになりにくくなります。食べた日はなるべく全部記録しましょう。', sources: [] })
  }
  if (days.length) {
    if (proteinLow) {
      advice.push({
        title: `たんぱく質が平均${round(avgProtein)}g（体重×1.6g＝${round(weightKg * 1.6)}gに届いていない）`,
        detail: '筋肉を増やすには、たんぱく質を体重×1.6gくらいとると効果が大きいと分かっています。肉・魚・卵・大豆製品やプロテインを足しましょう。',
        sources: ['protein'],
      })
    } else if (weightKg) {
      good.push(`たんぱく質を平均${round(avgProtein)}g（体重×${r1(avgProtein / weightKg)}g）とれました`)
    }
    if (fatHighDays > 0) {
      advice.push({
        title: `脂質がカロリーの30%を超えた日が${fatHighDays}日`,
        detail: '揚げ物・脂の多い肉・お菓子を減らすと、同じカロリーでたんぱく質や炭水化物を多くとれます。',
        sources: ['kijun'],
      })
    }
  }

  // --- 重量の伸び ---
  const { improved, stalled } = progress(workouts, start)
  if (improved.length) good.push(`自己ベストを更新：${improved.join('・')}`)
  if (stalled.length) {
    const reasons = []
    if (proteinLow) reasons.push({ text: 'たんぱく質が体重×1.6gに届いていません（上を見てください）', sources: ['protein'] })
    if (bigDeficit) {
      reasons.push({
        text: `1日の消費カロリー（約${round(target.expenditure)}kcal）より500kcal以上少ない日が${deficitDays}日ありました。この差だと筋肉が増えにくいので、減量のペースをゆるめる（目標の日を先にする）のも手です`,
        sources: ['deficit'],
      })
    }
    const lowAreas = [...new Set(stalled.map(areaOf).filter((a) => a && sets[a] < SETS_TARGET))]
    if (lowAreas.length) {
      reasons.push({
        text: `${lowAreas.map((a) => AREAS.find((x) => x.id === a).label).join('・')}の週のセット数が10より少ないので、セットを増やしましょう`,
        sources: ['volume'],
      })
    }
    if (!reasons.length) {
      reasons.push({
        text: '食事と量は足りています。同じ重さで回数を1回ずつ増やし、目標の回数（10回前後）を超えてできたら、重さを2〜10%上げましょう',
        sources: ['overload'],
      })
    }
    advice.push({
      title: `${PLATEAU_WEEKS}週続けて伸びていない種目：${stalled.join('・')}`,
      detail: reasons.map((r) => r.text).join('。') + '。',
      sources: [...new Set(reasons.flatMap((r) => r.sources))],
      note: `「${PLATEAU_WEEKS}週続けて」はアプリの決めです。強さは、重さと回数から出した「1回だけ上げられる重さ」の推定（Epley の式）で比べています。`,
    })
  }

  // --- 体重 ---
  const now = lastWeight(weights, start)
  const prev = lastWeight(weights, addDays(start, -7))
  const twoAgo = lastWeight(weights, addDays(start, -14))
  const losing = Number(goal?.loseKg) > 0
  let weightChange = null
  if (now !== null && prev !== null) {
    weightChange = r1(now - prev)
    const pct = ((prev - now) / prev) * 100
    if (pct > 1) {
      advice.push({
        title: `体重が1週間で${r1(prev - now)}kg減った（体重の${r1(pct)}%）`,
        detail: '1週間に体重の1%より速く減ると、筋肉も落ちやすくなります。食べる量を少し増やして、ペースをゆるめましょう。',
        sources: ['rate'],
      })
    } else if (losing && now < prev) {
      good.push(`体重が${r1(prev - now)}kg減りました（ちょうどよいペース）`)
    }
  }
  if (losing && now !== null && twoAgo !== null && now >= twoAgo) {
    advice.push({
      title: '減量中なのに、2週間体重が減っていない',
      detail: '記録していない食べ物や飲み物がないか確かめましょう。記録が合っていれば、目標のカロリーを少し下げるか、運動を増やしましょう。',
      sources: [],
    })
  }

  return {
    start,
    end,
    good,
    advice,
    stats: {
      trainingDays,
      sets,
      mealDays: days.length,
      avgScore: scores.length ? round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
      avgProtein: days.length ? round(avgProtein) : null,
      weightChange,
    },
  }
}

// 振り返りを見たかどうか（グラフのタブに印を出すため）。見た週の月曜日を覚える
const SEEN_KEY = 'fitness-tracker.reviewSeen'

export function lastWeekStart(today) {
  return addDays(weekStart(today), -7)
}

export function hasUnseenReview(today, records) {
  const start = lastWeekStart(today)
  try {
    if (localStorage.getItem(SEEN_KEY) === start) return false
  } catch {
    return false
  }
  return records.some((r) => inWeek(r.date, start))
}

export function markReviewSeen(today) {
  try {
    localStorage.setItem(SEEN_KEY, lastWeekStart(today))
  } catch {
    // 覚えられなくても振り返りは見られる
  }
}
