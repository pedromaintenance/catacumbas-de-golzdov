'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');

function mockCanvas(){
 const count={rect:0,stroke:0,text:0,ellipse:0};
 const methods={clearRect(){},fillRect(){count.rect++;},strokeRect(){count.stroke++;},
  save(){},restore(){},beginPath(){},ellipse(){count.ellipse++;},
  fill(){},stroke(){},arc(){},moveTo(){},lineTo(){},translate(){},
  fillText(){count.text++;}};
 return {c:methods,count};
}

test('visuais P3 portam paletas dos cinco estratos e os oito sprites Canvas legados',async()=>{
 const legacy=read('index.html'),ported=read('phaser-src/src/classic-art.js');
 const original=legacy.match(/const THEMES=\[[^\n]+?\];/);
 assert.ok(original);
 assert.ok(ported.includes(original[0]),'paleta precisa coincidir com jogo HTML');
 const kinds=['rat','guard','slime','specter','kappa','archer','boss','knight'];
 for(const kind of kinds)assert.match(ported,new RegExp(kind));
 assert.match(ported,/function drawSprite\(/);
 assert.match(ported,/function drawFloor\(/);
 assert.match(ported,/function drawWall\(/);
 assert.match(ported,/function drawItem\(/);
 assert.doesNotMatch(ported,/Math\.random\(|localStorage|sessionStorage|GolzdovTurns/);
 const {CLASSIC_PALETTES}=await import('../phaser-src/src/classic-art.js');
 assert.equal(CLASSIC_PALETTES.length,5);
});
test('renderer legado em Phaser desenha mapa e monstros sem alterar run ou rngState',async()=>{
 const [{drawClassicMap,drawClassicHero},{initialPreviewRun,previewVisible}]=await Promise.all([
  import('../phaser-src/src/classic-art.js'),import('../phaser-src/src/preview-engine.js')]);
 for(const floor of [1,3,5]){
  const run=initialPreviewRun(0x12345678,floor),visible=previewVisible(run);
  const save=JSON.stringify(run);
  const {c,count}=mockCanvas();
  assert.doesNotThrow(()=>drawClassicMap(c,run,visible,36));
  assert.ok(count.rect>0&&count.stroke>0, 'paredes, pisos e itens devem gerar desenho');
  const portrait=mockCanvas();
  assert.doesNotThrow(()=>drawClassicHero(portrait.c,run.hero));
  assert.ok(portrait.count.rect>4);
  assert.equal(JSON.stringify(run),save, 'desenhar não pode consumir RNG nem alterar estado');
 }
});
test('preview P2B com PV zerado vira derrota encerrada ao retomar o save sem turno extra',async()=>{
 const [{initialPreviewRun,normalizePreviewOutcome,previewAction},{loadPreview,savePreview}]=await Promise.all([
  import('../phaser-src/src/preview-engine.js'),import('../phaser-src/src/preview-save.js')]);
 const map=new Map();
 const storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};
 const run=initialPreviewRun(0x12345678,1);run.hero.hp=0;run.over=false;run.previewOutcome=null;
 assert.ok(savePreview(storage,run));
 const restored=loadPreview(storage),turn=restored.turn,rng=restored.rngState;
 assert.equal(normalizePreviewOutcome(restored),true);
 assert.equal(restored.over,true);assert.equal(restored.previewOutcome,'death');
 assert.equal(restored.hero.hp,0);
 const outcome=previewAction(restored,{type:'WAIT'});
 assert.equal(outcome.status,'inactive');
 assert.equal(restored.turn,turn);assert.equal(restored.rngState,rng);
 assert.equal(normalizePreviewOutcome(restored),true);
});
test('cena expõe texturas clássicas, HUD com barras e modal de fim sem reimplementar regras',()=>{
 const scene=read('phaser-src/src/scenes/DungeonScene.js'),html=read('phaser-src/index.html');
 assert.match(scene,/drawClassicMap\(/);
 assert.match(scene,/drawClassicHero\(/);
 assert.match(scene,/textures\.addCanvas/);
 assert.match(scene,/textures\.get\('classic-world-p3'\)\.refresh\(\)/);
 assert.match(scene,/normalizePreviewOutcome\(this\.run\)/);
 assert.match(scene,/previewAction\(this\.run,action\)/);
 assert.doesNotMatch(scene,/Math\.random\(/);
 assert.match(html,/id="run-ending"/);
 assert.match(html,/id="hp-fill"/);
 assert.match(html,/id="focus-fill"/);
 assert.match(html,/data-preview-action="restart"/);
 const css=read('phaser-src/src/style.css');
 assert.match(css,/\.ending-content/);
 assert.match(css,/\.resource-track/);
});
