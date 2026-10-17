/* P3 visual: fórmulas de pixels e paletas diretamente adaptadas do
 * renderer Canvas legado (index.html / build 1.3.6). Não altera regras,
 * RNG de simulação ou saves. A composição visual é consumida pelo Phaser.
 */
const THEMES=[{floor:'#29272b',wall:'#504447',light:'#6a5350',accent:'#caad7e',glow:'#caac76'},{floor:'#22262a',wall:'#4b4e51',light:'#657077',accent:'#83a5ae',glow:'#83a5ae'},{floor:'#292227',wall:'#624449',light:'#744f59',accent:'#bd6166',glow:'#c74757'},{floor:'#272529',wall:'#5d5250',light:'#83756b',accent:'#d4b077',glow:'#cbb38d'},{floor:'#252028',wall:'#52434f',light:'#796278',accent:'#d08aa2',glow:'#d95370'}];
function seeded(x,y,f){let n=(Math.imul(x+17,73856093)^Math.imul(y+31,19349663)^Math.imul(f,83492791))>>>0;n^=n>>>13;n=Math.imul(n,1274126177);return(n>>>0)/4294967295;}

function drawSprite(c,hero,type,cx,cy,t,tile){const d=tile,unit=d/20,s=(xx,yy,w,h,color)=>{c.fillStyle=color;c.fillRect(cx+(xx-10)*unit,cy+(yy-10)*unit,w*unit,h*unit);};const pulse=.5+.5*Math.sin(t*3+cx/20);c.save();c.shadowBlur=tile*.18;c.shadowColor=type==='hero'?'#e7b171':type==='boss'?'#ee6985':'#c1a8a2';c.fillStyle='#05060788';c.beginPath();c.ellipse(cx,cy+d*.28,d*.27,d*.095,0,0,7);c.fill();c.shadowBlur=0;
  if(type==='hero'){const p=hero;let cape=p.classId==='vigia'?'#9e4849':p.classId==='arcanista'?'#546d84':'#4d7656';s(5,8,10,9,cape);s(7,4,6,6,'#d6b79a');s(6,4,8,3,p.classId==='vigia'?'#a6a9af':p.classId==='arcanista'?'#aeb8cc':'#638265');s(6,9,8,7,p.classId==='vigia'?'#9e9da1':p.classId==='arcanista'?'#526a85':'#43654a');s(7,16,2,3,'#827d82');s(11,16,2,3,'#827d82');s(6,7,2,1,'#f5d28c');s(12,7,2,1,'#f5d28c');s(14,9,2,7,'#bc9765');if(p.classId==='vigia'){s(15,6,2,8,'#d7c6ad');s(13,5,5,3,'#a9a5ab');}if(p.classId==='arcanista'){s(15,4,2,13,'#d9b66f');s(14,2,4,4,'#94ced0');}if(p.classId==='errante'){s(15,5,1,12,'#d0b07a');s(14,7,1,8,'#d0b07a');}if(p.buff){c.strokeStyle='#d8b277';c.lineWidth=unit;c.beginPath();c.arc(cx,cy,9*unit,0,Math.PI*2);c.stroke();}}
  else if(type==='rat'){s(4,11,13,5,'#957d75');s(7,7,8,7,'#baaa91');s(7,6,3,4,'#d0bd9b');s(12,6,3,4,'#d0bd9b');s(9,11,2,1,'#e85d68');s(13,11,2,1,'#e85d68');s(15,14,4,2,'#816a6b');}
  else if(type==='slime'){s(4,10,13,7,'#355b58');s(5,7,11,8,'#76aa98');s(7,5,7,5,'#91c7ad');s(8,11,2,2,'#172b2d');s(13,11,2,2,'#172b2d');s(6,16,3,2,'#578b7d');s(13,16,4,2,'#578b7d');}
  else if(type==='specter'){s(6,6,9,12,'#826587');s(7,4,7,9,'#c5a9c8');s(7,13,3,5,'#b09bbb');s(12,13,3,5,'#b09bbb');s(9,8,2,2,'#552b52');s(13,8,2,2,'#552b52');}
  else if(type==='kappa'){s(5,8,11,9,'#507c5a');s(6,6,9,7,'#89b18e');s(6,4,9,3,'#7d9c79');s(8,10,2,2,'#18292a');s(13,10,2,2,'#18292a');s(16,9,2,8,'#e4d8a9');s(5,17,4,2,'#bca26f');}
  else if(type==='archer'){s(5,7,11,10,'#634e69');s(7,4,8,8,'#9d809b');s(9,8,2,2,'#eb9fc3');s(13,8,2,2,'#eb9fc3');s(15,5,2,13,'#b7a074');s(16,7,1,9,'#ceb3a2');}
  else if(type==='boss'){s(4,8,13,11,'#7e344c');s(6,4,9,10,'#d0a6aa');s(7,1,7,4,'#b19c8b');s(9,7,2,2,'#f34c62');s(13,7,2,2,'#f34c62');s(2,8,3,9,'#78506c');s(17,8,3,9,'#78506c');s(10,0,2,3,'#e2b17f');s(8,13,6,2,'#5d243e');c.strokeStyle='#d3688a';c.lineWidth=1.2*unit;c.beginPath();c.arc(cx,cy,9*unit+pulse*unit,0,7);c.stroke();}
  else{const dark=type==='knight'?'#484859':'#6c5e5f';s(5,8,11,10,dark);s(7,5,8,9,type==='knight'?'#a5a4af':'#bfb9ad');s(8,10,2,2,'#df6c77');s(13,10,2,2,'#df6c77');s(3,9,3,10,'#99928b');s(16,7,2,13,'#a98a77');s(15,5,5,3,'#cac4ad');if(type==='knight')s(7,3,8,2,'#af8b75');}
  c.restore();}

function drawItem(c,item,cx,cy,t,tile){const s=tile/20,k=item.kind;c.save();c.translate(cx,cy);c.shadowBlur=7;c.shadowColor=k==='trap'?'#c65d64':'#cbb17d';c.fillStyle='#11121788';c.beginPath();c.ellipse(0,tile*.3,tile*.21,tile*.07,0,0,7);c.fill();c.font=`bold ${Math.round(tile*.51)}px Georgia`;c.textAlign='center';c.textBaseline='middle';const ic={coins:'◈',potion:'✚',mana:'✧',heal:'♥',relic:'✥',weapon:'⚔',armor:'◆',trap:'⌁'}[k];c.fillStyle={coins:'#efc374',potion:'#9ebd9d',mana:'#87c2d5',heal:'#d77777',relic:'#dbb2e0',weapon:'#e1d1b0',armor:'#bfc6ca',trap:'#654a50'}[k];c.fillText(ic,0,Math.sin(t*3+cx)*s*.55);c.restore();}

function drawFloor(c,floor,cx,cy,tile,x,y,theme,seenNow){const q=seeded(x,y,floor),u=tile;c.fillStyle=theme.floor;c.fillRect(cx,cy,u+1,u+1);c.strokeStyle='#080b0e33';c.lineWidth=Math.max(.6,u*.024);c.strokeRect(cx+.8,cy+.8,u-1.5,u-1.5);if(q>.55){c.fillStyle='#ffffff0b';c.fillRect(cx+u*.2,cy+u*.25,u*.1,u*.055);c.fillRect(cx+u*.68,cy+u*.6,u*.12,u*.04);}if(q>.86){c.strokeStyle='#13131680';c.beginPath();c.moveTo(cx+u*.2,cy+u*.24);c.lineTo(cx+u*.47,cy+u*.37);c.lineTo(cx+u*.38,cy+u*.75);c.stroke();}if(floor>=3&&q>.94){c.fillStyle='#8d323b44';c.fillRect(cx+u*.25,cy+u*.3,u*.45,u*.25);}if(!seenNow){c.fillStyle='#06070ab3';c.fillRect(cx,cy,u,u);}}

function drawWall(c,floor,cx,cy,tile,x,y,theme,seenNow){const u=tile,q=seeded(x,y,floor);c.fillStyle='#16171c';c.fillRect(cx,cy,u+1,u+1);c.fillStyle=theme.wall;c.fillRect(cx+u*.04,cy+u*.04,u*.92,u*.73);c.fillStyle=theme.light;c.fillRect(cx+u*.08,cy+u*.07,u*.85,u*.105);c.fillStyle='#11131b';c.fillRect(cx+u*.04,cy+u*.76,u*.92,u*.2);c.strokeStyle='#161719a0';c.lineWidth=1;c.beginPath();c.moveTo(cx+u*(q>.5?.5:.35),cy+u*.15);c.lineTo(cx+u*(q>.5?.5:.35),cy+u*.76);c.stroke();if(q>.79){c.fillStyle='#9f8b7a50';c.fillRect(cx+u*.6,cy+u*.36,u*.11,u*.2);}if(!seenNow){c.fillStyle='#050608bb';c.fillRect(cx,cy,u,u);}}

const cell=(x,y,w)=>y*w+x;
export function drawClassicMap(c,run,visible,tile=36){
  const width=35,height=35,theme=THEMES[run.floor-1]||THEMES[0];
  c.clearRect(0,0,width*tile,height*tile);
  c.fillStyle='#090b10';c.fillRect(0,0,width*tile,height*tile);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const key=cell(x,y,width);
    if(!run.seen[key])continue;
    const vis=visible.has(key);
    if(run.map[key]===1)drawFloor(c,run.floor,x*tile,y*tile,tile,x,y,theme,vis);
    else drawWall(c,run.floor,x*tile,y*tile,tile,x,y,theme,vis);
  }
  const pin=(point,symbol,color)=>{
    if(!point||!visible.has(cell(point.x,point.y,width)))return;
    const x=(point.x+.5)*tile,y=(point.y+.5)*tile;
    c.save();c.textAlign='center';c.textBaseline='middle';c.font='bold '+Math.round(tile*.65)+'px Georgia';
    c.shadowColor=color;c.shadowBlur=tile*.2;c.fillStyle=color;c.fillText(symbol,x,y);c.restore();
  };
  pin(run.stairs,'⇣','#e6bc72');
  if(!run.altarUsed)pin(run.shrine,'根','#9fe4d5');
  for(const it of run.items)if(visible.has(cell(it.x,it.y,width))){
    drawItem(c,it,(it.x+.5)*tile,(it.y+.5)*tile,0,tile);
  }
  for(const e of run.enemies)if(e.hp>0&&visible.has(cell(e.x,e.y,width))){
    const x=(e.x+.5)*tile,y=(e.y+.5)*tile;
    drawSprite(c,run.hero,e.type,x,y,0,tile);
    if(e.hp<e.maxhp||e.type==='boss'){
      c.fillStyle='#140e16';c.fillRect(x-tile*.38,y-tile*.48,tile*.76,3);
      c.fillStyle=e.type==='boss'?'#e05d76':'#bb777d';
      c.fillRect(x-tile*.38,y-tile*.48,tile*.76*(Math.max(0,e.hp)/e.maxhp),3);
    }
    // As posições fracionárias do marcador antigo eram enviadas ao
    // lookup inteiro de visibilidade, que nunca as desenhava. O inimigo
    // já passou pelo filtro visible: desenhar os sinais aqui é seguro.
    const marks=[];
    if(e.stun>0)marks.push(['✧','#eac9a0']);
    if(e.root>0)marks.push(['根','#91d9b8']);
    if(e.smolder>0)marks.push(['✹','#eb8560']);
    if((e.type==='archer'||e.type==='boss')&&e.cd>0)marks.push(['⌛','#b0c7de']);
    if(marks.length){
      c.save();c.textAlign='center';c.textBaseline='middle';
      c.font='bold '+Math.round(tile*.35)+'px Georgia';
      c.shadowColor='#0d0d16';c.shadowBlur=tile*.11;
      for(const [i,mark] of marks.entries()){
        const ox=(i-(marks.length-1)/2)*tile*.25;
        c.fillStyle=mark[1];c.fillText(mark[0],x+ox,y-tile*.68);
      }
      c.restore();
    }
  }
}
export function drawClassicHero(c,hero,size=64){
  c.clearRect(0,0,size,size);
  drawSprite(c,hero,'hero',size/2,size/2,0,size*.8);
}
export const CLASSIC_PALETTES=THEMES;
