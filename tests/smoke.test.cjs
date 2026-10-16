'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const worker = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);

function boot() {
  const storage = new Map();
  const elements = new Map();
  function element(id) {
    if (!elements.has(id)) {
      const flags = new Set(id === 'overlay' ? ['hidden'] : []);
      elements.set(id, {
        id, textContent: '', innerHTML: '', disabled: false, style: {},
        classList: {
          add: v => flags.add(v), remove: v => flags.delete(v),
          contains: v => flags.has(v),
          toggle(v, state) {
            const on = state === undefined ? !flags.has(v) : state;
            if (on) flags.add(v); else flags.delete(v);
          }
        },
        addEventListener() {}, getContext() { return {}; },
        getBoundingClientRect() { return { width: 350, height: 500 }; },
        click() {}
      });
    }
    return elements.get(id);
  }
  const sandbox = {
    console,
    document: {
      getElementById: element,
      querySelectorAll: () => [],
      addEventListener() {},
      createElement: () => element('generated')
    },
    window: { addEventListener() {} },
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: key => storage.delete(key)
    },
    crypto: { getRandomValues: array => { array[0] = 0x12345678; return array; } },
    requestAnimationFrame() { return 0; },
    setTimeout() { return 0; },
    clearTimeout() {},
    performance: { now: () => 0 }
  };
  const hook = "showScreen('home');renderClasses();requestAnimationFrame(render);";
  assert.equal(scripts[0].split(hook).length, 2, 'ponto de instrumentação único');
  const instrumented = scripts[0].replace(
    hook,
    "showScreen('home');renderClasses();globalThis.__testHooks={get:()=>G,startNew,resume,migrateRun,generateFloor,save,learnTalent,levelModal,receiveDamage,hideModal,chooseClass:id=>{selectedClass=id},talents:CLASS_TALENTS,applyRelic,relicEvent,heroHit,worldTurn,inventory,relicSynergies,relics:RELICS,removeRelic,showRelicOffer,acceptRelicOffer,showPendingRelicOffer,collect};requestAnimationFrame(render);"
  );
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'relic-effects.js'), 'utf8'), sandbox, { filename: 'relic-effects.js', timeout: 10000 });
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'relic-offers.js'), 'utf8'), sandbox, { filename: 'relic-offers.js', timeout: 10000 });
  for (const name of ['core/rng.js', 'core/dungeon.js', 'core/navigation.js', 'core/combat.js', 'core/skills.js']) vm.runInNewContext(fs.readFileSync(path.join(ROOT,name), 'utf8'), sandbox, { filename:name, timeout:10000 });
  vm.runInNewContext(instrumented, sandbox, { filename: 'index.html', timeout: 10000 });
  return { hooks: sandbox.__testHooks, storage, elements };
}

function connected(run) {
  const width = 35, height = 35;
  const id = (x, y) => y * width + x;
  const stack = [[run.hero.x, run.hero.y]];
  const seen = new Set();
  while (stack.length) {
    const [x, y] = stack.pop();
    const pos = id(x, y);
    if (seen.has(pos) || x < 0 || x >= width || y < 0 || y >= height || run.map[pos] !== 1) continue;
    seen.add(pos);
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return seen.has(id(run.stairs.x, run.stairs.y)) &&
    run.enemies.every(e => seen.has(id(e.x, e.y))) &&
    run.items.every(i => seen.has(id(i.x, i.y)));
}

test('os scripts embutidos são válidos e cache PWA não depende de versão duplicada', () => {
  assert.equal(scripts.length, 2);
  for (const script of scripts) assert.doesNotThrow(() => new vm.Script(script));
  assert.match(html, /caches\.match\(new URL\(file, location\.href\)\)/);
  assert.match(worker, /const CACHE = 'golzdov-offline-v12'/);
  assert.match(worker, /'\.\/gamepad\.js'/);
  for (const file of ['core/rng.js', 'core/dungeon.js', 'core/navigation.js', 'core/combat.js', 'core/skills.js']) {
    assert.match(html, new RegExp('<script src="\\./'+file.replace('/', '\\/')+'"></script>'));
    assert.ok(worker.includes("'./"+file+"'"));
    assert.ok(html.includes("'./"+file+"'"));
  }
  assert.match(html, /<script src="\.\/gamepad\.js"><\/script>/);
  assert.match(html, /<script src="\.\/relic-effects\.js"><\/script>/);
  assert.match(worker, /'\.\/relic-effects\.js'/);
  assert.match(html, /const FILES = \[.*'\.\/relic-effects\.js'/);
  assert.match(html, /<script src="\.\/relic-offers\.js"><\/script>/);
  assert.match(worker, /'\.\/relic-offers\.js'/);
  assert.match(html, /const FILES = \[.*'\.\/relic-offers\.js'/);
  assert.match(html, /const FILES = \[.*'\.\/gamepad\.js'/);
  assert.doesNotThrow(() => new vm.Script(fs.readFileSync(path.join(ROOT, 'gamepad.js'), 'utf8')));
});

test('a mesma seed reproduz masmorra, itens e inimigos', () => {
  const { hooks } = boot();
  hooks.startNew();
  const snapshot = run => JSON.stringify({
    seed: run.seed, map: run.map, stairs: run.stairs, enemies: run.enemies, items: run.items
  });
  const first = snapshot(hooks.get());
  assert.equal(hooks.get().schemaVersion, 2);
  hooks.startNew();
  assert.equal(snapshot(hooks.get()), first);
});

test('save v1 local migra sem perder o progresso, seed ou meta legados', () => {
  const { hooks, storage } = boot();
  hooks.startNew();
  const old = JSON.parse(JSON.stringify(hooks.get()));
  delete old.seed;
  delete old.rngState;
  delete old.schemaVersion;
  const oldMeta = { best: 5, wins: 3, runs: 8, kills: 120 };
  storage.set('carcaca_golzdov_meta_v1', JSON.stringify(oldMeta));
  storage.set('carcaca_golzdov_run_v1', JSON.stringify(old));
  hooks.resume();
  const run = hooks.get();
  assert.equal(run.schemaVersion, 2);
  assert.deepEqual(Array.from(run.hero.talents), []);
  assert.deepEqual(Array.from(run.hero.upgrades), []);
  assert.ok(run.hero.relicState && run.hero.relicState.echo === 0);
  assert.ok(Array.isArray(run.visitedRooms));
  assert.equal(run.pendingRelicOffer,null);
  assert.equal(run.shopOffers,null);
  assert.ok(run.seed > 0 && run.rngState > 0);
  assert.deepEqual(Array.from(run.map), old.map);
  assert.deepEqual(JSON.parse(storage.get('carcaca_golzdov_meta_v1')), oldMeta);
  hooks.save();
  assert.equal(JSON.parse(storage.get('carcaca_golzdov_run_v1')).schemaVersion, 2);
});

test('nove talentos existem, são ofertados e persistem nas três classes', () => {
  for (const cls of ['vigia', 'arcanista', 'errante']) {
    const { hooks, elements } = boot();
    hooks.chooseClass(cls);
    hooks.startNew();
    assert.equal(hooks.talents[cls].length, 3);
    hooks.get().hero.xp = hooks.get().hero.nextXP;
    hooks.levelModal();
    const firstOffer = elements.get('modal').innerHTML;
    for (const talent of hooks.talents[cls]) {
      assert.ok(firstOffer.includes(talent.title), cls + ': falta ' + talent.title);
    }
    hooks.learnTalent(hooks.talents[cls][0]);
    assert.ok(hooks.get().hero.talents.includes(hooks.talents[cls][0].id));
    hooks.get().hero.xp = hooks.get().hero.nextXP;
    hooks.levelModal();
    const nextOffer = elements.get('modal').innerHTML;
    assert.ok(nextOffer.includes(hooks.talents[cls][1].title));
    assert.ok(nextOffer.includes(hooks.talents[cls][2].title));
    assert.ok(!nextOffer.includes(hooks.talents[cls][0].title));
  }
});

test('Último Juramento salva de uma morte por estrato, mas não de duas', () => {
  const { hooks } = boot();
  hooks.startNew();
  hooks.learnTalent(hooks.talents.vigia[2]);
  hooks.hideModal(true);
  hooks.get().hero.hp = 1;
  hooks.receiveDamage(100, 'Teste');
  assert.equal(hooks.get().hero.hp, 1);
  assert.equal(hooks.get().hero.lastOathUsed, true);
  assert.equal(hooks.get().hero.oathWeakened, true);
  hooks.receiveDamage(100, 'Teste');
  assert.equal(hooks.get().over, true);
});

test('integração real: Musgo e Marca produzem Jardim e persistem no inventário', () => {
  const { hooks, elements, storage } = boot();
  hooks.startNew();
  hooks.hideModal(true);
  const run = hooks.get(), p = run.hero;
  run.enemies = [];
  p.hp = 10; p.mana = 0; run.turn = 5;
  hooks.applyRelic(hooks.relics.find(r => r.id === 'moss'));
  hooks.applyRelic(hooks.relics.find(r => r.id === 'rune'));
  assert.equal(hooks.relicSynergies()[0].id, 'jardim-da-medula');
  hooks.worldTurn();
  assert.equal(p.hp, 12); // bug antigo de 'regen' vs 'moss' corrigido
  assert.equal(p.mana, 1);
  hooks.relicEvent('onRoot', { count: 2 });
  assert.equal(p.hp, 15);
  assert.equal(p.mana, 2);
  hooks.inventory();
  assert.match(elements.get('modal').innerHTML, /SINERGIAS ATIVAS/);
  assert.match(elements.get('modal').innerHTML, /O Jardim da Medula/);
  hooks.save();
  const saved = JSON.parse(storage.get('carcaca_golzdov_run_v1'));
  assert.ok(saved.hero.relics.includes('moss'));
  assert.ok(saved.hero.relics.includes('rune'));
});

test('integração real: crítico queima, turnos consomem efeito sem causar loops', () => {
  const { hooks } = boot();
  hooks.startNew();
  hooks.hideModal(true);
  const run = hooks.get();
  const enemy = { id: 899, type: 'boss', x: 30, y: 30, hp: 80, maxhp: 80,
    atk: 1, def: 1, stun: 0, root: 0, cd: 0 };
  run.enemies = [enemy];
  hooks.applyRelic(hooks.relics.find(r => r.id === 'fang'));
  hooks.applyRelic(hooks.relics.find(r => r.id === 'ash'));
  hooks.heroHit(enemy, 5, 'Teste', 'basic', true);
  assert.equal(enemy.hp, 75);
  assert.equal(enemy.smolder, 2);
  hooks.worldTurn();
  assert.equal(enemy.hp, 73);
  hooks.heroHit(enemy, 5, 'Teste', 'basic', true);
  assert.equal(enemy.hp, 64); // +4 da sinergia, sem queimar novamente de forma recursiva
  hooks.worldTurn();
  hooks.worldTurn();
  assert.equal(enemy.hp, 60);
  assert.equal(enemy.smolder, 0);
});

test('integração real: save v2 antigo ganha relicState sem perder relíquias ou status', () => {
  const { hooks } = boot();
  hooks.startNew();
  const old = JSON.parse(JSON.stringify(hooks.get()));
  old.hero.relics = ['moss', 'mirror', 'eye'];
  delete old.hero.relicState;
  delete old.visitedRooms;
  const migrated = hooks.migrateRun(old);
  assert.deepEqual(Array.from(migrated.hero.relics), old.hero.relics);
  assert.equal(migrated.hero.relicState.echo, 0);
  assert.equal(migrated.hero.relicState.ward, 0);
  assert.deepEqual(Array.from(migrated.visitedRooms), []);
});

test('trocas de relíquias são transacionais: stats e âmbar só mudam depois de confirmar', () => {
  const { hooks,elements }=boot();
  hooks.startNew();hooks.hideModal(true);
  const run=hooks.get(),p=run.hero,find=id=>hooks.relics.find(r=>r.id===id);
  for(const id of ['fang','moss','heart','chalice'])hooks.applyRelic(find(id));
  const previous={atk:p.atk,maxhp:p.maxhp,maxmana:p.maxmana,coins:p.coins};
  p.coins=90;
  hooks.acceptRelicOffer(find('chain'),54,null);
  assert.match(elements.get('modal').innerHTML,/BOLSA CHEIA/);
  assert.equal(p.atk,previous.atk);
  assert.equal(p.maxhp,previous.maxhp);
  assert.equal(p.relics.length,4);
  assert.equal(p.coins,90);
  hooks.acceptRelicOffer(find('chain'),54,null,['heart','chalice']);
  assert.equal(p.coins,36);
  assert.deepEqual(Array.from(p.relics),['fang','moss','chain']);
  assert.equal(p.maxhp,previous.maxhp-10);
  assert.equal(p.maxmana,previous.maxmana-7);
  assert.equal(p.atk,previous.atk);
});

test('Nome Roubado reduz PV máximo enquanto equipado e devolve ao ser retirado',()=>{
  const {hooks}=boot();hooks.startNew();hooks.hideModal(true);
  const p=hooks.get().hero,baseHp=p.maxhp,baseAtk=p.atk;
  hooks.applyRelic(hooks.relics.find(r=>r.id==='omen'));
  assert.equal(p.atk,baseAtk+4);
  assert.equal(p.maxhp,baseHp-7);
  hooks.removeRelic('omen');
  assert.equal(p.atk,baseAtk);
  assert.equal(p.maxhp,baseHp);
});

test('oferta dupla gratuita fica pendente no save e pode ser retomada',()=>{
  const {hooks,storage,elements}=boot();
  hooks.startNew();hooks.hideModal(true);
  hooks.get().pendingRelicOffer={source:'relicario',offers:null};
  hooks.showPendingRelicOffer();
  assert.match(elements.get('modal').innerHTML,/Dois nomes nos ossos/);
  assert.match(elements.get('modal').innerHTML,/RECUSAR/);
  const offered=hooks.get().pendingRelicOffer.offers;
  assert.equal(offered.length,2);
  hooks.save();
  const resumed=hooks.migrateRun(JSON.parse(storage.get('carcaca_golzdov_run_v1')));
  assert.deepEqual(Array.from(resumed.pendingRelicOffer.offers),Array.from(offered));
});

test('mercador oferece os mesmos dois itens até compra, sem reroll gratuito',()=>{
  const {hooks,elements}=boot();
  hooks.startNew();hooks.hideModal(true);
  const p=hooks.get().hero;p.coins=100;
  hooks.showRelicOffer('mercador',54);
  const first=[...hooks.get().shopOffers];
  hooks.hideModal(true);
  hooks.showRelicOffer('mercador',54);
  assert.deepEqual(Array.from(hooks.get().shopOffers),first);
  assert.equal(p.coins,100);
  assert.match(elements.get('modal').innerHTML,/Preço: ◈ 54/);
});

test('1.000 estratos gerados mantêm escada, inimigos e itens alcançáveis', () => {
  const { hooks } = boot();
  hooks.startNew();
  for (let i = 0; i < 1000; i++) {
    const run = hooks.get();
    run.floor = i % 5 + 1;
    run.rngState = (0x12345678 + Math.imul(i + 1, 2654435761)) >>> 0 || 1;
    hooks.generateFloor();
    assert.ok(connected(run), 'estrato desconectado na iteração ' + i);
  }
});
