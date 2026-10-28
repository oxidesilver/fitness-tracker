// 筋トレの画面で選べる種目の一覧。自由入力はせず、ここから選ぶ（消費カロリーを計算できるようにするため）。
// 種目を足したいときは、ここに1行足す。
import { EXERCISE_CATALOG } from '../goal/exerciseCatalog.js'

// 道具の種類ごとの、重さの最低・きざみ・入力欄の名前
// barbell：バーベル（バーだけで20kg）、dumbbell：ダンベル（片手の重さ）、machine：マシン、cable：ケーブルマシン
// bodyweight：自重（重りなし。ベルトなどで重りを足すときだけ入れる）
export const EQUIPMENT = {
  barbell: { min: 20, step: 2.5, weightLabel: '重さ', note: 'バーだけで20kgあるので、20kgより軽くはできません' },
  dumbbell: { min: 1, step: 1, weightLabel: '片手の重さ', note: 'ダンベル1つ（片手）の重さを入れます' },
  machine: { min: 5, step: 2.5, weightLabel: '重さ', note: '' },
  cable: { min: 2.5, step: 2.5, weightLabel: '重さ', note: '' },
  // 左右に1本ずつケーブルを持つ種目（ケーブルクロスオーバー）。片側の重さを入れる
  cablePair: { min: 2.5, step: 2.5, weightLabel: '片側の重さ', note: '左右どちらか片側のケーブルの重さを入れます' },
  bodyweight: { min: 0, step: 2.5, weightLabel: '追加の重さ', note: '重りを足さないときは、重さは空のままにします（自重）' },
  // 前の版で自分で足した種目（一覧にない）。どんな道具か分からないので、重さは空（自重）でもよい
  legacy: { min: 0, step: 2.5, weightLabel: '重さ', note: '重りを使わないときは、重さは空のままにします（自重）' },
}

// 重さを空（自重）のままにしてよい道具
export const isWeightOptional = (equipment) => equipment === 'bodyweight' || equipment === 'legacy'

// ratio：はじめての種目で最初に入れておく重さ（体重 × ratio）。10回くらいくり返せる軽めの目安で、
// 女性はさらに 0.6 倍にする。2回目からは前回の重さが入る。
// 根拠の資料（1回だけ上げられる重さの基準など）は 10回用の重さと違うため、軽めに決めた目安
const STRENGTH = [
  { group: '胸', items: [
    { name: 'ベンチプレス', equipment: 'barbell', ratio: 0.35 },
    { name: 'インクラインベンチプレス', equipment: 'barbell', ratio: 0.3 },
    { name: 'ダンベルプレス', equipment: 'dumbbell', ratio: 0.12 },
    { name: 'ダンベルフライ', equipment: 'dumbbell', ratio: 0.08 },
    { name: 'チェストプレス（マシン）', equipment: 'machine', ratio: 0.3 },
    { name: 'ペックフライ（マシン）', equipment: 'machine', ratio: 0.2 },
    // 胸の上部・中部・下部で、ケーブルを引く向き（滑車の高さ）を変える
    { name: 'ケーブルクロスオーバー（上部）', equipment: 'cablePair', ratio: 0.06 },
    { name: 'ケーブルクロスオーバー（中部）', equipment: 'cablePair', ratio: 0.07 },
    { name: 'ケーブルクロスオーバー（下部）', equipment: 'cablePair', ratio: 0.07 },
    { name: '腕立て伏せ', equipment: 'bodyweight' },
  ] },
  { group: '背中', items: [
    { name: 'デッドリフト', equipment: 'barbell', ratio: 0.5 },
    { name: 'ベントオーバーロウ', equipment: 'barbell', ratio: 0.3 },
    { name: 'ワンハンドロウ', equipment: 'dumbbell', ratio: 0.15 },
    { name: 'ラットプルダウン', equipment: 'machine', ratio: 0.35 },
    { name: 'シーテッドロウ（マシン）', equipment: 'machine', ratio: 0.3 },
    { name: '懸垂', equipment: 'bodyweight' },
    { name: 'バックエクステンション', equipment: 'bodyweight' },
  ] },
  { group: '脚・お尻', items: [
    { name: 'スクワット', equipment: 'barbell', ratio: 0.5 },
    { name: 'レッグプレス', equipment: 'machine', ratio: 0.8 },
    { name: 'レッグエクステンション', equipment: 'machine', ratio: 0.25 },
    { name: 'レッグカール', equipment: 'machine', ratio: 0.2 },
    { name: 'ヒップスラスト', equipment: 'barbell', ratio: 0.4 },
    { name: 'ランジ', equipment: 'dumbbell', ratio: 0.08 },
    { name: 'アダクション・アブダクション（マシン）', equipment: 'machine', ratio: 0.25 },
    { name: 'カーフレイズ', equipment: 'bodyweight' },
    { name: '自重スクワット', equipment: 'bodyweight' },
    { name: '自重ランジ', equipment: 'bodyweight' },
    { name: 'ヒップリフト', equipment: 'bodyweight' },
  ] },
  { group: '肩', items: [
    { name: 'ショルダープレス', equipment: 'machine', ratio: 0.2 },
    { name: 'ダンベルショルダープレス', equipment: 'dumbbell', ratio: 0.1 },
    { name: 'サイドレイズ', equipment: 'dumbbell', ratio: 0.05 },
    { name: 'リアレイズ', equipment: 'dumbbell', ratio: 0.04 },
  ] },
  { group: '腕', items: [
    { name: 'ダンベルカール', equipment: 'dumbbell', ratio: 0.08 },
    { name: 'バーベルカール', equipment: 'barbell', ratio: 0.3 },
    { name: 'トライセプスプッシュダウン', equipment: 'cable', ratio: 0.15 },
    { name: 'フレンチプレス', equipment: 'dumbbell', ratio: 0.1 },
    { name: 'ディップス', equipment: 'bodyweight' },
  ] },
  { group: 'お腹', items: [
    { name: '腹筋（クランチ）', equipment: 'bodyweight' },
    { name: 'レッグレイズ', equipment: 'bodyweight' },
    { name: 'アブドミナル（マシン）', equipment: 'machine', ratio: 0.25 },
  ] },
]

// 有酸素などの時間で記録する種目。プロフィールの運動の計画と同じ一覧（筋トレ以外）を使う。
// ランニングは速度・傾斜で記録する（RunEditor）
const CARDIO = EXERCISE_CATALOG.filter((e) => e.id !== 'strength').map((e) =>
  e.id === 'run' ? { name: 'ランニング', kind: 'run' } : { name: e.name, kind: 'cardio', catalogId: e.id },
)

export const WORKOUT_GROUPS = [
  ...STRENGTH.map((g) => ({ group: g.group, items: g.items.map((i) => ({ ...i, kind: 'sets' })) })),
  { group: '有酸素・スポーツ', items: CARDIO },
]

const BY_NAME = new Map(WORKOUT_GROUPS.flatMap((g) => g.items.map((i) => [i.name, i])))

// 名前から種目の情報を探す。一覧にない名前（前の版で自分で足した種目）は、重さを空にもできる種目として扱う
export function workoutInfo(name) {
  return BY_NAME.get(name) ?? { name, kind: 'sets', equipment: 'legacy' }
}

// はじめての種目の最初の重さ（文字）。体重が分からなければ最低の重さ。自重の種目は空
export function startingWeight(info, bodyKg, sex) {
  const eq = EQUIPMENT[info.equipment]
  if (!info.ratio) return ''
  const base = bodyKg ? bodyKg * info.ratio * (sex === 'female' ? 0.6 : 1) : 0
  const rounded = Math.round(base / eq.step) * eq.step
  return String(Math.max(eq.min, rounded))
}
