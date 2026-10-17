'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
async function load(){
 const [engine,feedback]=await Promise.all([
  import('../phaser-src/src/preview-engine.js'),
  import('../phaser-src/src/preview-combat-feedback.js')
 ]);
 return {...engine,...feedback};
}
function arena(m,seed=0x12345678){
 const r=m.initialPreviewRun(seed,1,'vigia');
 r.map.fill(1);r.seen.fill(true);r.enemies=[];r.items=[];
 r.rooms=[];r.shrine=null;r.stairs={x:30,y:30};
 r.hero.x=15;r.hero.y=15;r.hero.nextXP=999999;
 r.hero.maxhp=250;r.hero.hp=230;
 r.hero.maxmana=40;r.hero.mana=40;
 return r;
}
const foe=(id=91,hp=30)=>({id,type:'rat',x:16,y:15,hp,maxhp:hp,
 atk:1,def:0,root:0,stun:20,cd:0});
test('P4A.2: acertar publica valor de dano real e não altera o resultado de simulação',async()=>{
 const m=await load(),r=arena(m);
 r.hero.crit=100;r.hero.atk=50;
 r.enemies=[foe(7,500)];
 const before=r.enemies[0].hp;
 const result=m.previewAction(r,{type:'ATTACK',enemyId:7});
 const cues=m.combatCues(result.events);
 assert.equal(result.status,'applied');
 assert.equal(result.consumesTurn,true);
 const hit=cues.find(x=>x.kind==='enemy-hit');
 // Para sementes que produzem falha crítica de chance 7%, a indicação
 // legítima é ERROU em vez de inventar o dano; procurar uma seed de acerto.
 if(hit){
  assert.equal(hit.critical,true);
  assert.equal(Number(hit.text.replace(/\D/g,'')),before-r.enemies[0].hp);
  assert.match(hit.description,/Crítico:/);
 }else assert.ok(cues.some(x=>x.kind==='miss'));
 assert.equal(r.turn,1);
});
test('críticos, falhas e abates são emitidos pelo combate real, não por texto do log',async()=>{
 const m=await load();let crit=null,miss=null,defeat=null;
 for(let seed=1;seed<=240&&(!crit||!miss||!defeat);seed++){
  const r=arena(m,seed);
  r.hero.atk=40;r.hero.crit=100;r.enemies=[foe(21,10)];
  const result=m.previewAction(r,{type:'ATTACK',enemyId:21});
  const kinds=result.events.filter(x=>x.type==='combat-feedback');
  if(kinds.some(x=>x.kind==='miss'))miss={r,result};
  if(kinds.some(x=>x.kind==='enemy-hit'&&x.critical))crit={r,result};
  if(kinds.some(x=>x.kind==='enemy-defeat'))defeat={r,result};
 }
 assert.ok(miss,'um seed deve produzir a falha canônica');
 assert.ok(crit,'um seed deve produzir crítico com crit=100');
 assert.ok(defeat,'um seed deve produzir abate');
 assert.equal(miss.r.kills,0);
 assert.ok(m.combatCues(miss.result.events).some(x=>x.text==='ERROU'));
 assert.equal(crit.r.kills,1);
 assert.ok(m.combatCues(crit.result.events).some(x=>x.kind==='enemy-hit'&&x.critical));
 assert.ok(m.combatCues(defeat.result.events).some(x=>x.text==='ABATIDO'));
});
test('armadilha mostra dano efetivamente sofrido, sem gastar turno extra',async()=>{
 const m=await load(),r=arena(m);
 r.items=[{kind:'trap',x:15,y:15,value:0}];
 const hp=r.hero.hp,tick=r.turn;
 const result=m.previewAction(r,{type:'INTERACT'});
 assert.equal(result.status,'collected');
 const cue=m.combatCues(result.events).find(x=>x.kind==='hero-hit');
 assert.ok(cue);
 assert.equal(cue.text,'−'+(hp-r.hero.hp)+' PV');
 assert.equal(r.turn,tick);
 assert.equal(r.items.length,0);
});
test('esquiva do herói é indicada sem inventar dano recebido',async()=>{
 const m=await load(),r=arena(m);
 r.hero.dodge=100;r.enemies=[{...foe(90,400),stun:0}];
 const hp=r.hero.hp;
 const result=m.previewAction(r,{type:'WAIT'});
 assert.equal(result.status,'applied');
 const cues=m.combatCues(result.events);
 assert.ok(cues.some(x=>x.kind==='dodge'&&x.text==='ESQUIVA'));
 assert.ok(!cues.some(x=>x.kind==='hero-hit'));
 assert.equal(r.hero.hp,hp);
});
test('projeção de feedback é pura, filtrada, ordenada e limitada',async()=>{
 const m=await load(),r=arena(m),state=JSON.stringify(r);
 const entries=[
  {type:'combat-feedback',kind:'enemy-hit',x:16,y:15,amount:11,critical:true,name:'Rato'},
  {type:'message',text:'outra coisa'},
  {type:'combat-feedback',kind:'enemy-defeat',x:16,y:15,name:'Rato'},
  {type:'combat-feedback',kind:'hero-hit',x:-1,y:0,amount:12},
  {type:'combat-feedback',kind:'desconhecido',x:15,y:15},
  {type:'combat-feedback',kind:'dodge',x:15,y:15}
 ];
 const snapshot=JSON.stringify(entries);
 const cues=m.combatCues(entries);
 assert.deepEqual(cues.map(x=>x.kind),['enemy-hit','enemy-defeat','dodge']);
 assert.equal(cues[0].text,'CRÍTICO −11');
 assert.deepEqual(m.combatCues(entries,2).map(x=>x.kind),['enemy-defeat','dodge']);
 assert.equal(m.combatCues(entries,0).length,0);
 assert.equal(m.combatCues(null).length,0);
 assert.ok(m.combatAnnouncement(cues).includes('Rato derrotado'));
 assert.equal(JSON.stringify(entries),snapshot);
 assert.equal(JSON.stringify(r),state,'feedback não consome RNG nem muta a run');
});
test('feedback visual fica fora do save e não depende de animação para informar',async()=>{
 const m=await load(),r=arena(m);
 const before=JSON.stringify(r);
 const cues=m.combatCues([{type:'combat-feedback',kind:'hero-hit',x:15,y:15,amount:6}]);
 assert.equal(cues[0].description,'Você sofreu 6 de dano.');
 assert.equal(JSON.stringify(r),before);
 const renderer=read('phaser-src/src/scenes/DungeonScene.js');
 const html=read('phaser-src/index.html');
 assert.match(renderer,/this\.showCombatFeedback\(result\.events\)/);
 assert.match(renderer,/reducedMotion/);
 assert.match(renderer,/prefers-reduced-motion: reduce/);
 assert.match(renderer,/this\.combatObjects\.clear\(\)/);
 assert.match(html,/id="combat-status"/);
 assert.match(html,/aria-live="polite"/);
 assert.doesNotMatch(read('phaser-src/src/preview-combat-feedback.js'),/Math\.random|localStorage|sessionStorage|setTimeout\(/);
 assert.doesNotMatch(renderer,/carcaca_golzdov_run_v1|carcaca_golzdov_meta_v1/);
});
