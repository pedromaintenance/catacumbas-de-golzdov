/* Golzdov P1C.3A — IA de inimigos sem DOM, Phaser ou tempo real.
 * A ordem de sorteios e de vizinhos do enemyStep legado é preservada.
 * Adaptadores de dano são síncronos até P1C.3B (fila de eventos).
 */
(function(root){
'use strict';
function distance(a,b){return Math.abs(a.x-b.x)+Math.abs(a.y-b.y);}
function step(run,enemy,definitions,{walkable,lineClear,enemyAt,onMelee,onReceiveDamage}){
  const p=run.hero,def=definitions[enemy.type],d=distance(enemy,p);
  if(enemy.stun>0){enemy.stun--;return 'stunned';}
  if(enemy.root>0){enemy.root--;if(d<=1)onMelee(enemy);return 'rooted';}
  if(d<=1){onMelee(enemy);return 'melee';}
  if(def.range&&d<=def.range&&lineClear(enemy.x,enemy.y,p.x,p.y)&&enemy.cd<=0){
    const roll=root.GolzdovCombat.enemyRanged(run,enemy,{boss:enemy.type==='boss'});
    onReceiveDamage(roll.damage,roll.forbiddenWord?'Uma palavra proibida rasga o ar!':def.name+' ataca de longe.');
    enemy.cd=enemy.type==='boss'?1:2;
    return 'ranged';
  }
  if(enemy.cd>0)enemy.cd--;
  if(d>11)return 'distant';
  const dirs=[[0,-1],[1,0],[0,1],[-1,0]];
  const choices=dirs.map(([dx,dy])=>({x:enemy.x+dx,y:enemy.y+dy}))
    .filter(q=>walkable(q.x,q.y)&&!(q.x===p.x&&q.y===p.y)&&!enemyAt(q.x,q.y));
  if(!choices.length)return 'blocked';
  if(def.range&&d<=def.range&&root.GolzdovCoreRng.next(run)<.35)return 'paused';
  choices.sort((a,b)=>distance(a,p)-distance(b,p));
  const first=choices[0];
  if(distance(first,p)<d||root.GolzdovCoreRng.next(run)<.08){
    enemy.x=first.x;enemy.y=first.y;
    return 'moved';
  }
  return 'idle';
}
root.GolzdovEnemies=Object.freeze({step,distance});
})(typeof window!=='undefined'?window:globalThis);
