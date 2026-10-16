/* Golzdov — seis habilidades de classe, independentes de UI/Canvas/Phaser.
 * P1C.2: eventos de ataque e raiz são callbacks síncronos de domínio.
 * A UI recebe mensagens pelo resultado, mantendo modal, som e save no legado.
 * P1C.3 substituirá os callbacks por um despachante determinístico de eventos.
 */
(function(root){
'use strict';
const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const talent=(p,id)=>Array.isArray(p.talents)&&p.talents.includes(id);
function requireRng(){
  if(!root.GolzdovCoreRng)throw Error('Carregue core/rng.js antes de core/skills.js.');
  return root.GolzdovCoreRng;
}
function validateTarget(run,which,x,y,{skills,isVisible,lineClear,enemyAt}){
  const skill=skills[which],p=run.hero;
  if(dist(p,{x,y})>skill.range||!isVisible(x,y)||!lineClear(p.x,p.y,x,y))
    return {status:'unreachable',enemy:null};
  const enemy=enemyAt(x,y);
  if(!(p.classId==='arcanista'&&which===1)&&!enemy)
    return {status:'empty',enemy:null};
  if(p.mana<skill.cost)return {status:'no-focus',enemy};
  return {status:'ready',enemy};
}
function instant(run,which,{skills,hit,onRoot}){
  const p=run.hero,skill=skills[which];
  if(skill.target)throw Error('Uma habilidade com alvo precisa da fase de mira.');
  if(p.mana<skill.cost)return {status:'no-focus'};
  p.mana-=skill.cost;
  if(p.classId==='vigia'){
    p.hp=clamp(p.hp+7+p.level,0,p.maxhp);
    p.buff=4;
    return {status:'used',message:'Bastião: você recupera vida e ergue uma guarda rúnica.',icon:'◆'};
  }
  if(p.classId==='errante'){
    let count=0;
    for(const enemy of [...run.enemies]){
      if(dist(p,enemy)>2)continue;
      hit(enemy,6+p.level,'Espinhos','skill');
      if(enemy.hp>0){enemy.root=2;count++;}
    }
    onRoot('onRoot',{count});
    if(count&&talent(p,'e_drenante'))p.mana=clamp(p.mana+Math.min(2,count),0,p.maxmana);
    return {status:'used',message:count?`${count} inimigos enredados nas raízes de Ironwood.`:'Espinhos crescem, mas não alcançam ninguém.',icon:'❋',count};
  }
  throw Error('A classe não possui habilidade instantânea.');
}
function targeted(run,which,x,y,{skills,isVisible,lineClear,enemyAt,hit}){
  const result=validateTarget(run,which,x,y,{skills,isVisible,lineClear,enemyAt});
  if(result.status!=='ready')return result;
  const p=run.hero,enemy=result.enemy,rand=(a,b)=>requireRng().integer(run,a,b);
  p.mana-=skills[which].cost;
  if(p.classId==='vigia'){
    const damage=p.atk+rand(6,10)+p.level;
    hit(enemy,damage,'Martelo rúnico','skill');
    if(enemy.hp>0)enemy.stun=2;
    if(talent(p,'v_runa')){
      for(const other of [...run.enemies]){
        if(other!==enemy&&other.hp>0&&dist(other,enemy)<=1)
          hit(other,Math.max(1,Math.floor(damage/2)),'Estilhaço rúnico','skill');
      }
    }
  }else if(p.classId==='arcanista'&&which===0){
    const damage=11+rand(0,5)+p.level*2;
    hit(enemy,damage,'Glifo de luz 光','skill');
    if(enemy.hp<=0&&talent(p,'a_faminto'))p.mana=clamp(p.mana+3,0,p.maxmana);
    if(talent(p,'a_ricochete')){
      const second=run.enemies.find(e=>e!==enemy&&e.hp>0&&dist(e,enemy)<=2&&isVisible(e.x,e.y)&&lineClear(p.x,p.y,e.x,e.y));
      if(second)hit(second,Math.max(1,Math.floor(damage/2)),'Eco de luz 光','skill');
    }
  }else if(p.classId==='arcanista'){
    let count=0;
    for(const victim of [...run.enemies]){
      if(Math.hypot(victim.x-x,victim.y-y)>1.6)continue;
      hit(victim,7+rand(1,4)+p.level,'Sonho 夢','skill');
      if(victim.hp>0)victim.stun=talent(p,'a_sonho')?3:2;
      count++;
    }
    if(!count)return {status:'used',message:'O sonho se desfaz na pedra sem encontrar uma mente.',icon:'夢'};
  }else if(p.classId==='errante'){
    const bonus=talent(p,'e_tiro')?Math.min(8,Math.max(0,dist(p,enemy)-2)*2):0;
    hit(enemy,13+rand(0,6)+p.level*2+bonus,'Tiro fantasma','skill');
  }else throw Error('Classe desconhecida para habilidade com alvo.');
  return {status:'used'};
}
root.GolzdovSkills=Object.freeze({validateTarget,instant,targeted});
})(typeof window!=='undefined'?window:globalThis);
