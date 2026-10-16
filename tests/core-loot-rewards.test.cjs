'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const oldCode=fs.readFileSync(path.join(ROOT,'tests/fixtures/legacy-loot-rewards.js'),'utf8');
const main=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];
const modules=['core/rng.js','core/dungeon.js','core/navigation.js','core/combat.js','core/skills.js','core/enemies.js','core/turns.js','core/actions.js','core/loot.js','core/rewards.js','core/defense.js','relic-effects.js','relic-offers.js'];
function boot(legacy){
 const elements=new Map(),storage=new Map();
 function elem(id){
  if(!elements.has(id)){
   const set=new Set(id==='overlay'?['hidden']:[]);
   elements.set(id,{id,textContent:'',innerHTML:'',style:{},disabled:false,
    classList:{add:v=>set.add(v),remove:v=>set.delete(v),contains:v=>set.has(v),
      toggle(v,on){if(on===undefined?!set.has(v):on)set.add(v);else set.delete(v);}},
    addEventListener(){},getContext(){return {}},getBoundingClientRect(){return {width:350,height:500}},click(){}});
  }
  return elements.get(id);
 }
 const ctx={
  document:{getElementById:elem,querySelectorAll:()=>[],addEventListener(){},createElement:()=>elem('generated')},
  window:{addEventListener(){}},
  localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
  crypto:{getRandomValues(a){a[0]=0x12345678;return a}},
  requestAnimationFrame(){return 0},setTimeout(){return 0},clearTimeout(){},
  performance:{now:()=>0}
 };
 for(const name of modules)vm.runInNewContext(fs.readFileSync(path.join(ROOT,name),'utf8'),ctx,{filename:name,timeout:10000});
 let source=main;
 if(legacy){
  const collect=oldCode.slice(oldCode.indexOf('function collect('),oldCode.indexOf('function killEnemy(')).trim();
  const kill=oldCode.slice(oldCode.indexOf('function killEnemy(')).trim();
  const ca=source.indexOf('function collect('),cb=source.indexOf('function applyRelic(',ca);
  const ka=source.indexOf('function killEnemy('),kb=source.indexOf('function skill(',ka);
  assert.ok(ca>=0&&cb>ca&&ka>=0&&kb>ka);
  source=source.slice(0,ka)+kill+'\n'+source.slice(kb);
  source=source.slice(0,ca)+collect+'\n'+source.slice(cb);
 }
 const hook="showScreen('home');renderClasses();requestAnimationFrame(render);";
 assert.equal(source.split(hook).length,2);
 source=source.replace(hook,"showScreen('home');renderClasses();globalThis.__testLoot={get:()=>G,startNew,hideModal,collect,killEnemy,chooseClass:id=>{selectedClass=id}};requestAnimationFrame(render);");
 vm.runInNewContext(source,ctx,{filename:legacy?'legacy-loot':'modern-loot',timeout:10000});
 return {api:ctx.__testLoot,storage,core:ctx.window};
}
const SEEDS=[1,2,0x12345678,0xabcdef01,0xdeadbeef,0xffffffff,0x6d2b79f5,0x80000000];
const LOOT_CASES=['coins','potion','mana','heal','trap','relic','relic-empty','weapon','armor','unknown'];
const KILL_CASES=['rat-effect','guard-basic','archer-skill','boss-basic'];
function setup(runtime,cls,seed){
 const h=runtime.api;
 h.chooseClass(cls);h.startNew();h.hideModal(true);
 const run=h.get(),p=run.hero;
 run.rngState=seed;run.turn=8;run.floor=3;run.logs=[];run.over=false;run.bossDown=false;
 run.kills=0;run.treasure=0;run.pendingRelicOffer=null;run.chainUsed=false;
 run.items=[];run.enemies=[];
 p.x=15;p.y=15;p.level=3;p.hp=35;p.maxhp=80;p.mana=5;p.maxmana=22;
 p.coins=6;p.potions=1;p.atk=13;p.def=2;p.xp=0;p.nextXP=900;
 p.relics=[];p.talents=[];p.relicState={echo:0,ward:0,fangTurn:-1};
 return run;
}
function state(runtime){return JSON.stringify({run:runtime.api.get(),
  save:runtime.storage.get('carcaca_golzdov_run_v1')||null,
  meta:runtime.storage.get('carcaca_golzdov_meta_v1')||null});}
function playLoot(runtime,cls,seed,scenario){
 const run=setup(runtime,cls,seed),p=run.hero;
 let kind=scenario==='relic-empty'?'relic':scenario;
 if(scenario==='relic-empty')p.relics=['heart','chalice','moss','crown','fang','rune','mirror','eye','ash','chain','omen'];
 if(kind==='mana')p.mana=p.maxmana-1;
 if(kind==='heal')p.hp=p.maxhp-3;
 runtime.api.collect({x:15,y:15,kind,value:17});
 return state(runtime);
}
function playKill(runtime,cls,seed,scenario){
 const run=setup(runtime,cls,seed);
 const [type,source]=scenario.split('-');
 const enemy={id:501,type,x:16,y:15,hp:0,maxhp:60,atk:8,def:1,stun:0,root:0,cd:0};
 run.enemies=[enemy,{id:502,type:'rat',x:30,y:30,hp:10,maxhp:10,atk:2,def:0,stun:0,root:0,cd:0}];
 if(type==='rat')run.hero.relics=['fang'];
 if(type==='archer')run.hero.relics=['moss','rune'];
 runtime.api.killEnemy(enemy,source);
 return state(runtime);
}
test('loot/recompensas só manipulam estado e produzem eventos — sem DOM, Phaser ou storage',()=>{
 for(const name of ['core/loot.js','core/rewards.js']){
  const code=fs.readFileSync(path.join(ROOT,name),'utf8').replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'');
  assert.doesNotMatch(code,/document\.|localStorage|Phaser\.|requestAnimationFrame|setTimeout\(|Math\.random\(|beep\(/);
  assert.doesNotThrow(()=>new vm.Script(code));
 }
});
test('240 replays de coleta são idênticos ao legado, incluindo RNG, mensagens e vida',()=>{
 const old=boot(true),fresh=boot(false);
 let count=0;
 for(const cls of ['vigia','arcanista','errante'])for(const seed of SEEDS)for(const kind of LOOT_CASES){
  assert.equal(playLoot(fresh,cls,seed,kind),playLoot(old,cls,seed,kind),cls+' '+seed+' '+kind);
  count++;
 }
 assert.equal(count,240);
});
test('96 replays de abates preservam experiência, âmbar, gatilhos, boss e mana',()=>{
 const old=boot(true),fresh=boot(false);let count=0;
 for(const cls of ['vigia','arcanista','errante'])for(const seed of SEEDS)for(const kind of KILL_CASES){
  assert.equal(playKill(fresh,cls,seed,kind),playKill(old,cls,seed,kind),cls+' '+seed+' '+kind);
  count++;
 }
 assert.equal(count,96);
});
test('COLLECT só retira o objeto sob o herói uma vez, sem gastar turno',()=>{
 const {core}=boot(false);
 const run={over:false,turn:6,rngState:123,treasure:0,hero:{x:3,y:4,coins:0},
  items:[{kind:'coins',value:7,x:3,y:4},{kind:'coins',value:2,x:9,y:9}]};
 const action=core.GolzdovActions.dispatch(run,{type:'COLLECT'});
 assert.equal(action.status,'applied');
 assert.equal(action.consumesTurn,false);
 assert.equal(run.turn,6);
 assert.equal(run.rngState,123);
 assert.equal(run.items.length,1);
 assert.equal(run.hero.coins,7);
 assert.equal(run.treasure,7);
 assert.equal(JSON.stringify(action.events.map(e=>e.type)),JSON.stringify(['log','sound']));
 const again=core.GolzdovActions.dispatch(run,{type:'COLLECT'});
 assert.equal(again.status,'no-item');
 assert.equal(again.events.length,0);
});
