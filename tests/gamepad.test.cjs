'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');

const source = fs.readFileSync(path.join(__dirname, '..', 'gamepad.js'), 'utf8');

function harness() {
  let screen = 'game';
  let aiming = false;
  let active = true;
  const actions = [];
  const classes = flags => ({
    contains: flag => flags.has(flag),
    add: flag => flags.add(flag),
    remove: flag => flags.delete(flag)
  });
  const uiButton = (name, extraClass) => {
    const flags = new Set(extraClass ? [extraClass] : []);
    return {
      name, disabled: false, hidden: false, classList: classes(flags),
      closest: () => null, getClientRects: () => [1],
      focus() {}, scrollIntoView() {},
      click() { actions.push('click:' + name); }
    };
  };
  const menuButtons = [uiButton('fechar', 'close-modal'), uiButton('recompensa1'), uiButton('recompensa2')];
  const homeButtons = [uiButton('iniciar'), uiButton('continuar')];
  const selectButtons = [uiButton('classe'), uiButton('descer')];
  let gamepads = [];
  const pad = {
    id: 'Xbox Wireless Controller (STANDARD GAMEPAD)',
    index: 0, connected: true, mapping: 'standard',
    buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })),
    axes: [0, 0, 0, 0]
  };
  const navigator = { getGamepads: () => gamepads };
  const document = { querySelectorAll(selector) {
    if (selector === '#modal button') return menuButtons;
    if (selector === '#home button') return homeButtons;
    if (selector === '#select button') return selectButtons;
    return [];
  } };
  const window = {};
  vm.runInNewContext(source, { window, navigator, document }, { filename: 'gamepad.js' });
  assert.ok(window.GolzdovGamepad?.create);
  const controller = window.GolzdovGamepad.create({
    getContext: () => screen, isAiming: () => aiming,
    onConnectionChange: connected => actions.push('connection:' + connected),
    onDirection: (dx, dy) => actions.push('direction:' + dx + ',' + dy),
    onConfirm: () => actions.push('attack'),
    onGameBack: () => actions.push('cancel'),
    onModalBack: () => actions.push('dialog-back'),
    onSelectionBack: () => actions.push('selection-back'),
    onSkill: number => { actions.push('skill:' + number); aiming = true; },
    onLeftShoulder: () => actions.push('LB'),
    onRightShoulder: () => actions.push('RB'),
    onPotion: () => actions.push('potion'),
    onWait: () => actions.push('wait'),
    onJournal: () => actions.push('journal'),
    onMenu: () => { actions.push('menu'); screen = 'modal'; }
  });
  return {
    controller, pad, actions, menuButtons, homeButtons,
    connect() { gamepads = [pad]; }, disconnect() { gamepads = []; },
    context(next) { screen = next; },
    setAim(value) { aiming = value; },
    poll(time = 100) { controller.poll(time); },
    tap(button, time = 100) {
      pad.buttons[button].pressed = true; controller.poll(time);
      pad.buttons[button].pressed = false; controller.poll(time + 8);
    }
  };
}

test('Gamepad API opcional: ausência ou desconexão não trava o jogo', () => {
  const h = harness();
  h.poll(10);
  assert.equal(h.actions.length, 0);
  h.connect();
  h.poll(20);
  assert.equal(h.controller.isConnected(), true);
  assert.ok(h.actions.includes('connection:true'));
  h.disconnect();
  h.poll(30);
  assert.equal(h.controller.isConnected(), false);
  assert.ok(h.actions.includes('connection:false'));
});

test('mapeamento Xbox: ataque, habilidades, poção, espera, atalhos e menu', () => {
  const h = harness();
  h.connect();
  h.poll(10);
  for (const [button, expected] of [
    [0, 'attack'], [1, 'cancel'], [2, 'skill:0'], [3, 'skill:1'],
    [4, 'LB'], [5, 'RB'], [6, 'potion'], [7, 'wait'], [8, 'journal'], [9, 'menu']
  ]) {
    h.context('game');
    h.tap(button, 100 + button * 40);
    assert.ok(h.actions.includes(expected), expected);
  }
});

test('habilidades não repetem ao manter botão pressionado', () => {
  const h = harness(); h.connect(); h.poll(10);
  h.pad.buttons[2].pressed = true;
  for (const time of [40, 80, 200, 500, 1200]) h.poll(time);
  assert.equal(h.actions.filter(a => a === 'skill:0').length, 1);
  h.pad.buttons[2].pressed = false; h.poll(1220);
  h.pad.buttons[2].pressed = true; h.poll(1230);
  assert.equal(h.actions.filter(a => a === 'skill:0').length, 2);
});

test('direcional e analógico têm zona morta e repetição controlada', () => {
  const h = harness(); h.connect(); h.poll(10);
  h.pad.axes[0] = 0.4; h.poll(50);
  assert.equal(h.actions.filter(a => a.startsWith('direction:')).length, 0);
  h.pad.axes[0] = 0.91; h.poll(100);
  h.poll(200); h.poll(350); h.poll(510);
  assert.deepEqual(h.actions.filter(a => a.startsWith('direction:')), [
    'direction:1,0', 'direction:1,0', 'direction:1,0'
  ]);
  h.pad.axes[0] = 0; h.poll(600);
  h.pad.buttons[12].pressed = true; h.poll(650);
  assert.ok(h.actions.includes('direction:0,-1'));
});

test('analógico direito movimenta a mira sem mover quando ela não está ativa', () => {
  const h = harness(); h.connect(); h.poll(10);
  h.pad.axes[2] = 0.9; h.poll(30);
  assert.equal(h.actions.filter(a => a.startsWith('direction:')).length, 0);
  h.setAim(true); h.poll(60);
  assert.ok(h.actions.includes('direction:1,0'));
  h.pad.axes[2] = 0; h.poll(70);
  h.pad.axes[3] = -0.95; h.poll(90);
  assert.ok(h.actions.includes('direction:0,-1'));
});

test('A confirma a opção selecionada, B volta e close-modal não rouba o foco', () => {
  const h = harness(); h.context('modal'); h.connect(); h.poll(10);
  assert.equal(h.menuButtons[1].classList.contains('gamepad-focused'), true);
  h.tap(0, 50);
  assert.ok(h.actions.includes('click:recompensa1'));
  h.pad.buttons[13].pressed = true; h.poll(100);
  h.pad.buttons[13].pressed = false; h.poll(110);
  h.tap(0, 150);
  assert.ok(h.actions.includes('click:recompensa2'));
  h.tap(1, 200);
  assert.ok(h.actions.includes('dialog-back'));
});

test('home e seleção podem ser usados sem mouse', () => {
  const h = harness(); h.connect(); h.context('home'); h.poll(10);
  assert.equal(h.homeButtons[0].classList.contains('gamepad-focused'), true);
  h.tap(0, 40);
  assert.ok(h.actions.includes('click:iniciar'));
  h.context('select'); h.poll(60);
  h.tap(1, 80);
  assert.ok(h.actions.includes('selection-back'));
});
