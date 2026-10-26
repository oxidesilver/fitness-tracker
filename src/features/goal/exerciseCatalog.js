// 運動の計画で選べる種目と、強さごとの METs。
// 並び順：スポーツ庁「令和6年度 スポーツの実施状況等に関する世論調査」の、この1年間に行った人が多い順
//   https://www.mext.go.jp/sports/b_menu/houdou/jsa_00202.html
// METs：国立健康・栄養研究所ほか「改訂第2版 身体活動のメッツ(METs)表 成人版」（2024年）。code はその表の番号
//   https://www.nibn.go.jp/activities/documents/2024Compendium_table_adult_ver1_1_5.pdf
// levels の真ん中あたりを、選んだときの最初の強さにする（default）

export const EXERCISE_CATALOG = [
  {
    id: 'walk',
    name: 'ウォーキング',
    default: 2,
    levels: [
      { label: 'ゆっくり（時速4km）', mets: 3.0, code: '17170' },
      { label: 'ふつう（時速4.5〜5.5km）', mets: 3.8, code: '17190' },
      { label: '速歩き（時速5.7〜6.3km）', mets: 4.8, code: '17200' },
      { label: 'とても速く（時速6.4〜7km）', mets: 5.5, code: '17220' },
    ],
  },
  {
    id: 'strength',
    name: '筋トレ',
    default: 0,
    levels: [
      { label: 'ふつう（マシンやダンベルで8〜15回）', mets: 3.5, code: '02054' },
      { label: '自重トレーニング（腕立て・腹筋など）', mets: 3.8, code: '02022' },
      { label: 'きつい（高重量・ボディビル）', mets: 6.0, code: '02050' },
    ],
  },
  {
    id: 'gymnastics',
    name: '体操',
    default: 1,
    levels: [
      { label: '軽め（健康体操）', mets: 3.5, code: '02030' },
      { label: 'ふつう', mets: 3.8, code: '15300' },
    ],
  },
  {
    id: 'run',
    name: 'ランニング',
    default: 1,
    levels: [
      { label: 'ゆっくり（時速6.5〜6.8km）', mets: 6.5, code: '12028' },
      { label: 'ジョギング（自分のペース）', mets: 7.5, code: '12020' },
      { label: 'ふつう（時速8.1〜8.4km）', mets: 8.5, code: '12030' },
      { label: '速く（時速9.7〜10.2km）', mets: 9.3, code: '12050' },
    ],
  },
  {
    id: 'stairs',
    name: '階段の上り下り',
    default: 1,
    levels: [
      { label: 'ゆっくり上る', mets: 4.5, code: '17133' },
      { label: 'ふつうに上る', mets: 6.8, code: '17131' },
      { label: '上り下りをくり返す', mets: 7.5, code: '17138' },
    ],
  },
  {
    id: 'bike',
    name: '自転車',
    default: 2,
    levels: [
      { label: 'ゆっくり（時速約9km）', mets: 3.5, code: '01018' },
      { label: 'ふつう（時速16km未満・通勤など）', mets: 4.0, code: '01010' },
      { label: 'エアロバイク', mets: 6.8, code: '01200' },
      { label: '速く（時速19〜22km）', mets: 8.0, code: '01030' },
    ],
  },
  {
    id: 'yoga',
    name: 'ヨガ',
    default: 0,
    levels: [
      { label: 'ふつう', mets: 2.3, code: '02175' },
      { label: 'ホットヨガ', mets: 3.0, code: '02155' },
      { label: 'パワーヨガ', mets: 4.0, code: '02160' },
    ],
  },
  {
    id: 'pilates',
    name: 'ピラティス',
    default: 0,
    levels: [{ label: 'ふつう', mets: 2.8, code: '02105' }],
  },
  {
    id: 'aerobics',
    name: 'エアロビクス',
    default: 0,
    levels: [
      { label: '軽め（ジャンプなし）', mets: 4.8, code: '02005' },
      { label: 'きつい（ジャンプあり）', mets: 8.0, code: '02006' },
    ],
  },
  {
    id: 'golf',
    name: 'ゴルフ',
    default: 2,
    levels: [
      { label: '打ちっぱなし', mets: 3.5, code: '15270' },
      { label: 'カートで回る', mets: 3.5, code: '15290' },
      { label: '歩いて回る（クラブを運ぶ）', mets: 4.3, code: '15265' },
    ],
  },
  {
    id: 'hiking',
    name: '登山・ハイキング',
    default: 1,
    levels: [
      { label: 'ゆったりハイキング', mets: 3.8, code: '17081' },
      { label: 'ふつうのハイキング', mets: 5.3, code: '17082' },
      { label: '山を登る（傾斜6〜10%）', mets: 7.0, code: '17035' },
    ],
  },
  {
    id: 'swim',
    name: '水泳',
    default: 1,
    levels: [
      { label: 'ゆっくり（平泳ぎ）', mets: 5.3, code: '18265' },
      { label: 'クロール（ゆっくり）', mets: 5.8, code: '18292' },
      { label: 'クロール（ふつう）', mets: 8.0, code: '18290' },
    ],
  },
  {
    id: 'tennis',
    name: 'テニス',
    default: 1,
    levels: [
      { label: '練習（ボールを打つ）', mets: 5.0, code: '15695' },
      { label: 'ふつう', mets: 6.8, code: '15675' },
      { label: 'シングルスの試合', mets: 8.0, code: '15690' },
    ],
  },
  {
    id: 'badminton',
    name: 'バドミントン',
    default: 0,
    levels: [
      { label: 'ふつう（試合以外）', mets: 5.5, code: '15030' },
      { label: '競技', mets: 7.0, code: '15020' },
    ],
  },
  {
    id: 'tabletennis',
    name: '卓球',
    default: 0,
    levels: [{ label: 'ふつう', mets: 4.0, code: '15660' }],
  },
  {
    id: 'dance',
    name: 'ダンス',
    default: 1,
    levels: [
      { label: 'ゆっくり（社交ダンスなど）', mets: 3.0, code: '03040' },
      { label: 'ふつう（フラダンスなど）', mets: 4.5, code: '03025' },
      { label: '速く', mets: 5.5, code: '03030' },
    ],
  },
  {
    id: 'aquawalk',
    name: '水中ウォーキング',
    default: 1,
    levels: [
      { label: 'ゆっくり', mets: 2.5, code: '18367' },
      { label: 'ふつう', mets: 4.8, code: '18368' },
      { label: '速く', mets: 6.8, code: '18369' },
    ],
  },
]

export function findExercise(id) {
  return EXERCISE_CATALOG.find((e) => e.id === id) ?? null
}
