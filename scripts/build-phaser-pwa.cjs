'use strict';
/* P5A.1 — pós-build determinístico: cache de TODOS os assets reais do Vite.
 * Nunca muda /index.html, /sw.js, /manifest.webmanifest ou saves clássicos.
 */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const ROOT=path.resolve(__dirname,'..');
const DIST=path.join(ROOT,'phaser-src/dist');
const TEMPLATE=path.join(ROOT,'phaser-src/sw-template.js');
const PREFIX='golzdov-phaser-offline-';
function bundleAssets(html){
 const assets=[...html.matchAll(/(?:src|href)="(\.\/assets\/[^"]+)"/g)].map(x=>x[1]);
 const unique=[...new Set(assets)].sort();
 assert.ok(unique.some(x=>x.endsWith('.js')),'JS ausente do bundle');
 assert.ok(unique.some(x=>x.endsWith('.css')),'CSS ausente do bundle');
 for(const file of unique){
  assert.match(file,/^\.\/assets\/[A-Za-z0-9_.-]+\.(?:js|css)$/);
 }
 return unique;
}
function renderPreviewWorker(template,version,precache){
 assert.match(version,/^[a-f0-9]{12}$/);
 assert.ok(precache.includes('./index.html'));
 assert.ok(precache.every(x=>x.startsWith('./')&&!x.includes('..')));
 return template.replace('__VERSION__',version)
  .replace('__ASSETS__',JSON.stringify(precache,null,2));
}
function generatePreviewPwa(dist=DIST){
 const html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
 const files=bundleAssets(html);
 for(const file of files)assert.ok(fs.existsSync(path.join(dist,file)),file+' ausente');
 const iconDir=path.join(dist,'icons');
 fs.mkdirSync(iconDir,{recursive:true});
 for(const size of [192,512]){
  fs.copyFileSync(path.join(ROOT,'icons','icon-'+size+'.png'),path.join(iconDir,'icon-'+size+'.png'));
 }
 assert.ok(fs.existsSync(path.join(dist,'manifest.webmanifest')),'manifest ausente');
 const precache=['./','./index.html','./manifest.webmanifest',
  './icons/icon-192.png','./icons/icon-512.png',...files];
 const hash=createHash('sha256');
 for(const file of precache.filter(x=>x!=='./')){
  hash.update(file);
  hash.update(fs.readFileSync(path.join(dist,file)));
 }
 const version=hash.digest('hex').slice(0,12);
 const worker=renderPreviewWorker(fs.readFileSync(TEMPLATE,'utf8'),version,precache);
 fs.writeFileSync(path.join(dist,'sw.js'),worker);
 return {version,precache,worker,cache:PREFIX+version};
}
if(require.main===module){
 const built=generatePreviewPwa();
 process.stdout.write('P5A.1: '+built.cache+'; '+built.precache.length+' caminhos offline.\n');
}
module.exports={bundleAssets,renderPreviewWorker,generatePreviewPwa,PREFIX};
