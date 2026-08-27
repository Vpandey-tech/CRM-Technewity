importScripts("https://js.pusher.com/beams/service-worker.js");

// Cache version synchronized with application deployments
const cacheVersion = 'v1.0.1';

const deleteOldCaches = async () => {
  const keys = await caches.keys();
  await Promise.all(
    keys.map(async (k) => {
      if (k !== cacheVersion) {
        console.log('[SW] Deleting stale cache version:', k);
        return caches.delete(k);
      }
      return Promise.resolve();
    })
  );
};

const cacheResource = async (cacheName, event) => {
  const url = event.request.url;
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(url);

  if (cachedResponse) {
    return cachedResponse;
  }

  const res = await fetch(event.request);
  if (res.ok) {
    const resClone = res.clone();
    await cache.put(url, resClone);
  }
  return res;
};

const isEmojiResources = (url) => {
  return url.includes('cdn.jsdelivr.net/npm/emoji-datasource-twitter/img');
};

const cacheEmojiResources = async (event) => {
  return cacheResource(cacheVersion, event);
};

const isNextjsStaticResource = (url) => {
  return url.includes('_next/static');
};

const isApiRequest = (url) => {
  return url.includes('/api/');
};

const isGmailAvatar = (url) => {
  return url.includes('lh3.googleusercontent.com');
};

const isMediaResources = (url) => {
  return /\.(png|svg|gif|jpeg|jpg|bmp|avif|ico)$/.test(url);
};

const cacheGmailAvatar = async (event) => {
  return cacheResource(cacheVersion, event);
};

const fetchEvent = () => {
  self.addEventListener('fetch', (e) => {
    const req = e.request;
    const url = req.url;

    if (isApiRequest(url)) {
      return;
    }

    if (isEmojiResources(url)) {
      e.respondWith(cacheEmojiResources(e));
      return;
    }

    if (isGmailAvatar(url)) {
      e.respondWith(cacheGmailAvatar(e));
      return;
    }

    if (isMediaResources(url)) {
      e.respondWith(cacheResource(cacheVersion, e));
      return;
    }

    if (isNextjsStaticResource(url)) {
      // Let browser/Next.js handle content-hashed static chunks natively
      return;
    }
  });
};

fetchEvent();

const installEvent = () => {
  self.addEventListener('install', (event) => {
    console.log('[SW] Service worker installed, activating immediately');
    self.skipWaiting();
  });
};
installEvent();

const activateEvent = () => {
  self.addEventListener('activate', (event) => {
    console.log('[SW] Service worker activated, claiming clients');
    event.waitUntil(
      deleteOldCaches().then(() => self.clients.claim())
    );
  });
};
activateEvent();



