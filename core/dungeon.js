/* Carcaça / Golzdov — gerador 1.2C separado de DOM/Canvas/Phaser.
 * Contrato: generateFloor(run, enemyDefinitions, width, height).
 * Mutação do estado da expedição é deliberada, com consumo de RNG idêntico
 * ao do legacy. Não usa render, áudio, storage, relógio ou Math.random().
 * Mudanças de algoritmo DEVEM alterar os golden tests conscientemente.
 */
(function(root){
'use strict';
function distance(a,b){return Math.abs(a.x-b.x)+Math.abs(a.y-b.y);}
function generateFloor(run,definitions,width=35,height=35){
  if(!run||!run.hero||!definitions)throw Error('Expedição inválida para geração de masmorra.');
  const random=root.GolzdovCoreRng;
  if(!random)throw Error('Carregue core/rng.js antes de core/dungeon.js.');
  const rand=(a,b)=>random.integer(run,a,b);
  const pick=a=>random.pick(run,a);
  const idx=(x,y)=>y*width+x;
  const inMap=(x,y)=>x>0&&y>0&&x<width-1&&y<height-1;
  const walk=(x,y)=>inMap(x,y)&&run.map[idx(x,y)]===1;
  function carved(m,x,y){if(x>=1&&y>=1&&x<width-1&&y<height-1)m[idx(x,y)]=1;}
  function digLink(m,ax,ay,bx,by){
    let x=ax,y=ay;
    const horizontal=random.next(run)>.5;
    const cx=()=>{while(x!==bx){carved(m,x,y);x+=Math.sign(bx-x);}};
    const cy=()=>{while(y!==by){carved(m,x,y);y+=Math.sign(by-y);}};
    horizontal?(cx(),cy()):(cy(),cx());
    carved(m,bx,by);
  }
  function freeCell(room){
    for(let j=0;j<22;j++){
      let x=rand(room.x+1,room.x+room.w-2),y=rand(room.y+1,room.y+room.h-2);
      if(walk(x,y)&&!(run.hero.x===x&&run.hero.y===y)
        &&!(run.stairs?.x===x&&run.stairs?.y===y)
        &&!(run.shrine?.x===x&&run.shrine?.y===y)
        &&!run.enemies.some(e=>e.x===x&&e.y===y)
        &&!run.items.some(i=>i.x===x&&i.y===y))return{x,y};
    }
    return null;
  }
  function spawnEnemy(type,x,y){
    const def=definitions[type],bonus=type==='boss'?0:run.floor-1;
    run.enemies.push({id:++run.enemyId,type,x,y,hp:def.hp+bonus*3,maxhp:def.hp+bonus*3,atk:def.atk+Math.floor(bonus/2),def:def.def,stun:0,root:0,cd:0});
  }
  const floor=run.floor;
  run.map=Array(width*height).fill(0);
  run.seen=Array(width*height).fill(false);
  run.enemies=[];
  run.items=[];
  run.rooms=[];
  run.stairs=null;
  run.shrine=null;
  run.altarUsed=false;
  run.chainUsed=false;
  run.visitedRooms=[0];
  run.shopOffers=null;
  run.hero.relicState.echo=0;
  run.hero.relicState.ward=0;
  run.hero.riposte=0;
  run.hero.lastOathUsed=false;
  run.hero.oathWeakened=false;
  // IMPORTANT: rand(10,13) é avaliado novamente em CADA condição do laço.
  // Parece estranho, mas esta é a ordem de RNG do jogo 1.2C.
  let tries=0;
  while(run.rooms.length<rand(10,13)&&tries++<230){
    let w=rand(4,8),h=rand(4,8),x=rand(2,width-w-2),y=rand(2,height-h-2);
    let room={x,y,w,h,cx:Math.floor(x+w/2),cy:Math.floor(y+h/2)};
    if(run.rooms.some(r=>x<r.x+r.w+1&&x+w+1>r.x&&y<r.y+r.h+1&&y+h+1>r.y))continue;
    for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)carved(run.map,xx,yy);
    if(run.rooms.length){
      const prev=run.rooms[run.rooms.length-1];
      digLink(run.map,prev.cx,prev.cy,room.cx,room.cy);
    }
    run.rooms.push(room);
  }
  if(run.rooms.length<3){
    run.rooms=[];
    for(let k=0;k<7;k++){
      let x=3+(k%3)*10,y=3+Math.floor(k/3)*11;
      for(let yy=y;yy<y+6;yy++)for(let xx=x;xx<x+6;xx++)carved(run.map,xx,yy);
      const r={x,y,w:6,h:6,cx:x+3,cy:y+3};
      if(run.rooms.length)digLink(run.map,run.rooms.at(-1).cx,run.rooms.at(-1).cy,r.cx,r.cy);
      run.rooms.push(r);
    }
  }
  const spawn=run.rooms[0];
  run.hero.x=spawn.cx;run.hero.y=spawn.cy;
  const farther=run.rooms.slice(1).sort((a,b)=>distance(b,spawn)-distance(a,spawn))[0]||run.rooms.at(-1);
  run.stairs={x:farther.cx,y:farther.cy};
  let shrineRoom=run.rooms.slice(1).find(r=>r!==farther&&distance(r,spawn)>9);
  if(shrineRoom)run.shrine={x:shrineRoom.cx,y:shrineRoom.cy};
  let optionsByLevel=[
    ['rat','guard'],
    ['rat','guard','slime','archer'],
    ['guard','slime','archer','kappa'],
    ['guard','archer','kappa','specter','knight'],
    ['archer','kappa','specter','knight']
  ];
  let num=7+floor*3;
  for(let n=0;n<num;n++){
    const r=pick(run.rooms.slice(1));
    const cell=freeCell(r);
    if(!cell)continue;
    const type=pick(optionsByLevel[floor-1]);
    spawnEnemy(type,cell.x,cell.y);
  }
  if(floor===5){
    const bossRoom=farther;
    let p={x:bossRoom.cx,y:bossRoom.cy-2};
    if(!walk(p.x,p.y)||distance(p,run.hero)<4)p=freeCell(bossRoom)||{x:bossRoom.cx,y:bossRoom.cy};
    spawnEnemy('boss',p.x,p.y);
  }
  for(let n=0;n<7+floor*2;n++){
    const r=pick(run.rooms.slice(1));
    const p=freeCell(r);
    if(!p)continue;
    let kind=pick(['coins','coins','coins','potion','mana','heal','relic','weapon','armor','trap']);
    if(kind==='relic'&&n>5)kind='coins';
    run.items.push({...p,kind,value:kind==='coins'?rand(4,12)+floor*2:0});
  }
  if(floor>1)run.hero.mana=Math.max(0,Math.min(run.hero.maxmana,run.hero.mana+3));
  return run;
}
root.GolzdovDungeon=Object.freeze({generateFloor,distance});
})(typeof window!=='undefined'?window:globalThis);
