'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
const pad=(buttons=[],connected=true)=>({connected,
 buttons:Array.from({length:17},(_,i)=>({pressed:buttons.includes(i)})),axes:[0,0,0,0]});
const load=()=>import('../phaser-src/src/preview-pad-latch.js');
test('P5B.2: A/X/Y/RB só disparam uma vez enquanto pressionados',async()=>{
 const {PreviewPadLatch}=await load(),latch=new PreviewPadLatch();
 latch.sample(pad([0,2,3,5]),'exploration');
 for(const key of [0,2,3,5])assert.equal(latch.consume(key),true);
 for(let frame=0;frame<40;frame++){
  latch.sample(pad([0,2,3,5]),'exploration');
  for(const key of [0,2,3,5])assert.equal(latch.consume(key),false);
 }
 latch.sample(pad([]),'exploration');
 latch.sample(pad([0,2,3,5]),'exploration');
 for(const key of [0,2,3,5])assert.equal(latch.consume(key),true);
});
test('P5B.2: direção pode repetir, A curto durante cooldown fica enfileirado',async()=>{
 const {PreviewPadLatch}=await load(),latch=new PreviewPadLatch();
 const dpad=pad([12]);latch.sample(dpad,'exploration');
 for(let i=0;i<20;i++)latch.sample(dpad,'exploration');
 assert.equal(latch.consume(12),true,'borda é única mesmo com movimento pressionado');
 assert.equal(latch.consume(12),false);
 latch.sample(pad([]),'exploration');
 latch.sample(pad([0]),'exploration');
 latch.sample(pad([]),'exploration');
 assert.equal(latch.consume(0),true,'clique curto não some durante atraso de 175 ms');
 assert.equal(latch.consume(0),false);
});
test('P5B.2: troca de modal nunca reaproveita A segurado da tela anterior',async()=>{
 const {PreviewPadLatch}=await load(),latch=new PreviewPadLatch();
 latch.sample(pad([0]),'class');
 assert.equal(latch.consume(0),true);
 latch.sample(pad([0]),'exploration');
 assert.equal(latch.consume(0),false);
 latch.sample(pad([0]),'item');
 assert.equal(latch.consume(0),false);
 latch.sample(pad([]),'item');latch.sample(pad([0]),'item');
 assert.equal(latch.consume(0),true);
 latch.sample(pad([0]),'ending');
 assert.equal(latch.consume(0),false);
 latch.sample(pad([]),'ending');latch.sample(pad([0]),'ending');
 assert.equal(latch.consume(0),true);
});
test('P5B.2: desconectar limpa pendências e reconectar reconhece o botão inicial',async()=>{
 const {PreviewPadLatch}=await load(),latch=new PreviewPadLatch();
 latch.sample(pad([0]),'item');
 latch.sample(null,'item');
 assert.equal(latch.consume(0),false);
 latch.sample(pad([0]),'item');
 assert.equal(latch.consume(0),true);
 latch.reset();assert.equal(latch.consume(0),false);
});
test('B faz VOLTAR preferencial em substituição e cancela outros menus sem gastar turno',async()=>{
 const {PreviewPadLatch,previewBackChoiceIndex}=await load();
 const {PreviewItemUI}=await import('../phaser-src/src/preview-item-ui.js');
 const chosen=[];
 const dummy={items:[{type:'RELIC_SKIP'},{type:'RELIC_BACK'},{type:'RELIC_CONFIRM'}],
  selection:2,move(){},choose(index){chosen.push(index);}};
 const latch=new PreviewPadLatch();
 latch.sample(pad([1]),'item');
 assert.equal(PreviewItemUI.prototype.pad.call(dummy,pad([1]),latch),true);
 assert.deepEqual(chosen,[1]);
 latch.sample(pad([1]),'item');
 assert.equal(PreviewItemUI.prototype.pad.call(dummy,pad([1]),latch),false);
 assert.deepEqual(chosen,[1],'B segurado não escolhe novamente');
 for(const type of ['RELIC_SKIP','SHOP_CLOSE','STAIRS_CANCEL']){
  assert.equal(previewBackChoiceIndex([{type}]),0);
 }
 assert.equal(previewBackChoiceIndex([{type:'CHOOSE_SHRINE'}]),-1,
  'altar irreversível não deve ganhar botão cancelar inexistente');
});
test('contextos obedecem prioridade de decisão, talentos, modais, rota e fim',async()=>{
 const {previewInputContext}=await load();
 const scene={classSelectionOpen:true,run:{over:false},itemUI:{active:()=>false},autoPath:[]};
 assert.equal(previewInputContext(scene),'class');
 scene.classSelectionOpen=false;scene.run.pendingFinalChoice=true;
 assert.equal(previewInputContext(scene),'ending');
 scene.run.pendingFinalChoice=false;scene.run.over=true;
 assert.equal(previewInputContext(scene),'ended');
 scene.run.over=false;scene.run.pendingTalentChoices=['x'];
 assert.equal(previewInputContext(scene),'talent');
 scene.run.pendingTalentChoices=null;scene.itemUI.active=()=>true;
 assert.equal(previewInputContext(scene),'item');
 scene.itemUI.active=()=>false;scene.autoPath=[[1,0]];
 assert.equal(previewInputContext(scene),'route');
 scene.autoPath=[];
 assert.equal(previewInputContext(scene),'exploration');
});
test('UI da P5B.2 usa latch nos botões únicos mas D-pad mantém repetição',()=>{
 const scene=read('phaser-src/src/scenes/DungeonScene.js');
 const item=read('phaser-src/src/preview-item-ui.js');
 const html=read('phaser-src/index.html');
 assert.match(scene,/this\.padLatch\.sample\(gamepad,previewInputContext\(this\)\)/);
 for(const b of [0,1,2,3,5])assert.match(scene,new RegExp('this\\.padLatch\\.consume\\('+b+'\\)'));
 assert.match(item,/pad\(pad,latch\)/);
 assert.match(item,/previewBackChoiceIndex\(this\.items\)/);
 assert.match(item,/scrollIntoView\?\./);
 assert.match(scene,/closest\('button,a,input,textarea,select,\[contenteditable="true"\]'\)/);
 assert.match(html,/Ações únicas exigem soltar e pressionar novamente/);
 assert.match(html,/O Gesto Preciso/);
 assert.doesNotMatch(scene,/carcaca_golzdov_run_v1|carcaca_golzdov_meta_v1/);
});
test('replays sem buff, sem teleporte e com save/load são determinísticos até morte ou 35 turnos',async()=>{
 const m=await import('../phaser-src/src/preview-engine.js');
 const save=await import('../phaser-src/src/preview-save.js');
 async function replay(seed,cls){
  const mem=new Map([['carcaca_golzdov_run_v1','LEGACY_SAVE'],['carcaca_golzdov_meta_v1','LEGACY_META']]);
  const storage={getItem:k=>mem.get(k),setItem:(k,v)=>mem.set(k,v),removeItem:k=>mem.delete(k)};
  let run=m.initialPreviewRun(seed,1,cls),trace=[];
  const initial=JSON.parse(JSON.stringify(run.hero));
  for(let i=0;i<35&&!run.over;i++){
   // Não concede PV/atributos, não move personagem por fixture nem apaga monstros.
   const result=m.previewAction(run,{type:'WAIT'});
   assert.ok(['applied','inactive'].includes(result.status));
   assert.equal(save.savePreview(storage,run),true);
   run=save.loadPreview(storage);
   assert.ok(run&&Number.isFinite(run.hero.hp));
   assert.equal(run.hero.classId,cls);
   trace.push([run.turn,run.hero.hp,run.rngState,run.kills,run.previewOutcome]);
  }
  assert.equal(initial.maxhp,run.hero.maxhp);
  assert.equal(initial.atk,run.hero.atk);
  assert.equal(mem.get('carcaca_golzdov_run_v1'),'LEGACY_SAVE');
  assert.equal(mem.get('carcaca_golzdov_meta_v1'),'LEGACY_META');
  return trace;
 }
 for(const cls of ['vigia','arcanista','errante']){
  for(const seed of [7,0x12345678,0x87654321]){
   const a=await replay(seed,cls),b=await replay(seed,cls);
   assert.ok(a.length>=1);
   assert.deepEqual(a,b,'replay canônico deve reproduzir a mesma sequência de IA e RNG');
  }
 }
});
