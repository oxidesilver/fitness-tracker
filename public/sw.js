// オフラインでも開けるようにするための仕組み（サービスワーカー）。
// いつもはインターネットから最新のものを取り、つながらないときだけ前に保存したものを使う（ネットワーク優先）。
// こうすると、アプリを更新したときに古い画面が出続けることを防げる。
// 参考：https://developer.mozilla.org/ja/docs/Web/API/Service_Worker_API

const CACHE = 'fitness-tracker-v1'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  // 名前の違う古い保存を消す
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return

  // 画面（index.html）は、ブラウザに残っている古いものを使わず、毎回新しいか確かめる
  const fresh = request.mode === 'navigate' ? fetch(request, { cache: 'no-cache' }) : fetch(request)
  event.respondWith(
    fresh
      .then((response) => {
        if (response.ok) {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy))
        }
        return response
      })
      .catch(() => caches.match(request).then((cached) => cached ?? Response.error())),
  )
})
