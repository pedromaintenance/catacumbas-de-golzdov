'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
async function game(){
 const [engine,relics,storage]=await Promise.all([
  import('../phaser-src/src/preview-engine.js'),
  import('../phaser-src/src/preview-relics.js'),
  import('../phaser-src/src/preview-save.js')
 ]);
 return {...engine,...relics,...storage};
}
function arena(mod,cls='vigia'){
 const r=mod.initialPreviewRun(0x19870abc,1,cls);
 r.map.fill(1);r.seen.fill(true);r.rooms=[];r.visitedRooms=[];
 r.enemies=[];r.items=[];r.shrine=null;r.stairs={x:30,y:30};
 r.hero.x=15;r.hero.y=15;r.hero.maxhp=200;r.hero.hp=150;
 r.hero.maxmana=100;r.hero.mana=50;r.hero.nextXP=9999;
 return r;
}
function step(mod,r,item){
 if(item)r.items=[{x:16,y:15,kind:item.kind,value:item.value||0}];
 return mod.previewAction(r,{type:'MOVE',dx:1,dy:0});
}
test('P3B.1 relíquias: onze definições e efeitos são os do HTML clássico',async()=>{
 const mod=await game(),html=read('index.html');
 const match=html.match(/const RELICS=(\[[\s\S]*?\]);\s*const STORIES=/);
 assert.ok(match);
 const expected=vm.runInNewContext('('+match[1]+')');
 assert.equal(JSON.stringify(mod.PREVIEW_RELICS),JSON.stringify(expected));
 assert.equal(mod.PREVIEW_RELICS.length,11);
});
test('os oito tipos de item são coletados por movimento usando o núcleo, inclusive armas e armadilhas',async()=>{
 const mod=await game();
 for(const kind of ['coins','potion','heal','mana','weapon','armor','trap','relic']){
  const r=arena(mod),p=r.hero;
  const before={coins:p.coins,potions:p.potions,hp:p.hp,mana:p.mana,atk:p.atk,def:p.def,turn:r.turn};
  const result=step(mod,r,{kind,value:19});
  assert.equal(result.status,'applied',kind);
  assert.equal(result.consumesTurn,true,kind);
  assert.equal(r.turn,before.turn+1,kind);
  assert.equal(r.items.length,0,kind);
  if(kind==='coins')assert.equal(p.coins,before.coins+19);
  if(kind==='potion')assert.equal(p.potions,before.potions+1);
  if(kind==='heal')assert.equal(p.hp,before.hp+9);
  if(kind==='mana')assert.equal(p.mana,before.mana+6);
  if(kind==='weapon')assert.ok(p.atk>before.atk);
  if(kind==='armor')assert.equal(p.def,before.def+1);
  if(kind==='trap')assert.ok(p.hp<before.hp);
  if(kind==='relic')assert.equal(r.pendingRelicOffer?.offers?.length,2);
 }
});
test('interagir na própria casa coleta uma só vez, sem consumir turno adicional',async()=>{
 const mod=await game(),r=arena(mod);
 r.items=[{kind:'potion',value:0,x:15,y:15}];
 const oldTurn=r.turn,one=mod.previewAction(r,{type:'INTERACT'});
 assert.equal(one.status,'collected');
 assert.equal(r.hero.potions,3);
 assert.equal(r.turn,oldTurn);
 assert.equal(mod.previewAction(r,{type:'INTERACT'}).status,'nothing-to-interact');
 assert.equal(r.hero.potions,3);
});
test('oferta de relicário permanece no save e escolha não altera RNG/turno',async()=>{
 const mod=await game(),r=arena(mod);
 step(mod,r,{kind:'relic'});
 const offers=[...r.pendingRelicOffer.offers],beforeRng=r.rngState,turn=r.turn;
 const calls=[],store=new Map(),memory={
  getItem:k=>(calls.push(k),store.get(k)),setItem:(k,v)=>(calls.push(k),store.set(k,v))
 };
 assert.equal(mod.savePreview(memory,r),true);
 const restored=mod.loadPreview(memory);
 assert.deepEqual(restored.pendingRelicOffer.offers,offers);
 assert.equal(restored.rngState,beforeRng);
 const id=offers[0],result=mod.previewAction(restored,{type:'RELIC_SELECT',id});
 assert.equal(result.status,'relic-equipped');
 assert.ok(restored.hero.relics.includes(id));
 assert.equal(restored.pendingRelicOffer,null);
 assert.equal(restored.rngState,beforeRng);
 assert.equal(restored.turn,turn);
 assert.ok(calls.every(x=>x===mod.PREVIEW_SAVE_KEY));
});
test('troca de relíquias é transacional e exige confirmação; slots ancestrais ocupam dois',async()=>{
 const mod=await game(),r=arena(mod);
 const owned=['heart','moss','rune','mirror'];
 r.hero.relics=[...owned];
 r.pendingRelicOffer={source:'relicario',offers:['chain','ash'],selection:null,removing:[]};
 const stats=JSON.stringify(r.hero),rng=r.rngState,turn=r.turn;
 assert.equal(mod.previewAction(r,{type:'RELIC_SELECT',id:'chain'}).status,'relic-swap-required');
 assert.equal(mod.previewAction(r,{type:'RELIC_TOGGLE',id:'heart'}).status,'relic-swap-pending');
 assert.equal(JSON.stringify(r.hero),stats);
 assert.equal(mod.previewAction(r,{type:'RELIC_CONFIRM'}).status,'relic-swap-required');
 assert.equal(mod.previewAction(r,{type:'RELIC_TOGGLE',id:'moss'}).status,'relic-swap-pending');
 assert.equal(JSON.stringify(r.hero),stats);
 assert.equal(mod.previewAction(r,{type:'RELIC_CONFIRM'}).status,'relic-equipped');
 assert.ok(r.hero.relics.includes('chain'));
 assert.ok(!r.hero.relics.includes('heart'));
 assert.ok(!r.hero.relics.includes('moss'));
 assert.equal(r.hero.relics.length,3);
 assert.equal(r.pendingRelicOffer,null);
 assert.equal(r.rngState,rng);assert.equal(r.turn,turn);
});
test('relicário pode ser recusado; escolhas inválidas não alteram itens',async()=>{
 const mod=await game(),r=arena(mod);
 step(mod,r,{kind:'relic'});
 const copy=JSON.stringify(r);
 assert.equal(mod.previewAction(r,{type:'RELIC_SELECT',id:'nao-existe'}).status,'invalid-relic');
 assert.equal(JSON.stringify(r),copy);
 assert.equal(mod.previewAction(r,{type:'WAIT'}).status,'relic-choice-required');
 assert.equal(mod.previewAction(r,{type:'RELIC_SKIP'}).status,'relic-skipped');
 assert.equal(r.pendingRelicOffer,null);
});
test('altar mostra escolha, permite cura/relíquia e não consome turno extra',async()=>{
 const mod=await game(),r=arena(mod);
 r.shrine={x:16,y:15};
 step(mod,r);
 assert.equal(r.altarUsed,true);
 assert.equal(r.pendingShrineChoice,true);
 const tick=r.turn;
 assert.equal(mod.previewAction(r,{type:'WAIT'}).status,'shrine-choice-required');
 assert.equal(mod.previewAction(r,{type:'CHOOSE_SHRINE',id:'heal'}).status,'shrine-used');
 assert.equal(r.hero.hp,170);
 assert.equal(r.turn,tick);
 assert.equal(r.pendingShrineChoice,false);
 const other=arena(mod);other.shrine={x:16,y:15};
 step(mod,other);
 assert.equal(mod.previewAction(other,{type:'CHOOSE_SHRINE',id:'relic'}).status,'shrine-used');
 assert.equal(other.pendingRelicOffer.offers.length,2);
});
test('escada espera confirmação e pode reabrir depois de cancelar sem gerar novo turno',async()=>{
 const mod=await game(),r=arena(mod);
 r.stairs={x:16,y:15};
 step(mod,r);const turn=r.turn,oldFloor=r.floor;
 assert.equal(r.pendingStairs,true);assert.equal(r.floor,oldFloor);
 assert.equal(mod.previewAction(r,{type:'WAIT'}).status,'stairs-choice-required');
 assert.equal(mod.previewAction(r,{type:'STAIRS_CANCEL'}).status,'stairs-cancelled');
 assert.equal(mod.previewAction(r,{type:'INTERACT'}).status,'stairs-opened');
 assert.equal(mod.previewAction(r,{type:'STAIRS_DESCEND'}).status,'descended');
 assert.equal(r.floor,2);assert.equal(r.turn,turn);
 assert.equal(r.pendingStairs,false);
});
test('relíquias disparam onRoot e onTurnStart no núcleo Phaser',async()=>{
 const mod=await game(),r=arena(mod,'errante');
 r.hero.relics=['rune','moss'];
 r.hero.mana=50;r.hero.hp=120;
 r.enemies=[{id:4,type:'rat',x:16,y:15,hp:50,maxhp:50,atk:1,def:0,stun:4,root:0,cd:0}];
 const oldFocus=r.hero.mana;
 const out=mod.previewAction(r,{type:'SKILL',which:1});
 assert.equal(out.status,'applied');
 assert.ok(r.enemies[0].root>0);
 // Círculo custa quatro, Marca de Raiz recupera um pela raiz.
 assert.equal(r.hero.mana,oldFocus-4+1);
 r.turn=5;
 mod.previewAction(r,{type:'WAIT'});
 assert.ok(r.hero.hp>=122);
});
test('modal e auto-roteamento aparecem na cena; a preview mantém chaves de save isoladas',()=>{
 const html=read('phaser-src/index.html'),scene=read('phaser-src/src/scenes/DungeonScene.js');
 const adapter=read('phaser-src/src/preview-item-ui.js'),
  route=read('phaser-src/src/preview-route.js');
 for(const id of ['item-selection','item-options','hero-coins','hero-relic-slots'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(route,/findPath\(/);
 assert.match(scene,/planPreviewRoute\(/);
 assert.match(scene,/type:'INTERACT'/);
 assert.match(scene,/itemUI\.active\(\)/);
 assert.match(adapter,/RELIC_CONFIRM/);
 assert.doesNotMatch(scene,/carcaca_golzdov_run_v1|carcaca_golzdov_meta_v1/);
});
