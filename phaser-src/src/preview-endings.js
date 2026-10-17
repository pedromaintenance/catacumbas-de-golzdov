/* P3B.3 — desfechos canônicos da Carcaça / Golzdov.
 * Conteúdo narrativo espelhado da versão HTML (showFinalChoice, showVictoryEnding,
 * showDeathEnding). Domínio puro: sem DOM, Phaser, storage ou RNG.
 */
import '../../core/endings.js';
const host=typeof window!=='undefined'?window:globalThis;

export const PREVIEW_ENDING_COPY=Object.freeze({
 decision:Object.freeze({
  kicker:'O NOME SEPULTADO',
  title:'A palavra respira.',
  intro:'O Escrivão cai. Nas paredes do osso, a última inscrição se acende: 本, a origem. A Corte tentou apropriar-se do direito de nomear o mundo. Agora ele está diante de você.',
  question:'O que fará com esse poder?'
 }),
 luz:Object.freeze({
  icon:'光',
  label:'REVELAR O NOME',
  description:'Devolver à Carcaça uma verdade compartilhada, impossível de monopolizar.',
  kicker:'VITÓRIA · O CAMINHO DA LUZ',
  title:'Golzdov se lembra.',
  story:'A inscrição emerge das catacumbas, gravada em milhares de pequenas pedras. Nenhum trono conseguirá recolher todas. A verdade torna-se pública.'
 }),
 raiz:Object.freeze({
  icon:'根',
  label:'GUARDAR O NOME',
  description:'Proteger o segredo até que os povos livres possam decidir seu destino.',
  kicker:'VITÓRIA · O CAMINHO DA RAIZ',
  title:'Golzdov se lembra.',
  story:'Você retira a inscrição do altar e a esconde entre os clãs livres. O poder de nomear permanece protegido, até que a própria terra escolha sua voz.'
 }),
 sharedVictory:'Você retorna à superfície. A luta contra a Rainha da Noite não terminou — mas algo que ela julgava possuir já não lhe pertence.',
 death:Object.freeze({
  kicker:'SUA HISTÓRIA FOI INTERROMPIDA',
  title:'O osso vence.',
  story:'A Carcaça conhece mais um nome que nunca alcançou a superfície. Mas o próximo aventureiro pode encontrar sua marca.'
 })
});

export function beginPreviewFinalDecision(run){
 if(!run||!run.bossDown||run.over)return false;
 const outcome=host.GolzdovEndings.decision(run);
 if(outcome.status!=='decision')return false;
 run.pendingFinalChoice=true;
 run.previewOutcome='decision';
 return true;
}
export function choosePreviewEnding(run,id){
 if(!run||!run.pendingFinalChoice||!run.over||
  run.previewOutcome!=='decision'||!['luz','raiz'].includes(id))
  return false;
 // A mesma transição da engine clássica, sem jamais repetir a mutação
 // metadados/clear-save do adaptador HTML. O save experimental retém o epílogo.
 const outcome=host.GolzdovEndings.victory(run,id);
 if(outcome.status!=='victory')return false;
 run.pendingFinalChoice=false;
 run.previewOutcome=id;
 return true;
}
export function normalizePreviewEnding(run){
 if(!run||!run.hero)return false;
 // Saves P2B–P3B.2 tinham "vitória" terminal, sem escolha. Abrir a
 // preview nova deve liberar Luz/Raiz, nunca descartar a campanha.
 if(run.over&&run.bossDown&&run.previewOutcome==='victory'){
  run.pendingFinalChoice=true;
  run.previewOutcome='decision';
  return true;
 }
 if(run.previewOutcome==='decision'){
  run.over=true;
  run.pendingFinalChoice=true;
 }
 return false;
}
