'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const test=require('node:test');
const host={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','relic-offers.js'),'utf8'),host,{filename:'relic-offers.js'});
const rules=host.window.GolzdovRelicOffers;
const catalog=Object.keys(rules.DATA).map(id=>({id}));

test('catálogo define 11 itens com cinco raridades, incluindo maldição real e ancestral de custo 2',()=>{
 assert.equal(catalog.length,11);
 assert.deepEqual(Object.keys(rules.RARITIES).sort(),['ancestral','common','cursed','epic','rare']);
 for(const r of catalog){assert.ok(rules.info(r.id)?.name);assert.ok(rules.info(r.id)?.slots>0);}
 assert.equal(rules.info('omen').rarity,'cursed');
 assert.equal(rules.info('chain').slots,2);
 assert.equal(rules.MAX_SLOTS,4);
});

test('relíquias ofertadas são distintas, não possuídas e reproduzíveis',()=>{
 const hero={relics:['moss','heart']};
 const roll=()=>0;
 const first=rules.offered(catalog,hero,roll).map(r=>r.id);
 const second=rules.offered(catalog,hero,roll).map(r=>r.id);
 assert.deepEqual(first,second);
 assert.equal(first.length,2);
 assert.equal(new Set(first).size,2);
 assert.ok(first.every(id=>!hero.relics.includes(id)));
 assert.equal(rules.offered(catalog,{relics:catalog.map(r=>r.id)},roll).length,0);
});

test('4 espaços; ancestrais custam dois; trocas só cabem após remover o necessário',()=>{
 const hero={relics:['fang','moss','eye','rune']};
 assert.equal(rules.occupied(hero),4);
 assert.equal(rules.capacity(hero),4);
 assert.equal(rules.canFit(hero,'chain'),false);
 assert.equal(rules.canFit(hero,'chain',['fang']),false);
 assert.equal(rules.canFit(hero,'chain',['fang','moss']),true);
 assert.equal(rules.canFit(hero,'omen',['fang']),true);
 assert.equal(rules.occupied({relics:['chain','mirror']}),3);
});

test('saves legados com mais espaços mantêm todos os itens até a troca consciente',()=>{
 const legacy={relics:['fang','moss','eye','rune','ash','chain']};
 assert.equal(rules.occupied(legacy),7);
 assert.equal(rules.capacity(legacy),7);
 assert.equal(rules.canFit(legacy,'omen'),false);
 assert.equal(rules.canFit(legacy,'omen',['moss']),true);
 assert.equal(rules.occupied({relics:['chain','chain']}),2);
});
