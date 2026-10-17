/* Adaptador de cena P2A — reutiliza os módulos originais de simulação.
 * Este módulo não grava no armazenamento e não executa turnos sozinho.
 * Catálogo de inimigos espelhado e verificado por tests/phaser-p2a.test.cjs.
 */
import '../../core/rng.js';
import '../../core/dungeon.js';
import '../../core/navigation.js';
import {PREVIEW_CLASSES} from './preview-classes.js';

export const WIDTH=35;
export const HEIGHT=35;
export const ENEMIES=Object.freeze({
  rat:{name:'Rato de Ossos',hp:8,atk:4,def:0,xp:6,gold:2},
  guard:{name:'Sentinela Óssea',hp:15,atk:6,def:2,xp:11,gold:5},
  slime:{name:'Lodo de Medula',hp:18,atk:5,def:1,xp:10,gold:4},
  archer:{name:'Arqueiro da Corte',hp:13,atk:6,def:1,xp:13,gold:6,range:4},
  kappa:{name:'Kappa-Escriba',hp:17,atk:7,def:1,xp:15,gold:6},
  specter:{name:'Eco Sem Nome',hp:20,atk:8,def:1,xp:17,gold:8},
  knight:{name:'Cavaleiro Vazio',hp:26,atk:9,def:3,xp:22,gold:11},
  boss:{name:'Escrivão Sem Nome',hp:106,atk:13,def:3,xp:100,gold:90,range:3}
});
const host=typeof window!=='undefined'?window:globalThis;
const FIXED_SEED=0x52c4a190;

export function createPreviewWorld(seed=FIXED_SEED,floor=1,classId='vigia'){
  if(!Number.isInteger(floor)||floor<1||floor>5)throw Error('Estrato fora de 1–5');
  const fixedSeed=(seed>>>0)||host.GolzdovCoreRng.NONZERO;
  const def=PREVIEW_CLASSES[classId];
  if(!def)throw Error('Classe desconhecida: '+classId);
  const hero={classId,talents:[],upgrades:[],riposte:0,
    lastOathUsed:false,oathWeakened:false,x:0,y:0,hp:def.hp,maxhp:def.hp,
    mana:def.mana,maxmana:def.mana,atk:def.atk,def:def.def,range:def.range,
    dodge:def.dodge,crit:10,
    level:1,xp:0,nextXP:22,coins:0,potions:2,
    weapon:def.weapon,armor:def.armor,
    relics:[],relicState:{echo:0,ward:0,fangTurn:-1},buff:0};
  const run={schemaVersion:2,seed:fixedSeed,rngState:fixedSeed,floor,turn:0,over:false,
    map:[],seen:[],rooms:[],enemies:[],items:[],stairs:null,shrine:null,
    altarUsed:false,enemyId:0,logs:[],kills:0,steps:0,treasure:0,
    chainUsed:false,visitedRooms:[],pendingRelicOffer:null,shopOffers:null,hero};
  host.GolzdovDungeon.generateFloor(run,ENEMIES,WIDTH,HEIGHT);
  const visible=host.GolzdovNavigation.visibleCells(run.map,WIDTH,HEIGHT,run.hero);
  for(const i of visible)run.seen[i]=true;
  return {run,visible};
}
