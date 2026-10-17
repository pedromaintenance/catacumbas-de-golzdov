/* P3A.2 — progressão da preview, usando os mesmos talentos do HTML clássico.
 * O estado da escolha é persistido; abrir a UI ou restaurar um save não sorteia
 * opções novamente. Somente GolzdovCoreRng pode consumir RNG de gameplay.
 */
export const PREVIEW_CLASS_TALENTS=Object.freeze({
  vigia:[
    {id:'v_muralha',kind:'class',icon:'◆',title:'MURALHA VIVA',desc:'Durante Bastião, cada golpe sofrido acumula +3 de dano ao próximo ataque (máximo +9).'},
    {id:'v_runa',kind:'class',icon:'✥',title:'RUNA ESTILHAÇANTE',desc:'Martelo Rúnico também atinge inimigos adjacentes ao alvo, causando metade de seu dano.'},
    {id:'v_juramento',kind:'class',icon:'♥',title:'ÚLTIMO JURAMENTO',desc:'Uma vez por estrato, resista ao dano fatal com 1 PV. Sua defesa efetiva cai em 1 até descer.'}
  ],
  arcanista:[
    {id:'a_ricochete',kind:'class',icon:'光',title:'GLIFO RICOCHETE',desc:'Glifo de Luz atinge um segundo inimigo até 2 casas do alvo, causando metade do dano.'},
    {id:'a_faminto',kind:'class',icon:'✧',title:'GLIFO FAMINTO',desc:'Eliminar o alvo principal com Glifo de Luz recupera 3 de foco.'},
    {id:'a_sonho',kind:'class',icon:'夢',title:'SONHO PROFUNDO',desc:'Sonho Afundado atordoa inimigos atingidos por 1 turno adicional.'}
  ],
  errante:[
    {id:'e_predador',kind:'class',icon:'◉',title:'OLHO PREDADOR',desc:'+20 pontos percentuais de crítico contra inimigos enraizados.'},
    {id:'e_drenante',kind:'class',icon:'❋',title:'ESPINHOS DRENANTES',desc:'Círculo de Espinhos recupera até 2 de foco, conforme os inimigos atingidos.'},
    {id:'e_tiro',kind:'class',icon:'➶',title:'TIRO CALCULADO',desc:'Tiro Fantasma causa +2 dano por casa além da segunda, até +8.'}
  ]
});
export const PREVIEW_UNIVERSAL_TALENTS=Object.freeze([
  {id:'u_vida',kind:'universal',icon:'♥',title:'CARNE RESISTENTE',desc:'+9 vida máxima e cura 9 pontos.'},
  {id:'u_dano',kind:'universal',icon:'⚔',title:'PRESA AFIADA',desc:'+2 de dano básico.'},
  {id:'u_foco',kind:'universal',icon:'✧',title:'MEMÓRIA ARCANA',desc:'+5 de foco máximo e restaura 5 pontos.'}
]);
const host=typeof window!=='undefined'?window:globalThis;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export const talentById=(id,classId)=>[
 ...(PREVIEW_CLASS_TALENTS[classId]||[]),...PREVIEW_UNIVERSAL_TALENTS
].find(t=>t.id===id)||null;
export const pendingTalents=run=>(run?.pendingTalentChoices||[])
 .map(id=>talentById(id,run.hero.classId)).filter(Boolean);
export function beginPreviewLevelUp(run){
 const p=run.hero;
 if(run.pendingTalentChoices?.length||p.xp<p.nextXP)return false;
 p.xp-=p.nextXP;
 p.level++;
 p.nextXP=Math.floor(p.nextXP*1.48+6);
 p.hp=clamp(p.hp+4,0,p.maxhp);
 const all=PREVIEW_CLASS_TALENTS[p.classId]||[];
 const learned=all.filter(t=>p.talents.includes(t.id));
 const options=learned.length>=2?[]:all.filter(t=>!p.talents.includes(t.id));
 const base=[...PREVIEW_UNIVERSAL_TALENTS];
 while(options.length<3&&base.length){
  const i=host.GolzdovCoreRng.integer(run,0,base.length-1);
  options.push(base.splice(i,1)[0]);
 }
 run.pendingTalentChoices=options.map(t=>t.id);
 return true;
}
export function choosePreviewTalent(run,id){
 if(!run?.hero||!Array.isArray(run.pendingTalentChoices)||
    !run.pendingTalentChoices.includes(id))return null;
 const p=run.hero,t=talentById(id,p.classId);
 if(!t)return null;
 if(t.kind==='class'){
  if(p.talents.includes(t.id)||p.talents.filter(x=>(PREVIEW_CLASS_TALENTS[p.classId]||[])
    .some(a=>a.id===x)).length>=2)return null;
  p.talents.push(t.id);
 }else{
  p.upgrades.push(t.id);
  if(id==='u_vida'){p.maxhp+=9;p.hp=clamp(p.hp+9,0,p.maxhp);}
  else if(id==='u_dano')p.atk+=2;
  else if(id==='u_foco'){p.maxmana+=5;p.mana=clamp(p.mana+5,0,p.maxmana);}
 }
 run.pendingTalentChoices=null;
 return t;
}
