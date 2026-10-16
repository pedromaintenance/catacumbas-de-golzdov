/* Golzdov P1C.3A — ordem lógica do ciclo de turnos.
 * Nenhum requestAnimationFrame, timer, DOM, storage, efeito audiovisual.
 * Só avança ao ser explicitamente chamado por uma ação de jogo.
 */
(function(root){
'use strict';
function advance(run,{onVictory,onStart,onEnemy,onReveal,onDeath,onLevelUp,onReady}){
  if(!run||run.over)return {status:'inactive',advanced:false};
  if(run.bossDown){onVictory();return {status:'victory',advanced:false};}
  root.GolzdovCombat.startTurn(run);
  const player=run.hero;
  onStart();
  if(run.bossDown){onVictory();return {status:'victory',advanced:true};}
  for(const enemy of [...run.enemies]){
    if(run.over)break;
    if(Math.abs(enemy.x-player.x)+Math.abs(enemy.y-player.y)<10)onEnemy(enemy);
  }
  onReveal();
  if(player.hp<=0){onDeath();return {status:'death',advanced:true};}
  if(run.bossDown){onVictory();return {status:'victory',advanced:true};}
  if(player.xp>=player.nextXP){onLevelUp();return {status:'level-up',advanced:true};}
  onReady();
  return {status:'ready',advanced:true};
}
root.GolzdovTurns=Object.freeze({advance});
})(typeof window!=='undefined'?window:globalThis);
