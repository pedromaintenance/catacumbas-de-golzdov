/* Golzdov P1C.3B.3A — coleta determinística, sem DOM/Phaser/armazenamento.
 * A mutação lógica antecede os eventos; dano de armadilha é um evento de
 * domínio resolvido pelo sistema de combate no adaptador (ordem preservada).
 */
(function(root){
'use strict';
const WEAPONS=['Lâmina das Costelas','Arco de Osso','Martelo Fendido','Bastão da Sombra','Presa Polida'];
const ARMORS=['Placas Ancestrais','Colete de Ferro Negro','Cota de Vértebras','Manto de Osso'];
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
function resolve(run,item,{hasRelicOffers=false}={}){
  if(!run||!run.hero||!item)return [];
  const p=run.hero,random=root.GolzdovCoreRng;
  const events=[];
  function log(text,icon){events.push({type:'log',text,icon});}
  switch(item.kind){
    case 'coins':
      p.coins+=item.value;run.treasure+=item.value;
      log('Você encontra '+item.value+' lascas de âmbar ósseo.','◈');
      break;
    case 'potion':
      p.potions++;
      log('Um frasco de seiva curativa sobreviveu à ruína.','✚');
      break;
    case 'mana':
      p.mana=clamp(p.mana+6,0,p.maxmana);
      log('Um cristal restitui 6 pontos de foco.','✧');
      break;
    case 'heal':
      p.hp=clamp(p.hp+9,0,p.maxhp);
      log('Ossos quentes devolvem 9 pontos de vida.','♥');
      break;
    case 'trap':
      events.push({type:'damage',value:random.integer(run,3,7)+run.floor,message:'Uma inscrição explode sob seus pés!'});
      break;
    case 'relic':
      if(hasRelicOffers){
        run.pendingRelicOffer={source:'relicario',offers:null};
        log('Um relicário revela duas inscrições. Você escolherá uma delas.','✥');
      }else{
        p.coins+=12;
        log('Um relicário vazio guarda 12 lascas.','◈');
      }
      break;
    case 'weapon':{
      const up=random.integer(run,1,2);
      p.atk+=up;
      p.weapon=random.pick(run,WEAPONS);
      log('Arma: '+p.weapon+'. Ataque +'+up+'!','⚔');
      break;
    }
    case 'armor':
      p.def++;
      p.armor=random.pick(run,ARMORS);
      log(p.armor+': defesa +1!','◆');
      break;
  }
  events.push({type:'sound',frequency:item.kind==='trap'?115:590,duration:.11});
  return events;
}
root.GolzdovLoot=Object.freeze({resolve});
})(typeof window!=='undefined'?window:globalThis);
