/* Golzdov P1C.3B.3B.2B — estados terminais do domínio.
 * O núcleo muta somente run/meta; eventos descrevem operações de UI,
 * armazenamento e áudio que o adaptador antigo executa na ordem original.
 * Não usa DOM, Phaser, Storage, Canvas, relógio nem RNG.
 */
(function(root){
'use strict';
function loss(run){
  if(!run||run.over)return {status:'inactive',events:[]};
  run.over=true;
  return {status:'death',events:[
    {type:'end-meta',win:false},{type:'clear-save'},
    {type:'show-death'},{type:'sound',frequency:75,duration:.5,wave:'sawtooth'}
  ]};
}
function decision(run){
  if(!run||run.over)return {status:'inactive',events:[]};
  run.over=true;
  return {status:'decision',events:[{type:'show-final-choice'}]};
}
function victory(run,ending){
  // Igual ao legado: clicar numa opção depois da decisão não volta a marcar "over".
  return {status:'victory',events:[
    {type:'end-meta',win:true},{type:'clear-save'},
    {type:'show-victory',ending},{type:'sound',frequency:820,duration:.4,wave:'triangle'}
  ]};
}
function updateMeta(run,meta,win){
  const value=meta||{best:0,wins:0,runs:0,kills:0};
  value.best=Math.max(value.best||0,run.floor);
  value.runs=(value.runs||0)+1;
  value.kills=(value.kills||0)+run.kills;
  if(win)value.wins=(value.wins||0)+1;
  return value;
}
root.GolzdovEndings=Object.freeze({loss,decision,victory,updateMeta});
})(typeof window!=='undefined'?window:globalThis);
