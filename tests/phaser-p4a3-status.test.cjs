'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
async function load(){
 const [engine,status,art]=await Promise.all([
  import('../phaser-src/src/preview-engine.js'),
  import('../phaser-src/src/preview-status.js'),
  import('../phaser-src/src/classic-art.js')
 ]);
 return {...engine,...status,...art};
}
function arena(mod){
 const run=mod.initialPreviewRun(0x12345678,1,'vigia');
 run.map.fill(1);run.seen.fill(true);run.items=[];run.enemies=[];
 run.rooms=[];run.hero.x=15;run.hero.y=15;run.hero.range=3;
 run.hero.nextXP=999999;
 return run;
}
function enemy(id,x,y,type='rat'){
 return {id,x,y,type,hp:15,maxhp:20,atk:3,def:0,
  stun:0,root:0,smolder:0,cd:0};
}
test('P4A.3: condições do inimigo usam somente duração positiva, sem mutação',async()=>{
 const mod=await load();
 const e=enemy(1,16,15,'archer');
 e.stun=2;e.root=3;e.smolder=1;e.cd=2;
 const before=JSON.stringify(e);
 assert.deepEqual(mod.enemyPreviewConditions(e).map(c=>[c.kind,c.turns]),
  [['stun',2],['root',3],['smolder',1],['cooldown',2]]);
 assert.equal(JSON.stringify(e),before);
 e.type='rat';
 assert.equal(mod.enemyPreviewConditions(e).some(x=>x.kind==='cooldown'),false);
 e.stun=0;e.root=-2;e.smolder=NaN;
 assert.deepEqual(mod.enemyPreviewConditions(e),[]);
});
test('ameaça atrás da neblina NÃO vaza nome, HP nem condição no painel',async()=>{
 const mod=await load(),run=arena(mod);
 const hidden=enemy(3,17,15,'boss');hidden.stun=4;
 run.enemies=[hidden];
 const visible=new Set([15*35+15,15*35+16]);
 const state=JSON.stringify(run);
 const out=mod.previewThreats(run,visible);
 assert.equal(out.total,0);assert.deepEqual(out.threats,[]);
 assert.equal(JSON.stringify(out).includes('Escrivão'),false);
 assert.equal(JSON.stringify(run),state);
});
test('ordenação por distância/id, limite e saúde real sem arredondar dano',async()=>{
 const mod=await load(),run=arena(mod);
 run.enemies=[enemy(8,18,15),enemy(2,16,15),enemy(1,15,16),
  enemy(99,20,20)];
 run.enemies[2].hp=4;
 const visible=new Set(run.enemies.map(e=>e.y*35+e.x));
 const result=mod.previewThreats(run,visible,2);
 assert.equal(result.total,4);
 assert.deepEqual(result.threats.map(e=>e.id),[1,2]);
 assert.equal(result.threats[0].hp,4);
 assert.equal(result.threats[0].maxhp,20);
 assert.equal(result.threats[0].distance,1);
 assert.equal(mod.previewThreats(run,visible,0).threats.length,0);
 assert.equal(mod.previewThreats(run,visible,40).threats.length,4);
});
test('alvo somente atacável com alcance e linha de visão canônicos',async()=>{
 const mod=await load(),run=arena(mod);
 const near=enemy(10,17,15),far=enemy(11,22,15);
 run.enemies=[near,far];
 const visible=new Set([near.y*35+near.x,far.y*35+far.x]);
 let out=mod.previewThreats(run,visible);
 assert.equal(out.threats[0].canAttack,true);
 assert.equal(out.threats[1].canAttack,false);
 run.map[15*35+16]=0;
 out=mod.previewThreats(run,visible);
 assert.equal(out.threats[0].canAttack,false,'parede impede ataque');
 run.map[15*35+16]=1;
 run.over=true;
 assert.equal(mod.previewThreats(run,visible).threats[0].canAttack,false);
});
test('estados do herói representam Bastião, revanche e exaustão',async()=>{
 const mod=await load(),run=arena(mod);
 run.hero.buff=3;run.hero.riposte=2;run.hero.oathWeakened=true;
 const snapshot=JSON.stringify(run);
 assert.deepEqual(mod.previewThreats(run,new Set()).hero.map(x=>x.kind),
  ['guarded','riposte','weakened']);
 assert.deepEqual(mod.previewThreats(run,new Set()).hero.map(x=>x.label),
  ['BASTIÃO','REVANCHE','EXAUSTÃO']);
 assert.equal(JSON.stringify(run),snapshot);
});
test('inimigos derrotados não aparecem; ataque direto usa motor existente',async()=>{
 const mod=await load(),run=arena(mod);
 run.hero.range=1;run.hero.atk=40;
 run.enemies=[enemy(7,16,15),enemy(9,14,15)];
 run.enemies[1].hp=0;
 const visible=new Set([15*35+16,15*35+14]);
 const shown=mod.previewThreats(run,visible);
 assert.deepEqual(shown.threats.map(e=>e.id),[7]);
 assert.equal(shown.threats[0].canAttack,true);
 const before=run.turn;
 const hit=mod.previewAction(run,{type:'ATTACK',enemyId:shown.threats[0].id});
 assert.equal(hit.consumesTurn,true);
 assert.equal(run.turn,before+1);
 assert.equal(mod.previewThreats(run,visible).total,run.enemies.filter(e=>e.hp>0).length);
});
test('ícones Canvas de status mostram Raiz/Atordoamento/Chamas e recarga sem alterar run',async()=>{
 const mod=await load(),run=arena(mod);
 const e=enemy(2,16,15,'archer');
 e.stun=2;e.root=3;e.smolder=1;e.cd=1;
 run.enemies=[e];run.stairs=null;run.shrine=null;
 const ctx={
  clearRect(){},fillRect(){},strokeRect(){},save(){},restore(){},beginPath(){},
  ellipse(){},fill(){},stroke(){},arc(){},moveTo(){},lineTo(){},
  translate(){},fillText(text){this.words.push(text);},words:[]
 };
 const visible=new Set([15*35+16]);
 const before=JSON.stringify(run);
 mod.drawClassicMap(ctx,run,visible,36);
 for(const mark of ['✧','根','✹','⌛'])
  assert.ok(ctx.words.includes(mark),'ícone '+mark+' precisa aparecer sobre inimigo visto');
 assert.equal(JSON.stringify(run),before);
 ctx.words=[];
 mod.drawClassicMap(ctx,run,new Set(),36);
 for(const mark of ['✧','根','✹','⌛'])
  assert.equal(ctx.words.includes(mark),false,'inimigos ocultos não desenham símbolos');
});
test('UI fornece botão acessível sem atacar ocultos nem atravessar escolha modal',()=>{
 const scene=read('phaser-src/src/scenes/DungeonScene.js');
 const html=read('phaser-src/index.html'),css=read('phaser-src/src/style.css');
 assert.match(html,/id="threat-toggle"/);
 assert.match(html,/aria-controls="threat-list"/);
 assert.match(html,/id="hero-condition-summary"/);
 assert.match(scene,/previewThreats\(this\.run,this\.visible/);
 assert.match(scene,/target\.canAttack/);
 assert.match(scene,/this\.itemUI\.active\(\)/);
 assert.match(scene,/list\.replaceChildren\(\)/);
 assert.match(scene,/data-preview-enemy-id/);
 assert.match(css,/\.threat-list\.hidden/);
 assert.doesNotMatch(scene,/carcaca_golzdov_run_v1|carcaca_golzdov_meta_v1/);
});
