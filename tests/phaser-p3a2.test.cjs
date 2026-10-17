'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
async function modules(){
 const [engine,talents,save]=await Promise.all([
  import('../phaser-src/src/preview-engine.js'),
  import('../phaser-src/src/preview-talents.js'),
  import('../phaser-src/src/preview-save.js')
 ]);
 return {...engine,...talents,...save};
}
function emptyArena(game,classId='vigia'){
 const r=game.initialPreviewRun(0x1a2b3c4d,1,classId);
 r.map.fill(1);r.seen.fill(true);r.enemies=[];r.rooms=[];
 r.stairs={x:31,y:31};r.hero.x=14;r.hero.y=14;return r;
}
test('P3A.2: nove talentos de classe e três universais são idênticos ao HTML',async()=>{
 const m=await modules(),html=read('index.html');
 const classMatch=html.match(/const CLASS_TALENTS=([\s\S]*?);\s*const UNIVERSAL_TALENTS=/);
 const universalMatch=html.match(/const UNIVERSAL_TALENTS=([\s\S]*?);\s*function hasTalent/);
 assert.ok(classMatch&&universalMatch);
 const expectedClasses=vm.runInNewContext('('+classMatch[1]+')');
 const expectedUniversals=vm.runInNewContext('('+universalMatch[1]+')');
 assert.equal(JSON.stringify(m.PREVIEW_CLASS_TALENTS),JSON.stringify(expectedClasses));
 assert.equal(JSON.stringify(m.PREVIEW_UNIVERSAL_TALENTS),JSON.stringify(expectedUniversals));
 assert.equal(Object.values(m.PREVIEW_CLASS_TALENTS).flat().length,9);
});
test('ascensão usa fórmula do HTML e pausa sem gasto adicional de turno ou RNG',async()=>{
 const m=await modules(),r=emptyArena(m);
 const initialMana=r.hero.mana;r.hero.xp=r.hero.nextXP;
 const result=m.previewAction(r,{type:'WAIT'});
 assert.equal(result.consumesTurn,true);
 assert.equal(r.hero.level,2);assert.equal(r.hero.xp,0);
 assert.equal(r.hero.nextXP,Math.floor(22*1.48+6));
 assert.equal(r.hero.hp,r.hero.maxhp);
 assert.deepEqual(r.pendingTalentChoices,['v_muralha','v_runa','v_juramento']);
 const saved=JSON.stringify(r),rng=r.rngState,turn=r.turn;
 for(const type of ['WAIT','POTION','MOVE','SKILL','ATTACK']){
  const action={type,dx:1,dy:0,which:0,enemyId:1};
  const blocked=m.previewAction(r,action);
  assert.equal(blocked.status,'choice-required',type);
  assert.equal(blocked.consumesTurn,false);
 }
 assert.equal(r.hero.mana,Math.min(initialMana+1,r.hero.maxmana));
 assert.equal(JSON.stringify(r),saved);
 assert.equal(r.rngState,rng);assert.equal(r.turn,turn);
});
test('escolha inválida não altera RNG; escolha válida persiste, não consome turno',async()=>{
 const m=await modules(),r=emptyArena(m,'arcanista');
 r.hero.xp=22;m.previewAction(r,{type:'WAIT'});
 const state=JSON.stringify(r),rng=r.rngState,turn=r.turn;
 assert.equal(m.previewAction(r,{type:'CHOOSE_TALENT',talentId:'v_runa'}).status,'invalid-talent');
 assert.equal(JSON.stringify(r),state);
 const outcome=m.previewAction(r,{type:'CHOOSE_TALENT',talentId:'a_ricochete'});
 assert.equal(outcome.status,'talent-chosen');
 assert.equal(outcome.consumesTurn,false);
 assert.equal(r.rngState,rng);assert.equal(r.turn,turn);
 assert.deepEqual(r.hero.talents,['a_ricochete']);
 assert.equal(r.pendingTalentChoices,null);
 const store=new Map(),memory={getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)};
 assert.equal(m.savePreview(memory,r),true);
 assert.equal(m.loadPreview(memory).hero.talents[0],'a_ricochete');
 assert.equal(store.size,1);assert.ok(store.has(m.PREVIEW_SAVE_KEY));
});
test('escolhas permanecem idênticas após salvar/restaurar, sem ressorteio no carregamento',async()=>{
 const m=await modules(),r=emptyArena(m,'errante');
 r.hero.talents=['e_tiro'];r.hero.xp=22;
 m.previewAction(r,{type:'WAIT'});
 assert.equal(r.pendingTalentChoices.length,3);
 const rng=r.rngState,pending=[...r.pendingTalentChoices];
 const data=JSON.stringify(r);
 const saved=JSON.parse(data);
 assert.deepEqual(saved.pendingTalentChoices,pending);
 assert.equal(saved.rngState,rng);
 assert.equal(m.pendingTalents(saved).length,3);
 assert.equal(JSON.stringify(saved),data);
 assert.equal(m.previewAction(saved,{type:'WAIT'}).status,'choice-required');
 assert.equal(saved.rngState,rng);
});
test('no máximo dois talentos exclusivos e melhorias universais acumuláveis',async()=>{
 const m=await modules(),r=emptyArena(m,'vigia');
 r.hero.talents=['v_muralha','v_runa'];r.hero.xp=22;
 m.previewAction(r,{type:'WAIT'});
 assert.ok(r.pendingTalentChoices.every(id=>id.startsWith('u_')));
 assert.equal(r.pendingTalentChoices.length,3);
 const prevAtk=r.hero.atk,prevTurn=r.turn,prevRng=r.rngState;
 assert.equal(m.previewAction(r,{type:'CHOOSE_TALENT',talentId:'u_dano'}).status,'talent-chosen');
 assert.equal(r.hero.atk,prevAtk+2);
 assert.deepEqual(r.hero.upgrades,['u_dano']);
 assert.equal(r.turn,prevTurn);assert.equal(r.rngState,prevRng);
 // Uma melhoria universal pode ser escolhida novamente em nível posterior.
 r.hero.xp=r.hero.nextXP;m.previewAction(r,{type:'WAIT'});
 assert.ok(r.pendingTalentChoices.includes('u_dano'));
 assert.equal(m.previewAction(r,{type:'CHOOSE_TALENT',talentId:'u_dano'}).status,'talent-chosen');
 assert.equal(r.hero.atk,prevAtk+4);
});
test('Último Juramento resiste a um golpe fatal; descida reinicia a condição',async()=>{
 const m=await modules(),r=emptyArena(m,'vigia');
 r.pendingTalentChoices=['v_juramento'];
 m.previewAction(r,{type:'CHOOSE_TALENT',talentId:'v_juramento'});
 r.hero.hp=1;r.hero.def=0;r.enemies=[{id:501,type:'rat',x:15,y:14,hp:50,maxhp:50,
  atk:100,def:0,stun:0,root:0,cd:0}];
 const result=m.previewAction(r,{type:'WAIT'});
 assert.equal(result.consumesTurn,true);
 assert.equal(r.hero.hp,1);
 assert.equal(r.hero.lastOathUsed,true);
 assert.equal(r.hero.oathWeakened,true);
 assert.equal(r.over,false);
 r.enemies=[];r.hero.x=r.stairs.x;r.hero.y=r.stairs.y;
 const turn=r.turn;
 assert.equal(m.previewAction(r,{type:'INTERACT'}).status,'stairs-opened');
 assert.equal(r.floor,1,'não desce automaticamente');
 assert.equal(m.previewAction(r,{type:'STAIRS_DESCEND'}).status,'descended');
 assert.equal(r.turn,turn,'escolha de escada não gasta turno');
 assert.equal(r.floor,2);
 assert.equal(r.hero.lastOathUsed,false);
 assert.equal(r.hero.oathWeakened,false);
});
test('modal expõe seleção para teclado/toque/Xbox e não altera chaves clássicas',()=>{
 const html=read('phaser-src/index.html'),scene=read('phaser-src/src/scenes/DungeonScene.js');
 assert.match(html,/id="talent-selection"/);
 assert.match(html,/id="talent-options"/);
 assert.match(html,/A ASCENSÃO/);
 assert.match(scene,/chooseTalentAt\(/);
 assert.match(scene,/data-preview-talent/);
 assert.match(scene,/pressed\(0\)\)this.chooseTalentAt/);
 assert.doesNotMatch(scene,/carcaca_golzdov_run_v1|carcaca_golzdov_meta_v1/);
});
