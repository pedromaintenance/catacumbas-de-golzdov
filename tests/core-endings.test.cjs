'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const legacy=fs.readFileSync(path.join(ROOT,'tests/fixtures/legacy-endings.js'),'utf8');
const embedded=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];
const mods=['core/rng.js','core/dungeon.js','core/navigation.js','core/combat.js','core/skills.js','core/enemies.js','core/turns.js','core/actions.js','core/loot.js','core/rewards.js','core/defense.js','core/endings.js','relic-effects.js','relic-offers.js'];
function boot(old){
 const elements=new Map(),storage=new Map();
 function elem(id){
  if(!elements.has(id)){
   const flags=new Set(id==='overlay'?['hidden']:[]);
   elements.set(id,{id,textContent:'',innerHTML:'',disabled:false,style:{},
    classList:{add(v){flags.add(v);},remove(v){flags.delete(v);},contains(v){return flags.has(v);},
     toggle(v,on){if(on===undefined?!flags.has(v):on)flags.add(v);else flags.delete(v);}},
    addEventListener(){},getContext(){return {}},getBoundingClientRect(){return {width:350,height:500}},click(){}});
  }
  return elements.get(id);
 }
 const ctx={
  document:{getElementById:elem,querySelectorAll:()=>[],addEventListener(){},createElement:()=>elem('generated')},
  window:{addEventListener(){}},
  localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
  crypto:{getRandomValues(a){a[0]=0x12345678;return a}},
  requestAnimationFrame(){return 0},setTimeout(){return 0},clearTimeout(){},performance:{now:()=>0}
 };
 for(const file of mods)vm.runInNewContext(fs.readFileSync(path.join(ROOT,file),'utf8'),ctx,{filename:file,timeout:10000});
 let src=embedded;
 if(old){
  const start=src.indexOf('function applyEndingEvents('),end=src.indexOf('function exportSave(){',start);
  assert.ok(start>=0&&end>start);
  src=src.slice(0,start)+legacy+'\n'+src.slice(end);
 }
 const anchor="showScreen('home');renderClasses();requestAnimationFrame(render);";
 assert.equal(src.split(anchor).length,2);
 src=src.replace(anchor,"showScreen('home');renderClasses();globalThis.__terminal={get:()=>G,startNew,hideModal,die,finalDecision,victory,endMeta,chooseClass:id=>{selectedClass=id}};requestAnimationFrame(render);");
 vm.runInNewContext(src,ctx,{filename:old?'legacy-terminal':'modern-terminal',timeout:10000});
 return {api:ctx.__terminal,storage,elem,core:ctx.window.GolzdovEndings};
}
const SEEDS=[1,2,0x12345678,0xdeadbeef,0xabcdef01,0xffffffff,0x80000000,0x6d2b79f5];
const CASES=['death','death-repeat','death-meta','death-low-floor','death-max-floor','choice','choice-repeat','choice-luz','choice-raiz','victory-luz','victory-raiz','victory-repeat'];
function play(runtime,cls,seed,scenario){
 const h=runtime.api;h.chooseClass(cls);h.startNew();h.hideModal(true);
 const g=h.get(),p=g.hero;
 g.rngState=seed;g.floor=scenario==='death-low-floor'?1:scenario==='death-max-floor'?5:3;
 g.turn=16;g.kills=7;g.treasure=62;g.over=false;g.bossDown=false;g.logs=[];
 p.level=4;p.hp=8;p.mana=2;
 if(scenario==='death-meta')runtime.storage.set('carcaca_golzdov_meta_v1',JSON.stringify({best:5,wins:3,runs:9,kills:37,extra:'kept'}));
 else runtime.storage.set('carcaca_golzdov_meta_v1',JSON.stringify({best:2,wins:1,runs:1,kills:4}));
 if(scenario.startsWith('death')){
  h.die();
  if(scenario==='death-repeat')h.die();
 }else if(scenario.startsWith('choice')){
  h.finalDecision();
  if(scenario==='choice-repeat')h.finalDecision();
  if(scenario==='choice-luz')runtime.elem('end-free').onclick();
  if(scenario==='choice-raiz')runtime.elem('end-hold').onclick();
 }else if(scenario.startsWith('victory')){
  h.victory(scenario==='victory-raiz'?'raiz':'luz');
  if(scenario==='victory-repeat')h.victory('luz');
 }
 return JSON.stringify({
  run:g,
  meta:runtime.storage.get('carcaca_golzdov_meta_v1')||null,
  save:runtime.storage.get('carcaca_golzdov_run_v1')||null,
  overlay:runtime.elem('overlay').classList.contains('hidden'),
  modal:runtime.elem('modal').innerHTML,
  buttons:['dead-title','dead-again','end-free','end-hold','win-menu','win-again'].map(id=>!!runtime.elem(id).onclick)
 });
}
test('288 replays de morte, final da história, escolha e meta são idênticos à build 1.3.4',()=>{
 const old=boot(true),current=boot(false);let count=0;
 for(const cls of ['vigia','arcanista','errante'])for(const seed of SEEDS)for(const scenario of CASES){
  assert.equal(play(current,cls,seed,scenario),play(old,cls,seed,scenario),cls+' '+seed+' '+scenario);
  count++;
 }
 assert.equal(count,288);
});
test('núcleo de finais produz eventos ordenados sem acessar DOM, storage ou RNG',()=>{
 const src=fs.readFileSync(path.join(ROOT,'core/endings.js'),'utf8').replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'');
 assert.doesNotMatch(src,/document\.|localStorage|sessionStorage|Phaser\.|requestAnimationFrame|setTimeout\(|beep\(|Math\.random\(/);
 assert.doesNotThrow(()=>new vm.Script(src));
 const {core}=boot(false);
 let run={over:false,floor:5,kills:6,hero:{hp:0}};
 let event=core.loss(run);
 assert.equal(event.status,'death');
 assert.equal(run.over,true);
 assert.equal(JSON.stringify(event.events.map(x=>x.type)),JSON.stringify(['end-meta','clear-save','show-death','sound']));
 assert.equal(core.loss(run).events.length,0);
 const next=core.decision({...run,over:false});
 assert.equal(JSON.stringify(next.events.map(x=>x.type)),JSON.stringify(['show-final-choice']));
 assert.equal(JSON.stringify(core.victory(run,'luz').events.map(x=>x.type)),JSON.stringify(['end-meta','clear-save','show-victory','sound']));
 const meta=core.updateMeta(run,{best:2,runs:3,kills:4,wins:1,unknown:'preserved'},true);
 assert.equal(JSON.stringify(meta),JSON.stringify({best:5,runs:4,kills:10,wins:2,unknown:'preserved'}));
});
