'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const original=fs.readFileSync(path.join(ROOT,'tests/fixtures/legacy-received-damage.js'),'utf8');
const modules=['core/rng.js','core/dungeon.js','core/navigation.js','core/combat.js','core/skills.js','core/enemies.js','core/turns.js','core/actions.js','core/loot.js','core/rewards.js','core/defense.js','core/endings.js','relic-effects.js','relic-offers.js'];
const embedded=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];
function boot(legacy){
 const dom=new Map(),storage=new Map();
 function element(id){
  if(!dom.has(id)){
   const flags=new Set(id==='overlay'?['hidden']:[]);
   dom.set(id,{id,textContent:'',innerHTML:'',disabled:false,style:{},
    classList:{add(v){flags.add(v);},remove(v){flags.delete(v);},contains(v){return flags.has(v);},
      toggle(v,on){if(on===undefined?!flags.has(v):on)flags.add(v);else flags.delete(v);}},
    addEventListener(){},getContext(){return{}},getBoundingClientRect(){return{width:350,height:500}},click(){}});
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
 for(const file of modules)vm.runInNewContext(fs.readFileSync(path.join(ROOT,file),'utf8'),env,{filename:file,timeout:10000});
 let code=embedded;
 if(legacy){
  const a=code.indexOf('function receiveDamage('),b=code.indexOf('function enemyStep(',a);
  assert.ok(a>=0&&b>a);
  code=code.slice(0,a)+original+'\n'+code.slice(b);
 }
 const needle="showScreen('home');renderClasses();requestAnimationFrame(render);";
 assert.equal(code.split(needle).length,2);
 code=code.replace(needle,"showScreen('home');renderClasses();globalThis.__defense={get:()=>G,startNew,hideModal,receiveDamage,chooseClass:id=>{selectedClass=id}};requestAnimationFrame(render);");
 vm.runInNewContext(code,env,{filename:legacy?'old-received-damage':'new-received-damage',timeout:10000});
 return {api:env.__defense,storage,core:env.window.GolzdovDefense};
}
const SEEDS=[1,2,0x12345678,0xabcdef01,0xdeadbeef,0xffffffff,0x6d2b79f5,0x80000000];
const CASES=[
 'normal','small','fatal','exact-lethal','oath','oath-used','oath-weakened','oath-twice',
 'buff','buff-muralha','buff-riposte-cap','chain','chain-after-use','chain-buff','chain-oath',
 'mirror','moss','heart','ward','oath-survive-hurt','zero','negative','overkill','heal-before'
];
function runScenario(runtime,cls,seed,scenario){
 const h=runtime.api;
 h.chooseClass(cls);h.startNew();h.hideModal(true);
 const g=h.get(),p=g.hero;
 g.rngState=seed;g.floor=3;g.turn=14;g.over=false;g.bossDown=false;g.kills=2;g.treasure=19;g.logs=[];
 g.chainUsed=false;g.enemies=[];g.items=[];g.pendingRelicOffer=null;
 p.hp=60;p.maxhp=90;p.def=3;p.dodge=8;p.mana=10;p.maxmana=35;p.buff=0;p.riposte=0;
 p.lastOathUsed=false;p.oathWeakened=false;p.talents=[];p.relics=[];p.relicState={echo:0,ward:0,fangTurn:-1};
 let damage=12;
 if(scenario==='small')damage=1;
 if(scenario==='fatal'){p.hp=8;damage=90;}
 if(scenario==='exact-lethal'){p.hp=12;damage=12;}
 if(scenario.startsWith('oath')){p.talents=['v_juramento'];p.hp=7;damage=55;}
 if(scenario==='oath-used')p.lastOathUsed=true;
 if(scenario==='oath-weakened')p.oathWeakened=true;
 if(scenario==='buff'){p.buff=3;damage=7;}
 if(scenario==='buff-muralha'){p.buff=3;p.talents=['v_muralha'];p.riposte=1;}
 if(scenario==='buff-riposte-cap'){p.buff=3;p.talents=['v_muralha'];p.riposte=3;}
 if(scenario==='chain'){p.relics=['chain'];damage=40;}
 if(scenario==='chain-after-use'){p.relics=['chain'];g.chainUsed=true;damage=40;}
 if(scenario==='chain-buff'){p.relics=['chain'];p.buff=2;p.talents=['v_muralha'];damage=40;}
 if(scenario==='chain-oath'){p.relics=['chain'];p.talents=['v_juramento'];p.hp=3;damage=60;}
 if(['mirror','moss','heart','ward'].includes(scenario)){p.relics=[scenario];damage=8;}
 if(scenario==='oath-survive-hurt'){p.relics=['heart'];}
 if(scenario==='zero')damage=0;
 if(scenario==='negative')damage=-4;
 if(scenario==='overkill'){p.hp=1;damage=999;}
 if(scenario==='heal-before'){p.hp=p.maxhp;damage=6;}
 h.receiveDamage(damage,'Impacto da Carcaça!');
 if(scenario==='oath-twice'&&!g.over)h.receiveDamage(55,'Segundo impacto da Carcaça!');
 return JSON.stringify({
  run:g,save:runtime.storage.get('carcaca_golzdov_run_v1')||null,
  meta:runtime.storage.get('carcaca_golzdov_meta_v1')||null
 });
}
test('576 replays preservam HP, armadura, buffs, Grilhões, Último Juramento, meta, RNG e morte',()=>{
 const legacy=boot(true),modern=boot(false);let count=0;
 for(const cls of ['vigia','arcanista','errante'])for(const seed of SEEDS)for(const scenario of CASES){
  assert.equal(runScenario(modern,cls,seed,scenario),runScenario(legacy,cls,seed,scenario),cls+' '+seed+' '+scenario);
  count++;
 }
 assert.equal(count,576);
});
test('o núcleo de defesa é independente de DOM, Phaser, save, áudio e RNG global',()=>{
 const source=fs.readFileSync(path.join(ROOT,'core/defense.js'),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
 assert.doesNotMatch(source,/document\.|localStorage|Phaser\.|requestAnimationFrame|setTimeout\(|beep\(|Math\.random\(/);
 assert.doesNotThrow(()=>new vm.Script(source));
});
test('dano e juramento são etapas distintas para manter onDefend e onHurt na ordem original',()=>{
 const c={window:{}};
 for(const file of ['core/rng.js','core/combat.js','core/defense.js'])vm.runInNewContext(fs.readFileSync(path.join(ROOT,file),'utf8'),c);
 const core=c.window.GolzdovDefense;
 const run={hero:{hp:5,buff:0,talents:['v_juramento'],relics:[],lastOathUsed:false,riposte:0},chainUsed:false,rngState:111};
 const a=core.reduce(run,10);
 assert.equal(a,10);
 const start=core.apply(run,a,'Teste');
 assert.equal(run.hero.hp,0);
 assert.equal(JSON.stringify(start.map(e=>e.type)),JSON.stringify(['log','sound']));
 assert.equal(run.hero.lastOathUsed,false);
 const finish=core.afterHurt(run,{juramento:true});
 assert.equal(run.hero.hp,1);
 assert.equal(run.hero.oathWeakened,true);
 assert.equal(run.hero.lastOathUsed,true);
 assert.equal(finish.length,1);
 assert.equal(core.afterHurt({...run,hero:{...run.hero,hp:0}}, {juramento:true})[0].type,'die');
 assert.equal(run.rngState,111);
});
