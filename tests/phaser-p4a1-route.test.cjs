'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
async function load(){
 const [engine,route,save]=await Promise.all([
  import('../phaser-src/src/preview-engine.js'),
  import('../phaser-src/src/preview-route.js'),
  import('../phaser-src/src/preview-save.js')
 ]);
 return {...engine,...route,...save};
}
function arena(mod){
 const r=mod.initialPreviewRun(0x12345678);
 r.map.fill(1);r.seen.fill(true);r.enemies=[];r.items=[];r.shrine=null;
 r.hero.x=15;r.hero.y=15;r.stairs={x:30,y:30};
 return r;
}
test('P4A.1: rota explora apenas casas conhecidas e preserva o estado e RNG',async()=>{
 const m=await load(),run=arena(m),old=JSON.stringify(run);
 const path=m.planPreviewRoute(run,18,15);
 assert.deepEqual(path,[[1,0],[1,0],[1,0]]);
 assert.deepEqual(m.routeCoordinates(run.hero,path),[{x:16,y:15},{x:17,y:15},{x:18,y:15}]);
 assert.equal(JSON.stringify(run),old);
 run.seen[15*35+18]=false;
 assert.equal(m.planPreviewRoute(run,18,15),null,'destino fora da neblina não permite rota');
});
test('rota recusa destinos inválidos, paredes, inimigos e coordenadas fora do mapa',async()=>{
 const m=await load(),run=arena(m);
 for(const p of [[0,0],[34,34],[-1,12],[35,12],[1.5,4],[NaN,6]])
  assert.equal(m.planPreviewRoute(run,...p),null);
 run.map[15*35+17]=0;
 assert.equal(m.planPreviewRoute(run,17,15),null);
 run.enemies=[{id:4,hp:8,x:16,y:15}];
 assert.equal(m.planPreviewRoute(run,16,15),null);
 run.over=true;
 assert.equal(m.planPreviewRoute(run,18,15),null);
 assert.deepEqual(m.routeCoordinates(run.hero,[[1,0],[2,0]]),[]);
});
test('ameaça próxima avistada pausa navegação, sem interferência de inimigo morto ou distante',async()=>{
 const m=await load(),run=arena(m),visible=new Set([15*35+17]);
 run.enemies=[{id:1,hp:8,x:17,y:15}];
 const before=JSON.stringify(run);
 assert.equal(m.nearPreviewThreat(run,visible),true);
 assert.equal(m.nearPreviewThreat(run,new Set()),false);
 assert.equal(m.nearPreviewThreat(run,visible,1),false);
 run.enemies[0].hp=0;
 assert.equal(m.nearPreviewThreat(run,visible),false);
 run.enemies[0].hp=8;run.enemies[0].x=25;
 assert.equal(m.nearPreviewThreat(run,visible),false);
 assert.notEqual(JSON.stringify(run),before,'somente mutações explícitas do teste mudaram o estado');
});
test('P4A.1: transição integrada dos cinco estratos usa mapas reais, navegação, menus e saves',async()=>{
 const m=await load();
 for(const seed of [7,0x12345678,0x99887766]){
  const store=new Map(),storage={getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)};
  let run=m.initialPreviewRun(seed,1,'vigia');
  for(let floor=1;floor<=5;floor++){
   assert.equal(run.floor,floor);
   // Fixtures de QA: remove inimigos/itens para isolar a topologia e as transições.
   // Não é um playtest de combate/balanceamento.
   run.enemies=[];run.items=[];run.shrine=null;run.seen.fill(true);
   run.hero.maxhp=500;run.hero.hp=500;run.hero.nextXP=999999;
   const target={...run.stairs};
   const path=m.planPreviewRoute(run,target.x,target.y);
   assert.ok(path?.length>0,'escada deve ser alcançável pela malha gerada no estrato '+floor);
   const before=run.turn;
   for(const [dx,dy] of path){
    const out=m.previewAction(run,{type:'MOVE',dx,dy});
    assert.equal(out.status,'applied');
    assert.equal(out.consumesTurn,true);
   }
   assert.equal(run.turn,before+path.length);
   assert.deepEqual([run.hero.x,run.hero.y],[target.x,target.y]);
   assert.equal(run.pendingStairs,true);
   if(floor===5){
    assert.equal(m.previewAction(run,{type:'STAIRS_DESCEND'}).status,'sealed');
    assert.equal(m.previewAction(run,{type:'STAIRS_CANCEL'}).status,'stairs-cancelled');
    run.bossDown=true;
    assert.equal(m.previewAction(run,{type:'WAIT'}).status,'applied');
    assert.equal(run.pendingFinalChoice,true);
    break;
   }
   assert.equal(m.previewAction(run,{type:'SHOP_OPEN'}).status,'shop-opened');
   assert.equal(m.previewAction(run,{type:'SHOP_CLOSE'}).status,'shop-closed');
   const descent=m.previewAction(run,{type:'STAIRS_DESCEND'});
   assert.equal(descent.status,'descended');
   assert.equal(descent.consumesTurn,false);
   assert.equal(run.floor,floor+1);
   assert.equal(run.shopOffers,null,'estoque é reiniciado a cada estrato');
   assert.equal(m.savePreview(storage,run),true);
   run=m.loadPreview(storage);
   assert.equal(run.floor,floor+1);
  }
  const turn=run.turn,rng=run.rngState;
  assert.equal(m.previewAction(run,{type:'CHOOSE_ENDING',ending:'raiz'}).status,'ending-chosen');
  assert.equal(run.previewOutcome,'raiz');
  assert.equal(run.turn,turn);assert.equal(run.rngState,rng);
 }
});
test('regras de roteamento são independentes da cena e não gastam turnos ou dados aleatórios',async()=>{
 const m=await load(),r=arena(m);
 const before=JSON.stringify(r);
 m.planPreviewRoute(r,30,16);
 m.nearPreviewThreat(r,new Set());
 m.routeCoordinates(r.hero,[[1,0],[1,0]]);
 assert.equal(JSON.stringify(r),before);
 const js=read('phaser-src/src/preview-route.js');
 assert.doesNotMatch(js,/Math\.random|localStorage|sessionStorage|document\.getElementById|requestAnimationFrame/);
});
test('UI marca o destino, permite cancelar por toque/Esc/B e interrompe ao avistar inimigos',()=>{
 const html=read('phaser-src/index.html');
 const scene=read('phaser-src/src/scenes/DungeonScene.js');
 const css=read('phaser-src/src/style.css');
 for(const id of ['route-feedback','route-text'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/data-preview-action="cancel-route"/);
 assert.match(scene,/this\.routeGraphics\.strokeRect/);
 assert.match(scene,/routeCoordinates\(/);
 assert.match(scene,/planPreviewRoute\(/);
 assert.match(scene,/nearPreviewThreat\(/);
 assert.match(scene,/routeCancelUntilRelease/);
 assert.match(scene,/cancelAutoRoute\(/);
 assert.match(scene,/this\.itemUI\.active\(\)\)return/);
 assert.match(css,/\.route-feedback\.hidden/);
 assert.doesNotMatch(scene,/carcaca_golzdov_run_v1|carcaca_golzdov_meta_v1/);
});
