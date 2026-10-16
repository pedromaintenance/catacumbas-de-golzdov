'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('P2A mantém Phaser isolado, base relativa e dependências diretas fixadas',()=>{
  const pkg=JSON.parse(read('phaser-src/package.json'));
  assert.equal(pkg.dependencies.phaser,'4.2.1');
  assert.equal(pkg.devDependencies.vite,'6.3.1');
  assert.equal(pkg.private,true);
  const vite=read('phaser-src/vite.config.js');
  assert.match(vite,/base:\s*'\.\/'/);
  assert.match(vite,/outDir:\s*'dist'/);
  const html=read('phaser-src/index.html');
  assert.match(html,/type="module"\s+src="\.\/src\/main\.js"/);
  assert.match(html,/NÃO JOGÁVEL/);
  assert.doesNotMatch(html,/serviceWorker\.register|localStorage|https?:\/\/.*(?:src|href)/i);
  assert.match(read('phaser-src/src/main.js'),/Phaser\.Game/);
  assert.match(read('phaser-src/src/scenes/DungeonScene.js'),/createPreviewWorld/);
  assert.match(read('phaser-src/src/scenes/DungeonScene.js'),/startFollow/);
  const sw=read('sw.js');
  assert.doesNotMatch(sw,/\.\/phaser(?:-src)?\//);
  assert.doesNotMatch(read('index.html'),/href=['"]\.\/phaser/);
});
test('catálogo técnico reproduz os atributos dos oito inimigos do legado',async()=>{
  const {ENEMIES}=await import('../phaser-src/src/world.js');
  const js=read('index.html');
  const match=js.match(/const ENEMIES=(\{[\s\S]*?\});\s*const RELICS=/);
  assert.ok(match,'catálogo ENEMIES no HTML do jogo atual');
  const legacy=vm.runInNewContext('('+match[1]+')');
  assert.deepEqual(Object.keys(ENEMIES),Object.keys(legacy));
  for(const id of Object.keys(legacy)){
    for(const field of ['hp','atk','def'])assert.equal(ENEMIES[id][field],legacy[id][field],id+'.'+field);
  }
});
test('mapas P2A usam o gerador real: cinco estratos determinísticos e conectados',async()=>{
  const {createPreviewWorld,WIDTH,HEIGHT}=await import('../phaser-src/src/world.js');
  const seeds=[1,0x12345678,0x52c4a190,0xffffffff];
  let count=0;
  for(let floor=1;floor<=5;floor++)for(const seed of seeds){
    const left=createPreviewWorld(seed,floor),right=createPreviewWorld(seed,floor);
    assert.equal(JSON.stringify(left.run),JSON.stringify(right.run));
    assert.equal(left.run.map.length,WIDTH*HEIGHT);
    assert.equal(left.run.seen.length,WIDTH*HEIGHT);
    assert.ok(left.visible.has(left.run.hero.y*WIDTH+left.run.hero.x));
    assert.equal(left.run.floor,floor);
    assert.ok(left.run.enemies.length>0);
    assert.ok(left.run.items.length>0);
    const world=left.run,idx=(x,y)=>y*WIDTH+x;
    assert.equal(world.map[idx(world.stairs.x,world.stairs.y)],1);
    const queue=[{x:world.hero.x,y:world.hero.y}],seen=new Set([idx(world.hero.x,world.hero.y)]);
    for(let i=0;i<queue.length;i++){
      const {x,y}=queue[i];
      for(const [dx,dy] of [[0,1],[1,0],[-1,0],[0,-1]]){
        const nx=x+dx,ny=y+dy,k=idx(nx,ny);
        if(nx<=0||ny<=0||nx>=WIDTH-1||ny>=HEIGHT-1||seen.has(k)||world.map[k]!==1)continue;
        seen.add(k);queue.push({x:nx,y:ny});
      }
    }
    assert.ok(seen.has(idx(world.stairs.x,world.stairs.y)),'escada acessível');
    count++;
  }
  assert.equal(count,20);
});
test('a geração e o renderer técnico não escrevem no save legado nem iniciam turnos no frame',()=>{
  for(const p of ['phaser-src/src/world.js','phaser-src/src/scenes/DungeonScene.js','phaser-src/src/main.js']){
    const text=read(p).replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'');
    assert.doesNotMatch(text,/\blocalStorage\b|sessionStorage|navigator\.serviceWorker|save\(|GolzdovTurns\.advance/);
  }
});
