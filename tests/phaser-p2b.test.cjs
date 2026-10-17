'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
async function modules(){
 return Promise.all([import('../phaser-src/src/preview-engine.js'),import('../phaser-src/src/preview-save.js')]);
}
test('save P2B usa apenas chave própria, valida schema e não lê legado',async()=>{
 const [engine,save]=await modules();
 const calls=[],map=new Map();
 const storage={getItem:k=>(calls.push(['get',k]),map.get(k)||null),
   setItem:(k,v)=>(calls.push(['set',k]),map.set(k,v)),
   removeItem:k=>(calls.push(['remove',k]),map.delete(k))};
 const run=engine.initialPreviewRun(0x12345678,2);
 assert.equal(save.savePreview(storage,run),true);
 assert.ok(save.PREVIEW_SAVE_KEY.includes('phaser_preview_'));
 assert.equal(JSON.stringify(save.loadPreview(storage)),JSON.stringify(run));
 assert.equal(save.clearPreview(storage),true);
 assert.equal(save.loadPreview(storage),null);
 for(const [kind,key] of calls){
  assert.equal(key,save.PREVIEW_SAVE_KEY);
  assert.ok(!key.startsWith('carcaca_golzdov_run_'),kind);
  assert.ok(!key.startsWith('carcaca_golzdov_meta_'),kind);
 }
 map.set(save.PREVIEW_SAVE_KEY,'{"schemaVersion":1}');
 assert.equal(save.loadPreview(storage),null);
 map.set(save.PREVIEW_SAVE_KEY,'invalid JSON');
 assert.equal(save.loadPreview(storage),null);
});
test('5 estratos, 8 seeds: preview cria mapa real e WAIT avança um turno exato',async()=>{
 const [engine]=await modules();
 for(let floor=1;floor<=5;floor++)for(const seed of [1,2,3,0x12345678,0xabcdef01,0x6d2b79f5,0xffffffff,0x80000000]){
  const run=engine.initialPreviewRun(seed,floor);run.enemies=[];
  const before=run.turn,old=run.rngState,mana=run.hero.mana;
  run.hero.mana=0;
  const out=engine.previewAction(run,{type:'WAIT'});
  assert.equal(out.consumesTurn,true);
  assert.equal(run.turn,before+1);
  assert.equal(run.hero.mana,1);
  assert.equal(run.rngState,old);
  assert.equal(run.floor,floor);
  assert.ok(run.seen.some(Boolean));
 }
});
test('movimento contra parede e ataque fora de alcance não gastam turno nem RNG',async()=>{
 const [engine]=await modules();
 const run=engine.initialPreviewRun(42,1);run.enemies=[];
 const p=run.hero,before=run.rngState,start=run.turn;
 const bad=engine.previewAction(run,{type:'MOVE',dx:5,dy:5});
 assert.equal(bad.consumesTurn,false);
 assert.equal(run.rngState,before);assert.equal(run.turn,start);
 const foe={id:987,type:'rat',x:Math.min(33,p.x+15),y:p.y,hp:8,maxhp:8,atk:4,def:0,root:0,stun:0,cd:0};
 run.enemies.push(foe);
 const no=engine.previewAction(run,{type:'ATTACK',enemyId:987});
 assert.equal(no.consumesTurn,false);assert.equal(run.turn,start);
 assert.equal(run.rngState,before);
});
test('colisão com inimigo vira ataque e só avança um turno',async()=>{
 const [engine]=await modules();const run=engine.initialPreviewRun(157,1);
 const p=run.hero;
 p.x=15;p.y=15;p.range=1;p.atk=20;p.crit=100;p.hp=100;p.maxhp=100;
 run.map.fill(1);run.seen.fill(true);
 run.enemies=[{id:5,type:'rat',x:16,y:15,hp:100,maxhp:100,atk:1,def:0,root:0,stun:0,cd:0}];
 run.enemyId=5;
 const turn=run.turn,rngBefore=run.rngState;
 const outcome=engine.previewAction(run,{type:'MOVE',dx:1,dy:0});
 assert.equal(outcome.consumesTurn,true);
 assert.equal(run.turn,turn+1);
 assert.equal(run.hero.x,15);
 assert.notEqual(run.rngState,rngBefore,'a tentativa deve consumir RNG do golpe');
 assert.ok(run.enemies[0].hp<=100);
 if(run.enemies[0].hp===100)assert.match(run.previewLog.join(' '),/Você erra/);
});
test('POTION aplica custo e heal; preview salva estado sem afetar produção',async()=>{
 const [engine,save]=await modules();const run=engine.initialPreviewRun(100,1);
 run.enemies=[];const p=run.hero;
 p.hp=5;p.potions=2;
 const out=engine.previewAction(run,{type:'POTION'});
 assert.equal(out.consumesTurn,true);
 assert.equal(run.turn,1);
 assert.equal(p.potions,1);
 assert.ok(p.hp>5);
 const map=new Map(),storage={setItem:(k,v)=>map.set(k,v),getItem:k=>map.get(k)};
 assert.equal(save.savePreview(storage,run),true);
 assert.equal(map.size,1);
 assert.ok(save.loadPreview(storage));
});
test('P2B scene expõe teclado, toque, gamepad e HUD, mas não roda turnos no update',()=>{
 const s=read('phaser-src/src/scenes/DungeonScene.js'),html=read('phaser-src/index.html');
 assert.match(s,/keydown/);assert.match(s,/getGamepads/);assert.match(s,/pointerdown/);
 assert.match(s,/previewAction/);assert.match(s,/savePreview/);assert.match(s,/startFollow/);
 assert.match(html,/data-preview-action="up"/);
 assert.match(html,/data-preview-action="attack"/);
 assert.match(html,/id="hero-hp"/);assert.match(html,/id="hero-focus"/);
 const update=s.slice(s.indexOf('update(time){'));
 assert.doesNotMatch(update,/GolzdovTurns\.advance|Math\.random/);
 const store=read('phaser-src/src/preview-save.js');
 assert.doesNotMatch(store,/['"]carcaca_golzdov_run_v1['"]|['"]carcaca_golzdov_meta_v1['"]/);
 const sw=read('sw.js');
 assert.doesNotMatch(sw,/\.\/phaser\//);
});
