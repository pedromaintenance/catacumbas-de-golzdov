'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
async function setup(){
 const [engine,endings,save]=await Promise.all([
  import('../phaser-src/src/preview-engine.js'),
  import('../phaser-src/src/preview-endings.js'),
  import('../phaser-src/src/preview-save.js')
 ]);
 return {...engine,...endings,...save};
}
function blankRun(mod){
 const run=mod.initialPreviewRun(0x44332211,5,'vigia');
 run.hero.hp=43;run.hero.xp=0;run.hero.nextXP=999999;
 run.enemies=[];run.items=[];run.shrine=null;
 run.map.fill(1);run.seen.fill(true);run.rooms=[];
 run.bossDown=true;
 return run;
}
test('P3B.3: derrotar Escrivão abre escolha, não proclama vitória automática',async()=>{
 const mod=await setup(),run=blankRun(mod),seed=run.rngState,turn=run.turn;
 const outcome=mod.previewAction(run,{type:'WAIT'});
 assert.equal(outcome.consumesTurn,true);
 assert.equal(outcome.status,'applied');
 assert.equal(run.over,true);
 assert.equal(run.pendingFinalChoice,true);
 assert.equal(run.previewOutcome,'decision');
 assert.equal(run.turn,turn,'boss derrotado interrompe ciclo antes de outro turno');
 assert.equal(run.rngState,seed,'não consome RNG na decisão');
 assert.ok(outcome.events.some(e=>e.type==='final-decision'));
});
test('enquanto decide, nenhuma ação ou RNG adicional; escolha inválida é inócua',async()=>{
 const mod=await setup(),run=blankRun(mod);
 mod.previewAction(run,{type:'WAIT'});
 const previous=JSON.stringify(run);
 for(const action of [{type:'WAIT'},{type:'MOVE',dx:1,dy:0},
  {type:'ATTACK',enemyId:1},{type:'INTERACT'},{type:'SKILL',which:0}]){
  const out=mod.previewAction(run,action);
  assert.equal(out.status,'inactive');
  assert.equal(out.consumesTurn,false);
 }
 assert.equal(mod.previewAction(run,{type:'CHOOSE_ENDING',ending:'kali'}).status,'invalid-ending');
 assert.equal(JSON.stringify(run),previous);
});
test('Luz e Raiz geram epílogos distintos, uma única vez e sem gasto de turno',async()=>{
 const mod=await setup();
 for(const ending of ['luz','raiz']){
  const run=blankRun(mod);
  mod.previewAction(run,{type:'WAIT'});
  const turn=run.turn,rng=run.rngState;
  const out=mod.previewAction(run,{type:'CHOOSE_ENDING',ending});
  assert.equal(out.status,'ending-chosen');
  assert.equal(out.consumesTurn,false);
  assert.equal(run.previewOutcome,ending);
  assert.equal(run.pendingFinalChoice,false);
  assert.equal(run.over,true);
  assert.equal(run.turn,turn);assert.equal(run.rngState,rng);
  const finalized=JSON.stringify(run);
  assert.equal(mod.previewAction(run,{type:'CHOOSE_ENDING',ending:ending==='luz'?'raiz':'luz'}).status,'invalid-ending');
  assert.equal(JSON.stringify(run),finalized,'resultado não pode ser alterado após concluir');
 }
 assert.notEqual(mod.PREVIEW_ENDING_COPY.luz.story,mod.PREVIEW_ENDING_COPY.raiz.story);
});
test('uma decisão pendente e um epílogo finalizado sobrevivem ao save da preview',async()=>{
 const mod=await setup(),run=blankRun(mod);
 mod.previewAction(run,{type:'WAIT'});
 const store=new Map(),mem={getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)};
 assert.equal(mod.savePreview(mem,run),true);
 const resumed=mod.loadPreview(mem);
 assert.equal(resumed.pendingFinalChoice,true);
 assert.equal(mod.previewAction(resumed,{type:'CHOOSE_ENDING',ending:'luz'}).status,'ending-chosen');
 assert.equal(mod.savePreview(mem,resumed),true);
 const completed=mod.loadPreview(mem);
 assert.equal(completed.previewOutcome,'luz');
 assert.equal(completed.pendingFinalChoice,false);
 assert.equal(completed.bossDown,true);
 assert.deepEqual([...store.keys()],[mod.PREVIEW_SAVE_KEY]);
});
test('save antigo de vitória P2B pode escolher Luz/Raiz sem apagar progresso',async()=>{
 const mod=await setup(),run=blankRun(mod);
 run.over=true;run.previewOutcome='victory';run.pendingFinalChoice=undefined;
 const before={seed:run.seed,rng:run.rngState,turn:run.turn,level:run.hero.level};
 assert.equal(mod.normalizePreviewEnding(run),true);
 assert.equal(run.pendingFinalChoice,true);
 assert.equal(run.previewOutcome,'decision');
 assert.equal(mod.normalizePreviewEnding(run),false,'migração é idempotente');
 assert.equal(mod.previewAction(run,{type:'CHOOSE_ENDING',ending:'raiz'}).status,'ending-chosen');
 assert.deepEqual({seed:run.seed,rng:run.rngState,turn:run.turn,level:run.hero.level},before);
});
test('morte mantém fim independente, sem habilitar escolha final',async()=>{
 const mod=await setup(),run=blankRun(mod);
 run.bossDown=false;run.hero.hp=0;
 const out=mod.previewAction(run,{type:'WAIT'});
 assert.equal(out.status,'inactive');
 assert.equal(run.previewOutcome,'death');
 assert.equal(run.pendingFinalChoice,false);
 assert.equal(run.over,true);
 assert.equal(mod.previewAction(run,{type:'CHOOSE_ENDING',ending:'luz'}).status,'invalid-ending');
});
test('textos dos dois epílogos e da decisão permanecem canônicos ao HTML',async()=>{
 const mod=await setup(),html=read('index.html'),copy=mod.PREVIEW_ENDING_COPY;
 for(const key of ['luz','raiz']){
  const c=copy[key];
  assert.ok(html.includes(c.description));
  assert.ok(html.includes(c.story));
  assert.ok(html.includes(c.label));
 }
 assert.ok(html.includes(copy.sharedVictory));
 assert.ok(html.includes(copy.decision.question));
 assert.ok(html.includes(copy.death.story));
 assert.ok(html.includes(copy.decision.kicker));
});
test('interface final oferece teclado, toque, gamepad, botões e reinício sem apagar save clássico',()=>{
 const html=read('phaser-src/index.html'),scene=read('phaser-src/src/scenes/DungeonScene.js'),
  css=read('phaser-src/src/style.css');
 assert.match(html,/data-preview-ending="luz"/);
 assert.match(html,/data-preview-ending="raiz"/);
 assert.match(scene,/pendingFinalChoice/);
 assert.match(scene,/chooseEnding\(/);
 assert.match(scene,/normalizePreviewEnding/);
 assert.match(scene,/pressed\(0\)\)this.chooseEnding/);
 assert.match(css,/\.ending-choices/);
 assert.doesNotMatch(scene,/carcaca_golzdov_run_v1|carcaca_golzdov_meta_v1/);
});
