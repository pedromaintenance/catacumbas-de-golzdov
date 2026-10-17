'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
async function setup(){
 const [hist,engine,save]=await Promise.all([
  import('../phaser-src/src/preview-history.js'),
  import('../phaser-src/src/preview-engine.js'),
  import('../phaser-src/src/preview-save.js')
 ]);
 return {...hist,...engine,...save};
}
const storage=()=>{
 const map=new Map();
 return {map,getItem:k=>map.get(k)||null,setItem:(k,v)=>{map.set(k,v);},
  removeItem:k=>map.delete(k)};
};
function run(engine,outcome='luz',id='exp-1'){
 const r=engine.initialPreviewRun(0x23456789,5,'vigia');
 r.previewSessionId=id;r.bossDown=outcome!=='death';r.pendingFinalChoice=false;
 r.over=true;r.previewOutcome=outcome;r.kills=19;r.turn=91;r.treasure=44;
 r.hero.level=5;
 return r;
}
test('P3B.4: histórico fica em chave exclusiva e agrega best/wins/runs/kills do núcleo',async()=>{
 const m=await setup(),s=storage(),win=run(m,'luz','one');
 const result=m.archivePreviewRun(s,win,'2026-10-16T23:00:00.000Z');
 assert.equal(result.status,'archived');
 const meta=m.readPreviewHistory(s);
 assert.deepEqual([meta.runs,meta.wins,meta.kills,meta.best,meta.luz,meta.raiz,meta.deaths],
  [1,1,19,5,1,0,0]);
 assert.equal(meta.records.length,1);
 assert.deepEqual([meta.records[0].outcome,meta.records[0].turns,meta.records[0].treasure],
  ['luz',91,44]);
 assert.equal(meta.records[0].at,'2026-10-16T23:00:00.000Z');
 assert.deepEqual([...s.map.keys()],[m.PREVIEW_HISTORY_KEY]);
});
test('derrota registra profundidade, mas não incrementa vitórias nem Luz/Raiz',async()=>{
 const m=await setup(),s=storage(),a=run(m,'death','fall');
 a.bossDown=false;a.floor=3;
 assert.equal(m.archivePreviewRun(s,a).status,'archived');
 const meta=m.readPreviewHistory(s);
 assert.deepEqual([meta.runs,meta.wins,meta.deaths,meta.best,meta.luz,meta.raiz],
  [1,0,1,3,0,0]);
});
test('decisão pendente nunca entra nas crônicas mesmo com run.over=true',async()=>{
 const m=await setup(),s=storage(),a=run(m,'luz','undecided');
 a.previewOutcome='decision';a.pendingFinalChoice=true;
 assert.equal(m.archivePreviewRun(s,a).status,'not-finished');
 assert.equal(s.map.size,0);
 assert.equal(m.readPreviewHistory(s).runs,0);
});
test('idempotência: reload, chamar duas vezes e outra conclusão não duplicam vitória',async()=>{
 const m=await setup(),s=storage(),a=run(m,'raiz','same');
 assert.equal(m.archivePreviewRun(s,a).status,'archived');
 assert.equal(m.archivePreviewRun(s,a).status,'already-archived');
 const again=JSON.parse(JSON.stringify(a));
 assert.equal(m.archivePreviewRun(s,again).status,'already-archived');
 assert.equal(m.readPreviewHistory(s).runs,1);
 const next=run(m,'luz','another');
 assert.equal(m.archivePreviewRun(s,next).status,'archived');
 const meta=m.readPreviewHistory(s);
 assert.deepEqual([meta.runs,meta.wins,meta.luz,meta.raiz,meta.kills],[2,2,1,1,38]);
 assert.deepEqual(meta.records.map(x=>x.id),['another','same']);
});
test('um mesmo seed pode gerar expedições distintas com IDs persistidos',async()=>{
 const m=await setup(),s=storage();
 const a=run(m,'raiz','new-game-A'),b=run(m,'raiz','new-game-B');
 assert.equal(a.seed,b.seed);assert.equal(a.turn,b.turn);
 assert.equal(m.archivePreviewRun(s,a).status,'archived');
 assert.equal(m.archivePreviewRun(s,b).status,'archived');
 assert.equal(m.readPreviewHistory(s).runs,2);
 assert.notEqual(m.newPreviewSessionId(),m.newPreviewSessionId());
});
test('preview antiga sem id recebe impressão estável, sem precisar consumir RNG',async()=>{
 const m=await setup(),s=storage(),a=run(m,'luz','');
 delete a.previewSessionId;
 const seed=a.rngState,turn=a.turn;
 assert.equal(m.archivePreviewRun(s,a).status,'archived');
 assert.match(a.previewArchivedId,/^legacy-/);
 assert.equal(a.rngState,seed);assert.equal(a.turn,turn);
 const copy=JSON.parse(JSON.stringify(a));
 assert.equal(m.archivePreviewRun(s,copy).status,'already-archived');
 assert.equal(m.readPreviewHistory(s).runs,1);
});
test('histórico limita detalhes às vinte últimas partidas mantendo totais agregados',async()=>{
 const m=await setup(),s=storage();
 for(let i=0;i<26;i++){
  const a=run(m,i%2?'raiz':'death','id-'+i);
  assert.equal(m.archivePreviewRun(s,a).status,'archived');
 }
 const meta=m.readPreviewHistory(s);
 assert.equal(meta.records.length,20);
 assert.equal(meta.records[0].id,'id-25');
 assert.equal(meta.records.at(-1).id,'id-6');
 assert.deepEqual([meta.runs,meta.wins,meta.deaths,meta.luz,meta.raiz],[26,13,13,0,13]);
});
test('reiniciar remove somente a campanha da preview, preservando o histórico',async()=>{
 const m=await setup(),s=storage(),a=run(m,'luz','save-test');
 assert.equal(m.archivePreviewRun(s,a).status,'archived');
 assert.equal(m.savePreview(s,a),true);
 assert.equal(m.clearPreview(s),true);
 assert.equal(s.map.has(m.PREVIEW_SAVE_KEY),false);
 assert.equal(m.readPreviewHistory(s).runs,1);
 assert.equal(s.map.has('carcaca_golzdov_run_v1'),false);
 assert.equal(s.map.has('carcaca_golzdov_meta_v1'),false);
});
test('storage indisponível, dados corrompidos e preview ainda em andamento são seguros',async()=>{
 const m=await setup(),s=storage(),a=run(m,'luz','unavailable');
 assert.equal(m.archivePreviewRun(null,a).status,'unavailable');
 assert.equal(a.previewArchivedId,undefined);
 s.map.set(m.PREVIEW_HISTORY_KEY,'{malformed');
 assert.equal(m.readPreviewHistory(s).runs,0);
 a.over=false;
 assert.equal(m.archivePreviewRun(s,a).status,'not-finished');
 const frozen=storage();frozen.setItem=()=>{throw Error('quota exceeded')};
 const completed=run(m,'raiz','quota');
 assert.equal(m.archivePreviewRun(frozen,completed).status,'unavailable');
 assert.equal(completed.previewArchivedId,undefined);
});
test('layout mostra painel independente, botão de reinício funciona após fim e UI evita innerHTML',()=>{
 const html=read('phaser-src/index.html');
 const scene=read('phaser-src/src/scenes/DungeonScene.js');
 assert.match(html,/id="chronicle-toggle"/);
 assert.match(html,/id="chronicle-records"/);
 assert.match(scene,/archivePreviewRun\(storage\(\),g\)/);
 assert.match(scene,/command==='restart'/);
 assert.match(scene,/previewSessionId=newPreviewSessionId\(\)/);
 assert.match(scene,/list\.replaceChildren\(\)/);
 assert.doesNotMatch(scene,/carcaca_golzdov_run_v1|carcaca_golzdov_meta_v1/);
});
