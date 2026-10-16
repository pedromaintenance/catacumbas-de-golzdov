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
  const last=js.indexOf('function executeUtilityAction(',first);
  assert.ok(first>=0&&last>first+1000);
  js=js.slice(0,first)+frozen+'\n'+js.slice(last);
 }
 const hook="showScreen('home');renderClasses();requestAnimationFrame(render);";
 assert.equal(js.split(hook).length,2);
 js=js.replace(hook,"showScreen('home');renderClasses();globalThis.__skills={get:()=>G,getAim:()=>aim,startNew,hideModal,skill,castOn,reveal,waitTurn,drink,doMove,attack,chooseClass:id=>{selectedClass=id}};requestAnimationFrame(render);");
 vm.runInNewContext(js,sandbox,{filename:old?'legacy-original-skills.js':'migrated-skills.js',timeout:10000});
 return sandbox.__skills;
}


const SEQUENCE_SEEDS=[1,2,0x12345678,0xabcdef01,0xdeadbeef,0xffffffff,0x6d2b79f5,0x80000000];
const PLANS=[
 ['skill0','wait','drink','skill1','move','skill0','attack'],
 ['skill1','skill0','wait','move','skill1','drink','skill0'],
 ['skill0','skill0','skill1','drink','wait','move','skill1'],
 ['wait','skill1','move','skill0','attack','drink','skill1']
];
function play(h,cls,floor,seed,plan){
 h.chooseClass(cls);h.startNew();h.hideModal(true);
 const g=h.get(),p=g.hero;
 g.rngState=seed;g.floor=floor;g.turn=4;g.steps=3;g.over=false;g.bossDown=false;g.kills=0;g.treasure=0;g.logs=[];
 g.map=Array(35*35).fill(1);g.seen=Array(35*35).fill(true);
 g.rooms=[];g.visitedRooms=[];g.items=[];g.pendingRelicOffer=null;g.chainUsed=false;
 g.stairs={x:30,y:30};g.shrine={x:29,y:29};g.altarUsed=false;g.enemyId=502;
 p.x=15;p.y=15;p.hp=240;p.maxhp=300;p.mana=100;p.maxmana=130;p.level=4;p.xp=0;p.nextXP=5000;
 p.atk=12;p.def=5;p.dodge=12;p.crit=15;p.potions=5;p.buff=0;p.riposte=0;p.lastOathUsed=false;p.oathWeakened=false;
 p.relics=['moss','rune'];p.relicState={echo:0,ward:0,fangTurn:-1};
 p.talents=cls==='vigia'?['v_runa','v_muralha']:cls==='arcanista'?['a_ricochete','a_faminto','a_sonho']:['e_tiro','e_drenante'];
 g.enemies=[
 {id:501,type:'guard',x:16,y:15,hp:250,maxhp:250,atk:7,def:2,stun:0,root:0,cd:0},
 {id:502,type:'slime',x:17,y:15,hp:250,maxhp:250,atk:7,def:1,stun:0,root:0,cd:0}
 ];
 h.reveal();
 const states=[];
 for(const act of plan){
  if(act==='skill0'){h.skill(0);if(h.getAim()!==null)h.castOn(16,15);}
  else if(act==='skill1'){h.skill(1);if(h.getAim()!==null)h.castOn(17,15);}
  else if(act==='wait')h.waitTurn();
  else if(act==='drink')h.drink();
  else if(act==='move')h.doMove(0,1);
  else if(act==='attack'){const foe=g.enemies.find(e=>e.hp>0);if(foe)h.attack(foe,false);}
  states.push(JSON.stringify({run:g,aim:h.getAim()}));
  if(g.over)break;
 }
 return states;
}
test('480 sequências completas: SKILL, WAIT, POTION, MOVE e ATTACK idênticos ao legado',()=>{
 const old=boot(true),fresh=boot(false);let cases=0;
 for(const cls of ['vigia','arcanista','errante'])
  for(const floor of [1,2,3,4,5])
   for(const seed of SEQUENCE_SEEDS)
    for(const [i,plan] of PLANS.entries()){
      const before=play(old,cls,floor,seed,plan);
      const after=play(fresh,cls,floor,seed,plan);
      assert.deepEqual(after,before,cls+' floor '+floor+' seed '+seed+' plan '+i);
      cases++;
    }
 assert.equal(cases,480);
});
test('SKILL rejeita fase inexistente e não consome turno nem RNG',()=>{
 const ctx={window:{}};
 for(const name of ['core/rng.js','core/skills.js','core/actions.js'])
  vm.runInNewContext(fs.readFileSync(path.join(ROOT,name),'utf8'),ctx,{filename:name});
 const run={over:false,turn:4,rngState:723,hero:{classId:'vigia',mana:10}};
 const out=ctx.window.GolzdovActions.dispatch(run,{type:'SKILL',phase:'invalid',which:0,skills:[{cost:3,target:true}]});
 assert.equal(out.status,'invalid-skill-phase');
 assert.equal(out.consumesTurn,false);
 assert.equal(run.turn,4);
 assert.equal(run.rngState,723);
});
