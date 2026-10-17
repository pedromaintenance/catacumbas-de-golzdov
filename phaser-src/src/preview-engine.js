/* P2B vertical slice: movimentação, ataque, espera, poção e turno inimigo.
 * Reutiliza o dispatcher/IA/RNG/combate da build principal.
 * Sem navegador, Phaser, timers, áudio ou storage; nunca avança no render.
 * P3B.3 traz o confronto final Luz/Raiz e encerramentos canônicos.
 */
import './world.js';
import '../../core/combat.js';
import '../../core/skills.js';
import '../../core/enemies.js';
import '../../core/turns.js';
import '../../core/actions.js';
import '../../core/defense.js';
import '../../core/loot.js';
import '../../core/rewards.js';
import '../../relic-effects.js';
import {createPreviewWorld,ENEMIES,WIDTH,HEIGHT} from './world.js';
import {PREVIEW_CLASSES} from './preview-classes.js';
import {beginPreviewLevelUp,choosePreviewTalent} from './preview-talents.js';
import {PREVIEW_RELICS,ensurePreviewRelicOffer,resolvePreviewRelicChoice} from './preview-relics.js';
import {buyPreviewShopGood,shopGood} from './preview-shop.js';
import {beginPreviewFinalDecision,choosePreviewEnding,normalizePreviewEnding} from './preview-endings.js';
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
 run.pendingShrineChoice=false;
 run.pendingStairs=false;
 run.pendingShop=false;
 run.pendingFinalChoice=false;
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
function relicEvent(run,event,details,events){
 const p=run.hero;
 const ctx={run,hero:p,
  heal:n=>{p.hp=Math.min(p.maxhp,p.hp+n);},
  focus:n=>{p.mana=Math.min(p.maxmana,p.mana+n);},
  feedback:(message)=>note(run,message,events),
  damageEnemy:(enemy,damage,label,source)=>applyDamage(run,enemy,damage,label,events,source),
  ...details
 };
 host.GolzdovRelicEffects?.dispatch(event,ctx);
 return ctx;
}
function applyDamage(run,enemy,damage,label,events,source='effect',critical=false){
 if(!enemy||enemy.hp<=0)return;
 const beforeHp=enemy.hp;
 const foe={id:enemy.id,x:enemy.x,y:enemy.y,name:ENEMIES[enemy.type]?.name||enemy.type};
 const impacts=host.GolzdovCombat.damageEnemy(run,enemy,damage,label,ENEMIES,source);
 const dealt=Math.max(0,beforeHp-enemy.hp);
 if(dealt>0)events.push({type:'combat-feedback',kind:'enemy-hit',
  ...foe,amount:dealt,critical:!!critical});
 if(enemy.hp<=0)events.push({type:'combat-feedback',kind:'enemy-defeat',...foe});
 for(const impact of impacts){
  if(impact.type==='log')note(run,impact.text,events);
  if(impact.type==='defeat-enemy'){
   for(const reward of host.GolzdovRewards.defeat(run,enemy,ENEMIES,source)){
    if(reward.type==='log')note(run,reward.text,events);
    else if(reward.type==='relic-event')
     relicEvent(run,reward.event,{enemy:reward.enemy,kind:reward.kind},events);
    else if(reward.type==='boss-down')run.bossDown=true;
   }
  }
 }
}
function applyHeroHit(run,enemy,damage,label,events,source='basic',critical=false){
 if(!enemy||enemy.hp<=0)return;
 const hit=relicEvent(run,'onAttack',{
  enemy,damage,kind:source,critical,wasSmoldering:(enemy.smolder||0)>0
 },events);
 applyDamage(run,enemy,Math.max(1,Math.floor(hit.damage)),label,events,source,critical);
}
function doAttack(run,enemy,melee,events){
 if(!enemy||enemy.hp<=0)return false;
 const hit=host.GolzdovActions.dispatch(run,{
  type:'ATTACK',enemyId:enemy.id,enemyName:ENEMIES[enemy.type]?.name||enemy.type,
  melee,lineOfSight:host.GolzdovNavigation.lineClear(run.map,WIDTH,HEIGHT,run.hero.x,run.hero.y,enemy.x,enemy.y),
  predator:run.hero.talents.includes('e_predador'),muralha:run.hero.talents.includes('v_muralha')
 });
 let connected=false;
 for(const event of hit.events){
  if(event.type==='log')note(run,event.text,events);
  if(event.type==='hero-hit'){
   connected=true;
   applyHeroHit(run,enemy,event.damage,event.label,events,event.source,event.critical);
  }
 }
 if(hit.consumesTurn&&!connected)events.push({type:'combat-feedback',kind:'miss',
  id:enemy.id,x:enemy.x,y:enemy.y,name:ENEMIES[enemy.type]?.name||enemy.type});
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
  onRoot:(event,details)=>relicEvent(run,event,details,events)
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
 const reduced=host.GolzdovDefense.reduce(run,value,{muralha:run.hero.talents.includes('v_muralha')});
 const damage=relicEvent(run,'onDefend',{damage:reduced},events).damage;
 const hpBefore=run.hero.hp;
 for(const e of host.GolzdovDefense.apply(run,damage,message)){
  if(e.type==='log')note(run,e.text,events);
 }
 const taken=Math.max(0,hpBefore-run.hero.hp);
 if(taken>0)events.push({type:'combat-feedback',kind:'hero-hit',
  x:run.hero.x,y:run.hero.y,amount:taken});
 relicEvent(run,'onHurt',{damage},events);
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
   if(roll.dodge){
    note(run,'Você esquiva de '+ENEMIES[foe.type].name+'.',events);
    events.push({type:'combat-feedback',kind:'dodge',x:run.hero.x,y:run.hero.y});
    relicEvent(run,'onDodge',{enemy:foe},events);
   }else damageHero(run,roll.damage,ENEMIES[foe.type].name+' atinge você.',events);
  },
  onReceiveDamage:(damage,message)=>damageHero(run,damage,message,events)
 });
}
function stepWorld(run,events){
 host.GolzdovTurns.advance(run,{
  onVictory:()=>{
   if(beginPreviewFinalDecision(run)){
    note(run,'O Escrivão Sem Nome foi derrotado. A palavra original desperta.',events);
    events.push({type:'final-decision'});
   }
  },
  onStart:()=>relicEvent(run,'onTurnStart',{},events),
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
function collectAtPlayer(run,events){
 const item=run.items.find(i=>i.x===run.hero.x&&i.y===run.hero.y);
 if(!item)return false;
 const result=host.GolzdovActions.dispatch(run,{
  type:'COLLECT',hasRelicOffers:host.GolzdovRelicOffers.available(PREVIEW_RELICS,run.hero).length>0
 });
 for(const e of result.events){
  if(e.type==='log')note(run,e.text,events);
  else if(e.type==='damage')damageHero(run,e.value,e.message,events);
 }
 return result.status==='applied';
}
function prepareInteractions(run,events){
 if(run.pendingRelicOffer&&!run.pendingRelicOffer.offers){
  const had=ensurePreviewRelicOffer(run);
  if(had&&!run.pendingRelicOffer)
   note(run,'Nenhuma inscrição nova. Você recebe 12 lascas de âmbar.',events);
 }
}
function at(run,point){
 return !!point&&run.hero.x===point.x&&run.hero.y===point.y;
}
function enterSpecialCell(run,events){
 if(!run.over&&at(run,run.shrine)&&!run.altarUsed){
  run.altarUsed=true;run.pendingShrineChoice=true;
  note(run,'O altar yokai desperta. Escolha uma bênção.',events);
 }
 if(!run.over&&at(run,run.stairs)){
  run.pendingStairs=true;
  note(run,'Uma escadaria de ossos desce ao estrato seguinte.',events);
 }
 prepareInteractions(run,events);
}
export function previewAction(run,action){
 const events=[];
 if(!run)return {status:'inactive',consumesTurn:false,events};
 normalizePreviewEnding(run);
 const type=action?.type;
 if(type==='CHOOSE_ENDING'){
  if(!choosePreviewEnding(run,action.ending))
   return {status:'invalid-ending',consumesTurn:false,events};
  note(run,'Você escolheu o caminho da '+(action.ending==='luz'?'Luz 光.':'Raiz 根.'),events);
  return {status:'ending-chosen',consumesTurn:false,events};
 }
 if(normalizePreviewOutcome(run)||run.over)return {status:'inactive',consumesTurn:false,events};
 if(type==='CHOOSE_TALENT'){
  const picked=choosePreviewTalent(run,action.talentId);
  if(!picked)return {status:'invalid-talent',consumesTurn:false,events};
  note(run,'Nível '+run.hero.level+': '+picked.title+'.',events);
  prepareInteractions(run,events);
  return {status:'talent-chosen',consumesTurn:false,events};
 }
 if(run.pendingTalentChoices?.length)return {status:'choice-required',consumesTurn:false,events};
 if(type?.startsWith('RELIC_')){
  const out=resolvePreviewRelicChoice(run,action);
  if(out.status==='relic-equipped'){
   note(run,out.relic.name+' equipada.'+(out.cost?' ◈ '+out.cost+' pagos.':'')+
    (out.removed.length?' Substituídas: '+out.removed.join(', ')+'.':''),events);
   for(const synergy of out.synergies)note(run,'Sinergia: '+synergy.name+'.',events);
  }else if(out.status==='relic-skipped')note(run,'Você abandona o relicário.',events);
  return {status:out.status,consumesTurn:false,events};
 }
 if(run.pendingRelicOffer)return {status:'relic-choice-required',consumesTurn:false,events};
 if(type==='CHOOSE_SHRINE'){
  if(!run.pendingShrineChoice)return {status:'no-shrine',consumesTurn:false,events};
  const p=run.hero;
  if(action.id==='heal')p.hp=Math.min(p.maxhp,p.hp+20);
  else if(action.id==='focus')p.mana=p.maxmana;
  else if(action.id==='relic'){
   if(host.GolzdovRelicOffers.available(PREVIEW_RELICS,p).length)
    run.pendingRelicOffer={source:'altar',offers:null};
   else p.coins+=25;
  }else return {status:'invalid-shrine',consumesTurn:false,events};
  run.pendingShrineChoice=false;
  note(run,action.id==='relic'?'O altar oferece inscrições antigas.':
   action.id==='heal'?'A Raiz restaura até 20 PV.':'A Luz devolve todo o foco.',events);
  prepareInteractions(run,events);
  return {status:'shrine-used',consumesTurn:false,events};
 }
 if(run.pendingShrineChoice)return {status:'shrine-choice-required',consumesTurn:false,events};
 // O comerciante é acessível apenas pela escada, antes de descer.
 if(type==='SHOP_OPEN'){
  if(!run.pendingStairs||!at(run,run.stairs)||run.floor===5)
   return {status:'no-shop',consumesTurn:false,events};
  run.pendingStairs=false;run.pendingShop=true;
  note(run,'Um mercador de ossos revela suas mercadorias.',events);
  return {status:'shop-opened',consumesTurn:false,events};
 }
 if(type==='SHOP_CLOSE'){
  if(!run.pendingShop)return {status:'no-shop',consumesTurn:false,events};
  run.pendingShop=false;run.pendingStairs=true;
  note(run,'Você retorna à escadaria.',events);
  return {status:'shop-closed',consumesTurn:false,events};
 }
 if(type==='SHOP_BUY'){
  const out=buyPreviewShopGood(run,action.id);
  if(out.status==='shop-bought')note(run,'Compra: '+out.good.name+'. ◈ '+out.good.cost+' pagos.',events);
  return {status:out.status,consumesTurn:false,events};
 }
 if(type==='SHOP_RELIC'){
  if(!run.pendingShop)return {status:'no-shop',consumesTurn:false,events};
  const price=shopGood('relic').cost;
  if(run.hero.coins<price)return {status:'insufficient-coins',consumesTurn:false,events};
  if(Array.isArray(run.shopOffers)&&!run.shopOffers.some(id=>!run.hero.relics.includes(id)))
   return {status:'shop-sold-out',consumesTurn:false,events};
  run.pendingRelicOffer={source:'mercador',cost:price,offers:null};
  prepareInteractions(run,events);
  if(!run.pendingRelicOffer)return {status:'shop-sold-out',consumesTurn:false,events};
  note(run,'O mercador oferece duas inscrições.',events);
  return {status:'shop-relic-opened',consumesTurn:false,events};
 }
 if(run.pendingShop)return {status:'shop-choice-required',consumesTurn:false,events};
 if(type==='STAIRS_CANCEL'){
  run.pendingStairs=false;
  note(run,'Você permanece no estrato atual.',events);
  return {status:'stairs-cancelled',consumesTurn:false,events};
 }
 if(type==='STAIRS_DESCEND'){
  if(!run.pendingStairs||!at(run,run.stairs))return {status:'no-stairs',consumesTurn:false,events};
  if(run.floor>=5){
   note(run,'O selo final exige derrotar o Escrivão Sem Nome.',events);
   return {status:'sealed',consumesTurn:false,events};
  }
  run.floor++;run.pendingStairs=false;run.pendingShrineChoice=false;
  host.GolzdovDungeon.generateFloor(run,ENEMIES,WIDTH,HEIGHT);
  run.hero.hp=Math.min(run.hero.maxhp,run.hero.hp+5);
  run.hero.mana=Math.min(run.hero.maxmana,run.hero.mana+3);
  previewVisible(run);
  note(run,'Você alcançou o estrato '+run.floor+'.',events);
  return {status:'descended',consumesTurn:false,events};
 }
 if(run.pendingStairs)return {status:'stairs-choice-required',consumesTurn:false,events};
 if(type==='INTERACT'){
  if(collectAtPlayer(run,events)){prepareInteractions(run,events);return {status:'collected',consumesTurn:false,events};}
  if(at(run,run.shrine)&&!run.altarUsed){
   run.altarUsed=true;run.pendingShrineChoice=true;
   note(run,'O altar yokai desperta.',events);
   return {status:'shrine-opened',consumesTurn:false,events};
  }
  if(at(run,run.stairs)){run.pendingStairs=true;
   note(run,'Escolha explorar ou descer.',events);
   return {status:'stairs-opened',consumesTurn:false,events};
  }
  return {status:'nothing-to-interact',consumesTurn:false,events};
 }
 const p=run.hero;
 let result;
 if(type==='SKILL'){
  const out=doSkill(run,action,events);
  return {...out,events};
 }
 if(type==='ATTACK'){
  const enemy=run.enemies.find(e=>e.id===action.enemyId&&e.hp>0);
  const consumesTurn=doAttack(run,enemy,false,events);
  if(consumesTurn)stepWorld(run,events);
  return {status:consumesTurn?'applied':'out-of-range',consumesTurn,events};
 }
 result=host.GolzdovActions.dispatch(run,type==='MOVE'?{...action,width:WIDTH,height:HEIGHT}:action);
 let consumed=result.consumesTurn;
 for(const e of result.events){
  if(e.type==='log')note(run,e.text,events);
  else if(e.type==='enter-room')relicEvent(run,'onEnterRoom',{roomIndex:e.roomIndex},events);
  else if(e.type==='attack'){
   const enemy=run.enemies.find(x=>x.id===e.enemyId&&x.hp>0);
   consumed=doAttack(run,enemy,true,events);
  }else if(e.type==='collect-at-player')collectAtPlayer(run,events);
  else if(e.type==='turn'){if(consumed&&!run.over)stepWorld(run,events);}
 }
 if(result.status==='enemy'&&consumed)stepWorld(run,events);
 if(result.status==='applied'&&type==='MOVE'&&consumed)enterSpecialCell(run,events);
 return {status:result.status,consumesTurn:consumed,events};
}
