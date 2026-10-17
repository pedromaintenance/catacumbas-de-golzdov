'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
async function load(){
 const [engine,shop,save]=await Promise.all([
  import('../phaser-src/src/preview-engine.js'),
  import('../phaser-src/src/preview-shop.js'),
  import('../phaser-src/src/preview-save.js')
 ]);
 return {...engine,...shop,...save};
}
function stage(m,cls='vigia'){
 const run=m.initialPreviewRun(0x17293845,1,cls);
 run.map.fill(1);run.seen.fill(true);run.rooms=[];run.visitedRooms=[];
 run.enemies=[];run.items=[];run.shrine=null;
 run.stairs={x:15,y:15};run.hero.x=15;run.hero.y=15;
 run.hero.hp=10;run.hero.mana=0;run.hero.nextXP=5000;
 run.hero.coins=400;
 const opened=m.previewAction(run,{type:'INTERACT'});
 assert.equal(opened.status,'stairs-opened');
 assert.equal(m.previewAction(run,{type:'SHOP_OPEN'}).status,'shop-opened');
 return run;
}
const act=(m,r,type,id)=>m.previewAction(r,{type,id});
test('P3B.2: seis preços e descrições iguais ao mercador HTML',async()=>{
 const m=await load(),html=read('index.html');
 const block=html.slice(html.indexOf('function shopModal()'),html.indexOf('function showStory()'));
 assert.equal(m.PREVIEW_SHOP_GOODS.length,6);
 for(const g of m.PREVIEW_SHOP_GOODS){
  assert.match(block,new RegExp(g.name));
  assert.match(block,new RegExp('cost:'+g.cost));
  assert.ok(block.includes(g.desc));
 }
 assert.deepEqual(m.PREVIEW_SHOP_GOODS.map(x=>x.cost),[20,16,16,38,38,54]);
});
test('as cinco compras normais conservam turno, RNG e reabrem o mesmo mercado',async()=>{
 const m=await load(),r=stage(m,'arcanista');
 const p=r.hero,before={turn:r.turn,rng:r.rngState,coins:p.coins};
 const initial={potions:p.potions,hp:p.hp,mana:p.mana,atk:p.atk,def:p.def};
 for(const id of ['potion','heal','focus','attack','defense']){
  assert.equal(act(m,r,'SHOP_BUY',id).status,'shop-bought');
  assert.equal(r.pendingShop,true);
 }
 assert.equal(p.potions,initial.potions+1);
 assert.equal(p.hp,Math.min(p.maxhp,initial.hp+18));
 assert.equal(p.mana,p.maxmana);
 assert.equal(p.atk,initial.atk+1);
 assert.equal(p.def,initial.def+1);
 assert.equal(p.coins,before.coins-20-16-16-38-38);
 assert.equal(r.turn,before.turn);assert.equal(r.rngState,before.rng);
});
test('compra negada, item inválido e menu fora da escada não modificam estado',async()=>{
 const m=await load(),r=stage(m);
 r.hero.coins=15;const old=JSON.stringify(r);
 assert.equal(act(m,r,'SHOP_BUY','potion').status,'insufficient-coins');
 assert.equal(act(m,r,'SHOP_BUY','relic').status,'invalid-shop-item');
 assert.equal(act(m,r,'SHOP_BUY','nao-existe').status,'invalid-shop-item');
 assert.equal(act(m,r,'SHOP_RELIC').status,'insufficient-coins');
 assert.equal(JSON.stringify(r),old);
 assert.equal(act(m,r,'SHOP_CLOSE').status,'shop-closed');
 assert.equal(r.pendingStairs,true);assert.equal(r.pendingShop,false);
 assert.equal(act(m,r,'SHOP_BUY','potion').status,'invalid-shop-item');
 assert.equal(act(m,r,'SHOP_RELIC').status,'no-shop');
 assert.equal(act(m,r,'SHOP_OPEN').status,'shop-opened');
 assert.equal(act(m,r,'SHOP_CLOSE').status,'shop-closed');
});
test('oferta do mercador é fixa por andar e persistida após cancelar, voltar e salvar',async()=>{
 const m=await load(),r=stage(m);
 const initialCoins=r.hero.coins,turn=r.turn;
 assert.equal(act(m,r,'SHOP_RELIC').status,'shop-relic-opened');
 const offer=[...r.pendingRelicOffer.offers],seed=r.rngState;
 assert.equal(offer.length,2);assert.deepEqual(r.shopOffers,offer);
 const store=new Map(),storage={getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)};
 assert.equal(m.savePreview(storage,r),true);
 const loaded=m.loadPreview(storage);
 assert.deepEqual(loaded.pendingRelicOffer.offers,offer);
 assert.equal(loaded.rngState,seed);
 assert.equal(act(m,loaded,'RELIC_SKIP').status,'relic-skipped');
 assert.equal(loaded.pendingShop,true);
 assert.equal(act(m,loaded,'SHOP_RELIC').status,'shop-relic-opened');
 assert.deepEqual(loaded.pendingRelicOffer.offers,offer);
 assert.equal(loaded.rngState,seed);
 assert.equal(loaded.hero.coins,initialCoins);assert.equal(loaded.turn,turn);
});
test('relicário do mercador cobra 54 somente ao equipar e nunca duas vezes',async()=>{
 const m=await load(),r=stage(m);
 assert.equal(act(m,r,'SHOP_RELIC').status,'shop-relic-opened');
 const offer=[...r.pendingRelicOffer.offers],coins=r.hero.coins,seed=r.rngState,tick=r.turn;
 const choice=act(m,r,'RELIC_SELECT',offer[0]);
 assert.equal(choice.status,'relic-equipped');
 assert.equal(r.hero.coins,coins-54);
 assert.equal(r.hero.relics.includes(offer[0]),true);
 assert.equal(r.pendingRelicOffer,null);
 assert.equal(r.pendingShop,true);
 assert.equal(r.rngState,seed);assert.equal(r.turn,tick);
 assert.equal(act(m,r,'RELIC_CONFIRM').status,'no-relic-offer');
 assert.equal(r.hero.coins,coins-54);
 assert.equal(act(m,r,'SHOP_RELIC').status,'shop-relic-opened');
 assert.deepEqual(r.pendingRelicOffer.offers,[offer[1]]);
 assert.equal(r.rngState,seed);
});
test('troca na bolsa cheia é transacional, só debita após confirmar e não rerola',async()=>{
 const m=await load(),r=stage(m);
 r.hero.relics=['heart','moss','rune','mirror'];
 const old=JSON.stringify(r.hero),initial=r.hero.coins;
 assert.equal(act(m,r,'SHOP_RELIC').status,'shop-relic-opened');
 const first=r.pendingRelicOffer.offers[0],rng=r.rngState,turn=r.turn;
 assert.equal(act(m,r,'RELIC_SELECT',first).status,'relic-swap-required');
 assert.equal(r.hero.coins,initial);
 assert.equal(act(m,r,'RELIC_TOGGLE','heart').status,'relic-swap-pending');
 assert.equal(JSON.stringify(r.hero),old);
 assert.equal(r.hero.coins,initial);
 assert.equal(act(m,r,'RELIC_CONFIRM').status,'relic-equipped');
 assert.equal(r.hero.coins,initial-54);
 assert.equal(r.hero.relics.includes(first),true);
 assert.equal(r.hero.relics.includes('heart'),false);
 assert.equal(r.turn,turn);assert.equal(r.rngState,rng);
});
test('recusar uma oferta ou esgotar o catálogo nunca produz âmbar gratuito',async()=>{
 const m=await load(),r=stage(m);
 r.hero.relics=['heart','moss','rune','mirror','fang','ash','chain','omen','eye','crown','chalice'];
 const before=r.hero.coins,seed=r.rngState;
 assert.equal(act(m,r,'SHOP_RELIC').status,'shop-sold-out');
 assert.equal(r.pendingRelicOffer,null);
 assert.deepEqual(r.shopOffers,[]);
 assert.equal(r.hero.coins,before);assert.equal(r.rngState,seed);
 assert.equal(act(m,r,'SHOP_RELIC').status,'shop-sold-out');
 assert.equal(r.hero.coins,before);
});
test('compra de relicário sem saldo não consome turno/RNG nem sorteia ofertas',async()=>{
 const m=await load(),r=stage(m);
 r.hero.coins=53;const raw=JSON.stringify(r);
 assert.equal(act(m,r,'SHOP_RELIC').status,'insufficient-coins');
 assert.equal(JSON.stringify(r),raw);
 r.hero.coins=60;
 assert.equal(act(m,r,'SHOP_RELIC').status,'shop-relic-opened');
 r.hero.coins=50;const rng=r.rngState;
 const pick=r.pendingRelicOffer.offers[0],snapshot=JSON.stringify(r.hero);
 assert.equal(act(m,r,'RELIC_SELECT',pick).status,'insufficient-coins');
 assert.equal(JSON.stringify(r.hero),snapshot);
 assert.equal(r.rngState,rng);
});
test('abrir mercador no último andar ou fora da escada não é permitido',async()=>{
 const m=await load(),r=stage(m);
 assert.equal(act(m,r,'SHOP_CLOSE').status,'shop-closed');
 r.hero.x=14;
 const old=JSON.stringify(r);
 assert.equal(act(m,r,'SHOP_OPEN').status,'no-shop');
 assert.equal(JSON.stringify(r),old);
 r.hero.x=15;r.floor=5;
 assert.equal(act(m,r,'SHOP_OPEN').status,'no-shop');
});
test('a interface inclui mercador, confirmação, preço e retorno sem tocar no save estável',()=>{
 const scene=read('phaser-src/src/scenes/DungeonScene.js');
 const ui=read('phaser-src/src/preview-item-ui.js');
 const html=read('phaser-src/index.html');
 assert.match(ui,/SHOP_OPEN/);assert.match(ui,/SHOP_RELIC/);
 assert.match(ui,/SHOP_BUY/);assert.match(ui,/SHOP_CLOSE/);
 assert.match(ui,/Preço: ◈/);
 assert.match(scene,/PreviewItemUI/);
 assert.match(html,/id="item-selection"/);
 assert.doesNotMatch(ui+scene,/carcaca_golzdov_run_v1|carcaca_golzdov_meta_v1/);
});
