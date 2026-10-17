/* P5A.1 — Service Worker EXCLUSIVO da preview /phaser/.
 * Gerado com assets da build. Não administra o cache do Golzdov clássico.
 */
const PREFIX='golzdov-phaser-offline-';
const CACHE=PREFIX+'__VERSION__';
const PRECACHE=__ASSETS__;

self.addEventListener('install',event=>{
  // Falha na instalação caso um asset obrigatório não seja armazenado.
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(PRECACHE))
    .then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(name=>name.startsWith(PREFIX)&&name!==CACHE)
      .map(name=>caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  const scope=new URL(self.registration.scope);
  // Nem / (jogo legado), nem outros projetos do GitHub Pages.
  if(url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
  if(request.mode==='navigate'){
    const home=scope.pathname;
    const index=new URL('./index.html',scope).pathname;
    if(url.pathname!==home&&url.pathname!==index)return;
    event.respondWith((async()=>{
      // Online: versão nova na rede. Offline: HTML desta build atômica.
      // Não substituir o HTML em cache antes de instalar todos os assets novos.
      try{return await fetch(request);}
      catch(_){
        const cache=await caches.open(CACHE);
        return await cache.match(new URL('./index.html',scope))||
          new Response('A prévia ainda precisa ser carregada online.',{status:503});
      }
    })());
    return;
  }
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const found=await cache.match(request,{ignoreSearch:true});
    if(found)return found;
    return fetch(request);
  })());
});
