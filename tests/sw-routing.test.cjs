'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const sw = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
const ORIGIN = 'https://pedromaintenance.github.io';
const ROOT = ORIGIN + '/catacumbas-de-golzdov/';
const PHASER = ROOT + 'phaser/';

function boot({ installed = true, offline = false } = {}) {
  const listeners = {};
  const calls = { fetch: [], open: [], match: [], delete: [], claim: 0, skipWaiting: 0, respond: 0 };
  const files = new Map();
  if (installed) files.set(ROOT + 'index.html', { title: 'GOLZDOV LEGADO' });
  const caches = {
    async open(name) {
      calls.open.push(name);
      return {
        async match(url) { calls.match.push(String(url)); return files.get(String(url)); },
        async addAll(paths) { calls.addAll = [...paths]; }
      };
    },
    async match(url) { calls.match.push(String(url.url || url)); return files.get(String(url.url || url)); },
    async keys() { return ['golzdov-offline-v7', 'golzdov-offline-v8', 'golzdov-offline-v9', 'golzdov-offline-v10', 'golzdov-offline-v11', 'golzdov-offline-v12', 'golzdov-offline-v13', 'golzdov-offline-v14', 'golzdov-offline-v15', 'golzdov-offline-v16', 'golzdov-offline-v17', 'golzdov-phaser-v1', 'another-app-cache']; },
    async delete(name) { calls.delete.push(name); return true; }
  };
  const self = {
    location: { origin: ORIGIN },
    registration: { scope: ROOT },
    clients: { async claim() { calls.claim++; } },
    async skipWaiting() { calls.skipWaiting++; },
    addEventListener(name, handler) { listeners[name] = handler; }
  };
  const fetch = async request => {
    calls.fetch.push(request.url);
    if (offline) throw new Error('offline');
    return { title: 'REDE: ' + request.url };
  };
  vm.runInNewContext(sw, { self, caches, fetch, Response, URL }, { filename: 'sw.js' });
  function request(url, mode = 'navigate', method = 'GET') {
    const event = {
      request: { url, mode, method },
      respondWith(promise) { calls.respond++; this.result = Promise.resolve(promise); },
    };
    listeners.fetch(event);
    return event;
  }
  return { self, caches, listeners, request, calls };
}

test('service worker P0 libera subpasta /phaser/ e seus HTML sem servir a versão legada', async () => {
  const { request, calls } = boot();
  for (const address of [PHASER, PHASER + 'index.html', PHASER + 'dungeon/', ROOT + 'docs/']) {
    const event = request(address);
    assert.equal(event.result, undefined, address);
  }
  assert.equal(calls.respond, 0);
  assert.equal(calls.open.length, 0);
  assert.equal(calls.fetch.length, 0);
});

test('a raiz e o index oficial continuam disponíveis offline a partir do cache legado', async () => {
  const { request, calls } = boot({ offline: true });
  for (const address of [ROOT, ROOT + 'index.html', ROOT + '?home=1']) {
    const event = request(address);
    assert.equal((await event.result).title, 'GOLZDOV LEGADO');
  }
  assert.equal(calls.respond, 3);
  assert.equal(calls.fetch.length, 0);
});

test('quando o legado não estiver instalado, root funciona online e retorna 503 offline', async () => {
  const online = boot({ installed: false });
  const a = online.request(ROOT);
  assert.equal((await a.result).title, 'REDE: ' + ROOT);
  const offline = boot({ installed: false, offline: true });
  const b = offline.request(ROOT);
  assert.equal((await b.result).status, 503);
});

test('assets independentes passam pela busca normal; /phaser/ não recebe fallback do legado', async () => {
  const { request, calls } = boot();
  const asset = request(PHASER + 'assets/app-123.js', 'no-cors');
  assert.equal((await asset.result).title, 'REDE: ' + PHASER + 'assets/app-123.js');
  assert.equal(calls.fetch.length, 1);
  assert.ok(!calls.match.includes(ROOT + 'index.html'));
});

test('não intercepta outros domínios, outros projetos ou métodos não-GET', () => {
  const { request, calls } = boot();
  request('https://example.org/catacumbas-de-golzdov/');
  request(ORIGIN + '/outro-projeto/');
  request(ROOT + 'saves', 'navigate', 'POST');
  assert.equal(calls.respond, 0);
});

test('a atualização libera o client e apaga somente caches antigos do Golzdov legado', async () => {
  const { listeners, calls } = boot();
  let install, activate;
  listeners.install({ waitUntil(p) { install = p; } });
  await install;
  assert.ok(calls.addAll.includes('./index.html'));
  assert.equal(calls.skipWaiting, 1);
  listeners.activate({ waitUntil(p) { activate = p; } });
  await activate;
  assert.deepEqual(calls.delete, ['golzdov-offline-v7','golzdov-offline-v8','golzdov-offline-v9','golzdov-offline-v10','golzdov-offline-v11','golzdov-offline-v12','golzdov-offline-v13','golzdov-offline-v14','golzdov-offline-v15','golzdov-offline-v16','golzdov-offline-v17']);
  assert.equal(calls.claim, 1);
});

test('cache v18 inclui defesa e Juramento e nenhuma nova chave localStorage', () => {
  assert.match(sw, /const CACHE = 'golzdov-offline-v18'/);
  assert.match(sw, /'\.\/core\/rng\.js'/);
  assert.match(sw, /'\.\/core\/dungeon\.js'/);
  assert.match(sw, /'\.\/core\/navigation\.js'/);
  assert.match(sw, /'\.\/core\/combat\.js'/);
  assert.match(sw, /'\.\/core\/skills\.js'/);
  assert.match(sw, /'\.\/core\/enemies\.js'/);
  assert.match(sw, /'\.\/core\/turns\.js'/);
  assert.match(sw, /'\.\/core\/actions\.js'/);
  assert.match(sw, /'\.\/core\/loot\.js'/);
  assert.match(sw, /'\.\/core\/rewards\.js'/);
  assert.match(sw, /'\.\/core\/defense\.js'/);
  assert.match(sw, /url\.pathname !== homePath && url\.pathname !== indexPath/);
  assert.doesNotMatch(sw, /localStorage/);
});
