/* Código original: copiar literalmente sem adaptar para P1C.3A. */
function enemyStep(e){const p=G.hero,def=ENEMIES[e.type],distance=dist(e,p);if(e.stun>0){e.stun--;return;}if(e.root>0){e.root--;if(distance<=1)enemyHit(e);return;}if(distance<=1){enemyHit(e);return;}if(def.range&&distance<=def.range&&lineClear(e.x,e.y,p.x,p.y)&&e.cd<=0){const result=window.GolzdovCombat.enemyRanged(G,e,{boss:e.type==='boss'});receiveDamage(result.damage,result.forbiddenWord?'Uma palavra proibida rasga o ar!':`${def.name} ataca de longe.`);e.cd=e.type==='boss'?1:2;return;}
  if(e.cd>0)e.cd--;if(distance>11)return;
  let dirs=[[0,-1],[1,0],[0,1],[-1,0]];let candidates=dirs.map(([dx,dy])=>({x:e.x+dx,y:e.y+dy})).filter(q=>walk(q.x,q.y)&&!(q.x===p.x&&q.y===p.y)&&!enemyAt(q.x,q.y));if(!candidates.length)return;
  if(def.range&&distance<=def.range&&gameRandom()<.35)return;
  candidates.sort((a,b)=>dist(a,p)-dist(b,p));let first=candidates[0];if(dist(first,p)<distance||gameRandom()<.08){e.x=first.x;e.y=first.y;}
}
function worldTurn(){if(!G||G.over)return;if(G.bossDown){finalDecision();return;}window.GolzdovCombat.startTurn(G);const p=G.hero;relicEvent('onTurnStart');if(G.bossDown){finalDecision();return;}for(const e of [...G.enemies]){if(G.over)break;if(dist(e,p)<10)enemyStep(e);}reveal();if(p.hp<=0){die();return;}if(G.bossDown){finalDecision();return;}if(p.xp>=p.nextXP){levelModal();return;}updateHUD();save();}
