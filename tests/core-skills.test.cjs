'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const frozen=fs.readFileSync(path.join(ROOT,'tests/fixtures/legacy-skills.js'),'utf8');
const modules=['core/rng.js','core/dungeon.js','core/navigation.js','core/combat.js','core/skills.js','core/enemies.js','core/turns.js','core/actions.js','core/loot.js','core/rewards.js','core/defense.js','core/endings.js','relic-effects.js','relic-offers.js'];
const source=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];

function boot(old){
 const elements=new Map(),storage=new Map();
 function element(id){
  if(!elements.has(id)){
   const flags=new Set(id==='overlay'?['hidden']:[]);
   elements.set(id,{
    id,textContent:'',innerHTML:'',disabled:false,style:{},
    classList:{add(v){flags.add(v);},remove(v){flags.delete(v);},contains(v){return flags.has(v);},toggle(v,on){if(on===undefined? !flags.has(v):on)flags.add(v);else flags.delete(v);}},
    addEventListener(){},getContext(){return {};},
    getBoundingClientRect(){return {width:350,height:500};},click(){}
   });
  }
  return elements.get(id);
 }
 const sandbox={
  document:{getElementById:element,querySelectorAll:()=>[],addEventListener(){},createElement:()=>element('generated')},
  window:{addEventListener(){}},
  localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
  crypto:{getRandomValues(a){a[0]=0x12345678;return a;}},
  requestAnimationFrame(){return 0;},setTimeout(){return 0;},clearTimeout(){},performance:{now:()=>0}
 };
 for(const name of modules)vm.runInNewContext(fs.readFileSync(path.join(ROOT,name),'utf8'),sandbox,{filename:name,timeout:10000});
 let js=source;
 if(old){
  const first=js.indexOf('function skill(which)');
  const last=js.indexOf('function drink()',first);
  assert.ok(first>=0&&last>first+1000);
  js=js.slice(0,first)+frozen+'\n'+js.slice(last);
 }
 const hook="showScreen('home');renderClasses();requestAnimationFrame(render);";
 assert.equal(js.split(hook).length,2);
 js=js.replace(hook,"showScreen('home');renderClasses();globalThis.__skills={get:()=>G,getAim:()=>aim,startNew,hideModal,skill,castOn,reveal,chooseClass:id=>{selectedClass=id}};requestAnimationFrame(render);");
 vm.runInNewContext(js,sandbox,{filename:old?'legacy-original-skills.js':'migrated-skills.js',timeout:10000});
 return sandbox.__skills;
}

function simulate(h,classId,seed,scenario){
 h.chooseClass(classId);h.startNew();h.hideModal(true);
 const run=h.get(),p=run.hero;
 run.rngState=seed;run.turn=4;run.floor=3;run.map=Array(35*35).fill(1);run.seen=Array(35*35).fill(true);run.items=[];run.bossDown=false;run.logs=[];run.kills=0;run.treasure=0;
 p.x=15;p.y=15;p.hp=95;p.maxhp=150;
 p.mana=scenario.includes('no_focus')?0:28;
 p.maxmana=80;p.atk=11;p.def=3;p.level=3;p.nextXP=500;p.xp=0;p.dodge=0;p.crit=10;p.potions=2;p.buff=0;
 p.relics=['moss','rune'];p.relicState={echo:0,ward:0,fangTurn:-1};
 p.talents=scenario.includes('talented')?{
  vigia:['v_runa'],arcanista:['a_ricochete','a_faminto','a_sonho'],errante:['e_tiro','e_drenante']
 }[classId]:[];
 run.enemies=[
  {id:101,type:'guard',x:16,y:15,hp:scenario==='first_kill'?1:150,maxhp:150,atk:10,def:2,stun:0,root:0,cd:0},
  {id:102,type:'slime',x:17,y:15,hp:150,maxhp:150,atk:8,def:1,stun:0,root:0,cd:0},
  {id:103,type:'rat',x:16,y:16,hp:150,maxhp:150,atk:6,def:0,stun:0,root:0,cd:0},
  {id:104,type:'archer',x:19,y:15,hp:150,maxhp:150,atk:7,def:1,stun:0,root:0,cd:0}
 ];
 run.enemyId=104;
 const second=scenario.startsWith('second'),which=second?1:0;
 const needsTarget=classId==='arcanista'||which===0;
 let tx=16,ty=15;
 if(scenario.endsWith('far')){tx=28;ty=15;}
 if(scenario.endsWith('blocked')){run.map[15*35+16]=0;tx=17;ty=15;}
 if(scenario.endsWith('empty')){tx=13;ty=15;}
 h.reveal();h.skill(which);
 if(needsTarget&&h.getAim()!==null)h.castOn(tx,ty);
 const state={
  rngState:run.rngState,turn:run.turn,aim:h.getAim(),
  hp:p.hp,mana:p.mana,buff:p.buff,level:p.level,xp:p.xp,kills:run.kills,coins:p.coins,
  relicState:p.relicState,
  enemies:run.enemies.map(e=>({id:e.id,x:e.x,y:e.y,hp:e.hp,stun:e.stun,root:e.root,cd:e.cd,smolder:e.smolder})),
  logs:run.logs.slice(0,10)
 };
 return JSON.stringify(state);
}

const SCENARIOS=[
 'first_hit','first_talented','first_kill','first_no_focus','first_far','first_blocked','first_empty',
 'second_hit','second_talented','second_no_focus','second_far','second_blocked','second_empty','second_multi'
];
const SEEDS=[1,0x12345678,0xabcdef01,0xffffffff,0x6d2b79f5,0xdeadbeef];

test('módulo de habilidades funciona sem DOM, Phaser, áudio e storage',()=>{
 const code=fs.readFileSync(path.join(ROOT,'core/skills.js'),'utf8');
 const bare=code.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'');
 assert.doesNotMatch(bare,/document\.|localStorage|Phaser\.|showModal\(|setTimeout\(|beep\(|Math\.random\(/);
 const ctx={window:{}};
 vm.runInNewContext(fs.readFileSync(path.join(ROOT,'core/skills.js'),'utf8'),ctx);
 for(const name of ['instant','validateTarget','targeted'])assert.equal(typeof ctx.window.GolzdovSkills[name],'function');
});

test('252 replays: habilidades e decisões de turno idênticas ao legado pré-P1C.2',()=>{
 const original=boot(true),modern=boot(false);
 let executed=0;
 for(const classId of ['vigia','arcanista','errante'])for(const seed of SEEDS)for(const scenario of SCENARIOS){
  const oldState=simulate(original,classId,seed,scenario);
  const newState=simulate(modern,classId,seed,scenario);
  assert.equal(newState,oldState,classId+' '+scenario+' seed 0x'+seed.toString(16));
  executed++;
 }
 assert.equal(executed,252);
});

test('validação sem gasto de foco ou alteração de RNG',()=>{
 const run={rngState:123,hero:{classId:'errante',x:10,y:10,mana:3}};
 const ctx={window:{}};
 vm.runInNewContext(fs.readFileSync(path.join(ROOT,'core/skills.js'),'utf8'),ctx);
 const rules=ctx.window.GolzdovSkills;
 const input={skills:[{cost:3,range:6,target:true}],isVisible:()=>false,lineClear:()=>true,enemyAt:()=>null};
 assert.equal(rules.validateTarget(run,0,11,10,input).status,'unreachable');
 assert.equal(run.rngState,123);
 assert.equal(run.hero.mana,3);
});
