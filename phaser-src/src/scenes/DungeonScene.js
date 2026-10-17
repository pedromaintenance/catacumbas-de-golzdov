import Phaser from 'phaser';
import {initialPreviewRun,previewAction,previewVisible} from '../preview-engine.js';
import {loadPreview,savePreview,clearPreview} from '../preview-save.js';
import {WIDTH,HEIGHT} from '../world.js';
import {PREVIEW_CLASSES,PREVIEW_CLASS_IDS} from '../preview-classes.js';
import {drawClassicMap,drawClassicHero} from '../classic-art.js';
import {normalizePreviewOutcome} from '../preview-engine.js';
import {pendingTalents} from '../preview-talents.js';
import {PreviewItemUI} from '../preview-item-ui.js';
import {PREVIEW_ENDING_COPY,normalizePreviewEnding} from '../preview-endings.js';
import {newPreviewSessionId,readPreviewHistory,archivePreviewRun,finishedPreviewRun} from '../preview-history.js';
import {planPreviewRoute,nearPreviewThreat,routeCoordinates} from '../preview-route.js';
import {combatCues,combatAnnouncement} from '../preview-combat-feedback.js';
import {previewThreats} from '../preview-status.js';
const TILE=36;
const P={
 rock:0x11131d,wall:0x2c3343,floor:0x302b38,grid:0x4f4555,
 ghost:0x1b1d27,hero:0xf3c996,halo:0x947251,enemy:0xce777e,
 stair:0xd7aa67,shrine:0x81b9be,relic:0xc8a1ce,item:0xe2bb80,trap:0xc45b61
};
const title=['Costelas do Silêncio','Medula Fraturada','Veias Petrificadas','Salão das Vértebras','O Nome Sepultado'];
const el=id=>document.getElementById(id);
const storage=()=>{try{return window.localStorage;}catch(_){return null;}};
const fixedSeed=()=>{
 const s=new URLSearchParams(location.search).get('seed');
 const n=s===null?NaN:Number(s);
 return Number.isSafeInteger(n)&&n>0?(n>>>0):0x52c4a190;
};
const startFloor=()=>{
 const n=Number(new URLSearchParams(location.search).get('floor'));
 return Number.isInteger(n)&&n>=1&&n<=5?n:1;
};
export class DungeonScene extends Phaser.Scene{
 constructor(){super('DungeonScene');this.run=null;this.lastPadAt=0;this.aim=null;this.classSelectionOpen=false;this.talentSelectedIndex=0;this.lastTalentKey='';this.itemUI=null;this.autoPath=[];this.routeTarget=null;this.routeGraphics=null;this.nextAutoAt=0;this.finalSelectedIndex=0;this.routeCancelUntilRelease=false;this.combatObjects=new Set();}
 create(){
  const existing=loadPreview(storage());
  this.run=existing||initialPreviewRun(fixedSeed(),startFloor());
  this.classSelectionOpen=!existing;
  this.itemUI=new PreviewItemUI(this);
  this.previewRun=this.run;
  normalizePreviewEnding(this.run);
  normalizePreviewOutcome(this.run);
  this.visible=previewVisible(this.run);
  this.worldCanvas=document.createElement('canvas');
  this.worldCanvas.width=WIDTH*TILE;this.worldCanvas.height=HEIGHT*TILE;
  this.worldCtx=this.worldCanvas.getContext('2d');this.worldCtx.imageSmoothingEnabled=false;
  this.textures.addCanvas('classic-world-p3',this.worldCanvas);
  this.worldImage=this.add.image(0,0,'classic-world-p3').setOrigin(0).setDepth(0);
  this.routeGraphics=this.add.graphics().setDepth(4);
  this.heroCanvas=document.createElement('canvas');
  this.heroCanvas.width=64;this.heroCanvas.height=64;
  this.heroCtx=this.heroCanvas.getContext('2d');this.heroCtx.imageSmoothingEnabled=false;
  this.textures.addCanvas('classic-hero-p3',this.heroCanvas);
  this.hero=this.add.image(0,0,'classic-hero-p3').setDisplaySize(TILE*1.38,TILE*1.38).setDepth(10);
  this.cameras.main.setBounds(0,0,WIDTH*TILE,HEIGHT*TILE);
  this.cameras.main.startFollow(this.hero,true,.17,.17);
  this.cameras.main.roundPixels=true;
  this.cameras.main.setBackgroundColor('#0e1018');
  const resize=()=>this.cameras.main.setZoom(Math.max(.85,Math.min(1.6,this.scale.width/650)));
  resize();this.scale.on('resize',resize);
  const onKey=e=>{
   // Teclas usadas para abrir as crônicas não devem atacar ou passar turnos.
   if(e.target instanceof Element&&e.target.closest('#chronicle'))return;
   const key=e.key.toLowerCase();
   if(this.classSelectionOpen){
    const classes={1:'vigia',2:'arcanista',3:'errante'};
    if(classes[key]){e.preventDefault();this.chooseClass(classes[key]);}
    return;
   }
   if(this.run.pendingFinalChoice){
    if(key==='1'||key==='2'){e.preventDefault();this.chooseEnding(key==='1'?'luz':'raiz');}
    else if(key==='arrowleft'||key==='arrowup'||key==='a'||key==='w'){
     e.preventDefault();this.selectEnding(-1);
    }else if(key==='arrowright'||key==='arrowdown'||key==='d'||key==='s'){
     e.preventDefault();this.selectEnding(1);
    }else if(key==='enter'||key===' '){
     e.preventDefault();this.chooseEnding(this.finalSelectedIndex===0?'luz':'raiz');
    }else if(key!=='tab')e.preventDefault();
    return;
   }
   if(this.run.pendingTalentChoices?.length){
    if(['1','2','3'].includes(key)){
     e.preventDefault();this.chooseTalentAt(Number(key)-1);
    }else if(key==='tab'){return;}
    else e.preventDefault();
    return;
   }
   if(this.itemUI.active()){
    e.preventDefault();this.itemUI.key(key);return;
   }
   const movement={arrowup:[0,-1],w:[0,-1],arrowdown:[0,1],s:[0,1],
    arrowleft:[-1,0],a:[-1,0],arrowright:[1,0],d:[1,0]};
   if(key==='escape'){
    e.preventDefault();
    if(this.autoPath.length){this.cancelAutoRoute('Caminhada interrompida.');return;}
    this.aim=null;this.sync();return;
   }
   if(key==='1'||key==='2'){e.preventDefault();this.selectSkill(Number(key)-1);return;}
   if(key==='r'){e.preventDefault();this.restart();return;}
   if(key==='e'){e.preventDefault();this.cancelAutoRoute();this.perform({type:'INTERACT'});return;}
   if(key==='f'||key==='enter'){
    e.preventDefault();
    if(this.aim!==null)this.castNearest();
    else this.attackNearest();
    return;
   }
   if(this.aim!==null&&movement[key]){e.preventDefault();this.report('MIRA ATIVA: toque no alvo ou F para confirmar. Esc cancela.');return;}
   if(movement[key]){e.preventDefault();this.cancelAutoRoute();this.perform({type:'MOVE',dx:movement[key][0],dy:movement[key][1]});}
   else if(key===' '||key==='.'){e.preventDefault();this.perform({type:'WAIT'});}
   else if(key==='h'||key==='p')this.perform({type:'POTION'});
  };
  document.addEventListener('keydown',onKey);
  const buttons=[];
  for(const button of document.querySelectorAll('[data-preview-action]')){
   const listener=()=>this.command(button.dataset.previewAction);
   button.addEventListener('click',listener);buttons.push([button,listener]);
  }
  const classButtons=[];
  for(const button of document.querySelectorAll('[data-preview-class]')){
   const listener=()=>this.chooseClass(button.dataset.previewClass);
   button.addEventListener('click',listener);classButtons.push([button,listener]);
  }
  const pointerClick=pointer=>{
   if(this.run.over||this.classSelectionOpen||this.run.pendingTalentChoices?.length||this.itemUI.active())return;
   const x=Math.floor(pointer.worldX/TILE),y=Math.floor(pointer.worldY/TILE);
   if(x<0||y<0||x>=WIDTH||y>=HEIGHT)return;
   this.cancelAutoRoute();
   if(this.aim!==null){this.castAt(x,y);return;}
   const p=this.run.hero,enemy=this.run.enemies.find(e=>e.hp>0&&e.x===x&&e.y===y);
   const distance=Math.abs(x-p.x)+Math.abs(y-p.y);
   if(enemy){
    if(distance<=p.range)return this.perform({type:'ATTACK',enemyId:enemy.id});
    this.report('Inimigo fora do alcance. Aproxime-se para atacar.');return;
   }
   if(distance===0){this.perform({type:'INTERACT'});return;}
   if(distance===1){this.perform({type:'MOVE',dx:x-p.x,dy:y-p.y});return;}
   const path=planPreviewRoute(this.run,x,y);
   if(!path)return this.report('Destino inacessível ou ainda não explorado.');
   if(nearPreviewThreat(this.run,this.visible))
    return this.report('Há um inimigo próximo. Resolva o combate antes de caminhar automaticamente.');
   this.beginAutoRoute(path,x,y);
  };
  this.input.on('pointerdown',pointerClick);
  const talentList=el('talent-options');
  const onTalentClick=event=>{
   const button=event.target.closest('button[data-preview-talent]');
   if(button&&talentList.contains(button))this.chooseTalent(button.dataset.previewTalent);
  };
  talentList?.addEventListener('click',onTalentClick);
  const chronicleToggle=el('chronicle-toggle');
  const onChronicleToggle=()=>{
   const body=el('chronicle-body');
   if(!body)return;
   const open=body.classList.contains('hidden');
   body.classList.toggle('hidden',!open);
   chronicleToggle.setAttribute('aria-expanded',String(open));
   chronicleToggle.firstChild.textContent=open?'OCULTAR HISTÓRICO ':'VER HISTÓRICO ';
   if(open)this.syncHistory();
  };
  chronicleToggle?.addEventListener('click',onChronicleToggle);
  const threatToggle=el('threat-toggle'),threatList=el('threat-list');
  const onThreatToggle=()=>{
   if(!threatToggle||!threatList)return;
   const expanded=threatList.classList.contains('hidden');
   threatList.classList.toggle('hidden',!expanded);
   threatToggle.setAttribute('aria-expanded',String(expanded));
   threatToggle.textContent=expanded?'OCULTAR AMEAÇAS ▴':'VER AMEAÇAS ▾';
   if(expanded)this.syncThreats();
  };
  const onThreatClick=e=>{
   const button=e.target.closest('button[data-preview-enemy-id]');
   if(!button||!threatList?.contains(button)||button.disabled)return;
   if(this.classSelectionOpen||this.run.over||this.aim!==null||
    this.run.pendingTalentChoices?.length||this.itemUI.active())return;
   const id=Number(button.dataset.previewEnemyId);
   const target=previewThreats(this.run,this.visible,30).threats
    .find(t=>t.id===id&&t.canAttack);
   if(!target)return this.report('O alvo não está mais ao alcance ou à vista.');
   this.cancelAutoRoute();
   this.perform({type:'ATTACK',enemyId:id});
  };
  threatToggle?.addEventListener('click',onThreatToggle);
  threatList?.addEventListener('click',onThreatClick);
  const finalChoices=el('ending-choices');
  const onEndingClick=e=>{
   const button=e.target.closest('button[data-preview-ending]');
   if(button&&finalChoices.contains(button))this.chooseEnding(button.dataset.previewEnding);
  };
  finalChoices?.addEventListener('click',onEndingClick);
  this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{
   document.removeEventListener('keydown',onKey);
   for(const [button,listener] of buttons)button.removeEventListener('click',listener);
   for(const [button,listener] of classButtons)button.removeEventListener('click',listener);
   this.scale.off('resize',resize);
   this.input.off('pointerdown',pointerClick);
   this.itemUI?.destroy();
   this.clearCombatFeedback();
   talentList?.removeEventListener('click',onTalentClick);
   chronicleToggle?.removeEventListener('click',onChronicleToggle);
   threatToggle?.removeEventListener('click',onThreatToggle);
   threatList?.removeEventListener('click',onThreatClick);
   finalChoices?.removeEventListener('click',onEndingClick);
  });
  this.draw();this.sync();
  this.syncClassPicker();
  if(existing)savePreview(storage(),this.run);
 }
 command(command){
  if(command==='cancel-route'){this.cancelAutoRoute('Caminhada interrompida.');return;}
  // REINICIAR sempre abre a seleção, inclusive após morte, epílogo ou
  // durante um modal. O save atual só é trocado ao confirmar outra classe.
  if(command==='restart'){this.restart();return;}
  if(this.classSelectionOpen||this.run.pendingTalentChoices?.length||this.itemUI.active()||this.run.over)return;
  this.cancelAutoRoute();
  const dirs={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
  if(dirs[command]){
   if(this.aim!==null){this.report('Selecione um alvo para a habilidade, ou Esc para cancelar.');return;}
   this.perform({type:'MOVE',dx:dirs[command][0],dy:dirs[command][1]});
  }
  if(command==='wait')this.perform({type:'WAIT'});
  if(command==='potion')this.perform({type:'POTION'});
  if(command==='interact')this.perform({type:'INTERACT'});
  if(command==='attack'){if(this.aim!==null)this.castNearest();else this.attackNearest();}
  if(command==='skill0'||command==='skill1')this.selectSkill(Number(command.slice(-1)));
 }
 syncClassPicker(){
  const picker=el('class-selection');
  if(picker)picker.classList.toggle('hidden',!this.classSelectionOpen);
 }
 chooseClass(classId){
  if(!PREVIEW_CLASSES[classId])return;
  this.clearCombatFeedback();
  if(el('combat-status'))el('combat-status').textContent='Nenhum confronto registrado nesta expedição.';
  clearPreview(storage());
  this.run=initialPreviewRun(fixedSeed(),startFloor(),classId);
  this.run.previewSessionId=newPreviewSessionId();
  this.previewRun=this.run;this.visible=previewVisible(this.run);
  this.aim=null;this.classSelectionOpen=false;this.cancelAutoRoute();
  this.talentSelectedIndex=0;this.lastTalentKey='';this.finalSelectedIndex=0;
  this.syncClassPicker();
  savePreview(storage(),this.run);
  this.draw();this.sync();
 }
 restart(){
  // Abrir a seleção não apaga a campanha; só escolher uma classe o faz.
  this.cancelAutoRoute();this.aim=null;this.classSelectionOpen=true;this.syncClassPicker();this.sync();
 }
 selectSkill(which){
  if(this.classSelectionOpen||this.run.over||this.run.pendingTalentChoices?.length||this.itemUI.active())return;
  const skill=PREVIEW_CLASSES[this.run.hero.classId].skills[which];
  if(!skill)return;
  if(this.run.hero.mana<skill.cost){
   this.aim=null;this.report('Foco insuficiente: '+skill.cost+' necessários.');this.syncAim();return;
  }
  if(skill.target){
   this.aim=this.aim===which?null:which;
   this.syncAim();
   this.report(this.aim===null?'Mira cancelada.':'MIRA: '+skill.name+' · toque no mapa ou F para alvo próximo.');
  }else{
   this.aim=null;
   this.perform({type:'SKILL',which});
  }
 }
 castAt(x,y){
  if(this.classSelectionOpen||this.aim===null)return;
  const which=this.aim;
  const result=this.perform({type:'SKILL',which,x,y});
  if(result?.consumesTurn){this.aim=null;this.syncAim();}
 }
 castNearest(){
  if(this.aim===null)return;
  const skill=PREVIEW_CLASSES[this.run.hero.classId].skills[this.aim],p=this.run.hero;
  const dist=e=>Math.abs(e.x-p.x)+Math.abs(e.y-p.y);
  const foe=this.run.enemies.filter(e=>e.hp>0&&this.visible.has(e.y*WIDTH+e.x)&&dist(e)<=skill.range)
   .filter(e=>window.GolzdovNavigation.lineClear(this.run.map,WIDTH,HEIGHT,p.x,p.y,e.x,e.y))
   .sort((a,b)=>dist(a)-dist(b)||a.id-b.id)[0];
  if(foe)this.castAt(foe.x,foe.y);
  else this.report('Nenhum alvo válido para '+skill.name+'. Toque em uma posição visível.');
 }
 syncAim(){
  const hint=el('aim-hint'),aiming=this.aim!==null;
  if(hint){hint.classList.toggle('hidden',!aiming);if(aiming)hint.textContent='✧ MIRANDO '+PREVIEW_CLASSES[this.run.hero.classId].skills[this.aim].name+' · clique no mapa ou F · ESC cancela';}
  for(let which=0;which<2;which++){
   const btn=el('skill'+which+'-button');
   if(btn)btn.classList.toggle('aiming',this.aim===which);
  }
 }
 attackNearest(){
  if(this.classSelectionOpen||this.run.over||this.run.pendingTalentChoices?.length||this.itemUI.active())return;
  const hero=this.run.hero;
  const options=this.run.enemies.filter(e=>e.hp>0&&this.visible.has(e.y*WIDTH+e.x))
   .sort((a,b)=>(Math.abs(a.x-hero.x)+Math.abs(a.y-hero.y))-(Math.abs(b.x-hero.x)+Math.abs(b.y-hero.y)));
  const enemy=options.find(e=>Math.abs(e.x-hero.x)+Math.abs(e.y-hero.y)<=hero.range&&
   window.GolzdovNavigation.lineClear(this.run.map,WIDTH,HEIGHT,hero.x,hero.y,e.x,e.y));
  if(enemy)this.perform({type:'ATTACK',enemyId:enemy.id});
  else this.report('Nenhum inimigo visível ao alcance do ataque.');
 }
 perform(action){
  if(this.classSelectionOpen||
    (this.run.over&&!(this.run.pendingFinalChoice&&action.type==='CHOOSE_ENDING'))||
    (this.run.pendingTalentChoices?.length&&action.type!=='CHOOSE_TALENT')){
   this.report('Resolva a escolha de ascensão antes de continuar.');return null;
  }
  const result=previewAction(this.run,action);
  this.visible=previewVisible(this.run);
  if(result.consumesTurn||result.events.length||[
   'relic-swap-required','relic-swap-pending','relic-back','relic-equipped',
   'relic-skipped','stairs-cancelled','descended','shrine-used','ending-chosen'
  ].includes(result.status))savePreview(storage(),this.run);
  if(result.status==='blocked')this.report('Uma parede de ossos impede a passagem.');
  if(result.status==='out-of-range')this.report('O inimigo está fora do alcance.');
  this.draw();this.sync();
  this.showCombatFeedback(result.events);
  return result;
 }
 beginAutoRoute(path,x,y){
  this.autoPath=path;this.routeTarget={x,y};this.nextAutoAt=0;
  this.syncAutoRoute();
  this.report('Caminhando até o destino. Esc, B ou PARAR interrompem a rota.');
 }
 cancelAutoRoute(message=''){
  const wasActive=this.autoPath.length>0;
  this.autoPath=[];this.routeTarget=null;
  this.syncAutoRoute();
  if(wasActive&&message)this.report(message);
 }
 syncAutoRoute(){
  const active=this.autoPath.length>0&&!this.run.over&&!this.classSelectionOpen;
  const container=el('route-feedback'),text=el('route-text');
  if(container)container.classList.toggle('hidden',!active);
  if(text&&active)text.textContent='ROTA ATIVA · '+this.autoPath.length+
   ' passo(s) · destino '+(this.routeTarget?.x??'?')+','+(this.routeTarget?.y??'?');
  if(!this.routeGraphics)return;
  this.routeGraphics.clear();
  if(!active){if(!this.autoPath.length)this.routeTarget=null;return;}
  const points=routeCoordinates(this.run.hero,this.autoPath);
  this.routeGraphics.lineStyle(2,0xe4be8b,.8);
  this.routeGraphics.fillStyle(0xe4be8b,.35);
  for(const p of points){
   this.routeGraphics.strokeRect((p.x+.15)*TILE,(p.y+.15)*TILE,TILE*.7,TILE*.7);
   this.routeGraphics.fillCircle((p.x+.5)*TILE,(p.y+.5)*TILE,3);
  }
  if(this.routeTarget){
   this.routeGraphics.lineStyle(3,0xf8dd9c,1);
   this.routeGraphics.strokeCircle((this.routeTarget.x+.5)*TILE,
    (this.routeTarget.y+.5)*TILE,TILE*.35);
  }
 }
 clearCombatFeedback(){
  for(const object of this.combatObjects){
   this.tweens.killTweensOf(object);
   object.destroy();
  }
  this.combatObjects.clear();
 }
 showCombatFeedback(events){
  const cues=combatCues(events);
  if(!cues.length)return;
  const status=el('combat-status');
  if(status)status.textContent=combatAnnouncement(cues);
  const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches??false;
  for(const [i,cue] of cues.entries()){
   const text=this.add.text((cue.x+.5)*TILE,(cue.y+.23)*TILE-i%3*3,
    cue.text,{
     fontFamily:'monospace',fontSize:cue.critical?'19px':'15px',
     fontStyle:'bold',color:'#'+cue.color.toString(16).padStart(6,'0'),
     stroke:'#100e16',strokeThickness:4,
     backgroundColor:'#100e16c9',padding:{x:4,y:3}
    }).setOrigin(.5,1).setDepth(50);
   this.combatObjects.add(text);
   const done=()=>{this.combatObjects.delete(text);text.destroy();};
   if(reducedMotion)this.time.delayedCall(1050,done);
   else this.tweens.add({targets:text,y:text.y-22,alpha:0,
    duration:950,ease:'Sine.easeOut',onComplete:done});
  }
 }
 report(message){if(el('scene-status'))el('scene-status').textContent=message;}
 draw(){
  drawClassicMap(this.worldCtx,this.run,this.visible,TILE);
  this.textures.get('classic-world-p3').refresh();
  drawClassicHero(this.heroCtx,this.run.hero);
  this.textures.get('classic-hero-p3').refresh();
  this.hero.setPosition((this.run.hero.x+.5)*TILE,(this.run.hero.y+.5)*TILE);
 }
 sync(){
  const g=this.run,p=g.hero;
  if(finishedPreviewRun(g)){
   const archive=archivePreviewRun(storage(),g);
   if(archive.status==='archived')savePreview(storage(),g);
  }
  this.syncHistory();
  this.syncAutoRoute();
  this.syncThreats();
  const pairs={
   'hero-hp':p.hp+' / '+p.maxhp,
   'hero-focus':p.mana+' / '+p.maxmana,
   'hero-level':String(p.level),
   'run-turn':String(g.turn),
   'run-floor':g.floor+' / 5',
   'hero-potions':String(p.potions),
   'run-kills':String(g.kills),
   'hero-coins':String(p.coins),
   'hero-relic-slots':window.GolzdovRelicOffers.occupied(p)+' / '+window.GolzdovRelicOffers.capacity(p),
   'scene-seed':g.seed.toString(16).toUpperCase().padStart(8,'0')
  };
  for(const [id,value] of Object.entries(pairs))if(el(id))el(id).textContent=value;
  const bars={'hp-fill':p.maxhp>0?p.hp/p.maxhp:0,'focus-fill':p.maxmana>0?p.mana/p.maxmana:0};
  for(const [id,ratio] of Object.entries(bars))if(el(id))el(id).style.width=(Math.max(0,Math.min(1,ratio))*100)+'%';
  const end=el('run-ending');
  if(end){
   end.classList.toggle('hidden',!g.over);
   if(g.over){
    const decision=!!g.pendingFinalChoice;
    const path=PREVIEW_ENDING_COPY[g.previewOutcome];
    const copy=decision?PREVIEW_ENDING_COPY.decision:
     path?.story?path:PREVIEW_ENDING_COPY.death;
    if(el('ending-kicker'))el('ending-kicker').textContent=copy.kicker;
    if(el('ending-title'))el('ending-title').textContent=copy.title;
    if(el('ending-story'))el('ending-story').textContent=decision?
     copy.intro:path?.story||copy.story;
    if(el('ending-substory'))el('ending-substory').textContent=decision?
     copy.question:path?.story?PREVIEW_ENDING_COPY.sharedVictory:'';
    const options=el('ending-choices');
    if(options){
     options.classList.toggle('hidden',!decision);
     const values=['luz','raiz'];
     for(const [i,button] of [...options.querySelectorAll('[data-preview-ending]')].entries()){
      const choice=PREVIEW_ENDING_COPY[values[i]];
      button.querySelector('strong').textContent=choice.icon+' '+choice.label;
      button.querySelector('span').textContent=choice.description;
     }
    }
    if(el('ending-restart'))el('ending-restart').classList.toggle('hidden',decision);
    if(el('ending-controls'))el('ending-controls').classList.toggle('hidden',!decision);
    if(el('ending-summary'))el('ending-summary').textContent=
     'Estrato '+g.floor+' / 5 · Nível '+p.level+' · '+g.turn+' turnos · '+
     g.kills+' abates · ◈ '+g.treasure+' âmbar';
    if(decision)this.highlightEnding();
   }
  }
  const klass=PREVIEW_CLASSES[p.classId]||PREVIEW_CLASSES.vigia;
  if(el('hero-class'))el('hero-class').textContent=klass.name;
  if(el('hero-weapon'))el('hero-weapon').textContent=klass.weapon;
  for(let which=0;which<2;which++){
   const skill=klass.skills[which],btn=el('skill'+which+'-button');
   if(btn){btn.textContent=skill.icon+' '+skill.short+' · '+skill.cost+'✧';btn.disabled=g.over||!!g.pendingTalentChoices?.length||p.mana<skill.cost;}
  }
  this.syncAim();
  this.syncTalentPicker();
  this.itemUI?.sync();
  if(el('scene-heading'))el('scene-heading').textContent=title[g.floor-1];
  if(el('scene-status'))el('scene-status').textContent=g.over
   ?g.pendingFinalChoice?'O ESCRIVÃO CAIU — escolha o destino do Nome.':
    ['luz','raiz'].includes(g.previewOutcome)?'VITÓRIA · CAMINHO DA '+g.previewOutcome.toUpperCase():
    'FIM DA EXPEDIÇÃO — reinicie para tentar novamente.'
   :(g.pendingTalentChoices?.length?'ASCENSÃO: escolha um talento para continuar.':
   this.itemUI.active()?'Escolha uma opção no painel para continuar.':
   (g.previewLog?.at(-1)||'Explore os corredores do osso.'));
  if(el('recent-log'))el('recent-log').textContent=(g.previewLog||[]).slice(-3).join(' · ');
 }
 syncHistory(){
  const body=el('chronicle-body'),stats=el('chronicle-stats'),list=el('chronicle-records');
  if(!body||!stats||!list)return;
  const meta=readPreviewHistory(storage());
  stats.textContent='EXPEDIÇÕES '+meta.runs+' · VITÓRIAS '+meta.wins+
   ' · DERROTAS '+meta.deaths+' · MELHOR ESTRATO '+meta.best+'/5 · ABATES '+meta.kills+
   ' · LUZ 光 '+meta.luz+' · RAIZ 根 '+meta.raiz;
  // Evita reconstruir a lista em cada turno com o painel fechado.
  if(body.classList.contains('hidden'))return;
  const fingerprint=JSON.stringify(meta.records);
  if(list.dataset.recordsHash===fingerprint)return;
  list.dataset.recordsHash=fingerprint;
  list.replaceChildren();
  for(const record of meta.records){
   const li=document.createElement('li');
   const title=document.createElement('strong'),details=document.createElement('span');
   const result=record.outcome==='luz'?'光 LUZ':record.outcome==='raiz'?'根 RAIZ':'† DERROTA';
   const cls=PREVIEW_CLASSES[record.classId]?.name||record.classId;
   title.textContent=result+' · '+cls+' · Estrato '+record.floor+'/5';
   details.textContent='Nível '+record.level+' · '+record.turns+' turnos · '+
    record.kills+' abates · ◈ '+record.treasure+' · seed '+record.seed.toString(16).toUpperCase().padStart(8,'0');
   li.append(title,details);list.append(li);
  }
  if(!meta.records.length){
   const li=document.createElement('li');
   li.textContent='Nenhuma expedição concluída nesta preview.';
   list.append(li);
  }
 }
 chooseEnding(id){
  if(!this.run.pendingFinalChoice)return;
  const result=this.perform({type:'CHOOSE_ENDING',ending:id});
  if(result?.status==='ending-chosen')this.finalSelectedIndex=0;
 }
 selectEnding(direction){
  this.finalSelectedIndex=(this.finalSelectedIndex+direction+2)%2;
  this.highlightEnding();
 }
 highlightEnding(){
  const buttons=[...(el('ending-choices')?.querySelectorAll('[data-preview-ending]')||[])];
  buttons.forEach((button,i)=>button.classList.toggle('pad-selected',i===this.finalSelectedIndex));
 }
 chooseTalent(id){
  if(!this.run.pendingTalentChoices?.includes(id))return;
  const result=this.perform({type:'CHOOSE_TALENT',talentId:id});
  if(result?.status==='talent-chosen'){
   this.talentSelectedIndex=0;
   this.lastTalentKey='';
   this.sync();
  }
 }
 chooseTalentAt(index){
  const choices=this.run.pendingTalentChoices||[];
  if(choices[index])this.chooseTalent(choices[index]);
 }
 syncTalentPicker(){
  const modal=el('talent-selection'),list=el('talent-options');
  if(!modal||!list)return;
  const choices=this.run.pendingTalentChoices||[];
  const open=choices.length>0&&!this.classSelectionOpen&&!this.run.over;
  modal.classList.toggle('hidden',!open);
  if(!open){this.lastTalentKey='';return;}
  this.aim=null;
  const key=this.run.hero.classId+'|'+choices.join(',');
  if(key===this.lastTalentKey)return;
  this.lastTalentKey=key;this.talentSelectedIndex=0;
  if(el('talent-desc'))el('talent-desc').textContent='Nível '+this.run.hero.level+
   '. Escolha um talento; no máximo dois exclusivos da classe por expedição.';
  list.replaceChildren();
  for(const [i,t] of pendingTalents(this.run).entries()){
   const button=document.createElement('button');
   button.type='button';button.className='talent-card';
   button.dataset.previewTalent=t.id;
   const heading=document.createElement('strong');heading.textContent=t.icon+' '+t.title;
   const category=document.createElement('small');
   category.textContent=t.kind==='class'?'TALENTO DE CLASSE':'MELHORIA UNIVERSAL';
   const description=document.createElement('span');description.textContent=t.desc;
   const shortcut=document.createElement('b');shortcut.textContent=(i+1)+' · ESCOLHER';
   button.append(heading,category,description,shortcut);
   list.append(button);
  }
  list.querySelector('button')?.focus({preventScroll:true});
 }
 update(time){
  if(this.classSelectionOpen)return;
  if(this.run.pendingFinalChoice){
   if(time-this.lastPadAt<175)return;
   const pad=navigator.getGamepads?.()?.find(p=>p&&p.connected);
   if(!pad)return;
   const pressed=i=>!!pad.buttons[i]?.pressed,axis=i=>pad.axes[i]||0;
   if(pressed(12)||pressed(14)||axis(0)<-.55||axis(1)<-.55)this.selectEnding(-1);
   else if(pressed(13)||pressed(15)||axis(0)>.55||axis(1)>.55)this.selectEnding(1);
   else if(pressed(0))this.chooseEnding(this.finalSelectedIndex===0?'luz':'raiz');
   else return;
   this.lastPadAt=time;return;
  }
  if(this.run.over)return;
  if(this.itemUI.active()&&!this.run.pendingTalentChoices?.length){
   if(time-this.lastPadAt<175)return;
   const pad=navigator.getGamepads?.()?.find(p=>p&&p.connected);
   if(pad&&this.itemUI.pad(pad))this.lastPadAt=time;
   return;
  }
  // Entradas físicas têm precedência sobre a rota automática. Xbox B
  // interrompe sem ativar a habilidade 2 enquanto permanecer pressionado.
  if(this.routeCancelUntilRelease){
   const pad=navigator.getGamepads?.()?.find(p=>p&&p.connected);
   if(pad?.buttons[1]?.pressed)return;
   this.routeCancelUntilRelease=false;
  }
  if(!this.run.pendingTalentChoices?.length&&this.autoPath.length){
   const pad=navigator.getGamepads?.()?.find(p=>p&&p.connected);
   if(pad&&time-this.lastPadAt>=175){
    const pressed=i=>!!pad.buttons[i]?.pressed,axis=i=>pad.axes[i]||0;
    if(pressed(1)){
     this.routeCancelUntilRelease=true;this.lastPadAt=time;
     this.cancelAutoRoute('Caminhada interrompida pelo controle.');return;
    }
    let manual=null;
    if(pressed(12)||axis(1)<-.55)manual='up';
    else if(pressed(13)||axis(1)>.55)manual='down';
    else if(pressed(14)||axis(0)<-.55)manual='left';
    else if(pressed(15)||axis(0)>.55)manual='right';
    else if(pressed(0))manual='attack';
    if(manual){
     this.lastPadAt=time;this.command(manual);return;
    }
   }
   if(time<this.nextAutoAt)return;
   if(nearPreviewThreat(this.run,this.visible)){
    this.cancelAutoRoute('Ameaça próxima! Caminhada pausada; escolha a próxima ação.');return;
   }
   const [dx,dy]=this.autoPath.shift();
   const result=this.perform({type:'MOVE',dx,dy});
   this.nextAutoAt=time+155;
   if(result?.status!=='applied'||this.itemUI.active()||
    this.run.pendingTalentChoices?.length||this.run.over)
    this.cancelAutoRoute('Caminhada interrompida por combate ou interação.');
   else if(nearPreviewThreat(this.run,this.visible))
    this.cancelAutoRoute('Inimigo avistado! A caminhada foi interrompida.');
   else this.syncAutoRoute();
   return;
  }
  if(time-this.lastPadAt<175)return;
  const pad=navigator.getGamepads?.()?.find(p=>p&&p.connected);
  if(!pad)return;
  const pressed=i=>!!pad.buttons[i]?.pressed;
  const axis=(a)=>pad.axes[a]||0;
  if(this.run.pendingTalentChoices?.length){
   const options=this.run.pendingTalentChoices;
   if(pressed(12)||pressed(14)||axis(1)<-.55){
    this.talentSelectedIndex=(this.talentSelectedIndex+options.length-1)%options.length;
   }else if(pressed(13)||pressed(15)||axis(1)>.55){
    this.talentSelectedIndex=(this.talentSelectedIndex+1)%options.length;
   }else if(pressed(0))this.chooseTalentAt(this.talentSelectedIndex);
   else return;
   this.lastPadAt=time;
   for(const [i,button] of [...(el('talent-options')?.children||[])].entries())
    button.classList.toggle('pad-selected',i===this.talentSelectedIndex);
   return;
  }
  let cmd=null;
  if(pressed(12)||axis(1)<-.55)cmd='up';
  else if(pressed(13)||axis(1)>.55)cmd='down';
  else if(pressed(14)||axis(0)<-.55)cmd='left';
  else if(pressed(15)||axis(0)>.55)cmd='right';
  else if(pressed(0))cmd='attack';
  else if(pressed(3))cmd='skill0';
  else if(pressed(1))cmd=this.aim===null?'skill1':'cancel-aim';
  else if(pressed(2))cmd='potion';
  else if(pressed(5))cmd='wait';
  if(cmd){this.lastPadAt=time;if(cmd==='cancel-aim'){this.aim=null;this.syncAim();}else this.command(cmd);}
 }
}
