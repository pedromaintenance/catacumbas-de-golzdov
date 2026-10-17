/* P4A.3 — leitura pura dos estados de combate da preview.
 * Nunca revela inimigos fora da visibilidade atual, não altera a run
 * e não consome RNG, turnos, DOM nem armazenamento.
 */
import {WIDTH,HEIGHT,ENEMIES} from './world.js';
const root=typeof window!=='undefined'?window:globalThis;
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const duration=n=>Number.isFinite(n)&&n>0?Math.ceil(n):0;
const known=(enemy,visible)=>Number.isInteger(enemy?.x)&&Number.isInteger(enemy?.y)&&
 enemy.x>=0&&enemy.y>=0&&enemy.x<WIDTH&&enemy.y<HEIGHT&&
 visible.has(enemy.y*WIDTH+enemy.x);
export const PREVIEW_STATUS_LABELS=Object.freeze({
 stun:'ATORDOADO',root:'ENRAIZADO',smolder:'CHAMAS',cooldown:'RECARGA',
 guarded:'BASTIÃO',riposte:'REVANCHE',weakened:'EXAUSTÃO'
});
export function enemyPreviewConditions(enemy){
 const list=[];
 for(const [kind,value] of [['stun',enemy.stun],['root',enemy.root],['smolder',enemy.smolder]]){
  const turns=duration(value);
  if(turns)list.push({kind,label:PREVIEW_STATUS_LABELS[kind],turns});
 }
 // Recarga só tem significado para inimigos com ataque à distância.
 if(ENEMIES[enemy.type]?.range&&duration(enemy.cd))
  list.push({kind:'cooldown',label:PREVIEW_STATUS_LABELS.cooldown,turns:duration(enemy.cd)});
 return list;
}
export function heroPreviewConditions(hero){
 const list=[];
 if(duration(hero.buff))list.push({kind:'guarded',label:PREVIEW_STATUS_LABELS.guarded,turns:duration(hero.buff)});
 if(duration(hero.riposte))list.push({kind:'riposte',label:PREVIEW_STATUS_LABELS.riposte,stacks:duration(hero.riposte)});
 if(hero.oathWeakened)list.push({kind:'weakened',label:PREVIEW_STATUS_LABELS.weakened});
 return list;
}
export function previewThreats(run,visible,limit=8){
 if(!run?.hero||!Array.isArray(run.enemies)||!(visible instanceof Set))return {total:0,threats:[],hero:[]};
 const hero=run.hero;
 const foes=run.enemies.filter(e=>e&&e.hp>0&&known(e,visible))
  .sort((a,b)=>distance(a,hero)-distance(b,hero)||a.id-b.id);
 const maximum=Number.isInteger(limit)?Math.max(0,Math.min(30,limit)):8;
 return {
  total:foes.length,hero:heroPreviewConditions(hero),
  threats:foes.slice(0,maximum).map(e=>{
   const definition=ENEMIES[e.type];
   const d=distance(hero,e);
   const canAttack=!run.over&&d<=hero.range&&
    root.GolzdovNavigation.lineClear(run.map,WIDTH,HEIGHT,hero.x,hero.y,e.x,e.y);
   return {id:e.id,type:e.type,name:definition?.name||e.type,
    x:e.x,y:e.y,distance:d,hp:Math.max(0,e.hp),
    maxhp:Math.max(1,e.maxhp||definition?.hp||1),
    boss:e.type==='boss',conditions:enemyPreviewConditions(e),canAttack};
  })
 };
}
