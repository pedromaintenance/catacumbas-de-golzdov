/* Golzdov P1C.3B.1 — primeira etapa do despachante de ações.
 * Cálculos do estado não dependem do navegador, Phaser, relógio nem renderer.
 * O estado recebido é alterado explicitamente; eventos descrevem efeitos
 * posteriores (log, som e exatamente uma solicitação de turno), em ordem.
 * P1C.3B.2 acrescentará MOVE / ATTACK / SKILL ao mesmo contrato.
 */
(function(root){
'use strict';
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
function result(run,status,events=[]){
  const consumesTurn=events.some(e=>e.type==='turn');
  return {state:run,status,consumesTurn,events};
}
function dispatch(run,action){
  if(!run||run.over||!run.hero)return result(run,'inactive');
  const p=run.hero;
  if(!action||typeof action.type!=='string')return result(run,'invalid');
  switch(action.type){
    case 'WAIT':{
      p.mana=clamp(p.mana+1,0,p.maxmana);
      return result(run,'applied',[
        {type:'log',text:'Você respira fundo e restaura 1 ponto de foco.',icon:'◈'},
        {type:'turn'}
      ]);
    }
    case 'POTION':{
      if(!p.potions)return result(run,'no-potions',[
        {type:'log',text:'Sua bolsa está vazia.',icon:'✚'}
      ]);
      if(p.hp===p.maxhp)return result(run,'full-health',[
        {type:'log',text:'Você já está com a vida completa.',icon:'✚'}
      ]);
      p.potions--;
      const amount=17+p.level*2;
      p.hp=clamp(p.hp+amount,0,p.maxhp);
      return result(run,'applied',[
        {type:'log',text:'Você bebe uma poção: +'+amount+' de vida.',icon:'♥'},
        {type:'sound',frequency:620,duration:.14},
        {type:'turn'}
      ]);
    }
    default:
      return result(run,'unsupported');
  }
}
root.GolzdovActions=Object.freeze({dispatch});
})(typeof window!=='undefined'?window:globalThis);
