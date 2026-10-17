/* P2B vertical slice: movimentação, ataque, espera, poção e turno inimigo.
 * Reutiliza o dispatcher/IA/RNG/combate da build principal.
 * Sem navegador, Phaser, timers, áudio ou storage; nunca avança no render.
 * Talentos, relíquias, mercador, evolução por escolha e finais completos: P3.
 */
import './world.js';
import '../../core/combat.js';
import '../../core/skills.js';
import '../../core/enemies.js';
import '../../core/turns.js';
import '../../core/actions.js';
import '../../core/defense.js';
import {createPreviewWorld,ENEMIES,WIDTH,HEIGHT} from './world.js';
const host=typeof window!=='undefined'?window:globalThis;
const idx=(x,y)=>y*WIDTH+x;
const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const cell=(run,x,y)=>x>0&&y>0&&x<WIDTH-1&&y<HEIGHT-1&&run.map[idx(x,y)]===1;
export function initialPreviewRun(seed=0x52c4a190,floor=1){
 const {run}=createPreviewWorld(seed,floor);
 run.previewVersion=1;
 run.previewLog=['Você entra nas Costelas do Silêncio.'];
 run.previewOutcome=null;
 return run;
}
export function previewVisible(run){
 const visible=host.GolzdovNavigation.visibleCells(run.map,WIDTH,HEIGHT,run.hero);
 for(const k of visible)run.seen[k]=true;
 return visible;
}
function note(run,message,events){
 if(!message)return;
 run.previewLog=(run.previewLog||[]).concat(message).slice(-7);
 events.push({type:'message',text:message});
}
function doAttack(run,enemy,melee,events){
 if(!enemy||enemy.hp<=0)return false;
 const hit=host.GolzdovActions.dispatch(run,{
  type:'ATTACK',enemyId:enemy.id,enemyName:ENEMIES[enemy.type]?.name||enemy.type,
  melee,lineOfSight:host.GolzdovNavigation.lineClear(run.map,WIDTH,HEIGHT,run.hero.x,run.hero.y,enemy.x,enemy.y)
 });
 for(const event of hit.events){
  if(event.type==='log')note(run,event.text,events);
  if(event.type==='hero-hit'){
   for(const impact of host.GolzdovCombat.damageEnemy(run,enemy,event.damage,event.label,ENEMIES,'basic')){
    if(impact.type==='log')note(run,impact.text,events);
    if(impact.type==='defeat-enemy'){
     run.kills++;
     run.hero.xp+=ENEMIES[enemy.type].xp||0;
     run.hero.coins+=ENEMIES[enemy.type].gold||0;
     note(run,ENEMIES[enemy.type].name+' derrotado.',events);
     if(enemy.type==='boss')run.bossDown=true;
    }
   }
  }
 }
 return hit.consumesTurn;
}
function damageHero(run,value,message,events){
 const damage=host.GolzdovDefense.reduce(run,value,{muralha:false});
 for(const e of host.GolzdovDefense.apply(run,damage,message)){
  if(e.type==='log')note(run,e.text,events);
 }
 for(const e of host.GolzdovDefense.afterHurt(run,{juramento:false})){
  if(e.type==='die')run.hero.hp=0;
 }
}
function enemyStep(run,e,events){
 return host.GolzdovEnemies.step(run,e,ENEMIES,{
  walkable:(x,y)=>cell(run,x,y),
  lineClear:(x0,y0,x1,y1)=>host.GolzdovNavigation.lineClear(run.map,WIDTH,HEIGHT,x0,y0,x1,y1),
  enemyAt:(x,y)=>run.enemies.find(q=>q.hp>0&&q.x===x&&q.y===y),
  onMelee:(foe)=>{
   const roll=host.GolzdovCombat.enemyMelee(run,foe);
   if(roll.dodge)note(run,'Você esquiva de '+ENEMIES[foe.type].name+'.',events);
   else damageHero(run,roll.damage,ENEMIES[foe.type].name+' atinge você.',events);
  },
  onReceiveDamage:(damage,message)=>damageHero(run,damage,message,events)
 });
}
function stepWorld(run,events){
 host.GolzdovTurns.advance(run,{
  onVictory:()=>{run.over=true;run.previewOutcome='victory';note(run,'O Escrivão Sem Nome foi derrotado!',events);},
  onStart:()=>{},
  onEnemy:(enemy)=>enemyStep(run,enemy,events),
  onReveal:()=>previewVisible(run),
  onDeath:()=>{run.over=true;run.previewOutcome='death';note(run,'A Carcaça recebe o seu nome. Fim da expedição.',events);},
  onLevelUp:()=>{
   // P2B provisório: avanço simples para evitar travar o turno sem modal P3.
   run.hero.level++;
   run.hero.xp-=run.hero.nextXP;
   run.hero.nextXP+=Math.ceil(run.hero.nextXP*.4);
   run.hero.maxhp+=4;run.hero.hp=Math.min(run.hero.maxhp,run.hero.hp+4);
   note(run,'Nível '+run.hero.level+' alcançado (evolução simplificada P2B).',events);
  },
  onReady:()=>{}
 });
}
function collectBasic(run,events){
 const p=run.hero,item=run.items.find(i=>i.x===p.x&&i.y===p.y);
 if(!item)return;
 if(!['coins','potion','heal','mana'].includes(item.kind)){
  note(run,'Este objeto será interativo em uma próxima etapa.',events);return;
 }
 run.items=run.items.filter(x=>x!==item);
 if(item.kind==='coins'){const gold=item.value||0;p.coins+=gold;run.treasure+=gold;note(run,'+'+gold+' de âmbar.',events);}
 if(item.kind==='potion'){p.potions++;note(run,'Poção recolhida.',events);}
 if(item.kind==='heal'){p.hp=Math.min(p.maxhp,p.hp+10);note(run,'Você recuperou 10 PV.',events);}
 if(item.kind==='mana'){p.mana=Math.min(p.maxmana,p.mana+5);note(run,'Você recuperou 5 de foco.',events);}
}
export function previewAction(run,action){
 const events=[];
 if(!run||run.over)return {status:'inactive',consumesTurn:false,events};
 const p=run.hero;
 let result;
 if(action?.type==='ATTACK'){
  const enemy=run.enemies.find(e=>e.id===action.enemyId&&e.hp>0);
  const consumesTurn=doAttack(run,enemy,false,events);
  if(consumesTurn)stepWorld(run,events);
  return {status:consumesTurn?'applied':'out-of-range',consumesTurn,events};
 }
 result=host.GolzdovActions.dispatch(run,action?.type==='MOVE'?{...action,width:WIDTH,height:HEIGHT}:action);
 let consumed=result.consumesTurn;
 for(const e of result.events){
  if(e.type==='log')note(run,e.text,events);
  else if(e.type==='attack'){
   const enemy=run.enemies.find(x=>x.id===e.enemyId&&x.hp>0);
   consumed=doAttack(run,enemy,true,events);
  }else if(e.type==='collect-at-player')collectBasic(run,events);
  else if(e.type==='turn'){if(consumed)stepWorld(run,events);}
 }
 // MOVE com inimigo só emite 'attack' (sem 'turn'): avançar uma única vez.
 if(result.status==='enemy'&&consumed)stepWorld(run,events);
 if(consumed&&!run.over&&run.stairs&&p.x===run.stairs.x&&p.y===run.stairs.y){
  if(run.floor<5){
   run.floor++;
   host.GolzdovDungeon.generateFloor(run,ENEMIES,WIDTH,HEIGHT);
   previewVisible(run);
   note(run,'Você alcançou o estrato '+run.floor+'.',events);
  }else note(run,'Derrote o Escrivão Sem Nome para concluir.',events);
 }
 return {status:result.status,consumesTurn:consumed,events};
}
