// 記録のバックアップ：ブラウザの中に保存してある記録を1つのファイルに書き出す／読み込む。
// 機種変更のときや、記録が消えたときのために使う。

// このアプリが保存に使っている名前の頭（weights・workouts・meals など全部この形）
const PREFIX = 'fitness-tracker.'
// 最後に書き出した日。バックアップの中身には入れないよう、別の名前にする
const LAST_BACKUP_KEY = 'fitness-tracker-meta.lastBackup'
const APP = 'fitness-tracker'
const VERSION = 1

function appKeys() {
  const keys = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key.startsWith(PREFIX)) keys.push(key)
  }
  return keys
}

// 書き出す中身を作る：{ app, version, exportedAt, data: { 名前: 中身 } }
export function buildBackup() {
  const data = {}
  for (const key of appKeys()) {
    try {
      data[key] = JSON.parse(localStorage.getItem(key))
    } catch {
      data[key] = localStorage.getItem(key)
    }
  }
  return { app: APP, version: VERSION, exportedAt: new Date().toISOString(), data }
}

// 'fitness-tracker-backup-2026-10-26.json' のようなファイル名
export function backupFileName(date) {
  return `fitness-tracker-backup-${date}.json`
}

// バックアップを書き出す。
// iPhone では「共有」の画面を出し、「ファイルに保存」などを選べるようにする（ホーム画面のアプリでも使えるため）。
// 共有が使えないブラウザでは、ファイルとしてダウンロードする。
// 参考：https://developer.mozilla.org/ja/docs/Web/API/Navigator/share
export async function exportBackup(date) {
  const text = JSON.stringify(buildBackup(), null, 2)
  const name = backupFileName(date)
  const file = new File([text], name, { type: 'application/json' })

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name })
    } catch (e) {
      // 共有の画面を閉じただけのときは、何もしない
      if (e.name === 'AbortError') return false
      throw e
    }
  } else {
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }
  localStorage.setItem(LAST_BACKUP_KEY, date)
  return true
}

export function lastBackupDate() {
  return localStorage.getItem(LAST_BACKUP_KEY)
}

// ファイルの中身を確かめる。正しくなければエラーの文を投げる
export function parseBackup(text) {
  let backup
  try {
    backup = JSON.parse(text)
  } catch {
    throw new Error('ファイルを読めませんでした。このアプリで書き出したファイルを選んでください。')
  }
  if (backup?.app !== APP || typeof backup.data !== 'object' || backup.data === null) {
    throw new Error('このアプリのバックアップではないようです。')
  }
  if (backup.version > VERSION) {
    throw new Error('新しい形のバックアップです。アプリを開き直してから、もう一度試してください。')
  }
  return backup
}

// バックアップの中に、何がいくつ入っているか（確認の画面に出す）
export function summarize(backup) {
  const count = (key) => (Array.isArray(backup.data[key]) ? backup.data[key].length : 0)
  return {
    exportedAt: backup.exportedAt,
    weights: count(`${PREFIX}weights`),
    workouts: count(`${PREFIX}workouts`),
    meals: count(`${PREFIX}meals`),
  }
}

// 今の記録を全部消して、バックアップの中身に置きかえる
export function restoreBackup(backup) {
  for (const key of appKeys()) localStorage.removeItem(key)
  for (const [key, value] of Object.entries(backup.data)) {
    if (!key.startsWith(PREFIX)) continue
    localStorage.setItem(key, JSON.stringify(value))
  }
}
