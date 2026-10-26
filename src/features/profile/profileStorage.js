// プロフィール（性別・生年月日・身長・活動量）を保存・読み込みする。
// 体重はここには持たず、体重の画面の記録を使う。
import { loadObject, saveObject } from '../../storage.js'

const STORAGE_KEY = 'fitness-tracker.profile'

// 形：{ sex: 'male' | 'female', birthDate: '1995-04-01', heightCm: 170, activity: 'low' | 'normal' | 'high' }
const EMPTY = { sex: '', birthDate: '', heightCm: '', activity: '' }

export function loadProfile() {
  return { ...EMPTY, ...loadObject(STORAGE_KEY) }
}

export function saveProfile(profile) {
  saveObject(STORAGE_KEY, profile)
}
