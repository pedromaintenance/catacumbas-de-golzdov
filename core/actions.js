/* Golzdov P1C.3B.1 — primeira etapa do despachante de ações.
 * Cálculos do estado não dependem do navegador, Phaser, relógio nem renderer.
 * O estado recebido é alterado explicitamente; eventos descrevem efeitos
 * posteriores (log, som e exatamente uma solicitação de turno), em ordem.
 * P1C.3B.3B.1 adicionou ATTACK; SKILL, dano recebido e terminais completos pendentes.
 */
(function(root){
'use strict';
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
function result(run,status,events=[]){
  const consumesTurn=events.some(e=>e.type==='turn'||e.type==='attack');
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
    case 'MOVE':{
      const {dx,dy}=action;
      if(!Number.isInteger(dx)||!Number.isInteger(dy)||Math.abs(dx)+Math.abs(dy)!==1)
        return result(run,'invalid-direction');
      const width=action.width??35,height=action.height??35;
      const x=p.x+dx,y=p.y+dy;
      if(x<=0||y<=0||x>=width-1||y>=height-1||run.map[y*width+x]!==1)
        return result(run,'blocked',[{type:'sound',frequency:120,duration:.035}]);
      const enemy=run.enemies.find(e=>e.hp>0&&e.x===x&&e.y===y);
      if(enemy)return result(run,'enemy',[{type:'attack',enemyId:enemy.id}]);
      p.x=x;p.y=y;
      run.steps++;
      const events=[{type:'sound',frequency:190,duration:.028}];
      const roomIndex=run.rooms.findIndex(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h);
      if(roomIndex>=0&&!run.visitedRooms.includes(roomIndex)){
        run.visitedRooms.push(roomIndex);
        events.push({type:'enter-room',roomIndex});
      }
      // Loot must be resolved after onEnterRoom: relic events may alter the run.
      // The adapter's collect handler remains responsible until P1C.3B.3.
      events.push({type:'collect-at-player'},{type:'turn'},{type:'post-move'});
      return result(run,'applied',events);
    }
    case 'ATTACK':{
      const enemy=run.enemies.find(e=>e.id===action.enemyId&&e.hp>0);
      if(!enemy)return result(run,'no-target');
      const range=action.melee?1:p.range;
      const distance=Math.abs(p.x-enemy.x)+Math.abs(p.y-enemy.y);
      if(distance>range||(!action.melee&&!action.lineOfSight))
        return result(run,'out-of-range',[
          {type:'log',text:'O inimigo está fora do alcance ou atrás de uma parede.',icon:'!'},
          {type:'sound',frequency:140}
        ]);
      const roll=root.GolzdovCombat.basicAttack(run,enemy,{
        predator:!!action.predator,muralha:!!action.muralha
      });
      const events=[];
      if(roll.miss){
        events.push({type:'log',text:'Você erra '+action.enemyName+'.',icon:'⚔'});
        events.push({type:'sound',frequency:170,duration:.08});
      }else{
        if(roll.consumeRiposte)p.riposte=0;
        events.push({type:'hero-hit',enemyId:enemy.id,damage:roll.damage,
          label:roll.critical?'ACERTO CRÍTICO':'Golpe',source:'basic',critical:roll.critical});
        events.push({type:'sound',frequency:roll.critical?720:370,duration:.095,wave:'triangle'});
      }
      events.push({type:'turn'});
      return result(run,'applied',events);
    }
    case 'COLLECT':{
      const item=run.items.find(i=>i.x===p.x&&i.y===p.y);
      if(!item)return result(run,'no-item');
      // Item removal precedes trap/relic effects, as in the original doMove.
      run.items=run.items.filter(i=>i!==item);
      return result(run,'applied',root.GolzdovLoot.resolve(run,item,{hasRelicOffers:!!action.hasRelicOffers}));
    }
    default:
      return result(run,'unsupported');
  }
}
root.GolzdovActions=Object.freeze({dispatch});
})(typeof window!=='undefined'?window:globalThis);
