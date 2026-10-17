/* P4A.2 — projeção somente visual dos eventos produzidos pelo motor Phaser.
 * Não modifica run, consome RNG, toca em relógio/DOM ou executa turnos.
 */
import {WIDTH,HEIGHT} from './world.js';

const colors=Object.freeze({
 'enemy-hit':0xf2cc9c,'enemy-defeat':0xecad78,miss:0xb8c4d4,
 'hero-hit':0xf28d91,dodge:0x9bc9c1
});
const sane=(v)=>Number.isFinite(v)?v:0;
export function combatCues(events,max=12){
 if(!Array.isArray(events))return [];
 return events.filter(e=>e?.type==='combat-feedback'&&
  Object.hasOwn(colors,e.kind)&&Number.isInteger(e.x)&&Number.isInteger(e.y)&&
  e.x>=0&&e.y>=0&&e.x<WIDTH&&e.y<HEIGHT
 ).slice(-Math.max(0,Math.min(24,max))).map(e=>{
  const amount=Math.max(0,Math.floor(sane(e.amount)));
  let text='',description='';
  switch(e.kind){
   case 'enemy-hit':
    text=(e.critical?'CRÍTICO ':'')+'−'+amount;
    description=(e.critical?'Crítico: ':'Acerto: ')+(e.name||'inimigo')+
     ' sofre '+amount+' de dano.';break;
   case 'enemy-defeat':
    text='ABATIDO';description=(e.name||'Inimigo')+' derrotado.';break;
   case 'miss':
    text='ERROU';description='Você errou '+(e.name||'o inimigo')+'.';break;
   case 'hero-hit':
    text='−'+amount+' PV';description='Você sofreu '+amount+' de dano.';break;
   case 'dodge':
    text='ESQUIVA';description='Você esquivou de um ataque.';break;
  }
  return Object.freeze({kind:e.kind,x:e.x,y:e.y,text,description,
   color:colors[e.kind],critical:!!(e.critical&&e.kind==='enemy-hit')});
 });
}
export function combatAnnouncement(cues){
 if(!cues?.length)return '';
 // Em sequência de hits, anunciar até os três mais recentes sem saturar leitor de tela.
 return cues.slice(-3).map(c=>c.description).join(' ');
}
