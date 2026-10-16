/* Golzdov P1C.3B.3A — recompensa de abate e eventos de pós-morte.
 * Os gatilhos onKill precedem o log; bossDown só é aplicado depois,
 * preservando a ordem do jogo original e seus efeitos encadeados.
 */
(function(root){
'use strict';
function defeat(run,enemy,definitions,source='effect'){
  if(!run||!enemy)return [];
  const p=run.hero,def=definitions[enemy.type];
  run.kills++;
  p.xp+=def.xp;
  p.coins+=def.gold;
  run.treasure+=def.gold;
  p.mana=Math.max(0,Math.min(p.maxmana,p.mana+1));
  run.enemies=run.enemies.filter(x=>x!==enemy);
  const events=[
    {type:'relic-event',event:'onKill',enemy,kind:source},
    {type:'log',text:def.name+' cai. +'+def.xp+' experiência, +'+def.gold+' âmbar.',icon:'✥'}
  ];
  if(enemy.type==='boss')events.push({type:'boss-down'});
  return events;
}
root.GolzdovRewards=Object.freeze({defeat});
})(typeof window!=='undefined'?window:globalThis);
