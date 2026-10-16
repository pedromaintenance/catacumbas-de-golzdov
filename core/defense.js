/* Golzdov P1C.3B.3B.2 — defesa, dano recebido e Último Juramento.
 * Sem DOM, Phaser, localStorage, áudio ou agendadores.
 *
 * A ordem dos eventos onDefend / onHurt é deliberadamente mantida no
 * adaptador: efeitos de relíquias podem alterar o estado ou causar danos.
 * O último juramento só é avaliado DEPOIS do onHurt.
 */
(function(root){
'use strict';
function reduce(run,value,{muralha=false}={}){
  return root.GolzdovCombat.incomingDamage(run,value,{muralha});
}
function apply(run,damage,message){
  if(!run||!run.hero)return [];
  const p=run.hero;
  p.hp=Math.max(0,p.hp-damage);
  return [
    {type:'log',text:message+' −'+damage+' vida.',icon:'♥'},
    {type:'sound',frequency:95,duration:.15,wave:'sawtooth'}
  ];
}
function afterHurt(run,{juramento=false}={}){
  if(!run||!run.hero)return [];
  const p=run.hero;
  if(p.hp<=0&&juramento&&!p.lastOathUsed){
    p.hp=1;
    p.lastOathUsed=true;
    p.oathWeakened=true;
    return [{type:'log',text:'Último Juramento: você resiste ao golpe fatal, mas sua guarda enfraquece.',icon:'◆'}];
  }
  if(p.hp<=0)return [{type:'die'}];
  return [];
}
root.GolzdovDefense=Object.freeze({reduce,apply,afterHurt});
})(typeof window!=='undefined'?window:globalThis);
