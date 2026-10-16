import Phaser from 'phaser';
import {createPreviewWorld,WIDTH,HEIGHT} from '../world.js';

const TILE=28;
const COLORS={
  rock:0x10131c,stone:0x232937,grid:0x303749,
  floor:0x272734,threshold:0x555366,
  hero:0xffd9a1,halo:0xa47247,enemy:0xc57580,
  stair:0xd3b06b,shrine:0x93acb5,relic:0xb58ec6,
  item:0xc9aa84,trap:0x934d55
};
function seedFromUrl(){
  const args=new URLSearchParams(location.search);
  const n=Number(args.get('seed'));
  return Number.isSafeInteger(n)&&n>0?(n>>>0):0x52c4a190;
}
function floorFromUrl(){
  const n=Number(new URLSearchParams(location.search).get('floor'));
  return Number.isInteger(n)?Math.min(5,Math.max(1,n)):1;
}
function xy(run,p){return [p.x*TILE+TILE/2,p.y*TILE+TILE/2];}

export class DungeonScene extends Phaser.Scene{
  constructor(){super('DungeonScene');}
  create(){
    const {run,visible}=createPreviewWorld(seedFromUrl(),floorFromUrl());
    this.previewRun=run;
    this.cameras.main.setBackgroundColor('#10111a');
    const tileGraphics=this.add.graphics();
    tileGraphics.fillStyle(COLORS.rock);
    tileGraphics.fillRect(0,0,WIDTH*TILE,HEIGHT*TILE);
    for(let y=0;y<HEIGHT;y++)for(let x=0;x<WIDTH;x++){
      const cell=y*WIDTH+x;
      if(!visible.has(cell))continue; // P2A: visibilidade do core, sem atualizar frames.
      const walk=run.map[cell]===1;
      const alternate=((x*7+y*13)%5===0);
      tileGraphics.fillStyle(walk?(alternate?COLORS.threshold:COLORS.floor):COLORS.stone);
      tileGraphics.fillRect(x*TILE,y*TILE,TILE,TILE);
      if(walk){
        tileGraphics.lineStyle(1,COLORS.grid,.35);
        tileGraphics.strokeRect(x*TILE+.5,y*TILE+.5,TILE-1,TILE-1);
      }else{
        tileGraphics.fillStyle(COLORS.rock,.55);
        tileGraphics.fillRect(x*TILE+4,y*TILE+5,TILE-8,4);
      }
    }
    const pin=(pos,char,color)=>{
      if(!pos||!visible.has(pos.y*WIDTH+pos.x))return;
      const [x,y]=xy(run,pos);
      this.add.text(x,y,char,{fontFamily:'monospace',fontSize:'18px',color:'#e5d4bd'})
        .setOrigin(.5).setTint(color).setDepth(4);
    };
    pin(run.stairs,'⇣',COLORS.stair);
    pin(run.shrine,'✥',COLORS.shrine);
    for(const item of run.items){
      const symbol=item.kind==='relic'?'✧':item.kind==='trap'?'×':'◆';
      const color=item.kind==='relic'?COLORS.relic:item.kind==='trap'?COLORS.trap:COLORS.item;
      pin(item,symbol,color);
    }
    for(const enemy of run.enemies){
      if(enemy.hp<=0||!visible.has(enemy.y*WIDTH+enemy.x))continue;
      const [x,y]=xy(run,enemy);
      const circle=this.add.circle(x,y,8,COLORS.enemy).setDepth(5);
      circle.setStrokeStyle(2,0xf5c9c4,.7);
    }
    const [hx,hy]=xy(run,run.hero);
    const hero=this.add.container(hx,hy).setDepth(10);
    hero.add(this.add.circle(0,0,13,COLORS.halo,.24));
    hero.add(this.add.rectangle(0,0,14,16,COLORS.hero).setStrokeStyle(2,0x43352f));
    hero.add(this.add.rectangle(0,-4,4,5,0x412d28));
    this.cameras.main.setBounds(0,0,WIDTH*TILE,HEIGHT*TILE);
    this.cameras.main.startFollow(hero,true,.12,.12);
    this.cameras.main.roundPixels=true;
    const status=document.getElementById('scene-status');
    if(status)status.textContent='MAPA GERADO · ESTADO COMPARTILHADO · SEM TURNOS';
    const seed=document.getElementById('scene-seed');
    if(seed)seed.textContent='ESTRATO '+run.floor+' · SEED '+run.seed.toString(16).toUpperCase().padStart(8,'0');
    const resize=()=>this.cameras.main.setZoom(Math.min(1.5,Math.max(.8,this.scale.width/720)));
    resize();this.scale.on('resize',resize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>this.scale.off('resize',resize));
  }
}
