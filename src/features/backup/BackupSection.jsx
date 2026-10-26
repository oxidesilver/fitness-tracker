import { useState } from 'react'
import { formatDate, today } from '../../storage.js'
import { exportBackup, lastBackupDate, parseBackup, restoreBackup, summarize } from './backup.js'
import './backup.css'

// 記録の書き出し・読み込み。プロフィールの画面の一番下に出す。
export default function BackupSection() {
  const [last, setLast] = useState(lastBackupDate)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleExport() {
    setError('')
    setMessage('')
    try {
      if (await exportBackup(today())) {
        setLast(today())
        setMessage('書き出しました。ファイルを「ファイル」アプリや iCloud Drive などに保存しておいてください。')
      }
    } catch {
      setError('書き出せませんでした。もう一度試してください。')
    }
  }

  async function handleImport(e) {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    setError('')
    setMessage('')
    try {
      const backup = parseBackup(await file.text())
      const s = summarize(backup)
      const when = s.exportedAt ? formatDate(s.exportedAt.slice(0, 10)) : '日付不明'
      const ok = confirm(
        `${when}に書き出したバックアップです。\n体重 ${s.weights}件・筋トレ ${s.workouts}件・食事 ${s.meals}件\n\n今の記録はすべて消えて、この内容に置きかわります。読み込みますか？`,
      )
      if (!ok) return
      restoreBackup(backup)
      alert('読み込みました。アプリを読み込み直します。')
      location.reload()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <h2>バックアップ</h2>
      <div className="card backup">
        <p className="backup-help">
          記録はこのスマホのブラウザの中にだけ保存されています。機種変更のときや、記録が消えてしまったときのために、ときどき書き出しておいてください。
        </p>
        <p className="backup-last">最後に書き出した日：{last ? formatDate(last) : 'まだ書き出していません'}</p>

        <button type="button" className="primary" onClick={handleExport}>記録を書き出す</button>

        <label className="backup-import">
          バックアップから読み込む
          <input type="file" accept=".json,application/json" onChange={handleImport} />
        </label>
        <p className="backup-help">読み込むと、今の記録はすべてバックアップの内容に置きかわります。</p>

        {message && <p className="backup-message">✓ {message}</p>}
        {error && <p className="error">{error}</p>}
      </div>
    </>
  )
}
