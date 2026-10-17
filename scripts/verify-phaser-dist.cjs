'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const dist=path.resolve(__dirname,'../phaser-src/dist');
const htmlPath=path.join(dist,'index.html');
assert.ok(fs.existsSync(htmlPath),'HTML de build Phaser ausente');
const html=fs.readFileSync(htmlPath,'utf8');
const assets=[...html.matchAll(/(?:src|href)="(\.\/assets\/[^"]+)"/g)].map(x=>x[1]);
assert.ok(assets.some(p=>p.endsWith('.js')),'bundle JS ausente da página');
assert.ok(assets.some(p=>p.endsWith('.css')),'CSS bundle ausente da página');
for(const ref of assets)assert.ok(fs.existsSync(path.join(dist,ref)),'Asset ausente: '+ref);
assert.doesNotMatch(html,/(?:src|href)="\/assets\//);
assert.doesNotMatch(html,/<script[^>]+src="https?:\/\//);
assert.doesNotMatch(html,/serviceWorker\.register/);
assert.match(html,/rel="manifest" href="\.\/manifest\.webmanifest"/);
assert.match(html,/id="install-preview"/);
const sizes=assets.filter(x=>x.endsWith('.js')).map(x=>fs.statSync(path.join(dist,x)).size);
assert.ok(sizes.some(n=>n>100000),'Phaser 4 não está empacotado localmente');
console.log('P2A: bundle Vite/Phaser autocontido em URLs relativas; '+assets.length+' arquivos locais.');

const manifest=JSON.parse(fs.readFileSync(path.join(dist,'manifest.webmanifest'),'utf8'));
assert.equal(manifest.start_url,'./');
assert.equal(manifest.scope,'./');
assert.equal(manifest.display,'standalone');
assert.notEqual(manifest.id,'/catacumbas-de-golzdov/');
for(const icon of manifest.icons){
 assert.match(icon.src,/^\.\/icons\/icon-(?:192|512)\.png$/);
 assert.ok(fs.existsSync(path.join(dist,icon.src)),'Ícone PWA ausente: '+icon.src);
}
const worker=fs.readFileSync(path.join(dist,'sw.js'),'utf8');
assert.match(worker,/golzdov-phaser-offline-/);
assert.doesNotMatch(worker,/__VERSION__|__ASSETS__/);
assert.doesNotMatch(worker,/golzdov-offline-v20/);
assert.match(worker,/url\.pathname\.startsWith\(scope\.pathname\)/);
for(const asset of assets)assert.ok(worker.includes(asset),'SW não precacheia '+asset);
for(const file of ['./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'])
 assert.ok(worker.includes(file),'SW não precacheia '+file);
console.log('P5A.1: manifesto, ícones e Service Worker isolados; cache completo do bundle.');
