'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');

const code = fs.readFileSync(path.join(__dirname, '..', 'relic-effects.js'), 'utf8');
const root = { window: {} };
vm.runInNewContext(code, root, { filename: 'relic-effects.js' });
const fx = root.window.GolzdovRelicEffects;

function fixture(ids, { hp = 20, mana = 1, turn = 6 } = {}) {
  const hero = {
    relics: ids, hp, maxhp: 40, mana, maxmana: 12,
    relicState: { echo: 0, ward: 0, fangTurn: -1 }
  };
  const enemy = { type: 'knight', hp: 50, smolder: 0, exposed: 0, root: 0 };
  const run = { turn, hero, enemies: [enemy] };
  const events = [], hits = [];
  const dispatch = (event, extra = {}) => {
    const ctx = {
      run, hero, enemy, damage: 10, critical: false, kind: 'basic',
      heal: value => { const n = Math.min(hero.maxhp - hero.hp, value); hero.hp += n; return n; },
      focus: value => { const n = Math.min(hero.maxmana - hero.mana, value); hero.mana += n; return n; },
      feedback: (message, icon) => events.push([message, icon]),
      damageEnemy: (target, value, label, source) => {
        hits.push([target, value, label, source]);
        target.hp -= value;
        if (target.hp <= 0) run.enemies = run.enemies.filter(x => x !== target);
      },
      ...extra
    };
    fx.dispatch(event, ctx);
    return ctx;
  };
  return { hero, enemy, run, events, hits, dispatch };
}

test('motor possui os cinco eventos do contrato e dispensa DOM e RNG', () => {
  assert.deepEqual(Object.keys(fx.RELIC_EFFECTS).sort(), ['ash','crown','fang','mirror','moss','rune']);
  for (const event of ['onAttack','onKill','onDodge','onTurnStart','onEnterRoom']) {
    assert.ok(Object.values(fx.RELIC_EFFECTS).some(x => event in x), 'sem ' + event);
  }
  assert.equal(fx.SYNERGIES.length, 3);
  assert.equal(fx.synergiesFor({ relics: [] }).length, 0);
});

test('Presa: bônus em enraizados e uma única recarga por turno, sem duplicação', () => {
  const t = fixture(['fang','fang']);
  t.enemy.root = 2;
  assert.equal(t.dispatch('onAttack').damage, 13);
  t.dispatch('onKill');
  assert.equal(t.hero.mana, 2);
  t.dispatch('onKill');
  assert.equal(t.hero.mana, 2);
  t.run.turn++;
  t.dispatch('onKill');
  assert.equal(t.hero.mana, 3);
  t.dispatch('onKill', { kind: 'burn' });
  assert.equal(t.hero.mana, 3);
});

test('Musgo e Marca restauram separadamente e ativam o Jardim da Medula', () => {
  const t = fixture(['moss', 'rune'], { hp: 14, mana: 3 });
  assert.equal(fx.synergiesFor(t.hero)[0].id, 'jardim-da-medula');
  t.dispatch('onTurnStart');
  assert.equal(t.hero.hp, 16);
  assert.equal(t.hero.mana, 4);
  t.dispatch('onEnterRoom');
  assert.equal(t.hero.hp, 18);
  t.dispatch('onRoot', { count: 2 });
  assert.equal(t.hero.mana, 5);
  assert.equal(t.hero.hp, 21);
  t.dispatch('onRoot', { count: 0 });
  assert.equal(t.hero.hp, 21);
});

test('Espelho, Olho e exposição aplicam bônus uma vez, sem ataques gratuitos', () => {
  const t = fixture(['mirror', 'eye']);
  const active = fx.synergiesFor(t.hero);
  assert.equal(active.length, 1);
  assert.equal(active[0].id, 'olhar-inexistente');
  t.dispatch('onDodge');
  t.dispatch('onDodge');
  assert.equal(t.hero.relicState.echo, 1);
  assert.equal(t.enemy.exposed, 1);
  const first = t.dispatch('onAttack');
  assert.equal(first.damage, 17); // +3 espelho +4 exposição
  assert.equal(t.hero.relicState.echo, 0);
  assert.equal(t.enemy.exposed, 0);
  assert.equal(t.dispatch('onAttack').damage, 10);
});

test('Selo Rachado absorve 2 no próximo golpe e nunca acumula cargas', () => {
  const t = fixture(['crown']);
  t.dispatch('onHurt');
  t.dispatch('onHurt');
  assert.equal(t.hero.relicState.ward, 2);
  assert.equal(t.dispatch('onDefend').damage, 8);
  assert.equal(t.dispatch('onDefend').damage, 10);
});

test('Cinza queima por dois turnos e a Presa potencializa crítico em inimigo já ardendo', () => {
  const t = fixture(['ash', 'fang']);
  assert.equal(fx.synergiesFor(t.hero)[0].id, 'presa-das-cinzas');
  const noPriorBurn = t.dispatch('onAttack', { critical: true, wasSmoldering: false });
  assert.equal(noPriorBurn.damage, 10);
  assert.equal(t.enemy.smolder, 2);
  const nextAttack = t.dispatch('onAttack', { critical: true, wasSmoldering: true });
  assert.equal(nextAttack.damage, 14);
  t.dispatch('onTurnStart');
  t.dispatch('onTurnStart');
  t.dispatch('onTurnStart');
  assert.equal(t.enemy.smolder, 0);
  assert.equal(t.enemy.hp, 46);
  assert.equal(t.hits.length, 2);
  assert.ok(t.hits.every(([enemy, dmg, label, source]) => enemy === t.enemy && dmg === 2 && source === 'burn'));
});

test('sem relíquias e com estado nulo o despacho não altera o combate', () => {
  const empty = fixture([]);
  empty.enemy.root = 3;
  assert.equal(empty.dispatch('onAttack', { damage: 15, critical: true }).damage, 15);
  assert.equal(empty.dispatch('onTurnStart').hero.hp, 20);
  assert.equal(fx.dispatch('onAttack', null), null);
});
