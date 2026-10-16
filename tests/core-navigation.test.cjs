'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.join(__dirname,'..'),sandbox={window:{}};
for(const file of ['core/rng.js','core/dungeon.js','core/navigation.js']){
  const source=fs.readFileSync(path.join(ROOT,file),'utf8');
  assert.doesNotThrow(()=>new vm.Script(source,{filename:file}));
  vm.runInNewContext(source,sandbox,{filename:file,timeout:1000});
}
const world=sandbox.window.GolzdovDungeon,nav=sandbox.window.GolzdovNavigation;
const samples=JSON.parse(fs.readFileSync(path.join(ROOT,'tests/fixtures/legacy-navigation-golden.json'),'utf8')).samples;
const enemies={rat:{hp:8,atk:4,def:0},guard:{hp:15,atk:6,def:2},slime:{hp:18,atk:5,def:1},
 archer:{hp:13,atk:6,def:1},kappa:{hp:17,atk:7,def:1},specter:{hp:20,atk:8,def:1},
 knight:{hp:26,atk:9,def:3},boss:{hp:106,atk:13,def:3}};
const make=(seed,floor)=>({seed,rngState:seed,floor,hero:{x:0,y:0,hp:30,mana:0,maxmana:40,relics:[],
 relicState:{echo:0,ward:0,fangTurn:-1},riposte:0,lastOathUsed:false,oathWeakened:false},
 map:[],rooms:[],enemies:[],items:[],seen:[],enemyId:0,stairs:null,shrine:null,visitedRooms:[]});
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,'0');}
function targetCoords(g){
 const p=g.hero;
 return [
  [p.x,p.y],[p.x+1,p.y],[p.x,p.y+1],
  [g.stairs.x,g.stairs.y],
  [g.shrine?.x??2,g.shrine?.y??2],
  ...g.rooms.slice(0,5).map(r=>[r.cx,r.cy]),
  ...g.enemies.slice(0,4).map(e=>[e.x,e.y]),
  [1,1],[33,33]
 ];
}
test('módulo de visão e rota não depende de Phaser, DOM nem de RNG',()=>{
 const code=fs.readFileSync(path.join(ROOT,'core/navigation.js'),'utf8');
 assert.doesNotMatch(code,/document\./);
 assert.doesNotMatch(code,/localStorage/);
 assert.doesNotMatch(code.replace(/\/\*[\s\S]*?\*\//g,''),/Phaser\./);
 assert.doesNotMatch(code,/Math\.random\(/);
 assert.equal(typeof nav.visibleCells,'function');
 assert.equal(typeof nav.findPath,'function');
 assert.equal(samples.length,50);
});
test('paridade exata de 50 mapas: neblina/LOS/BFS = implementação antes da extração',()=>{
 for(const expected of samples){
  const g=make(expected.seed,expected.floor);
  world.generateFloor(g,enemies,35,35);
  const visible=nav.visibleCells(g.map,35,35,g.hero,0);
  for(const k of visible)g.seen[k]=true;
  const targets=targetCoords(g);
  assert.equal(g.hero.x,expected.hero.x);
  assert.equal(g.hero.y,expected.hero.y);
  assert.equal(targets.length,16);
  assert.equal(hash(JSON.stringify(g.seen)),expected.seenHash,
   'seen '+expected.seed+' floor '+expected.floor);
  assert.equal(hash(JSON.stringify(Array.from(visible).sort((a,b)=>a-b))),expected.visibleHash,
   'visible '+expected.seed+' floor '+expected.floor);
  const los=targets.map(([x,y])=>nav.lineClear(g.map,35,35,g.hero.x,g.hero.y,x,y));
  const paths=targets.map(([x,y])=>nav.findPath(g,35,35,x,y));
  assert.equal(JSON.stringify(los),JSON.stringify(expected.los),
    'line-of-sight '+expected.seed+' floor '+expected.floor);
  assert.equal(JSON.stringify(paths),JSON.stringify(expected.paths),
    'BFS '+expected.seed+' floor '+expected.floor);
 }
});
test('LOS impede visão através de paredes mas permite alcançar a célula-alvo',()=>{
 const map=Array(35*35).fill(1);
 map[5*35+6]=0;
 assert.equal(nav.lineClear(map,35,35,5,5,6,5),true);
 assert.equal(nav.lineClear(map,35,35,5,5,7,5),false);
});
test('inimigo ocupa casa e impede rota; fog desconhecida impede navegação',()=>{
 const map=Array(35*35).fill(0);
 for(let x=3;x<=7;x++)map[5*35+x]=1;
 const run={map,seen:Array(35*35).fill(false),hero:{x:3,y:5},enemies:[]};
 assert.equal(nav.findPath(run,35,35,7,5),null);
 run.seen.fill(true);
 assert.equal(JSON.stringify(nav.findPath(run,35,35,7,5)),JSON.stringify([[1,0],[1,0],[1,0],[1,0]]));
 run.enemies=[{x:5,y:5,hp:10}];
 assert.equal(nav.findPath(run,35,35,7,5),null);
});
