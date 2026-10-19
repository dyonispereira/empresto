// Emprestô service worker: makes the site installable and shows an offline page.
// Data is never cached: pages and API calls always come from the network so balances are never stale.
const CACHE='empresto-v1';
const SHELL=['/offline','/icon-192.png','/favicon.svg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
 const r=e.request;
 if(r.method!=='GET')return;
 if(r.mode==='navigate'){e.respondWith(fetch(r).catch(()=>caches.match('/offline')));return;}
 if(SHELL.includes(new URL(r.url).pathname))e.respondWith(caches.match(r).then(hit=>hit||fetch(r)));
});
