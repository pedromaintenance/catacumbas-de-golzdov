/* P3B.2 — mercador da escada.
 * Catálogo copiado do shopModal do HTML. Ações puras, sem DOM/storage/RNG.
 * Mercado e oferta permanecem nas propriedades já existentes do save preview.
 */
export const PREVIEW_SHOP_GOODS=Object.freeze([
 {id:'potion',icon:'✚',name:'POÇÃO DE SEIVA',cost:20,desc:'Adiciona uma poção curativa.'},
 {id:'heal',icon:'♥',name:'OSSOS RESTAURADOS',cost:16,desc:'Recupera 18 pontos de vida.'},
 {id:'focus',icon:'✧',name:'CRISTAL DE FOCO',cost:16,desc:'Recupera todo o foco.'},
 {id:'attack',icon:'⚔',name:'AFIAR A ARMA',cost:38,desc:'Aumenta seu ataque em 1.'},
 {id:'defense',icon:'◆',name:'GRAVAR ARMADURA',cost:38,desc:'Aumenta sua defesa em 1.'},
 {id:'relic',icon:'✥',name:'RELICÁRIO DE CINZAS',cost:54,desc:'Escolha entre duas relíquias por 54 âmbar.'}
]);
export const shopGood=id=>PREVIEW_SHOP_GOODS.find(g=>g.id===id)||null;
export function buyPreviewShopGood(run,id){
 const good=shopGood(id);
 if(!run?.pendingShop||!good||good.id==='relic')return {status:'invalid-shop-item'};
 const p=run.hero;
 if(p.coins<good.cost)return {status:'insufficient-coins',good};
 switch(id){
  case 'potion':p.potions++;break;
  case 'heal':p.hp=Math.min(p.maxhp,p.hp+18);break;
  case 'focus':p.mana=p.maxmana;break;
  case 'attack':p.atk++;break;
  case 'defense':p.def++;break;
 }
 p.coins-=good.cost;
 return {status:'shop-bought',good};
}
