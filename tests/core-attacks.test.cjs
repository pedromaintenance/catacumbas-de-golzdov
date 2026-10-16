'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const frozen=fs.readFileSync(path.join(ROOT,'tests/fixtures/legacy-attack-damage.js'),'utf8');
const script=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];
const modules=['core/rng.js','core/dungeon.js','core/navigation.js','core/combat.js','core/skills.js','core/enemies.js','core/turns.js','core/actions.js','core/loot.js','core/rewards.js','core/defense.js','core/endings.js','relic-effects.js','relic-offers.js'];
function boot(legacy){
 const dom=new Map(),storage=new Map();
 function element(id){
  if(!dom.has(id)){
   const flags=new Set(id==='overlay'?['hidden']:[]);
   dom.set(id,{id,textContent:'',innerHTML:'',disabled:false,style:{},
    classList:{add(v){flags.add(v);},remove(v){flags.delete(v);},contains(v){return flags.has(v);},
     toggle(v,on){if(on===undefined?!flags.has(v):on)flags.add(v);else flags.delete(v);}},
    addEventListener(){},getContext(){return {}},getBoundingClientRect(){return{width:350,height:500}},click(){}});
  }
  return dom.get(id);
 }
 const env={
  document:{getElementById:element,querySelectorAll:()=>[],addEventListener(){},createElement:()=>element('generated')},
  window:{addEventListener(){}},
  localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
  crypto:{getRandomValues(a){a[0]=0x12345678;return a}},
  requestAnimationFrame(){return 0},setTimeout(){return 0},clearTimeout(){},performance:{now:()=>0}
 };
 for(const name of modules)vm.runInNewContext(fs.readFileSync(path.join(ROOT,name),'utf8'),env,{filename:name,timeout:10000});
 let main=script;
 if(legacy){
  const originalAttack=frozen.slice(frozen.indexOf('function attack('),frozen.indexOf('function heroHit(')).trim();
  const originalHit=frozen.slice(frozen.indexOf('function heroHit('),frozen.indexOf('function receiveDamage(')).trim();
  const a=main.indexOf('function attack('),b=main.indexOf('function relicSynergies(',a);
  const c=main.indexOf('function heroHit('),d=main.indexOf('function killEnemy(',c);
  assert.ok(b>a&&d>c);
  main=main.slice(0,c)+originalHit+'\n'+main.slice(d);
  main=main.slice(0,a)+originalAttack+'\n'+main.slice(b);
 }
 const needle="showScreen('home');renderClasses();requestAnimationFrame(render);";
 assert.equal(main.split(needle).length,2);
 main=main.replace(needle,"showScreen('home');renderClasses();globalThis.__attacks={get:()=>G,startNew,hideModal,attack,heroHit,hitEnemy,chooseClass:id=>{selectedClass=id}};requestAnimationFrame(render);");
 vm.runInNewContext(main,env,{filename:legacy?'original-attacks':'new-attacks',timeout:10000});
 return {api:env.__attacks,storage};
}
const SEEDS=[1,2,3,0x12345678,0xabcdef01,0xdeadbeef,0xffffffff,0x6d2b79f5];
const ATTACK_CASES=['melee','ranged','far','wall','boss','kill','root','riposte','stunned','rune','fang','ward','dead-target','miss','critical'];
const HIT_CASES=['simple','lethal','overkill','dead','boss','relics'];
function prepare(runtime,cls,seed,scenario){
 const h=runtime.api;h.chooseClass(cls);h.startNew();h.hideModal(true);
 const g=h.get(),p=g.hero;
 g.rngState=seed;g.floor=3;g.turn=7;g.over=false;g.bossDown=false;g.kills=0;g.logs=[];g.treasure=0;
 g.map=Array(35*35).fill(1);g.seen=Array(35*35).fill(true);g.items=[];
 g.stairs={x:30,y:30};g.shrine={x:29,y:29};g.rooms=[];g.visitedRooms=[];
 p.x=15;p.y=15;p.hp=140;p.maxhp=200;p.mana=18;p.maxmana=60;
 p.level=3;p.atk=11;p.def=3;p.crit=12;p.dodge=0;p.xp=0;p.nextXP=900;p.buff=0;
 p.talents=[];p.relics=[];p.relicState={echo:0,ward:0,fangTurn:-1};p.riposte=0;
 const enemy={id:301,type:scenario==='boss'?'boss':'guard',x:16,y:15,hp:110,maxhp:110,atk:9,def:2,root:0,stun:0,cd:0};
 const other={id:302,type:'rat',x:24,y:25,hp:80,maxhp:80,atk:8,def:1,root:0,stun:0,cd:0};
 g.enemies=[enemy,other];
 if(scenario==='ranged'){enemy.x=18;p.range=5;}
 if(scenario==='far'){enemy.x=29;p.range=5;}
 if(scenario==='wall'){enemy.x=18;p.range=5;g.map[15*35+17]=0;}
 if(scenario==='kill'){enemy.hp=1;}
 if(scenario==='root'){enemy.root=2;p.talents=['e_predador'];p.crit=35;}
 if(scenario==='riposte'){p.riposte=3;p.talents=['v_muralha'];}
 if(scenario==='stunned'){enemy.stun=2;}
 if(scenario==='rune'){p.relics=['rune','moss'];}
 if(scenario==='fang'){p.relics=['fang'];enemy.hp=5;enemy.root=2;}
 if(scenario==='ward'){p.relics=['chain','mirror'];p.buff=2;}
 if(scenario==='dead-target')enemy.hp=0;
 if(scenario==='miss')p.crit=0;
 if(scenario==='critical')p.crit=100;
 return {g,enemy};
}
function snapshot(runtime){return JSON.stringify({
 run:runtime.api.get(),
 save:runtime.storage.get('carcaca_golzdov_run_v1')||null,
 meta:runtime.storage.get('carcaca_golzdov_meta_v1')||null
});}
test('360 ataques de três classes preservam dano, RNG, críticos, relíquias e turnos',()=>{
 const before=boot(true),after=boot(false);let count=0;
 for(const cls of ['vigia','arcanista','errante'])for(const seed of SEEDS)for(const scenario of ATTACK_CASES){
  const x=prepare(before,cls,seed,scenario),y=prepare(after,cls,seed,scenario);
  const melee=!['ranged','far','wall'].includes(scenario);
  before.api.attack(x.enemy,melee);after.api.attack(y.enemy,melee);
  assert.equal(snapshot(after),snapshot(before),cls+' / '+seed.toString(16)+' / '+scenario);
  count++;
 }
 assert.equal(count,360);
});
test('144 impactos diretos preservam morte, XP, âmbar, ordem dos relicários e chefe',()=>{
 const before=boot(true),after=boot(false);let count=0;
 for(const cls of ['vigia','arcanista','errante'])for(const seed of SEEDS)for(const scenario of HIT_CASES){
  const x=prepare(before,cls,seed,scenario),y=prepare(after,cls,seed,scenario);
  const configure=(e,g)=>{
    if(scenario==='lethal')e.hp=8;
    if(scenario==='overkill')e.hp=1;
    if(scenario==='dead')e.hp=0;
    if(scenario==='boss'){e.type='boss';e.hp=7;}
    if(scenario==='relics'){g.hero.relics=['fang','rune','moss'];e.hp=6;}
  };
  configure(x.enemy,x.g);configure(y.enemy,y.g);
  const dmg=scenario==='overkill'?200:15;
  before.api.hitEnemy(x.enemy,dmg,'Dano direto','effect');
  after.api.hitEnemy(y.enemy,dmg,'Dano direto','effect');
  assert.equal(snapshot(after),snapshot(before),cls+' / '+seed.toString(16)+' / '+scenario);
  count++;
 }
 assert.equal(count,144);
});
test('ATTACK não avança rodada nem RNG quando não existe alvo ou alcance',()=>{
 const env={window:{}};
 for(const name of ['core/rng.js','core/combat.js','core/actions.js'])vm.runInNewContext(fs.readFileSync(path.join(ROOT,name),'utf8'),env);
 const run={hero:{x:10,y:10,range:4,atk:8,crit:0},rngState:333,turn:6,enemies:[],over:false};
 const core=env.window.GolzdovActions;
 const empty=core.dispatch(run,{type:'ATTACK',enemyId:2,melee:true});
 assert.equal(empty.status,'no-target');assert.equal(empty.consumesTurn,false);
 run.enemies=[{id:2,x:20,y:10,hp:10,def:1,root:0}];
 const far=core.dispatch(run,{type:'ATTACK',enemyId:2,melee:false,lineOfSight:true});
 assert.equal(far.status,'out-of-range');assert.equal(far.consumesTurn,false);
 assert.equal(run.turn,6);assert.equal(run.rngState,333);
});
test('módulos de ataque não usam renderer ou storage',()=>{
 for(const name of ['core/combat.js','core/actions.js']){
  const source=fs.readFileSync(path.join(ROOT,name),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
  assert.doesNotMatch(source,/document\.|localStorage|Phaser\.|requestAnimationFrame|setTimeout\(|beep\(/);
 }
});
