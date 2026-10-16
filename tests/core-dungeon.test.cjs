'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.join(__dirname,'..');
const sandbox={window:{}};
for(const file of ['core/rng.js','core/dungeon.js']){
  const content=fs.readFileSync(path.join(ROOT,file),'utf8');
  assert.doesNotThrow(()=>new vm.Script(content,{filename:file}));
  vm.runInNewContext(content,sandbox,{filename:file,timeout:1000});
}
const rng=sandbox.window.GolzdovCoreRng,world=sandbox.window.GolzdovDungeon;
const fixture=JSON.parse(fs.readFileSync(path.join(ROOT,'tests/fixtures/legacy-dungeon-golden.json'),'utf8'));
const enemies={
 rat:{hp:8,atk:4,def:0},guard:{hp:15,atk:6,def:2},slime:{hp:18,atk:5,def:1},
 archer:{hp:13,atk:6,def:1},kappa:{hp:17,atk:7,def:1},specter:{hp:20,atk:8,def:1},
 knight:{hp:26,atk:9,def:3},boss:{hp:106,atk:13,def:3}
};
function fresh(seed,floor){
  return {seed,rngState:seed,floor,hero:{x:0,y:0,hp:30,mana:0,maxmana:40,
    relicState:{echo:0,ward:0,fangTurn:-1},riposte:0,lastOathUsed:false,oathWeakened:false},
    map:[],rooms:[],enemies:[],items:[],seen:[],enemyId:0,stairs:null,shrine:null,
    visitedRooms:[],shopOffers:null};
}
function serialize(run){
  return JSON.stringify({floor:run.floor,rngState:run.rngState,
    hero:{x:run.hero.x,y:run.hero.y,hp:run.hero.hp,mana:run.hero.mana},
    map:run.map,rooms:run.rooms,stairs:run.stairs,shrine:run.shrine,enemyId:run.enemyId,
    enemies:run.enemies,items:run.items,visitedRooms:run.visitedRooms,shopOffers:run.shopOffers});
}
function fnv(text){
  let hash=2166136261;
  for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619);}
  return(hash>>>0).toString(16).padStart(8,'0');
}
test('núcleo novo é carregável sem DOM, Canvas, Phaser ou armazenamento',()=>{
  assert.equal(typeof rng.next,'function');
  assert.equal(typeof world.generateFloor,'function');
  assert.equal(fixture.samples.length,50);
  const sources=['core/rng.js','core/dungeon.js'].map(f=>fs.readFileSync(path.join(ROOT,f),'utf8'));
  for(const src of sources){
    assert.doesNotMatch(src,/document\./);
    assert.doesNotMatch(src,/localStorage/);
    assert.doesNotMatch(src.replace(/\/\*[\s\S]*?\*\//g,''),/Phaser\./);
  }
});
test('xorshift do núcleo preserva sequências e a convenção de seed zero',()=>{
  for(const seed of [0,1,0x12345678,0xffffffff,0x6d2b79f5]){
    const run={rngState:seed};
    const sequence=rng.seeded(seed);
    for(let i=0;i<100;i++){
      const expected=rng.nextState(run.rngState);
      assert.equal(rng.next(run),expected.value);
      assert.equal(run.rngState,expected.state);
      assert.equal(sequence.next(),expected.value);
    }
  }
});
test('50 golden snapshots do legado continuam idênticos: 10 seeds × 5 estratos',()=>{
  for(const sample of fixture.samples){
    const run=fresh(sample.seed,sample.floor);
    const output=world.generateFloor(run,enemies,35,35);
    assert.equal(output,run);
    assert.equal(fnv(serialize(run)),sample.hash,
      'sem paridade: floor '+sample.floor+' seed '+sample.seed.toString(16));
    assert.equal(run.rngState,sample.rngState);
    assert.equal(run.rooms.length,sample.rooms);
    assert.equal(run.enemies.length,sample.enemies);
    assert.equal(run.items.length,sample.items);
  }
});
test('novo gerador mantém estado explícito e não compartilha mutações entre partidas',()=>{
  const a=fresh(0x12345678,2),b=fresh(0x12345678,2);
  world.generateFloor(a,enemies);
  world.generateFloor(b,enemies);
  assert.equal(serialize(a),serialize(b));
  a.map[0]=99;
  assert.notEqual(a.map[0],b.map[0]);
  assert.ok(a.items.every(i=>i.x>0&&i.y>0));
  assert.ok(a.enemies.every(e=>e.hp>0));
});
