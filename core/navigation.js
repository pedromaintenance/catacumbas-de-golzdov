/* Golzdov — navegação pura para Canvas legado e futuro Phaser.
 * Sem DOM, física, tempo real ou RNG. Ordem BFS preservada desde 1.2C.
 */
(function(root){
'use strict';
function inMap(x,y,width,height){return x>0&&y>0&&x<width-1&&y<height-1;}
function cell(x,y,width){return y*width+x;}
function walkable(map,width,height,x,y){return inMap(x,y,width,height)&&map[cell(x,y,width)]===1;}
function lineClear(map,width,height,x0,y0,x1,y1){
  let dx=Math.abs(x1-x0),dy=Math.abs(y1-y0),
    sx=x0<x1?1:-1,sy=y0<y1?1:-1,err=dx-dy;
  while(!(x0===x1&&y0===y1)){
    let e2=2*err;
    if(e2>-dy){err-=dy;x0+=sx;}
    if(e2<dx){err+=dx;y0+=sy;}
    if(x0===x1&&y0===y1)return true;
    if(!inMap(x0,y0,width,height)||map[cell(x0,y0,width)]===0)return false;
  }
  return true;
}
function visibleCells(map,width,height,hero,bonus=0){
  const tiles=new Set(),r=6+bonus;
  for(let y=hero.y-r;y<=hero.y+r;y++)for(let x=hero.x-r;x<=hero.x+r;x++){
    if(!inMap(x,y,width,height)||Math.hypot(x-hero.x,y-hero.y)>r+.25)continue;
    if(lineClear(map,width,height,hero.x,hero.y,x,y))tiles.add(cell(x,y,width));
  }
  return tiles;
}
function findPath(run,width,height,tx,ty){
  const map=run.map,seenCells=run.seen,hero=run.hero,enemies=run.enemies;
  const occupied=(x,y)=>enemies.some(e=>e.hp>0&&e.x===x&&e.y===y);
  if(!seenCells[cell(tx,ty,width)]||!walkable(map,width,height,tx,ty)||occupied(tx,ty))return null;
  const key=(x,y)=>y*width+x,queue=[{x:hero.x,y:hero.y}],
    seen=new Set([key(hero.x,hero.y)]),prev=new Map(),dirs=[[0,-1],[1,0],[0,1],[-1,0]];
  let i=0;
  while(i<queue.length){
    const u=queue[i++];
    if(u.x===tx&&u.y===ty){
      const arr=[];let k=key(tx,ty);
      while(k!==key(hero.x,hero.y)){
        const a=prev.get(k);
        if(!a)return null;
        arr.push(a.dir);k=a.from;
      }
      return arr.reverse();
    }
    for(const [dx,dy] of dirs){
      const x=u.x+dx,y=u.y+dy,k=key(x,y);
      if(!walkable(map,width,height,x,y)||!seenCells[k]||seen.has(k)||occupied(x,y))continue;
      seen.add(k);prev.set(k,{from:key(u.x,u.y),dir:[dx,dy]});queue.push({x,y});
    }
  }
  return null;
}
root.GolzdovNavigation=Object.freeze({inMap,walkable,lineClear,visibleCells,findPath});
})(typeof window!=='undefined'?window:globalThis);
