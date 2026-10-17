/* P3B.1 — interação com relicários na preview Phaser.
 * Mesmo catálogo e regras de slots/efeitos da versão HTML.
 * Escolha/transação não consome RNG nem turno; ofertas são sorteadas
 * uma vez após a ação de coleta e guardadas no save experimental.
 */
import '../../relic-offers.js';
export const PREVIEW_RELICS=Object.freeze([
  {id:'fang',name:'Presa de Golzdov',desc:'+2 de ataque. +3 dano contra enraizados; abate básico recupera 1 foco (1/turno).',icon:'♜',effect:'attack'},
  {id:'heart',name:'Osso Pulsante',desc:'+10 de vida máxima e cura imediata.',icon:'♥',effect:'health'},
  {id:'chalice',name:'Taça de Medula',desc:'+7 de foco máximo. Recupere 7 de foco.',icon:'✧',effect:'mana'},
  {id:'moss',name:'Musgo de Ironwood',desc:'Regenera 2 vida a cada 6 turnos e 2 vida ao entrar em uma nova sala.',icon:'❋',effect:'regen'},
  {id:'mirror',name:'Espelho Afogado',desc:'+12% de esquiva. Esquiva acrescenta +3 de dano ao próximo golpe (não acumula).',icon:'◉',effect:'dodge'},
  {id:'crown',name:'Selo Rachado',desc:'+2 de defesa. Após receber dano, reduz em 2 o próximo dano sofrido.',icon:'♛',effect:'defense'},
  {id:'rune',name:'Marca de Raiz 根',desc:'Recupera 1 foco a cada 3 turnos e +1 ao enraizar com magia.',icon:'根',effect:'focus'},
  {id:'ash',name:'Cinza do Crepúsculo',desc:'+15% chance de crítico. Golpe crítico queima o alvo (2 dano por 2 turnos).',icon:'✹',effect:'crit'},
  {id:'chain',name:'Grilhões Partidos',desc:'A primeira pancada de cada andar causa metade do dano.',icon:'⛓',effect:'chain'},
  {id:'eye',name:'Olho de Vandar',desc:'+2 de alcance de visão.',icon:'◈',effect:'vision'},
  {id:'omen',name:'Nome Roubado',desc:'AMALDIÇOADA: +4 ataque, mas −7 de vida máxima enquanto equipada.',icon:'☷',effect:'curse'}
]);
const host=typeof window!=='undefined'?window:globalThis;
const rules=()=>host.GolzdovRelicOffers;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const relicById=id=>PREVIEW_RELICS.find(r=>r.id===id)||null;
export function ensurePreviewRelicOffer(run){
 const pending=run.pendingRelicOffer;
 if(!pending||Array.isArray(pending.offers))return false;
 const offers=rules().offered(PREVIEW_RELICS,run.hero,()=>host.GolzdovCoreRng.next(run));
 pending.offers=offers.map(r=>r.id);
 pending.selection=null;pending.removing=[];
 if(!pending.offers.length){
  run.pendingRelicOffer=null;
  run.hero.coins+=12;
 }
 return true;
}
function changeStats(hero,relic,direction){
 const sign=direction;
 switch(relic.effect){
  case 'attack':hero.atk+=2*sign;break;
  case 'health':
   hero.maxhp=Math.max(1,hero.maxhp+10*sign);
   hero.hp=clamp(hero.hp+(sign>0?10:0),sign>0?0:1,hero.maxhp);break;
  case 'mana':
   hero.maxmana=Math.max(0,hero.maxmana+7*sign);
   hero.mana=clamp(hero.mana+(sign>0?7:0),0,hero.maxmana);break;
  case 'dodge':
   hero.dodge+=12*sign;
   if(sign<0)hero.relicState.echo=0;
   break;
  case 'defense':
   hero.def+=2*sign;
   if(sign<0)hero.relicState.ward=0;
   break;
  case 'crit':hero.crit+=15*sign;break;
  case 'curse':
   hero.atk+=4*sign;
   hero.maxhp=Math.max(1,hero.maxhp-7*sign);
   hero.hp=clamp(hero.hp,1,hero.maxhp);
   break;
 }
}
export function resolvePreviewRelicChoice(run,action){
 const pending=run?.pendingRelicOffer;
 if(!pending)return {status:'no-relic-offer'};
 const p=run.hero;
 if(action.type==='RELIC_SKIP'){
  run.pendingRelicOffer=null;
  return {status:'relic-skipped'};
 }
 if(action.type==='RELIC_BACK'){
  pending.selection=null;pending.removing=[];
  return {status:'relic-back'};
 }
 if(action.type==='RELIC_SELECT'){
  if(!pending.offers?.includes(action.id)||p.relics.includes(action.id))
   return {status:'invalid-relic'};
  pending.selection=action.id;pending.removing=[];
 }else if(action.type==='RELIC_TOGGLE'){
  if(!pending.selection||!p.relics.includes(action.id))return {status:'invalid-relic'};
  pending.removing=Array.isArray(pending.removing)?pending.removing:[];
  pending.removing=pending.removing.includes(action.id)
   ?pending.removing.filter(x=>x!==action.id):[...pending.removing,action.id];
 }else if(action.type!=='RELIC_CONFIRM')return {status:'invalid-relic'};
 const id=pending.selection,relic=relicById(id),removing=pending.removing||[];
 if(!relic||!pending.offers.includes(id)||removing.some(old=>!p.relics.includes(old)))
  return {status:'invalid-relic'};
 if(!rules().canFit(p,id,removing))return {status:'relic-swap-required'};
 const oldSynergies=new Set(host.GolzdovRelicEffects?.synergiesFor(p).map(x=>x.id)||[]);
 for(const oldId of removing){
  const old=relicById(oldId);
  if(!old)continue;
  p.relics=p.relics.filter(x=>x!==oldId);
  changeStats(p,old,-1);
 }
 p.relics.push(id);
 changeStats(p,relic,1);
 run.pendingRelicOffer=null;
 const newSynergies=host.GolzdovRelicEffects?.synergiesFor(p).filter(x=>!oldSynergies.has(x.id))||[];
 return {status:'relic-equipped',relic,removed:removing,synergies:newSynergies};
}
export function availablePreviewRelics(run){
 const offer=run?.pendingRelicOffer;
 if(!offer)return [];
 return (offer.offers||[]).map(id=>relicById(id)).filter(Boolean);
}
