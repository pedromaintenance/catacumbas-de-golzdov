'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const legacy=fs.readFileSync(path.join(ROOT,'tests/fixtures/legacy-utility-actions.js'),'utf8');
const script=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];
const dependencies=['core/rng.js','core/dungeon.js','core/navigation.js','core/combat.js','core/skills.js','core/enemies.js','core/turns.js','core/actions.js','core/loot.js','core/rewards.js','core/defense.js','core/endings.js','relic-effects.js','relic-offers.js'];
function boot(isLegacy){
 const dom=new Map(),storage=new Map();
 function element(id){
  if(!dom.has(id)){
   const tags=new Set(id==='overlay'?['hidden']:[]);
   dom.set(id,{id,textContent:'',innerHTML:'',style:{},disabled:false,
    classList:{add(v){tags.add(v);},remove(v){tags.delete(v);},contains(v){return tags.has(v);},
      toggle(v,on){if(on===undefined?!tags.has(v):on)tags.add(v);else tags.delete(v);}},
    addEventListener(){},getContext(){return {};},
    getBoundingClientRect(){return {width:350,height:500};},click(){}});
  }
  return dom.get(id);
 }
 const env={
  document:{getElementById:element,querySelectorAll:()=>[],addEventListener(){},createElement:()=>element('generated')},
  window:{addEventListener(){}},
  localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
  crypto:{getRandomValues(a){a[0]=0x12345678;return a;}},
  requestAnimationFrame(){return 0;},setTimeout(){return 0;},clearTimeout(){},performance:{now:()=>0}
 };
 for(const file of dependencies)vm.runInNewContext(fs.readFileSync(path.join(ROOT,file),'utf8'),env,{filename:file,timeout:10000});
 let main=script;
 if(isLegacy){
  const start=main.indexOf('function executeUtilityAction('),end=main.indexOf('function receiveDamage(',start);
  assert.ok(start>=0&&end>start+200);
  main=main.slice(0,start)+legacy+'\n'+main.slice(end);
 }
 const marker="showScreen('home');renderClasses();requestAnimationFrame(render);";
 assert.equal(main.split(marker).length,2);
 main=main.replace(marker,"showScreen('home');renderClasses();globalThis.__testAction={get:()=>G,startNew,hideModal,drink,waitTurn,chooseClass:id=>{selectedClass=id}};requestAnimationFrame(render);");
 vm.runInNewContext(main,env,{filename:isLegacy?'legacy-utility-actions':'new-utility-actions',timeout:10000});
 return {api:env.__testAction,storage,core:env.window.GolzdovActions};
}
const SEEDS=[1,2,0x12345678,0xdeadbeef,0xffffffff,0x6d2b79f5,0x80000000,0xabcdef01];
const CASES=['wait','wait-capped','wait-enemy','wait-relic','potion','potion-empty','potion-full','potion-fatal'];
function setup(runtime,classId,seed,scenario){
 const h=runtime.api;
 h.chooseClass(classId);h.startNew();h.hideModal(true);
 const g=h.get(),p=g.hero;
 g.rngState=seed;g.turn=5;g.floor=3;g.over=false;g.logs=[];g.bossDown=false;
 g.map=Array(35*35).fill(1);g.seen=Array(35*35).fill(true);g.items=[];
 p.x=15;p.y=15;p.hp=70;p.maxhp=130;p.mana=6;p.maxmana=20;p.level=4;p.xp=0;p.nextXP=500;
 p.def=2;p.dodge=10;p.potions=2;p.buff=0;p.talents=[];p.relics=[];p.relicState={echo:0,ward:0,fangTurn:-1};
 g.enemies=[{id:300,type:'guard',x:25,y:25,hp:90,maxhp:90,atk:8,def:1,stun:0,root:0,cd:0}];
 if(scenario==='wait-capped')p.mana=p.maxmana;
 if(scenario==='wait-enemy'){g.enemies[0].x=16;g.enemies[0].y=15;}
 if(scenario==='wait-relic')p.relics=['moss','rune'];
 if(scenario==='potion-empty')p.potions=0;
 if(scenario==='potion-full')p.hp=p.maxhp;
 if(scenario==='potion-fatal'){p.hp=18;g.enemies[0].x=16;g.enemies[0].y=15;g.enemies[0].atk=140;p.dodge=0;}
 const before=g.turn,orig=g.rngState;
 if(scenario.startsWith('wait'))h.waitTurn();else h.drink();
 return {run:g,turnDelta:g.turn-before,rngDelta:[orig,g.rngState],
  save:runtime.storage.get('carcaca_golzdov_run_v1')||null,
  meta:runtime.storage.get('carcaca_golzdov_meta_v1')||null};
}
test('dispatch de ações é carregável sem DOM, Phaser, áudio ou relógio',()=>{
 const src=fs.readFileSync(path.join(ROOT,'core/actions.js'),'utf8');
 const code=src.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'');
 assert.doesNotMatch(code,/document\.|localStorage|window\.document|Phaser\.|beep\(|setTimeout\(|requestAnimationFrame|Math\.random\(/);
 const {core}=boot(false);
 assert.equal(typeof core.dispatch,'function');
});
test('192 replays completos: WAIT e POTION idênticos aos handlers congelados',()=>{
 const old=boot(true),modern=boot(false);
 let completed=0;
 for(const cls of ['vigia','arcanista','errante'])for(const seed of SEEDS)for(const scenario of CASES){
  const a=setup(old,cls,seed,scenario),b=setup(modern,cls,seed,scenario);
  assert.equal(JSON.stringify(b),JSON.stringify(a),cls+' '+seed+' '+scenario);
  completed++;
 }
 assert.equal(completed,192);
});
test('ações inválidas não gastam turno, recurso, RNG nem produzem evento turn',()=>{
 const {core}=boot(false);
 const run={rngState:0x12345678,turn:8,over:false,hero:{hp:25,maxhp:25,mana:4,maxmana:10,potions:0,level:1}};
 for(const command of [{type:'POTION'},{type:'SOMETHING_ELSE'},null]){
  const out=core.dispatch(run,command);
  assert.equal(out.consumesTurn,false);
  assert.equal(out.events.some(x=>x.type==='turn'),false);
  assert.equal(run.rngState,0x12345678);
  assert.equal(run.turn,8);
 }
 run.hero.potions=1;
 const full=core.dispatch(run,{type:'POTION'});
 assert.equal(full.status,'full-health');
 assert.equal(run.hero.potions,1);
 assert.equal(full.consumesTurn,false);
 run.over=true;
 assert.equal(core.dispatch(run,{type:'WAIT'}).status,'inactive');
 assert.equal(run.hero.mana,4);
});
test('ações válidas emitem eventos em ordem, sem avançar um turno duas vezes',()=>{
 const {core}=boot(false);
 const run={rngState:456,turn:8,over:false,hero:{hp:20,maxhp:80,mana:3,maxmana:10,potions:2,level:2}};
 const potion=core.dispatch(run,{type:'POTION'});
 assert.equal(potion.status,'applied');
 assert.equal(potion.consumesTurn,true);
 assert.equal(JSON.stringify(potion.events.map(e=>e.type)),JSON.stringify(['log','sound','turn']));
 assert.equal(run.turn,8);
 assert.equal(run.rngState,456);
 assert.equal(run.hero.hp,41);
 const wait=core.dispatch(run,{type:'WAIT'});
 assert.equal(wait.consumesTurn,true);
 assert.equal(JSON.stringify(wait.events.map(e=>e.type)),JSON.stringify(['log','turn']));
 assert.equal(run.turn,8);
 assert.equal(run.hero.mana,4);
});
