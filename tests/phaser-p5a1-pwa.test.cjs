'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const vm=require('node:vm');
const {bundleAssets,renderPreviewWorker,generatePreviewPwa,PREFIX}=require('../scripts/build-phaser-pwa.cjs');
const ROOT=path.resolve(__dirname,'..');
const ROOT_URL='https://pedromaintenance.github.io/catacumbas-de-golzdov/';
const PHASER=ROOT_URL+'phaser/';
const template=fs.readFileSync(path.join(ROOT,'phaser-src/sw-template.js'),'utf8');
const previewManifest=JSON.parse(fs.readFileSync(path.join(ROOT,'phaser-src/public/manifest.webmanifest'),'utf8'));
function fakeDist(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'golzdov-preview-pwa-'));
 fs.mkdirSync(path.join(dir,'assets'),{recursive:true});
 fs.writeFileSync(path.join(dir,'index.html'),
  '<script type="module" src="./assets/index-Ab12.js"></script><link rel="stylesheet" href="./assets/index-Q9.css">');
 fs.writeFileSync(path.join(dir,'assets/index-Ab12.js'),'/* bundled Phaser local */');
 fs.writeFileSync(path.join(dir,'assets/index-Q9.css'),'body{background:#000}');
 fs.writeFileSync(path.join(dir,'manifest.webmanifest'),JSON.stringify(previewManifest));
 return dir;
}
function boot(worker,{offline=false}={}){
 const listeners={},items=new Map(),calls={open:[],delete:[],fetch:[],respond:0,claim:0,skipWaiting:0,add:[]};
 const caches={
  async open(name){
   calls.open.push(name);
   if(!items.has(name))items.set(name,new Map());
   const content=items.get(name);
   return {
    async addAll(paths){
     calls.add.push(...paths);
     for(const p of paths)content.set(new URL(p,PHASER).href,{source:'cache',path:p});
    },
    async match(url){return content.get(new URL(url?.url||url,PHASER).href);},
  };
  },
  async keys(){return [PREFIX+'old-one','golzdov-offline-v20','another-project',...items.keys()];},
  async delete(name){calls.delete.push(name);items.delete(name);return true;}
 };
 const self={
  registration:{scope:PHASER},
  clients:{async claim(){calls.claim++;}},
  async skipWaiting(){calls.skipWaiting++;},
  addEventListener(type,handler){listeners[type]=handler;}
 };
 const fetch=async req=>{
  calls.fetch.push(req.url);
  if(offline)throw Error('offline');
  return {source:'network',url:req.url};
 };
 vm.runInNewContext(worker,{self,caches,fetch,URL,Response},{filename:'phaser/sw.js'});
 async function install(){
  let task;listeners.install({waitUntil(p){task=p;}});
  await task;
 }
 async function activate(){
  let task;listeners.activate({waitUntil(p){task=p;}});
  await task;
 }
 function request(url,mode='navigate',method='GET'){
  const req={url,mode,method};
  const event={request:req,respondWith(p){calls.respond++;this.result=Promise.resolve(p);}};
  listeners.fetch(event);
  return event;
 }
 return {install,activate,request,calls};
}
test('P5A.1: manifesto de preview é independente da instalação HTML clássica',()=>{
 const root=JSON.parse(fs.readFileSync(path.join(ROOT,'manifest.webmanifest'),'utf8'));
 assert.notEqual(root.id,previewManifest.id);
 assert.equal(previewManifest.start_url,'./');
 assert.equal(previewManifest.scope,'./');
 assert.equal(previewManifest.display,'standalone');
 assert.equal(previewManifest.icons.length,2);
 for(const icon of previewManifest.icons)assert.ok(icon.src.startsWith('./icons/'));
});
test('pós-build coleta hash real dos bundles, cópia de ícones e versão muda com conteúdo',()=>{
 const dir=fakeDist();
 try{
  const one=generatePreviewPwa(dir);
  assert.match(one.version,/^[a-f0-9]{12}$/);
  assert.ok(one.precache.includes('./assets/index-Ab12.js'));
  assert.ok(one.precache.includes('./assets/index-Q9.css'));
  assert.equal(fs.statSync(path.join(dir,'icons/icon-512.png')).size,
   fs.statSync(path.join(ROOT,'icons/icon-512.png')).size);
  assert.ok(one.worker.includes(one.cache));
  const two=generatePreviewPwa(dir);
  assert.equal(one.version,two.version,'sem mudanças não deve invalidar cache');
  fs.writeFileSync(path.join(dir,'assets/index-Ab12.js'),'bundle realmente atualizado');
  const three=generatePreviewPwa(dir);
  assert.notEqual(three.version,two.version);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('build impede bundle incompleto/URL absoluta para evitar instalação quebrada',()=>{
 assert.throws(()=>bundleAssets('<script src="/assets/x.js"></script>'));
 assert.throws(()=>bundleAssets('<script src="./assets/x.js"></script>'));
 assert.throws(()=>bundleAssets('<script src="./assets/a.js"></script><link href="./assets/../x.css">'));
 assert.deepEqual(bundleAssets('<script src="./assets/a.js"></script><link href="./assets/b.css">'),
  ['./assets/a.js','./assets/b.css']);
});
test('SW guarda todos os bundles e o HTML e só remove caches antigos da preview',async()=>{
 const worker=renderPreviewWorker(template,'bcd123deaf45',
  ['./','./index.html','./manifest.webmanifest','./assets/bundle.js']);
 const env=boot(worker);
 await env.install();
 await env.activate();
 assert.ok(env.calls.add.includes('./assets/bundle.js'));
 assert.equal(env.calls.claim,1);
 assert.equal(env.calls.skipWaiting,1);
 assert.deepEqual(env.calls.delete,[PREFIX+'old-one']);
 assert.ok(!env.calls.delete.includes('golzdov-offline-v20'));
});
test('offline /phaser/ e /phaser/index.html, com query seed, carregam HTML da preview',async()=>{
 const worker=renderPreviewWorker(template,'bcd123deaf45',['./','./index.html','./assets/bundle.js']);
 const env=boot(worker,{offline:true});await env.install();
 for(const url of [PHASER,PHASER+'index.html',PHASER+'?floor=5&seed=99']){
  const event=env.request(url);
  assert.equal((await event.result).path,'./index.html');
 }
 const asset=env.request(PHASER+'assets/bundle.js','no-cors');
 assert.equal((await asset.result).path,'./assets/bundle.js');
});
test('SW nunca intercepta jogo clássico, outros projetos, POST ou navegação /phaser/falsa',async()=>{
 const worker=renderPreviewWorker(template,'bcd123deaf45',['./','./index.html','./assets/bundle.js']);
 const env=boot(worker);await env.install();
 for(const [url,mode,method] of [
  [ROOT_URL,'navigate','GET'],[ROOT_URL+'index.html','navigate','GET'],
  [ROOT_URL+'sw.js','no-cors','GET'],
  ['https://other.example/phaser/','navigate','GET'],
  ['https://pedromaintenance.github.io/another-project/','navigate','GET'],
  [PHASER+'secret','navigate','GET'],[PHASER,'navigate','POST']
 ]){
  assert.equal(env.request(url,mode,method).result,undefined,url);
 }
 assert.equal(env.calls.respond,0);
 const network=env.request(PHASER+'assets/not-yet-cached.js','no-cors');
 assert.equal((await network.result).source,'network');
});
test('no modo online a navegação carrega HTML da rede sem substituir o cache atômico',async()=>{
 const worker=renderPreviewWorker(template,'bcd123deaf45',['./','./index.html']);
 const env=boot(worker);await env.install();
 const response=await env.request(PHASER).result;
 assert.equal(response.source,'network');
 assert.deepEqual(env.calls.fetch,[PHASER]);
});
test('botão de instalação conserva fallback manual quando o prompt não é oferecido',async()=>{
 const {initPreviewPwa}=await import('../phaser-src/src/preview-pwa.js');
 const elements=new Map();
 const fake=id=>{
  if(!elements.has(id))elements.set(id,{
   textContent:'',hidden:true,disabled:false,listeners:{},
   addEventListener(type,fn){this.listeners[type]=fn;},
  });
  return elements.get(id);
 };
 const browserListeners={};
 const win={
  isSecureContext:true,location:{href:PHASER},
  navigator:{serviceWorker:{
   controller:null,
   register:async(url,opt)=>({scope:opt.scope}),
   ready:Promise.resolve({active:true}),
   addEventListener(type,fn){browserListeners[type]=fn;},
  }},
  addEventListener(type,fn){browserListeners[type]=fn;},
  matchMedia(){return {matches:false};}
 };
 const pwa=initPreviewPwa(win,{getElementById:fake});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(pwa.registration.scope,PHASER);
 fake('install-preview').listeners.click();
 assert.equal(fake('pwa-guide').hidden,false);
 assert.match(fake('pwa-guide').textContent,/Safari/);
 let calls=0;
 browserListeners.beforeinstallprompt({preventDefault(){calls++;},
  prompt:async()=>{calls++;},
  userChoice:Promise.resolve({outcome:'accepted'})
 });
 await fake('install-preview').listeners.click();
 assert.equal(calls,2);
 browserListeners.appinstalled();
 assert.equal(fake('install-preview').disabled,true);
});
