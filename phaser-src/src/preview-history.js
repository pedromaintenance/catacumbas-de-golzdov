/* P3B.4 — crônicas de expedições da preview.
 * Estatísticas clássicas usam GolzdovEndings.updateMeta; o arquivo é próprio
 * da preview e jamais lê/escreve os saves ou meta da versão HTML.
 * Sem acesso a storage no import, sem relógio/RNG dentro da simulação.
 */
import '../../core/endings.js';
export const PREVIEW_HISTORY_KEY='carcaca_golzdov_phaser_history_v1';
export const PREVIEW_HISTORY_LIMIT=20;
const root=typeof window!=='undefined'?window:globalThis;
const outcomes=Object.freeze(['death','luz','raiz']);
const fresh=()=>({schemaVersion:1,best:0,runs:0,wins:0,kills:0,luz:0,raiz:0,deaths:0,records:[]});
const int=(x)=>Number.isSafeInteger(x)&&x>=0?x:0;
let nonce=0;
export function newPreviewSessionId(){
 ++nonce;
 const uuid=typeof crypto!=='undefined'&&typeof crypto.randomUUID==='function'
  ?crypto.randomUUID():null;
 return 'phaser-'+(uuid||Date.now().toString(36)+'-'+nonce.toString(36));
}
export function readPreviewHistory(storage){
 try{
  const raw=storage?.getItem(PREVIEW_HISTORY_KEY);
  if(!raw)return fresh();
  const parsed=JSON.parse(raw);
  if(parsed?.schemaVersion!==1||!Array.isArray(parsed.records))return fresh();
  const result=fresh();
  for(const k of ['best','runs','wins','kills','luz','raiz','deaths'])result[k]=int(parsed[k]);
  result.records=parsed.records.filter(x=>
   x&&typeof x.id==='string'&&outcomes.includes(x.outcome)&&
   typeof x.classId==='string'&&Number.isInteger(x.floor)&&
   x.floor>=1&&x.floor<=5
  ).slice(0,PREVIEW_HISTORY_LIMIT).map(x=>({
   id:x.id,outcome:x.outcome,classId:x.classId,floor:x.floor,
   level:int(x.level),turns:int(x.turns),kills:int(x.kills),
   treasure:int(x.treasure),seed:int(x.seed),at:typeof x.at==='string'?x.at:''
  }));
  return result;
 }catch(_){return fresh();}
}
export function finishedPreviewRun(run){
 return !!(run?.over&&!run.pendingFinalChoice&&outcomes.includes(run.previewOutcome));
}
export function archivePreviewRun(storage,run,at=new Date().toISOString()){
 if(!finishedPreviewRun(run)||!run.hero)return {status:'not-finished'};
 const id=run.previewSessionId||
  'legacy-'+[int(run.seed),int(run.turn),int(run.kills),run.previewOutcome,
   run.hero.classId,int(run.hero.level),int(run.treasure)].join('-');
 const meta=readPreviewHistory(storage);
 if(meta.records.some(x=>x.id===id)){
  run.previewArchivedId=id;
  return {status:'already-archived',meta};
 }
 const win=run.previewOutcome!=='death';
 const next=root.GolzdovEndings.updateMeta(run,meta,win);
 next.schemaVersion=1;
 next.deaths=meta.deaths+(win?0:1);
 next.luz=meta.luz+(run.previewOutcome==='luz'?1:0);
 next.raiz=meta.raiz+(run.previewOutcome==='raiz'?1:0);
 next.records=[{
  id,outcome:run.previewOutcome,classId:run.hero.classId,floor:run.floor,
  level:int(run.hero.level),turns:int(run.turn),kills:int(run.kills),
  treasure:int(run.treasure),seed:int(run.seed),at
 },...meta.records].slice(0,PREVIEW_HISTORY_LIMIT);
 // Uma falha no armazenamento não deve dar aparência falsa de arquivamento.
 try{
  if(!storage||typeof storage.setItem!=='function')return {status:'unavailable',meta};
  storage.setItem(PREVIEW_HISTORY_KEY,JSON.stringify(next));
  run.previewArchivedId=id;
  return {status:'archived',meta:next};
 }catch(_){return {status:'unavailable',meta};}
}
