'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const legacy=fs.readFileSync(path.join(ROOT,'tests/fixtures/legacy-movement.js'),'utf8');
const js=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];
const modules=['core/rng.js','core/dungeon.js','core/navigation.js','core/combat.js','core/skills.js','core/enemies.js','core/turns.js','core/actions.js','core/loot.js','core/rewards.js','relic-effects.js','relic-offers.js'];
function boot(old){
 const dom=new Map(),storage=new Map();
 function element(id){
  if(!dom.has(id)){
   const classes=new Set(id==='overlay'?['hidden']:[]);
   dom.set(id,{id,textContent:'',innerHTML:'',style:{},disabled:false,
    classList:{add:v=>classes.add(v),remove:v=>classes.delete(v),contains:v=>classes.has(v),
      toggle(v,on){if(on===undefined?!classes.has(v):on)classes.add(v);else classes.delete(v);}},
    addEventListener(){},getContext(){return {}},getBoundingClientRect(){return{width:350,height:500}},click(){}});
  }
  return dom.get(id);
 }
 const context={
  document:{getElementById:element,querySelectorAll:()=>[],addEventListener(){},createElement:()=>element('generated')},
  window:{addEventListener(){}},
  localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
  crypto:{getRandomValues(a){a[0]=0x12345678;return a}},
  requestAnimationFrame(){return 0},setTimeout(){return 0},clearTimeout(){},performance:{now:()=>0}
 };
 for(const f of modules)vm.runInNewContext(fs.readFileSync(path.join(ROOT,f),'utf8'),context,{filename:f,timeout:10000});
 let script=js;
 if(old){
  const start=script.indexOf('function doMove('),end=script.indexOf('function applyGameEvents(',start);
  assert.ok(start>=0&&end>start);
  script=script.slice(0,start)+legacy+'\n'+script.slice(end);
 }
 const hook="showScreen('home');renderClasses();requestAnimationFrame(render);";
 assert.equal(script.split(hook).length,2);
 script=script.replace(hook,"showScreen('home');renderClasses();globalThis.__movement={get:()=>G,startNew,hideModal,doMove,chooseClass:id=>{selectedClass=id}};requestAnimationFrame(render);");
 vm.runInNewContext(script,context,{filename:old?'legacy-movement':'new-movement',timeout:10000});
 return {api:context.__movement,storage,actions:context.window.GolzdovActions};
}
const SCENARIOS=['open','wall','boundary','enemy','new-room','visited-room','coins','potion','mana','heal','trap','trap-fatal','relic','weapon','armor','shrine','stairs'];
const SEEDS=[1,2,0x12345678,0xabcdef01,0xdeadbeef,0xffffffff,0x6d2b79f5,0x80000000];
function play(runtime,cls,seed,scenario){
 const h=runtime.api;
 h.chooseClass(cls);h.startNew();h.hideModal(true);
 const g=h.get(),p=g.hero;
 g.rngState=seed;g.floor=3;g.turn=4;g.steps=12;g.over=false;g.bossDown=false;g.logs=[];
 g.map=Array(35*35).fill(1);g.seen=Array(35*35).fill(true);
 g.rooms=[{x:12,y:12,w:4,h:4,cx:14,cy:14},{x:16,y:14,w:4,h:4,cx:18,cy:16}];
 g.visitedRooms=[0];g.altarUsed=false;g.pendingRelicOffer=null;g.chainUsed=false;
 g.items=[];g.stairs={x:30,y:30};g.shrine={x:29,y:29};
 p.x=15;p.y=15;p.hp=70;p.maxhp=130;p.mana=12;p.maxmana=40;p.level=3;p.xp=0;p.nextXP=800;
 p.def=3;p.dodge=10;p.crit=15;p.relics=[];p.talents=[];p.relicState={echo:0,ward:0,fangTurn:-1};
 g.enemies=[{id:350,type:'guard',x:28,y:28,hp:200,maxhp:200,atk:12,def:2,stun:0,root:0,cd:0}];
 if(scenario==='wall')g.map[15*35+16]=0;
 if(scenario==='boundary'){p.x=1;p.y=1;}
 if(scenario==='enemy'){g.enemies[0].x=16;g.enemies[0].y=15;}
 if(scenario==='visited-room')g.visitedRooms=[0,1];
 if(['coins','potion','mana','heal','trap','trap-fatal','relic','weapon','armor'].includes(scenario)){
  const kind=scenario==='trap-fatal'?'trap':scenario;
  g.items=[{x:16,y:15,kind,value:kind==='coins'?21:0}];
 }
 if(scenario==='trap-fatal')p.hp=1;
 if(scenario==='shrine')g.shrine={x:16,y:15};
 if(scenario==='stairs')g.stairs={x:16,y:15};
 const dx=scenario==='boundary'?-1:1,dy=0;
 h.doMove(dx,dy);
 const save=runtime.storage.get('carcaca_golzdov_run_v1')||null;
 const meta=runtime.storage.get('carcaca_golzdov_meta_v1')||null;
 return JSON.stringify({run:g,save,meta});
}
test('408 cenários de movimento originais e novos têm estado e save idênticos',()=>{
 const old=boot(true),modern=boot(false);let count=0;
 for(const cls of ['vigia','arcanista','errante'])for(const seed of SEEDS)for(const scenario of SCENARIOS){
  assert.equal(play(modern,cls,seed,scenario),play(old,cls,seed,scenario),
    cls+' / '+seed.toString(16)+' / '+scenario);
  count++;
 }
 assert.equal(count,408);
});
test('MOVE é independente de DOM e proíbe diagonal e movimento fora do mapa',()=>{
 const {actions}=boot(false);
 const c=fs.readFileSync(path.join(ROOT,'core/actions.js'),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
 assert.doesNotMatch(c,/document\.|localStorage|Phaser\.|requestAnimationFrame|setTimeout\(/);
 const run={over:false,steps:0,rngState:123,hero:{x:10,y:10},map:Array(35*35).fill(1),enemies:[],rooms:[],visitedRooms:[]};
 for(const act of [{type:'MOVE',dx:1,dy:1},{type:'MOVE',dx:0,dy:0},{type:'MOVE',dx:1.5,dy:0}]){
  const got=actions.dispatch(run,act);
  assert.equal(got.status,'invalid-direction');
  assert.equal(got.consumesTurn,false);
 }
 assert.equal(run.steps,0);assert.equal(run.rngState,123);
 const ok=actions.dispatch(run,{type:'MOVE',dx:1,dy:0});
 assert.equal(ok.status,'applied');assert.equal(run.steps,1);assert.equal(run.hero.x,11);
 assert.equal(JSON.stringify(ok.events.map(x=>x.type)),JSON.stringify(['sound','collect-at-player','turn','post-move']));
 assert.equal(run.rngState,123);
});
test('inimigo na rota transfere ataque sem permitir passo ou duplicar turno',()=>{
 const {actions}=boot(false);
 const run={over:false,steps:3,rngState:321,hero:{x:10,y:10},map:Array(35*35).fill(1),
  enemies:[{id:11,hp:20,x:11,y:10}],rooms:[],visitedRooms:[]};
 const a=actions.dispatch(run,{type:'MOVE',dx:1,dy:0});
 assert.equal(a.status,'enemy');assert.equal(a.consumesTurn,true);
 assert.equal(a.events.length,1);assert.equal(a.events[0].type,'attack');
 assert.equal(a.events[0].enemyId,11);
 assert.equal(run.hero.x,10);assert.equal(run.steps,3);assert.equal(run.rngState,321);
});
test('a versão de teste aparece no menu inicial de forma acessível',()=>{
 assert.match(html,/<small id="build-version"[^>]*>BUILD 1\.3\.4 · CACHE V18 · P1C\.3B\.3B\.2A<\/small>/);
 assert.match(html,/\.build-version\{display:block/);
});
