// 筋トレのおすすめメニューを作る。
// 考え方（初心者向け）：
// - 全身の大きな筋肉（脚・胸・背中・肩・おなか）を、週2回以上鍛える
//   参考：ACSM（アメリカスポーツ医学会）2026年の筋トレの指針 https://www.sciencedaily.com/releases/2026/03/260319074552.htm
// - 1つの種目は「10回前後（8〜12回）で限界になる重さ」で3セット
//   参考：ACSM 2009年の指針（初心者は8〜12回で限界になる重さ）https://sfu.ca/~ryand/kin343/ACSMresistance.pdf
// - 1種目の時間は、準備と軽い1セット2分＋3セット（各1分）＋セットの間の休み1.5分×2 ＝ 約8分
// - 全身法と分割法：週の量が同じなら、筋肉の増え方や強さの伸びにほぼ差はない
//   参考：Ramos-Campo ら 2024年 https://doi.org/10.1519/JSC.0000000000004774
//   ただし同じ筋肉は週2回鍛える方がよい（Schoenfeld ら 2016年 https://pubmed.ncbi.nlm.nih.gov/27102172/ ）ので、
//   週3回までは全身法、週4〜5回は2分割、週6回以上は3分割をおすすめにする（4分割は選べるが、おすすめにはしない）
import { exerciseKcal } from '../goal/exercisePlan.js'
import { startingWeight, workoutInfo, EQUIPMENT } from './workoutCatalog.js'
import { lastWorkout } from './workoutStorage.js'

export const PLACES = [
  { id: 'gym', label: 'ジム' },
  { id: 'home', label: '自宅' },
]

// ジムで何を先にするか。フリーウェイト（BIG3：スクワット・ベンチプレス・デッドリフト）とマシンは、
// 筋肉の増え方に差がない（Haugen ら 2023年のメタ分析 https://doaj.org/article/a7282dba5e674176bde2a8239832d2f7 ）。
// 強さは練習した道具で伸びやすい（フリーウェイトで練習するとフリーウェイトで強くなる）ので、目的と好みで選ぶ
export const EQUIPMENT_PREFS = [
  { id: 'free', label: 'BIG3優先' },
  { id: 'machine', label: 'マシン優先' },
]

// やり方（全身法・分割法）と、分割法の日。日の並びはおすすめの順番（胸 → 肩 → 背中 → 脚）
export const STYLES = [
  { id: 'full', label: '全身法', days: [{ id: 'full', label: '全身' }] },
  { id: 'split2', label: '2分割', days: [{ id: 'upper', label: '上半身' }, { id: 'lower', label: '下半身' }] },
  { id: 'split3', label: '3分割', days: [{ id: 'chestShoulder', label: '胸・肩' }, { id: 'back', label: '背中' }, { id: 'legs', label: '脚' }] },
  {
    id: 'split4',
    label: '4分割',
    gymOnly: true,
    days: [{ id: 'chest', label: '胸' }, { id: 'shoulders', label: '肩' }, { id: 'back4', label: '背中' }, { id: 'legs4', label: '脚' }],
  },
]

// 前の版で覚えた 'split'（上下2分割）は 'split2' として読む
export function normalizeStyle(id) {
  if (id === 'split') return 'split2'
  return STYLES.some((st) => st.id === id) ? id : null
}

// 種目の並び（大きな筋肉から）。腕は、押す日（胸）に腕の後ろ、引く日（背中）に腕の前を入れる。おなかは脚か肩の日
const MENUS = {
  gym: {
    free: {
      full: ['スクワット', 'ベンチプレス', 'デッドリフト', 'ラットプルダウン', 'ダンベルショルダープレス', 'アブドミナル（マシン）'],
      upper: ['ベンチプレス', 'ベントオーバーロウ', 'ダンベルショルダープレス', 'ラットプルダウン', 'インクラインベンチプレス', 'ダンベルカール', 'トライセプスプッシュダウン'],
      lower: ['スクワット', 'デッドリフト', 'ランジ', 'レッグカール', 'カーフレイズ', 'アブドミナル（マシン）'],
      chestShoulder: ['ベンチプレス', 'インクラインベンチプレス', 'ダンベルショルダープレス', 'サイドレイズ', 'ケーブルクロスオーバー（中部）', 'トライセプスプッシュダウン'],
      back: ['デッドリフト', 'ベントオーバーロウ', 'ラットプルダウン', 'シーテッドロウ（マシン）', 'リアレイズ', 'ダンベルカール'],
      legs: ['スクワット', 'レッグプレス', 'ランジ', 'レッグカール', 'カーフレイズ', 'アブドミナル（マシン）'],
      chest: ['ベンチプレス', 'インクラインベンチプレス', 'ダンベルフライ', 'ケーブルクロスオーバー（上部）', 'ディップス', 'トライセプスプッシュダウン'],
      shoulders: ['ダンベルショルダープレス', 'サイドレイズ', 'リアレイズ', 'ショルダープレス', 'アブドミナル（マシン）'],
      back4: ['デッドリフト', 'ベントオーバーロウ', 'ラットプルダウン', 'シーテッドロウ（マシン）', 'ダンベルカール', 'バーベルカール'],
      legs4: ['スクワット', 'レッグプレス', 'ランジ', 'レッグエクステンション', 'レッグカール', 'カーフレイズ'],
    },
    machine: {
      full: ['レッグプレス', 'チェストプレス（マシン）', 'ラットプルダウン', 'ショルダープレス', 'アブドミナル（マシン）', 'シーテッドロウ（マシン）'],
      upper: ['チェストプレス（マシン）', 'ラットプルダウン', 'ショルダープレス', 'シーテッドロウ（マシン）', 'ペックフライ（マシン）', 'トライセプスプッシュダウン', 'ダンベルカール'],
      lower: ['レッグプレス', 'レッグカール', 'レッグエクステンション', 'アダクション・アブダクション（マシン）', 'アブドミナル（マシン）', 'カーフレイズ'],
      chestShoulder: ['チェストプレス（マシン）', 'ショルダープレス', 'ペックフライ（マシン）', 'サイドレイズ', 'ケーブルクロスオーバー（中部）', 'トライセプスプッシュダウン'],
      back: ['ラットプルダウン', 'シーテッドロウ（マシン）', 'ワンハンドロウ', 'バックエクステンション', 'リアレイズ', 'ダンベルカール'],
      legs: ['レッグプレス', 'レッグカール', 'レッグエクステンション', 'アダクション・アブダクション（マシン）', 'カーフレイズ', 'アブドミナル（マシン）'],
      chest: ['チェストプレス（マシン）', 'ペックフライ（マシン）', 'ケーブルクロスオーバー（上部）', 'ケーブルクロスオーバー（下部）', 'トライセプスプッシュダウン'],
      shoulders: ['ショルダープレス', 'サイドレイズ', 'リアレイズ', 'ダンベルショルダープレス', 'アブドミナル（マシン）'],
      back4: ['ラットプルダウン', 'シーテッドロウ（マシン）', 'ワンハンドロウ', 'バックエクステンション', 'ダンベルカール'],
      legs4: ['レッグプレス', 'レッグエクステンション', 'レッグカール', 'アダクション・アブダクション（マシン）', 'カーフレイズ'],
    },
  },
  // 自宅は器具なし（肩だけを鍛える自重の種目がないので、4分割はジムだけ）
  home: {
    full: ['自重スクワット', '腕立て伏せ', 'バックエクステンション', '腹筋（クランチ）', 'カーフレイズ', 'レッグレイズ'],
    upper: ['腕立て伏せ', 'バックエクステンション', '腹筋（クランチ）', 'レッグレイズ'],
    lower: ['自重スクワット', '自重ランジ', 'ヒップリフト', 'カーフレイズ'],
    chestShoulder: ['腕立て伏せ', 'ディップス', '腹筋（クランチ）'],
    back: ['懸垂', 'バックエクステンション', 'レッグレイズ'],
    legs: ['自重スクワット', '自重ランジ', 'ヒップリフト', 'カーフレイズ'],
  },
}

function menuList(place, pref, day) {
  return place === 'home' ? MENUS.home[day] : MENUS.gym[pref][day]
}

// 週の回数からおすすめのやり方。同じ筋肉は週2回鍛えるのがよい（Schoenfeld ら 2016年）ので、
// 週3回まで全身法、4〜5回は2分割、6回以上は3分割（各部位が週2回になる）。4分割で週2回にするには週8回が要るので、おすすめには出さない
export function recommendedStyle(sessionsPerWeek) {
  const n = Number(sessionsPerWeek)
  if (n >= 6) return 'split3'
  if (n >= 4) return 'split2'
  return 'full'
}

// 種目のいちばん大きな筋肉 → 分割の日の部位（腕の後ろは押す日＝胸、腕の前は引く日＝背中）
const AREA = {
  chest: 'chest', chestUpper: 'chest', chestMiddle: 'chest', chestLower: 'chest', triceps: 'chest',
  shoulders: 'shoulders',
  back: 'back', lowerBack: 'back', biceps: 'back',
  quads: 'legs', hamstrings: 'legs', glutes: 'legs', calves: 'legs',
}
const DAY_AREAS = {
  upper: ['chest', 'shoulders', 'back'], lower: ['legs'],
  chestShoulder: ['chest', 'shoulders'], back: ['back'], legs: ['legs'],
  chest: ['chest'], shoulders: ['shoulders'], back4: ['back'], legs4: ['legs'],
}

// その日の筋トレが、分割のどの日に近いか（メニューにある種目を先に数え、なければ種目の部位で数える）
function matchDay(dayRecords, days, guide) {
  const score = (d) =>
    dayRecords.reduce((a, r) => {
      const inMenu = [MENUS.gym.free[d.id], MENUS.gym.machine[d.id], MENUS.home[d.id]].some((l) => l?.includes(r.exercise))
      const area = AREA[guide[r.exercise]?.muscles[0]]
      return a + (inMenu ? 2 : 0) + (area && DAY_AREAS[d.id]?.includes(area) ? 1 : 0)
    }, 0)
  const scores = days.map(score)
  const best = Math.max(...scores)
  return best > 0 ? scores.indexOf(best) : -1
}

// 分割法で次にやる日：いちばん最近に筋トレした日が分割のどの日かを見て、その次の日（最後の日の次は最初に戻る）
// guide は workoutGuide.js の GUIDE
export function nextSplitDay(records, guide, styleId) {
  const days = STYLES.find((st) => st.id === styleId)?.days ?? STYLES[1].days
  if (days.length === 1) return days[0].id // 全身法は日が1つだけ
  const strength = records.filter((r) => r.sets && guide[r.exercise])
  if (strength.length === 0) return days[0].id
  const lastDate = strength.reduce((d, r) => (r.date > d ? r.date : d), '')
  const i = matchDay(strength.filter((r) => r.date === lastDate), days, guide)
  return i < 0 ? days[0].id : days[(i + 1) % days.length].id
}

export const SETS = 3
export const MINUTES_PER_EXERCISE = 8
const DEFAULT_STRENGTH_MINUTES = 40

// 筋トレに使える時間（分）。プロフィールの運動の計画があれば、その中の筋トレの時間を使う
export function strengthMinutes(exercisePlan, bodyKg) {
  const result = exerciseKcal(exercisePlan, bodyKg || 60)
  const item = result?.items.find((i) => i.name === '筋トレ')
  return { minutes: item?.minutes ?? DEFAULT_STRENGTH_MINUTES, fromPlan: Boolean(item) }
}

// おすすめメニュー：[{ name, weight: '22.5'（自重は ''）, bodyweight, sets, minutes }]
// day は STYLES の days の id。pref は 'free'（BIG3優先）か 'machine'（マシン優先）
export function recommendMenu({ place, pref = 'free', day, minutes, records, bodyKg, sex }) {
  const list = menuList(place, pref, day)
  const count = Math.min(list.length, Math.max(2, Math.floor(minutes / MINUTES_PER_EXERCISE)))
  return list.slice(0, count).map((name) => {
    const info = workoutInfo(name)
    const last = lastWorkout(records, name)
    const lastWeight = last?.sets?.[0]?.weightKg
    const weight = lastWeight != null ? String(lastWeight) : startingWeight(info, bodyKg, sex)
    return { name, weight, bodyweight: info.equipment === 'bodyweight', unitLabel: EQUIPMENT[info.equipment].weightLabel, fromLast: lastWeight != null, sets: SETS, minutes: MINUTES_PER_EXERCISE }
  })
}
