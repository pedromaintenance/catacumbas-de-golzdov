'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const original=fs.readFileSync(path.join(ROOT,'tests/fixtures/legacy-ai-turns.js'),'utf8');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
const deps=['core/rng.js','core/dungeon.js','core/navigation.js','core/combat.js','core/skills.js','core/enemies.js','core/turns.js','relic-effects.js','relic-offers.js'];
function boot(legacy){
 const elements=new Map(),store=new Map();
 function element(id){
  if(!elements.has(id)){
   const flags=new Set(id==='overlay'?['hidden']:[]);
   elements.set(id,{id,textContent:'',innerHTML:'',disabled:false,style:{},
    classList:{add:v=>flags.add(v),remove:v=>flags.delete(v),contains:v=>flags.has(v),
      toggle(v,on){const next=on===undefined?!flags.has(v):on;if(next)flags.add(v);else flags.delete(v);}},
    addEventListener(){},getContext(){return{}},getBoundingClientRect(){return{width:350,height:500}},click(){}
   });
  }
  return elements.get(id);
 }
 const ctx={
  document:{getElementById:element,querySelectorAll:()=>[],addEventListener(){},createElement:()=>element('generated')},
  window:{addEventListener(){}},
  localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},
  crypto:{getRandomValues(a){a[0]=0x12345678;return a;}},
  setTimeout(){return 0;},clearTimeout(){},requestAnimationFrame(){return 0;},performance:{now:()=>0}
 };
 for(const name of deps)vm.runInNewContext(fs.readFileSync(path.join(ROOT,name),'utf8'),ctx,{filename:name,timeout:10000});
 let js=scripts[0][1];
 if(legacy){
  const enemyBegin=js.indexOf('function enemyStep(e)'),enemyEnd=js.indexOf('function enemyHit(',enemyBegin);
  const turnBegin=js.indexOf('function worldTurn()'),turnEnd=js.indexOf('function updateHUD(',turnBegin);
  const enemyLegacy=original.slice(original.indexOf('function enemyStep(e)'),original.indexOf('function worldTurn()')).trim();
  const turnLegacy=original.slice(original.indexOf('function worldTurn()')).trim();
  assert.ok(enemyBegin>=0&&enemyEnd>enemyBegin&&turnBegin>=0&&turnEnd>turnBegin);
  js=js.slice(0,turnBegin)+turnLegacy+'\n'+js.slice(turnEnd);
  js=js.slice(0,enemyBegin)+enemyLegacy+'\n'+js.slice(enemyEnd);
 }
 const needle="showScreen('home');renderClasses();requestAnimationFrame(render);";
 assert.equal(js.split(needle).length,2);
 js=js.replace(needle,"showScreen('home');renderClasses();globalThis.__turnHooks={get:()=>G,startNew,hideModal,enemyStep,worldTurn,chooseClass:id=>{selectedClass=id}};requestAnimationFrame(render);");
 vm.runInNewContext(js,ctx,{filename:legacy?'old-ai.js':'new-ai.js',timeout:10000});
 return {h:ctx.__turnHooks,store,ctx};
}
const SEEDS=[1,2,123,0x12345678,0xabcdef01,0xffffffff,0xdeadbeef,0x6d2b79f5,0x80000000,0xa5a5a5a5];
const CASES=['stunned','rooted-melee','rooted-far','melee','ranged','boss-ranged','ranged-cd','move-closer','move-side','out-of-range','blocked','ranged-no-los'];
const TURNS=['basic','multiple','stun-root','buff','dodge','relics','level-up','victory','death','already-over'];
function prepare(h,cls,seed,which){
 h.chooseClass(cls);h.startNew();h.hideModal(true);
 const g=h.get(),p=g.hero;
 g.rngState=seed;g.floor=3;g.turn=7;g.bossDown=false;g.over=false;g.logs=[];
 g.map=Array(35*35).fill(1);g.seen=Array(35*35).fill(false);g.items=[];
 p.x=15;p.y=15;p.hp=150;p.maxhp=200;p.mana=10;p.maxmana=40;p.xp=0;p.nextXP=300;
 p.def=2;p.dodge=15;p.buff=0;p.talents=[];p.riposte=0;p.oathWeakened=false;
 p.relics=[];p.relicState={echo:0,ward:0,fangTurn:-1};
 const enemy=(id,type,x,y)=>({id,type,x,y,hp:85,maxhp:85,atk:10,def:2,stun:0,root:0,cd:0});
 const primary=enemy(301,which==='boss-ranged'?'boss':which.startsWith('ranged')?'archer':'guard',18,15);
 const other=enemy(302,'rat',18,17);
 g.enemies=[primary,other];
 if(which==='stunned')primary.stun=2;
 if(which==='rooted-melee'){primary.root=2;primary.x=16;}
 if(which==='rooted-far')primary.root=2;
 if(which==='melee'){primary.x=16;}
 if(which==='ranged'||which==='boss-ranged')primary.x=19;
 if(which==='ranged-cd'){primary.type='archer';primary.x=19;primary.cd=2;}
 if(which==='move-side'){primary.x=19;primary.y=17;}
 if(which==='out-of-range')primary.x=32;
 if(which==='blocked'){primary.x=18;primary.y=18;g.map[(18-1)+18*35]=0;g.map[19+18*35]=0;g.map[18+17*35]=0;g.map[18+19*35]=0;}
 if(which==='ranged-no-los'){primary.type='archer';primary.x=19;g.map[17+15*35]=0;}
 if(which==='multiple'){other.x=16;other.y=15;}
 if(which==='stun-root'){primary.stun=2;other.root=2;other.x=16;other.y=15;}
 if(which==='buff'){p.buff=3;p.talents=['v_muralha'];primary.x=16;}
 if(which==='dodge'){p.dodge=100;primary.x=16;}
 if(which==='relics'){p.relics=['moss','rune','chain'];primary.x=16;p.buff=2;}
 if(which==='level-up'){p.xp=400;primary.stun=2;other.stun=2;}
 if(which==='victory')g.bossDown=true;
 if(which==='death'){p.hp=1;primary.x=16;primary.atk=65;p.dodge=0;}
 if(which==='already-over')g.over=true;
 return {g,primary};
}
function snapshot(h){
 const g=h.get();
 const save={...g,seen:g.seen};
 return JSON.stringify(save);
}
test('IA e turnos independentes de Phaser, DOM, storage e animações',()=>{
 for(const file of ['core/enemies.js','core/turns.js']){
  const src=fs.readFileSync(path.join(ROOT,file),'utf8').replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'');
  assert.doesNotMatch(src,/document\.|localStorage|Phaser\.|requestAnimationFrame|setTimeout\(|Math\.random\(/);
  assert.doesNotThrow(()=>new vm.Script(src));
 }
});
test('360 cenários de IA do legado versus núcleo: movimento, stun, ataque e RNG',()=>{
 const old=boot(true).h,modern=boot(false).h;
 let count=0;
 for(const cls of ['vigia','arcanista','errante'])for(const seed of SEEDS)for(const scenario of CASES){
  const left=prepare(old,cls,seed,scenario),right=prepare(modern,cls,seed,scenario);
  old.enemyStep(left.primary);modern.enemyStep(right.primary);
  assert.equal(snapshot(modern),snapshot(old),cls+' '+seed+' '+scenario);
  count++;
 }
 assert.equal(count,360);
});
test('300 turnos completos: talentos, relíquias, morte, vitória, subida de nível e save',()=>{
 const old=boot(true).h,modern=boot(false).h;
 let count=0;
 for(const cls of ['vigia','arcanista','errante'])for(const seed of SEEDS)for(const scenario of TURNS){
  prepare(old,cls,seed,scenario);prepare(modern,cls,seed,scenario);
  old.worldTurn();modern.worldTurn();
  assert.equal(snapshot(modern),snapshot(old),cls+' '+seed+' '+scenario);
  count++;
 }
 assert.equal(count,300);
});
test('turno puro não avança sem expedição ativa ou com ação de vitória já resolvida',()=>{
 const c={window:{}};
 for(const file of ['core/combat.js','core/turns.js'])vm.runInNewContext(fs.readFileSync(path.join(ROOT,file),'utf8'),c);
 const turns=c.window.GolzdovTurns;
 const inert={turn:9,over:true};
 assert.equal(turns.advance(inert,{}).advanced,false);
 assert.equal(inert.turn,9);
 const win={turn:8,hero:{buff:0},bossDown:true,over:false};
 let victories=0;
 assert.equal(turns.advance(win,{onVictory(){victories++;}}).advanced,false);
 assert.equal(win.turn,8);assert.equal(victories,1);
});
