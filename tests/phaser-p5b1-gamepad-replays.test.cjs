'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
const {setTimeout}=require('node:timers/promises');
const classIds=['vigia','arcanista','errante'];
function pad({connected=true,pressed=[],axes=[0,0,0,0]}={}){
 return {connected,buttons:Array.from({length:17},(_,i)=>({pressed:pressed.includes(i)})),axes};
}
test('P5B.1: classe inicial abre com direcional ou analógico e A confirma',async()=>{
 const {classPickerInput,nextClassPickerIndex}=await import('../phaser-src/src/preview-gamepad-picker.js');
 assert.deepEqual(classPickerInput(pad({pressed:[12]})),{type:'move',delta:-1});
 assert.deepEqual(classPickerInput(pad({pressed:[13]})),{type:'move',delta:1});
 assert.deepEqual(classPickerInput(pad({axes:[.8,0,0,0]})),{type:'move',delta:1});
 assert.deepEqual(classPickerInput(pad({pressed:[0]})),{type:'confirm'});
 assert.equal(classPickerInput(pad({connected:false,pressed:[0]})),null);
 assert.equal(classPickerInput(pad({axes:[.35,0,0,0]})),null);
 assert.equal(classPickerInput(null),null);
 assert.equal(classPickerInput({connected:true}),null);
 assert.equal(nextClassPickerIndex(0,-1,3),2);
 assert.equal(nextClassPickerIndex(2,1,3),0);
 assert.equal(nextClassPickerIndex(1,1,3),2);
 assert.equal(nextClassPickerIndex(3,1,0),0);
});
test('P5B.1: cena não ataca com A segurado após confirmar e limpa marcação',()=>{
 const scene=read('phaser-src/src/scenes/DungeonScene.js');
 const html=read('phaser-src/index.html');
 const css=read('phaser-src/src/style.css');
 assert.match(scene,/if\(this\.classSelectionOpen\)\{\s*if\(!gamepad\|\|time-this\.lastPadAt<175\)return/);
 assert.match(scene,/this\.waitClassARelease=true/);
 assert.match(scene,/if\(this\.waitClassARelease\)\{\s*if\(gamepad\?\.buttons\?\.\[0\]\?\.pressed\)return/);
 assert.match(scene,/this\.chooseClass\(PREVIEW_CLASS_IDS\[this\.classPickerIndex\]\)/);
 assert.match(scene,/this\.moveClassPicker\(input\.delta\)/);
 assert.match(scene,/this\.syncGamepadState\(!!gamepad\)/);
 assert.match(scene,/closest\('#chronicle,#threat-panel,\.pwa-panel'\)/);
 assert.match(html,/id="gamepad-status"/);
 assert.match(html,/direcional\/analógico escolhe, A confirma/);
 assert.match(css,/\.class-card\.pad-selected/);
 assert.doesNotMatch(scene,/carcaca_golzdov_run_v1|carcaca_golzdov_meta_v1/);
});
function walkable(run,x,y){
 return x>0&&y>0&&x<34&&y<34&&run.map[y*35+x]===1&&
  !run.enemies.some(e=>e.hp>0&&e.x===x&&e.y===y);
}
function adjacent(run,x,y){
 for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]]){
  if(walkable(run,x+dx,y+dy))return [x+dx,y+dy];
 }
 throw Error('Nenhuma posição adjacente livre para o cenário de QA.');
}
async function replay(seed,classId){
 const m=await import('../phaser-src/src/preview-engine.js');
 const saves=await import('../phaser-src/src/preview-save.js');
 const disk=new Map(),storage={
  getItem:k=>disk.get(k)||null,setItem:(k,v)=>disk.set(k,v),removeItem:k=>disk.delete(k)
 };
 let run=m.initialPreviewRun(seed,1,classId),previousKills=0;
 const trace=[];
 for(let floor=1;floor<=5;floor++){
  assert.equal(run.floor,floor);
  // Inimigos, itens e IA são gerados pelo núcleo real e NÃO são removidos.
  // APENAS o herói ganha stats super elevados e é reposicionado pelo teste:
  // prova integração de combate, turnos e saves, NÃO balanceamento ou skill player.
  const actualEnemies=run.enemies.filter(e=>e.hp>0);
  assert.ok(actualEnemies.length>=1,'o estrato precisa gerar inimigos reais');
  const foe=floor===5?
   actualEnemies.find(e=>e.type==='boss'):actualEnemies[0];
  assert.ok(foe,'chefe real ausente do estrato 5');
  const initialEnemyId=foe.id,initialEnemyType=foe.type;
  const hero=run.hero;
  hero.maxhp=50000;hero.hp=50000;hero.atk=5000;hero.def=999;hero.dodge=100;
  hero.range=2;hero.nextXP=9999999;hero.xp=0;
  const [x,y]=adjacent(run,foe.x,foe.y);
  hero.x=x;hero.y=y;
  const rngBefore=run.rngState,turnsBefore=run.turn;
  // Força uma resposta da IA com um turno real ao lado do monstro,
  // antes que o ataque de QA (com dano elevado) termine o encontro.
  const enemyTurn=m.previewAction(run,{type:'WAIT'});
  assert.equal(enemyTurn.status,'applied');
  assert.equal(enemyTurn.consumesTurn,true);
  let attempts=0,hadCombatEvent=false;
  const hadEnemyAi=enemyTurn.events.some(x=>x.type==='combat-feedback'&&
   (x.kind==='dodge'||x.kind==='hero-hit'));
  while(foe.hp>0&&attempts++<25){
   const beforeTurn=run.turn;
   const out=m.previewAction(run,{type:'ATTACK',enemyId:initialEnemyId});
   assert.equal(out.status,'applied');
   assert.equal(out.consumesTurn,true);
   // O núcleo encerra imediatamente quando o golpe derruba o chefe:
   // neste caso a escolha final não avança outro turno.
   if(run.bossDown)assert.equal(run.turn,beforeTurn);
   else assert.equal(run.turn,beforeTurn+1);
   hadCombatEvent ||=out.events.some(x=>x.type==='combat-feedback'&&
    ['enemy-hit','miss','enemy-defeat'].includes(x.kind));
  }
  assert.ok(foe.hp<=0,'ataque do jogo deve derrotar o monstro real (PV podem ficar negativos pela regra canônica)');
  assert.ok(hadCombatEvent,'eventos reais de combate emitidos');
  assert.ok(hadEnemyAi,'IA deve responder a um ataque adjacente');
  assert.ok(run.turn>turnsBefore);
  assert.ok(run.kills>=previousKills+1);
  previousKills=run.kills;
  assert.notEqual(run.rngState,rngBefore,'ataque real deve consumir RNG canônico');
  trace.push({floor,foe:initialEnemyType,kills:run.kills,turns:run.turn,
   rng:run.rngState,hp:run.hero.hp});
  if(floor===5){
   assert.equal(run.bossDown,true,'morte real do boss marca bossDown');
   assert.equal(run.pendingFinalChoice,true,'morte real abre escolha canônica');
   assert.equal(run.previewOutcome,'decision');
   const turns=run.turn,state=run.rngState;
   const chosen=m.previewAction(run,{type:'CHOOSE_ENDING',ending:'luz'});
   assert.equal(chosen.status,'ending-chosen');
   assert.equal(run.previewOutcome,'luz');
   assert.equal(run.turn,turns);
   assert.equal(run.rngState,state);
   assert.equal(saves.savePreview(storage,run),true);
   assert.equal(saves.loadPreview(storage).previewOutcome,'luz');
   break;
  }
  // Após o combate real, a fixture encurta a travessia. O MOVE, a IA, a
  // escada, a geração do estrato seguinte e o save são todos executados.
  const [sx,sy]=adjacent(run,run.stairs.x,run.stairs.y);
  hero.x=sx;hero.y=sy;
  const moved=m.previewAction(run,{
   type:'MOVE',dx:run.stairs.x-sx,dy:run.stairs.y-sy
  });
  assert.equal(moved.status,'applied');
  assert.equal(run.pendingStairs,true);
  assert.equal(m.previewAction(run,{type:'STAIRS_DESCEND'}).status,'descended');
  assert.equal(run.floor,floor+1);
  assert.equal(saves.savePreview(storage,run),true);
  run=saves.loadPreview(storage);
  assert.equal(run.floor,floor+1);
 }
 return trace;
}
test('P5B.1: replays gerados reais com IA, combate e final nos cinco estratos',async()=>{
 for(const cls of classIds){
  const trace=await replay(0x12345678,cls);
  assert.equal(trace.length,5);
  assert.equal(trace[4].foe,'boss');
 }
});
test('P5B.1: mesmas classes/seeds geram replays idênticos com IA e saves',async()=>{
 const a=await replay(0x87654321,'vigia');
 const b=await replay(0x87654321,'vigia');
 assert.deepEqual(a,b);
 assert.equal(a.length,5);
});
