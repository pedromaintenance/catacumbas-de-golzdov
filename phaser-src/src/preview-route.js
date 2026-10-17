/* P4A.1 — navegação de preview: intenção de rota e pausa por ameaça.
 * Sem Phaser, DOM, timers, armazenamento nem geração de números aleatórios.
 * Encontra caminhos apenas em tiles já explorados pelo núcleo canônico.
 */
import './world.js';
import {WIDTH,HEIGHT} from './world.js';
const host=typeof window!=='undefined'?window:globalThis;
export function planPreviewRoute(run,x,y){
 if(!run?.hero||run.over||!Number.isInteger(x)||!Number.isInteger(y)||
  x<1||y<1||x>=WIDTH-1||y>=HEIGHT-1)return null;
 const path=host.GolzdovNavigation.findPath(run,WIDTH,HEIGHT,x,y);
 return path?.length?path.map(([dx,dy])=>[dx,dy]):null;
}
/* Não transforma o movimento em ataque automático: pausa a caminhada ao
 * detectar uma ameaça vista a até três casas, deixando o jogador decidir. */
export function nearPreviewThreat(run,visible,maxDistance=3){
 if(!run?.hero||!visible||maxDistance<1)return false;
 return run.enemies.some(e=>e.hp>0 &&
  Math.abs(e.x-run.hero.x)+Math.abs(e.y-run.hero.y)<=maxDistance &&
  visible.has(e.y*WIDTH+e.x));
}
export function routeCoordinates(hero,path){
 const points=[];let x=hero.x,y=hero.y;
 for(const [dx,dy] of path||[]){
  if(!Number.isInteger(dx)||!Number.isInteger(dy)||Math.abs(dx)+Math.abs(dy)!==1)
   return [];
  x+=dx;y+=dy;points.push({x,y});
 }
 return points;
}
