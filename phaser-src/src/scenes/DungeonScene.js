import Phaser from 'phaser';
import {initialPreviewRun,previewAction,previewVisible} from '../preview-engine.js';
import {loadPreview,savePreview,clearPreview} from '../preview-save.js';
import {WIDTH,HEIGHT} from '../world.js';
import {drawClassicMap,drawClassicHero} from '../classic-art.js';
import {normalizePreviewOutcome} from '../preview-engine.js';
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
 constructor(){super('DungeonScene');this.run=null;this.lastPadAt=0;}
 create(){
  const existing=loadPreview(storage());
  this.run=existing||initialPreviewRun(fixedSeed(),startFloor());
  this.previewRun=this.run;
  normalizePreviewOutcome(this.run);
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
   const key=e.key.toLowerCase(),movement={
    arrowup:[0,-1],w:[0,-1],arrowdown:[0,1],s:[0,1],
    arrowleft:[-1,0],a:[-1,0],arrowright:[1,0],d:[1,0]
   };
   if(movement[key]){e.preventDefault();this.perform({type:'MOVE',dx:movement[key][0],dy:movement[key][1]});}
   else if(key===' '||key==='.') {e.preventDefault();this.perform({type:'WAIT'});}
   else if(key==='h'||key==='p')this.perform({type:'POTION'});
   else if(key==='f'||key==='enter'){e.preventDefault();this.attackNearest();}
   else if(key==='r'){e.preventDefault();this.restart();}
   else if(key==='r'){e.preventDefault();this.restart();}
  };
  document.addEventListener('keydown',onKey);
  const buttons=[];
  for(const button of document.querySelectorAll('[data-preview-action]')){
   const listener=()=>this.command(button.dataset.previewAction);
   button.addEventListener('click',listener);buttons.push([button,listener]);
  }
  const pointerClick=pointer=>{
   if(this.run.over)return;
   const x=Math.floor(pointer.worldX/TILE),y=Math.floor(pointer.worldY/TILE);
   if(x<0||y<0||x>=WIDTH||y>=HEIGHT)return;
   const p=this.run.hero,enemy=this.run.enemies.find(e=>e.hp>0&&e.x===x&&e.y===y);
   const distance=Math.abs(x-p.x)+Math.abs(y-p.y);
   if(enemy&&distance<=p.range)return this.perform({type:'ATTACK',enemyId:enemy.id});
   if(distance===1)this.perform({type:'MOVE',dx:x-p.x,dy:y-p.y});
  };
  this.input.on('pointerdown',pointerClick);
  this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{
   document.removeEventListener('keydown',onKey);
   for(const [button,listener] of buttons)button.removeEventListener('click',listener);
   this.scale.off('resize',resize);
   this.input.off('pointerdown',pointerClick);
  });
  this.draw();
  this.sync();
  savePreview(storage(),this.run);
 }
 command(command){
  const dirs={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
  if(dirs[command])this.perform({type:'MOVE',dx:dirs[command][0],dy:dirs[command][1]});
  if(command==='wait')this.perform({type:'WAIT'});
  if(command==='potion')this.perform({type:'POTION'});
  if(command==='attack')this.attackNearest();
  if(command==='restart')this.restart();
 }
 restart(){
  clearPreview(storage());
  this.run=initialPreviewRun(fixedSeed(),startFloor());
  this.previewRun=this.run;
  this.visible=previewVisible(this.run);
  savePreview(storage(),this.run);
  this.draw();this.sync();
 }
 attackNearest(){
  if(this.run.over)return;
  const hero=this.run.hero;
  const options=this.run.enemies.filter(e=>e.hp>0&&this.visible.has(e.y*WIDTH+e.x))
   .sort((a,b)=>(Math.abs(a.x-hero.x)+Math.abs(a.y-hero.y))-(Math.abs(b.x-hero.x)+Math.abs(b.y-hero.y)));
  const enemy=options.find(e=>Math.abs(e.x-hero.x)+Math.abs(e.y-hero.y)<=hero.range);
  if(enemy)this.perform({type:'ATTACK',enemyId:enemy.id});
  else this.report('Nenhum inimigo visível ao alcance do ataque.');
 }
 perform(action){
  if(this.run.over){this.report('Expedição encerrada. Inicie outra.');return;}
  const result=previewAction(this.run,action);
  this.visible=previewVisible(this.run);
  if(result.consumesTurn||result.events.length){
   savePreview(storage(),this.run);
  }
  if(result.status==='blocked')this.report('Uma parede de ossos impede a passagem.');
  if(result.status==='out-of-range')this.report('O inimigo está fora do alcance.');
  this.draw();this.sync();
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
  if(el('scene-heading'))el('scene-heading').textContent=title[g.floor-1];
  if(el('scene-status'))el('scene-status').textContent=g.over
   ?g.previewOutcome==='victory'?'VITÓRIA NO RECORTE P2B — reinicie para outra expedição.':'FIM DA EXPEDIÇÃO — reinicie para tentar novamente.'
   :(g.previewLog?.at(-1)||'Explore os corredores do osso.');
  if(el('recent-log'))el('recent-log').textContent=(g.previewLog||[]).slice(-3).join(' · ');
 }
 update(time){
  if(time-this.lastPadAt<175||this.run.over)return;
  const pad=navigator.getGamepads?.()?.find(p=>p&&p.connected);
  if(!pad)return;
  const pressed=i=>!!pad.buttons[i]?.pressed;
  const axis=(a)=>pad.axes[a]||0;
  let cmd=null;
  if(pressed(12)||axis(1)<-.55)cmd='up';
  else if(pressed(13)||axis(1)>.55)cmd='down';
  else if(pressed(14)||axis(0)<-.55)cmd='left';
  else if(pressed(15)||axis(0)>.55)cmd='right';
  else if(pressed(0))cmd='attack';
  else if(pressed(2))cmd='potion';
  else if(pressed(5))cmd='wait';
  if(cmd){this.lastPadAt=time;this.command(cmd);}
 }
}
