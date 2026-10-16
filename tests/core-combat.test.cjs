'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const test=require('node:test');
const ROOT=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const fixture=JSON.parse(fs.readFileSync(path.join(ROOT,'tests/fixtures/legacy-combat-golden.json'),'utf8'));
const script=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];
const loaded=['core/rng.js','core/dungeon.js','core/navigation.js','core/combat.js','core/skills.js','core/enemies.js','core/turns.js','core/actions.js','core/loot.js','core/rewards.js','relic-effects.js','relic-offers.js'];

function makeRuntime(){
 const elements=new Map(),storage=new Map();
 function element(id){
  if(!elements.has(id)){
   const flags=new Set(id==='overlay'?['hidden']:[]);
   elements.set(id,{id,textContent:'',innerHTML:'',style:{},disabled:false,
    classList:{add:v=>flags.add(v),remove:v=>flags.delete(v),contains:v=>flags.has(v),
      toggle(v,state){const enabled=state===undefined?!flags.has(v):state;if(enabled)flags.add(v);else flags.delete(v);}},
    addEventListener(){},getContext(){return {};},
    getBoundingClientRect(){return {width:350,height:500}},click(){}});
  }
  return elements.get(id);
 }
 const sandbox={
  document:{getElementById:element,querySelectorAll:()=>[],addEventListener(){},createElement:()=>element('generated')},
  window:{addEventListener(){}},
  localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
  crypto:{getRandomValues(a){a[0]=0x12345678;return a;}},
  requestAnimationFrame(){return 0;},setTimeout(){return 0;},clearTimeout(){},
  performance:{now:()=>0}
 };
 const hook="showScreen('home');renderClasses();requestAnimationFrame(render);";
 assert.equal(script.split(hook).length,2);
 const instrumented=script.replace(hook,
  "showScreen('home');renderClasses();globalThis.__combatHooks={get:()=>G,startNew,hideModal,attack,enemyHit,receiveDamage,enemyStep,worldTurn,chooseClass:id=>{selectedClass=id}};requestAnimationFrame(render);");
 for(const name of loaded)vm.runInNewContext(fs.readFileSync(path.join(ROOT,name),'utf8'),sandbox,{filename:name,timeout:10000});
 vm.runInNewContext(instrumented,sandbox,{filename:'index.html',timeout:10000});
 return {hooks:sandbox.__combatHooks,combat:sandbox.window.GolzdovCombat};
}
function fnv(s){
 let h=2166136261;
 for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}
 return (h>>>0).toString(16).padStart(8,'0');
}
function play(hooks,sample){
 const {classId,seed,scenario}=sample;
 hooks.chooseClass(classId);hooks.startNew();hooks.hideModal(true);
 const run=hooks.get(),p=run.hero;
 run.rngState=seed;run.turn=5;run.floor=3;run.map=Array(35*35).fill(1);
 run.seen=Array(35*35).fill(true);run.items=[];run.bossDown=false;run.logs=[];
 p.x=15;p.y=15;p.hp=95;p.maxhp=120;p.mana=10;p.maxmana=30;p.atk=11;p.def=3;
 p.crit=scenario==='critical'?100:25;p.dodge=scenario==='enemy-dodge'?100:15;
 p.buff=scenario==='mitigate'?3:0;p.riposte=2;
 p.talents=classId==='vigia'?['v_muralha']:classId==='errante'?['e_predador']:[];
 p.relics=scenario==='mitigate'?['chain','crown']:['moss','rune'];
 p.relicState={echo:0,ward:scenario==='mitigate'?2:0,fangTurn:-1};
 run.chainUsed=false;
 const e={id:1,type:scenario==='boss-ranged'?'boss':scenario==='ranged'?'archer':'guard',
  x:scenario==='ranged'||scenario==='boss-ranged'?18:16,y:15,
  hp:500,maxhp:500,atk:10,def:2,stun:0,root:classId==='errante'?2:0,cd:0};
 run.enemies=[e];
 switch(scenario){
  case 'basic':case 'critical':hooks.attack(e,true);break;
  case 'enemy-melee':case 'enemy-dodge':hooks.enemyHit(e);break;
  case 'mitigate':hooks.receiveDamage(21,'Ataque de teste.');break;
  case 'ranged':case 'boss-ranged':hooks.enemyStep(e);break;
  case 'turn':hooks.worldTurn();break;
  default:throw Error('Cenário não suportado: '+scenario);
 }
 return {rngState:run.rngState,turn:run.turn,hp:p.hp,mana:p.mana,atk:p.atk,def:p.def,
  buff:p.buff,riposte:p.riposte,chainUsed:run.chainUsed,relicState:p.relicState,
  kills:run.kills,coins:p.coins,
  enemy:{hp:e.hp,x:e.x,y:e.y,stun:e.stun,root:e.root,cd:e.cd},logs:run.logs.slice(0,4)};
}

test('core/combat.js não acessa browser nem emite som ou UI',()=>{
 const source=fs.readFileSync(path.join(ROOT,'core/combat.js'),'utf8');
 const bare=source.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'');
 assert.doesNotMatch(bare,/document\.|localStorage|window\.document|Phaser\.|Math\.random\(|beep\(|showModal\(|setTimeout\(/);
 const {combat}=makeRuntime();
 for(const method of ['basicAttack','enemyMelee','enemyRanged','incomingDamage','startTurn'])assert.equal(typeof combat[method],'function');
});

test('192 golden snapshots das ações do legado preservam HP, dano, turnos, RNG e logs',()=>{
 const {hooks}=makeRuntime();
 assert.equal(fixture.samples.length,192);
 for(const sample of fixture.samples){
  const state=play(hooks,sample);
  const label=sample.classId+' '+sample.scenario+' '+sample.seed.toString(16);
  assert.equal(fnv(JSON.stringify(state)),sample.hash,label+' — snapshot inteiro');
  assert.equal(state.rngState,sample.rngState,label+' — RNG consumido');
  assert.equal(state.hp,sample.hp,label+' — vida');
  assert.equal(state.enemy.hp,sample.enemyHp,label+' — dano no inimigo');
 }
});

test('rolagem de ataque falho consome só um RNG e não consome riposte',()=>{
 const {combat}=makeRuntime();
 const run={rngState:1,hero:{atk:11,crit:25,riposte:2}};
 const roll=combat.basicAttack(run,{root:0,def:2},{muralha:true});
 assert.equal(roll.miss,true);
 assert.equal(roll.damage,0);
 assert.equal(roll.consumeRiposte,false);
 assert.equal(run.rngState,270369);
});

test('esquiva, mitigação com corrente e início de turno respeitam os limites',()=>{
 const {combat}=makeRuntime();
 const dodgeRun={rngState:1,hero:{dodge:100,def:2}};
 assert.equal(combat.enemyMelee(dodgeRun,{atk:8}).dodge,true);
 const run={chainUsed:false,turn:4,hero:{buff:3,riposte:2,relics:['chain']}};
 assert.equal(combat.incomingDamage(run,21,{muralha:true}),9);
 assert.equal(run.chainUsed,true);
 assert.equal(run.hero.riposte,3);
 combat.startTurn(run);
 assert.equal(run.turn,5);
 assert.equal(run.hero.buff,2);
});
