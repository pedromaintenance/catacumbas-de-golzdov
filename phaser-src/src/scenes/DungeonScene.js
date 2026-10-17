import Phaser from 'phaser';
import {initialPreviewRun,previewAction,previewVisible} from '../preview-engine.js';
import {loadPreview,savePreview,clearPreview} from '../preview-save.js';
import {WIDTH,HEIGHT} from '../world.js';
import {PREVIEW_CLASSES,PREVIEW_CLASS_IDS} from '../preview-classes.js';
import {drawClassicMap,drawClassicHero} from '../classic-art.js';
import {normalizePreviewOutcome} from '../preview-engine.js';
import {pendingTalents} from '../preview-talents.js';
import {PreviewItemUI} from '../preview-item-ui.js';
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
 constructor(){super('DungeonScene');this.run=null;this.lastPadAt=0;this.aim=null;this.classSelectionOpen=false;this.talentSelectedIndex=0;this.lastTalentKey='';this.itemUI=null;this.autoPath=[];this.nextAutoAt=0;}
 create(){
  const existing=loadPreview(storage());
  this.run=existing||initialPreviewRun(fixedSeed(),startFloor());
  this.classSelectionOpen=!existing;
  this.itemUI=new PreviewItemUI(this);
  this.previewRun=this.run;
  normalizePreviewOutcome(this.run);
  this.visible=previewVisible(this.run);
  this.worldCanvas=document.createElement('canvas');
  this.worldCanvas.width=WIDTH*TILE;this.worldCanvas.height=HEIGHT*TILE;
  this.worldCtx=this.worldCanvas.getContext('2d');this.worldCtx.imageSmoothingEnabled=false;
  this.textures.addCanvas('classic-world-p3',this.worldCanvas);
  this.worldImage=this.add.image(0,0,'classic-world-p3').setOrigin(0).setDepth(0);
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
   const key=e.key.toLowerCase();
   if(this.classSelectionOpen){
    const classes={1:'vigia',2:'arcanista',3:'errante'};
    if(classes[key]){e.preventDefault();this.chooseClass(classes[key]);}
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
   if(key==='escape'){this.aim=null;this.autoPath=[];this.sync();return;}
   if(key==='1'||key==='2'){e.preventDefault();this.selectSkill(Number(key)-1);return;}
   if(key==='r'){e.preventDefault();this.restart();return;}
   if(key==='e'){e.preventDefault();this.autoPath=[];this.perform({type:'INTERACT'});return;}
   if(key==='f'||key==='enter'){
    e.preventDefault();
    if(this.aim!==null)this.castNearest();
    else this.attackNearest();
    return;
   }
   if(this.aim!==null&&movement[key]){e.preventDefault();this.report('MIRA ATIVA: toque no alvo ou F para confirmar. Esc cancela.');return;}
   if(movement[key]){e.preventDefault();this.autoPath=[];this.perform({type:'MOVE',dx:movement[key][0],dy:movement[key][1]});}
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
   if(this.run.over||this.classSelectionOpen||this.run.pendingTalentChoices?.length)return;
   const x=Math.floor(pointer.worldX/TILE),y=Math.floor(pointer.worldY/TILE);
   if(x<0||y<0||x>=WIDTH||y>=HEIGHT)return;
   this.autoPath=[];
   if(this.aim!==null){this.castAt(x,y);return;}
   const p=this.run.hero,enemy=this.run.enemies.find(e=>e.hp>0&&e.x===x&&e.y===y);
   const distance=Math.abs(x-p.x)+Math.abs(y-p.y);
   if(enemy){
    if(distance<=p.range)return this.perform({type:'ATTACK',enemyId:enemy.id});
    this.report('Inimigo fora do alcance. Aproxime-se para atacar.');return;
   }
   if(distance===0){this.perform({type:'INTERACT'});return;}
   if(distance===1){this.perform({type:'MOVE',dx:x-p.x,dy:y-p.y});return;}
   const path=window.GolzdovNavigation.findPath(this.run,WIDTH,HEIGHT,x,y);
   if(path?.length){
    this.autoPath=path;this.nextAutoAt=0;
    this.report('Caminhando até o destino. Outra ação cancela a rota.');
   }else this.report('Destino inacessível ou ainda não explorado.');
  };
  this.input.on('pointerdown',pointerClick);
  const talentList=el('talent-options');
  const onTalentClick=event=>{
   const button=event.target.closest('button[data-preview-talent]');
   if(button&&talentList.contains(button))this.chooseTalent(button.dataset.previewTalent);
  };
  talentList?.addEventListener('click',onTalentClick);
  this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{
   document.removeEventListener('keydown',onKey);
   for(const [button,listener] of buttons)button.removeEventListener('click',listener);
   for(const [button,listener] of classButtons)button.removeEventListener('click',listener);
   this.scale.off('resize',resize);
   this.input.off('pointerdown',pointerClick);
   this.itemUI?.destroy();
   talentList?.removeEventListener('click',onTalentClick);
  });
  this.draw();this.sync();
  this.syncClassPicker();
  if(existing)savePreview(storage(),this.run);
 }
 command(command){
  if(this.classSelectionOpen||this.run.pendingTalentChoices?.length||this.itemUI.active())return;
  this.autoPath=[];
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
  if(command==='restart')this.restart();
 }
 syncClassPicker(){
  const picker=el('class-selection');
  if(picker)picker.classList.toggle('hidden',!this.classSelectionOpen);
 }
 chooseClass(classId){
  if(!PREVIEW_CLASSES[classId])return;
  clearPreview(storage());
  this.run=initialPreviewRun(fixedSeed(),startFloor(),classId);
  this.previewRun=this.run;this.visible=previewVisible(this.run);
  this.aim=null;this.classSelectionOpen=false;this.autoPath=[];
  this.talentSelectedIndex=0;this.lastTalentKey='';
  this.syncClassPicker();
  savePreview(storage(),this.run);
  this.draw();this.sync();
 }
 restart(){
  // Abrir a seleção não apaga a campanha; só escolher uma classe o faz.
  this.autoPath=[];this.aim=null;this.classSelectionOpen=true;this.syncClassPicker();this.sync();
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
  if(this.classSelectionOpen||this.run.over||
    (this.run.pendingTalentChoices?.length&&action.type!=='CHOOSE_TALENT')){
   this.report('Resolva a escolha de ascensão antes de continuar.');return null;
  }
  const result=previewAction(this.run,action);
  this.visible=previewVisible(this.run);
  if(result.consumesTurn||result.events.length||[
   'relic-swap-required','relic-swap-pending','relic-back','relic-equipped',
   'relic-skipped','stairs-cancelled','descended','shrine-used'
  ].includes(result.status))savePreview(storage(),this.run);
  if(result.status==='blocked')this.report('Uma parede de ossos impede a passagem.');
  if(result.status==='out-of-range')this.report('O inimigo está fora do alcance.');
  this.draw();this.sync();
  return result;
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
    const victory=g.previewOutcome==='victory';
    if(el('ending-kicker'))el('ending-kicker').textContent=victory?'O NOME SEPULTADO':'SUA HISTÓRIA FOI INTERROMPIDA';
    if(el('ending-title'))el('ending-title').textContent=victory?'O nome resiste.':'O osso vence.';
    if(el('ending-summary'))el('ending-summary').textContent='Estrato '+g.floor+' · '+g.turn+' turnos · '+g.kills+' abates';
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
   ?g.previewOutcome==='victory'?'VITÓRIA NA PRÉVIA — reinicie para outra expedição.':'FIM DA EXPEDIÇÃO — reinicie para tentar novamente.'
   :(g.pendingTalentChoices?.length?'ASCENSÃO: escolha um talento para continuar.':
   this.itemUI.active()?'Escolha uma opção no painel para continuar.':
   (g.previewLog?.at(-1)||'Explore os corredores do osso.'));
  if(el('recent-log'))el('recent-log').textContent=(g.previewLog||[]).slice(-3).join(' · ');
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
  if(this.run.over||this.classSelectionOpen)return;
  if(this.itemUI.active()&&!this.run.pendingTalentChoices?.length){
   if(time-this.lastPadAt<175)return;
   const pad=navigator.getGamepads?.()?.find(p=>p&&p.connected);
   if(pad&&this.itemUI.pad(pad))this.lastPadAt=time;
   return;
  }
  if(!this.run.pendingTalentChoices?.length&&this.autoPath.length){
   if(time<this.nextAutoAt)return;
   const [dx,dy]=this.autoPath.shift();
   const result=this.perform({type:'MOVE',dx,dy});
   this.nextAutoAt=time+155;
   if(result?.status!=='applied'||this.itemUI.active()||
    this.run.pendingTalentChoices?.length||this.run.over)this.autoPath=[];
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
