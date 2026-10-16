/* Golzdov — regras básicas de combate 1.2C extraídas para a futura engine Phaser.
 * Estado e RNG explícitos. Nenhum DOM, Canvas, UI, storage, timer ou fase visual.
 * Ataque, esquiva, mitigação e início de turno reproduzem o legado, sem antecipar
 * rolagens nem mudar a ordem de consumo do RNG.
 */
(function(root){
'use strict';
function dice(run){const r=root.GolzdovCoreRng;if(!r)throw Error('core/rng.js deve ser carregado antes de core/combat.js');return r;}
function basicAttack(run,enemy,{predator=false,muralha=false}={}){
  const random=dice(run),p=run.hero;
  if(random.next(run)*100<7)return {miss:true,critical:false,damage:0,consumeRiposte:false};
  const critBonus=predator&&enemy.root>0?20:0;
  const critical=random.next(run)*100<p.crit+critBonus;
  const riposte=muralha?3*(p.riposte||0):0;
  const damage=Math.max(1,p.atk+random.integer(run,0,4)-enemy.def+riposte)*(critical?2:1);
  return {miss:false,critical,damage,consumeRiposte:!!riposte};
}
function enemyMelee(run,enemy){
  const p=run.hero,random=dice(run);
  if(random.next(run)*100<p.dodge)return {dodge:true,damage:0};
  const effectiveDefense=Math.max(0,p.def-(p.oathWeakened?1:0));
  return {dodge:false,damage:Math.max(1,random.integer(run,enemy.atk-2,enemy.atk+2)-effectiveDefense)};
}
function enemyRanged(run,enemy,{boss=false}={}){
  const p=run.hero,random=dice(run);
  if(boss&&random.next(run)<.45){
    return {forbiddenWord:true,damage:random.integer(run,5,9)+run.floor};
  }
  const defense=Math.floor(Math.max(0,p.def-(p.oathWeakened?1:0))/2);
  return {forbiddenWord:false,damage:random.integer(run,Math.max(2,enemy.atk-3),enemy.atk+1)-defense};
}
function incomingDamage(run,value,{muralha=false}={}){
  const p=run.hero;
  let damage=Math.max(1,value);
  if(p.buff>0){
    damage=Math.max(1,damage-4);
    if(muralha)p.riposte=Math.min(3,(p.riposte||0)+1);
  }
  if(!run.chainUsed&&p.relics.includes('chain')){
    damage=Math.ceil(damage/2);
    run.chainUsed=true;
  }
  // O evento onDefend e os efeitos das relíquias continuam sob o despachante existente.
  return damage;
}
function startTurn(run){
  run.turn++;
  if(run.hero.buff>0)run.hero.buff--;
  return run.turn;
}
root.GolzdovCombat=Object.freeze({basicAttack,enemyMelee,enemyRanged,incomingDamage,startTurn});
})(typeof window!=='undefined'?window:globalThis);
