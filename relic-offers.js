/* Catacumbas de Golzdov — catálogo de relíquias e regras da bolsa, versão 1.2C.
 * Funções puras; RNG injetado para preservar seeds da expedição.
 * Slots ocupados por saves antigos são mantidos: nenhum item é descartado automaticamente.
 */
(function(root){
'use strict';
const MAX_SLOTS=4;
const RARITIES=Object.freeze({
  common:{name:'COMUM',weight:9,color:'#c5bcb0'},
  rare:{name:'RARA',weight:6,color:'#8fbdad'},
  epic:{name:'ÉPICA',weight:3,color:'#cba2e3'},
  cursed:{name:'AMALDIÇOADA',weight:2,color:'#e18b8c'},
  ancestral:{name:'ANCESTRAL',weight:1,color:'#e6c27e'}
});
const DATA=Object.freeze({
  heart:{rarity:'common',slots:1},
  chalice:{rarity:'common',slots:1},
  moss:{rarity:'common',slots:1},
  crown:{rarity:'common',slots:1},
  fang:{rarity:'rare',slots:1},
  rune:{rarity:'rare',slots:1},
  mirror:{rarity:'rare',slots:1},
  eye:{rarity:'epic',slots:1},
  ash:{rarity:'epic',slots:1},
  chain:{rarity:'ancestral',slots:2},
  omen:{rarity:'cursed',slots:1}
});
function info(id){const item=DATA[id];return item?{...item,name:RARITIES[item.rarity].name,color:RARITIES[item.rarity].color}:null;}
function occupied(hero){return [...new Set(hero?.relics||[])].reduce((total,id)=>total+(DATA[id]?.slots||1),0);}
function capacity(hero){return Math.max(MAX_SLOTS,occupied(hero));} // respeita o excesso de saves antigos
function available(catalog,hero){const owned=new Set(hero?.relics||[]);return catalog.filter(r=>!owned.has(r.id)&&DATA[r.id]);}
function offered(catalog,hero,random){
  const pool=available(catalog,hero);
  const picks=[];
  while(pool.length && picks.length<2){
    const total=pool.reduce((s,r)=>s+RARITIES[DATA[r.id].rarity].weight,0);
    let roll=random()*total;
    let index=pool.findIndex(r=>(roll-=RARITIES[DATA[r.id].rarity].weight)<0);
    if(index<0)index=pool.length-1;
    picks.push(pool.splice(index,1)[0]);
  }
  return picks;
}
function canFit(hero,newId,removing=[]){
  const removed=new Set(removing);
  const current=[...new Set(hero?.relics||[])].filter(id=>!removed.has(id));
  const cost=DATA[newId]?.slots||1;
  return current.reduce((n,id)=>n+(DATA[id]?.slots||1),0)+cost<=capacity(hero);
}
root.GolzdovRelicOffers=Object.freeze({MAX_SLOTS,RARITIES,DATA,info,occupied,capacity,available,offered,canFit});
})(typeof window!=='undefined'?window:globalThis);
