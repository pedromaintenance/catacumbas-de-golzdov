/* P3B.1 — interface de escolhas para item/relicário/altar/escada.
 * DOM é somente um adaptador: escolhas e transações acontecem no previewAction.
 */
import {availablePreviewRelics,relicById} from './preview-relics.js';
const el=id=>document.getElementById(id);
export class PreviewItemUI{
 constructor(scene){
  this.scene=scene;this.items=[];this.selection=0;this.cache='';
  this.list=el('item-options');
  this.onClick=event=>{
   const button=event.target.closest('button[data-preview-interaction]');
   if(button&&this.list?.contains(button))
    this.choose(Number(button.dataset.previewInteraction));
  };
  this.list?.addEventListener('click',this.onClick);
 }
 destroy(){this.list?.removeEventListener('click',this.onClick);}
 active(){
  const run=this.scene.run;
  return !!(run?.pendingRelicOffer||run?.pendingShrineChoice||run?.pendingStairs);
 }
 choices(run){
  const hero=run.hero,pending=run.pendingRelicOffer,rules=window.GolzdovRelicOffers;
  if(pending){
   if(!pending.selection)return [
    ...availablePreviewRelics(run).map(relic=>{
     const info=rules.info(relic.id);
     return {type:'RELIC_SELECT',id:relic.id,title:relic.icon+' '+relic.name+' · '+info.name,
      desc:relic.desc+' Ocupa '+info.slots+' espaço(s).'};
    }),
    {type:'RELIC_SKIP',title:'× RECUSAR',desc:'Abandonar o relicário, sem mudar equipamentos.'}
   ];
   const wanted=relicById(pending.selection),removing=pending.removing||[];
   const options=hero.relics.map(id=>{
    const relic=relicById(id),checked=removing.includes(id);
    return {type:'RELIC_TOGGLE',id,title:(checked?'☑ ':'□ ')+(relic?.name||id),
      desc:'Libera '+(rules.info(id)?.slots||1)+' espaço(s) ao confirmar. '+(checked?'Selecionada para troca.':'Toque para marcar.')};
   });
   if(wanted&&rules.canFit(hero,wanted.id,removing))
    options.push({type:'RELIC_CONFIRM',title:'✥ CONFIRMAR EQUIPAMENTO',
     desc:'Substituir apenas as relíquias marcadas por '+wanted.name+'.'});
   options.push({type:'RELIC_BACK',title:'← VOLTAR',desc:'Desfazer marcas sem modificar equipamentos.'});
   options.push({type:'RELIC_SKIP',title:'× RECUSAR',desc:'Cancelar a escolha de relíquias.'});
   return options;
  }
  if(run.pendingShrineChoice)return [
   {type:'CHOOSE_SHRINE',id:'heal',title:'♥ BEIJO DE RAIZ 根',desc:'Recupera até 20 PV.'},
   {type:'CHOOSE_SHRINE',id:'focus',title:'✧ CLAREZA DE LUZ 光',desc:'Recupera todo o foco.'},
   {type:'CHOOSE_SHRINE',id:'relic',title:'✥ TRIBUTO DE OSSO',desc:'Duas inscrições de relíquias à escolha.'}
  ];
  if(run.pendingStairs)return [
   ...(run.floor<5?[{type:'STAIRS_DESCEND',title:'↓ DESCER',
    desc:'Seguir ao estrato '+(run.floor+1)+' e deixar este andar para trás.'}]:[]),
   {type:'STAIRS_CANCEL',title:'← CONTINUAR EXPLORANDO',
    desc:run.floor===5?'O selo exige vencer o Escrivão Sem Nome.':
    'Ficar aqui. Pressione E quando quiser abrir a escadaria novamente.'}
  ];
  return [];
 }
 sync(){
  const scene=this.scene,run=scene.run,modal=el('item-selection');
  if(!modal||!this.list)return;
  const open=this.active()&&!scene.classSelectionOpen&&!run.pendingTalentChoices?.length&&!run.over;
  modal.classList.toggle('hidden',!open);
  if(!open){this.cache='';this.items=[];return;}
  const pending=run.pendingRelicOffer;
  const title=pending?(pending.selection?'BOLSA DE RELÍQUIAS':'O RELICÁRIO'):
   run.pendingShrineChoice?'ALTAR ESQUECIDO':'A ESCADARIA';
  const desc=pending?(pending.selection?'Marque as relíquias que deseja trocar antes de confirmar. ':
   'Escolha uma inscrição para sua bolsa. ')+
   window.GolzdovRelicOffers.occupied(run.hero)+'/'+window.GolzdovRelicOffers.capacity(run.hero)+' espaços ocupados.':
   run.pendingShrineChoice?'O altar oferece uma única bênção.':
   'Decida se deseja prosseguir ou continuar explorando.';
  const items=this.choices(run),key=JSON.stringify([title,desc,items]);
  if(key===this.cache)return;
  this.cache=key;this.items=items;this.selection=0;
  el('item-title').textContent=title;el('item-desc').textContent=desc;
  el('item-kicker').textContent=pending?'INSCRIÇÕES GRAVADAS NO OSSO':
   run.pendingShrineChoice?'O OSSO CONCEDE UMA BÊNÇÃO':'UM CAMINHO PARA O ESCURO';
  this.list.replaceChildren();
  for(const [i,item] of items.entries()){
   const button=document.createElement('button');
   button.type='button';button.className='item-card';
   button.dataset.previewInteraction=String(i);
   const strong=document.createElement('strong');strong.textContent=item.title;
   const summary=document.createElement('span');summary.textContent=item.desc;
   const number=document.createElement('b');number.textContent=(i+1)+' · ESCOLHER';
   button.append(strong,summary,number);this.list.append(button);
  }
  this.highlight();
  this.list.querySelector('button')?.focus({preventScroll:true});
 }
 highlight(){
  for(const [i,button] of [...(this.list?.children||[])].entries())
   button.classList.toggle('pad-selected',i===this.selection);
 }
 move(delta){
  if(!this.items.length)return;
  this.selection=(this.selection+delta+this.items.length)%this.items.length;
  this.highlight();
 }
 choose(index){
  const item=this.items[index];if(!item)return;
  this.scene.autoPath=[];
  this.cache='';this.selection=0;
  this.scene.perform({type:item.type,id:item.id});
 }
 key(key){
  if(/^[1-9]$/.test(key)){this.choose(Number(key)-1);return;}
  if(['arrowup','arrowleft','w','a'].includes(key))this.move(-1);
  if(['arrowdown','arrowright','s','d'].includes(key))this.move(1);
  if(key==='enter')this.choose(this.selection);
  if(key==='escape'){
   const i=this.items.findIndex(item=>item.type==='RELIC_SKIP'||item.type==='STAIRS_CANCEL');
   if(i>=0)this.choose(i);
  }
 }
 pad(pad){
  const press=i=>!!pad.buttons[i]?.pressed,axis=i=>pad.axes[i]||0;
  if(press(12)||press(14)||axis(1)<-.55||axis(0)<-.55)this.move(-1);
  else if(press(13)||press(15)||axis(1)>.55||axis(0)>.55)this.move(1);
  else if(press(0))this.choose(this.selection);
  else return false;
  return true;
 }
}
