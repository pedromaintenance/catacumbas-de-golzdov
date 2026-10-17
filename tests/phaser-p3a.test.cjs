'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
async function preview(){
 const [engine,classes,storage]=await Promise.all([
  import('../phaser-src/src/preview-engine.js'),
  import('../phaser-src/src/preview-classes.js'),
  import('../phaser-src/src/preview-save.js')
 ]);
 return {...engine,...classes,...storage};
}
function arena(game,cls){
 const run=game.initialPreviewRun(0x2468ace0,1,cls);
 run.map.fill(1);run.seen.fill(true);
 run.rooms=[];run.visitedRooms=[];run.stairs={x:30,y:30};
 run.hero.x=15;run.hero.y=15;run.hero.hp=60;run.hero.maxhp=100;
 run.hero.maxmana=90;run.hero.mana=90;run.hero.level=3;run.hero.nextXP=5000;
 run.enemies=[
  {id:110,type:'rat',x:16,y:15,hp:500,maxhp:500,atk:2,def:0,stun:5,root:0,cd:0},
  {id:111,type:'rat',x:17,y:15,hp:500,maxhp:500,atk:2,def:0,stun:5,root:0,cd:0},
  {id:112,type:'rat',x:18,y:15,hp:500,maxhp:500,atk:2,def:0,stun:5,root:0,cd:0}
 ];
 return run;
}
test('classes e seis habilidades reproduzem integralmente os dados iniciais do HTML legado',async()=>{
 const {PREVIEW_CLASSES,PREVIEW_CLASS_IDS}=await preview();
 const html=read('index.html');
 const match=html.match(/const CLASSES=(\{[\s\S]*?\});\s*const CLASS_TALENTS=/);
 assert.ok(match,'definições canônicas de CLASSES');
 const original=vm.runInNewContext('('+match[1]+')');
 assert.deepEqual(PREVIEW_CLASS_IDS,['vigia','arcanista','errante']);
 for(const id of PREVIEW_CLASS_IDS){
  const actual=PREVIEW_CLASSES[id],expected=original[id];
  for(const field of ['name','short','origin','icon','hp','mana','atk','def','range','dodge','weapon','armor'])
   assert.equal(actual[field],expected[field],id+' '+field);
  assert.equal(JSON.stringify(actual.skills),JSON.stringify(expected.skills),id+' skills');
 }
});
test('cada classe é gerada de modo determinístico com equipamento, vida e mana específicos',async()=>{
 const game=await preview();
 for(const classId of game.PREVIEW_CLASS_IDS)for(const floor of [1,3,5]){
  const a=game.initialPreviewRun(0x12345678,floor,classId);
  const b=game.initialPreviewRun(0x12345678,floor,classId);
  assert.equal(JSON.stringify(a),JSON.stringify(b));
  assert.equal(a.hero.classId,classId);
  assert.equal(a.hero.hp,game.PREVIEW_CLASSES[classId].hp);
  assert.equal(a.hero.mana,game.PREVIEW_CLASSES[classId].mana);
  assert.equal(a.hero.weapon,game.PREVIEW_CLASSES[classId].weapon);
  assert.equal(a.hero.range,game.PREVIEW_CLASSES[classId].range);
 }
 assert.throws(()=>game.initialPreviewRun(1,1,'qualquer'),/Classe desconhecida/);
});
test('seis habilidades consomem foco e exatamente um turno com os mesmos efeitos do core',async()=>{
 const game=await preview();
 for(const classId of game.PREVIEW_CLASS_IDS)for(const which of [0,1]){
  const run=arena(game,classId),spell=game.PREVIEW_CLASSES[classId].skills[which];
  const target=classId==='errante'?{x:18,y:15}:classId==='arcanista'?{x:17,y:15}:{x:16,y:15};
  const old=run.hero.mana,before=run.turn,rng=run.rngState;
  const result=game.previewAction(run,{type:'SKILL',which,...target});
  assert.equal(result.status,'applied',classId+'/'+which);
  assert.equal(result.consumesTurn,true);
  assert.equal(run.turn,before+1);
  assert.equal(run.hero.mana,old-spell.cost);
  assert.ok(run.rngState>=0);
  if(spell.target){
   assert.ok(run.enemies.some(e=>e.hp<e.maxhp),classId+'/'+which+' damage');
   if(classId==='vigia'&&which===0)assert.ok(run.enemies[0].stun>0);
  }else if(classId==='vigia'){
   assert.ok(run.hero.buff>0);
   assert.ok(run.hero.hp>60);
  }else{
   assert.ok(run.enemies.some(e=>e.root>0),classId+'/'+which+' enraizamento');
  }
  assert.ok(Array.isArray(result.events));
 }
});
test('foco insuficiente, alvo impossível ou habilidade inválida não gastam turno/RNG',async()=>{
 const game=await preview();
 for(const cls of game.PREVIEW_CLASS_IDS){
  for(const which of [0,1]){
   const run=arena(game,cls),skill=game.PREVIEW_CLASSES[cls].skills[which];
   run.hero.mana=0;
   const before=run.turn,rng=run.rngState;
   const no=game.previewAction(run,{type:'SKILL',which,x:16,y:15});
   assert.equal(no.consumesTurn,false);
   assert.equal(run.turn,before);
   assert.equal(run.rngState,rng);
   assert.equal(run.hero.mana,0);
   if(skill.target){
    run.hero.mana=90;
    const blocked=game.previewAction(run,{type:'SKILL',which,x:33,y:33});
    assert.equal(blocked.consumesTurn,false);
    assert.equal(run.turn,before);
    assert.equal(run.rngState,rng);
   }
  }
  const run=arena(game,cls),tick=run.turn,rng=run.rngState;
  assert.equal(game.previewAction(run,{type:'SKILL',which:33}).consumesTurn,false);
  assert.equal(run.turn,tick);assert.equal(run.rngState,rng);
 }
});
test('save da preview mantém classe selecionada e não acessa campanha HTML',async()=>{
 const game=await preview(),calls=[],map=new Map();
 const store={getItem:k=>(calls.push(k),map.get(k)||null),
  setItem:(k,v)=>(calls.push(k),map.set(k,v)),removeItem:k=>(calls.push(k),map.delete(k))};
 for(const id of game.PREVIEW_CLASS_IDS){
  const run=game.initialPreviewRun(123,1,id);
  assert.equal(game.savePreview(store,run),true);
  assert.equal(game.loadPreview(store).hero.classId,id);
 }
 assert.ok(calls.every(k=>k===game.PREVIEW_SAVE_KEY));
});
test('controles expõem três classes, duas magias, mira e gamepad; fechamento preserva preview',()=>{
 const scene=read('phaser-src/src/scenes/DungeonScene.js'),html=read('phaser-src/index.html');
 for(const id of ['vigia','arcanista','errante'])assert.match(html,new RegExp('data-preview-class="'+id+'"'));
 for(const id of ['skill0','skill1'])assert.match(html,new RegExp('data-preview-action="'+id+'"'));
 for(const id of ['class-selection','aim-hint','hero-class','hero-weapon'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(scene,/castAt\(/);assert.match(scene,/castNearest\(/);
 assert.match(scene,/chooseClass\(/);assert.match(scene,/this\.aim=/);
 assert.match(scene,/this\.padLatch\.consume\(3\)/);assert.match(scene,/this\.padLatch\.consume\(1\)/);
 assert.match(scene,/clearPreview\(storage\(\)\)/);
 assert.doesNotMatch(scene,/carcaca_golzdov_run_v1|carcaca_golzdov_meta_v1/);
});
