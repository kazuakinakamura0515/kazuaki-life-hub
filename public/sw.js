const CACHE="life-hub-static-v2";
const STATIC_ASSETS=["/offline.html","/manifest.webmanifest","/icon-192.png","/icon-512.png","/apple-touch-icon.png"];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(STATIC_ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  if(event.request.mode==="navigate"){
    event.respondWith(fetch(event.request).catch(()=>caches.match("/offline.html")));
    return;
  }
  if(url.origin===self.location.origin&&STATIC_ASSETS.includes(url.pathname)){
    event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
  }
});
