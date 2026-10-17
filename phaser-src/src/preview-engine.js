/* P2B vertical slice: movimentação, ataque, espera, poção e turno inimigo.
 * Reutiliza o dispatcher/IA/RNG/combate da build principal.
 * Sem navegador, Phaser, timers, áudio ou storage; nunca avança no render.
 * P3A.2 oferece progressão por escolha; relíquias, mercador e finais completos: P3B.
 */
import './world.js';
import '../../core/combat.js';
import '../../core/skills.js';
import '../../core/enemies.js';
import '../../core/turns.js';
import '../../core/actions.js';
import '../../core/defense.js';
import {createPreviewWorld,ENEMIES,WIDTH,HEIGHT} from './world.js';
import {PREVIEW_CLASSES} from './preview-classes.js';
import {beginPreviewLevelUp,choosePreviewTalent} from './preview-talents.js';
const host=typeof window!=='undefined'?window:globalThis;
const idx=(x,y)=>y*WIDTH+x;
const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const cell=(run,x,y)=>x>0&&y>0&&x<WIDTH-1&&y<HEIGHT-1&&run.map[idx(x,y)]===1;
export function initialPreviewRun(seed=0x52c4a190,floor=1,classId='vigia'){
 const {run}=createPreviewWorld(seed,floor,classId);
 run.previewVersion=1;
 run.previewLog=['O '+PREVIEW_CLASSES[classId].name+' entra nas Costelas do Silêncio.'];
 run.previewOutcome=null;
 run.pendingTalentChoices=null;
 return run;
}
// Saves P2B anteriores podiam conter PV=0 sem flag de encerramento.
export function normalizePreviewOutcome(run){
 if(!run||!run.hero)return false;
 if(run.hero.hp<=0){
  run.hero.hp=0;
  run.over=true;
  if(!run.previewOutcome)run.previewOutcome='death';
  return true;
 }
 return false;
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
function applyHeroHit(run,enemy,damage,label,events,source='basic'){
 if(!enemy||enemy.hp<=0)return;
 for(const impact of host.GolzdovCombat.damageEnemy(run,enemy,damage,label,ENEMIES,source)){
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
function doAttack(run,enemy,melee,events){
 if(!enemy||enemy.hp<=0)return false;
 const hit=host.GolzdovActions.dispatch(run,{
  type:'ATTACK',enemyId:enemy.id,enemyName:ENEMIES[enemy.type]?.name||enemy.type,
  melee,lineOfSight:host.GolzdovNavigation.lineClear(run.map,WIDTH,HEIGHT,run.hero.x,run.hero.y,enemy.x,enemy.y),
  predator:run.hero.talents.includes('e_predador'),muralha:run.hero.talents.includes('v_muralha')
 });
 for(const event of hit.events){
  if(event.type==='log')note(run,event.text,events);
  if(event.type==='hero-hit')
   applyHeroHit(run,enemy,event.damage,event.label,events,event.source);
 }
 return hit.consumesTurn;
}
function doSkill(run,action,events){
 const def=PREVIEW_CLASSES[run.hero.classId];
 const which=action.which,skill=def?.skills?.[which];
 if(!Number.isInteger(which)||!skill)return {status:'invalid-skill',consumesTurn:false};
 const phase=skill.target?'targeted':'instant';
 if(phase==='targeted'&&(!Number.isInteger(action.x)||!Number.isInteger(action.y)||
  action.x<0||action.y<0||action.x>=WIDTH||action.y>=HEIGHT))
  return {status:'invalid-target',consumesTurn:false};
 const visible=previewVisible(run);
 const result=host.GolzdovActions.dispatch(run,{
  type:'SKILL',phase,which,skills:def.skills,x:action.x,y:action.y,
  isVisible:(x,y)=>visible.has(idx(x,y)),
  lineClear:(x0,y0,x1,y1)=>host.GolzdovNavigation.lineClear(run.map,WIDTH,HEIGHT,x0,y0,x1,y1),
  enemyAt:(x,y)=>run.enemies.find(e=>e.hp>0&&e.x===x&&e.y===y),
  hit:(enemy,damage,label,source)=>applyHeroHit(run,enemy,damage,label,events,source),
  onRoot:()=>{} // gatilhos de relíquias e sinergias completos: P3B.
 });
 for(const e of result.events){
  if(e.type==='log')note(run,e.text,events);
  if(e.type==='turn')stepWorld(run,events);
 }
 if(result.status==='no-focus')note(run,'Foco insuficiente para '+skill.name+'.',events);
 if(result.status==='unreachable')note(run,'O alvo está fora do alcance ou atrás de uma parede.',events);
 if(result.status==='empty')note(run,'Selecione um inimigo válido.',events);
 return {status:result.status,consumesTurn:result.consumesTurn};
}
function damageHero(run,value,message,events){
 const damage=host.GolzdovDefense.reduce(run,value,{muralha:run.hero.talents.includes('v_muralha')});
 for(const e of host.GolzdovDefense.apply(run,damage,message)){
  if(e.type==='log')note(run,e.text,events);
 }
 for(const e of host.GolzdovDefense.afterHurt(run,{juramento:run.hero.talents.includes('v_juramento')})){
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
   if(beginPreviewLevelUp(run)){
    note(run,'Nível '+run.hero.level+' alcançado. Escolha um talento para prosseguir.',events);
    events.push({type:'talent-choice',options:[...run.pendingTalentChoices]});
   }
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
 if(!run||normalizePreviewOutcome(run)||run.over)return {status:'inactive',consumesTurn:false,events};
 if(action?.type==='CHOOSE_TALENT'){
  const picked=choosePreviewTalent(run,action.talentId);
  if(!picked)return {status:'invalid-talent',consumesTurn:false,events};
  note(run,'Nível '+run.hero.level+': '+picked.title+'.',events);
  return {status:'talent-chosen',consumesTurn:false,events};
 }
 if(run.pendingTalentChoices?.length)return {status:'choice-required',consumesTurn:false,events};
 const p=run.hero;
 let result;
 if(action?.type==='SKILL'){
  const out=doSkill(run,action,events);
  return {...out,events};
 }
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
   run.hero.lastOathUsed=false;run.hero.oathWeakened=false;
   host.GolzdovDungeon.generateFloor(run,ENEMIES,WIDTH,HEIGHT);
   previewVisible(run);
   note(run,'Você alcançou o estrato '+run.floor+'.',events);
  }else note(run,'Derrote o Escrivão Sem Nome para concluir.',events);
 }
 return {status:result.status,consumesTurn:consumed,events};
}
