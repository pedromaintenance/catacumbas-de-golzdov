/* Catacumbas de Golzdov — motor declarativo de relíquias 1.2B.
 * Contrato: dispatch(event, {run, hero, ...dados, heal, focus, damageEnemy, feedback}).
 * Eventos disponíveis: onAttack, onKill, onDodge, onTurnStart,
 * onEnterRoom, onDefend, onHurt, onRoot. Mutadores de dano alteram ctx.damage.
 * Nada aqui usa DOM, timers, aleatoriedade, save ou processa turnos adicionais.
 */
(function (root) {
  'use strict';

  const RELIC_EFFECTS = {
    fang: {
      onAttack(ctx) {
        if (ctx.enemy?.root > 0) ctx.damage += 3;
      },
      onKill(ctx) {
        if (ctx.kind !== 'basic' || ctx.hero.relicState.fangTurn === ctx.run.turn) return;
        ctx.hero.relicState.fangTurn = ctx.run.turn;
        ctx.focus(1);
      }
    },
    moss: {
      onTurnStart(ctx) {
        if (ctx.run.turn % 6 === 0) ctx.heal(2);
      },
      onEnterRoom(ctx) {
        ctx.heal(2);
      }
    },
    mirror: {
      onDodge(ctx) {
        ctx.hero.relicState.echo = 1; // cap 1; a dodge is never a free attack
        ctx.feedback('Espelho Afogado: o próximo golpe recebe +3 de dano.', '◉');
      },
      onAttack(ctx) {
        if (!ctx.hero.relicState.echo) return;
        ctx.hero.relicState.echo = 0;
        ctx.damage += 3;
      }
    },
    crown: {
      onDefend(ctx) {
        const ward = ctx.hero.relicState.ward || 0;
        if (!ward) return;
        ctx.hero.relicState.ward = 0;
        ctx.damage = Math.max(1, ctx.damage - ward);
      },
      onHurt(ctx) {
        if (ctx.hero.hp > 0) ctx.hero.relicState.ward = 2;
      }
    },
    rune: {
      onTurnStart(ctx) {
        if (ctx.run.turn % 3 === 0) ctx.focus(1);
      },
      onRoot(ctx) {
        if (ctx.count > 0) ctx.focus(1); // one activation per cast
      }
    },
    ash: {
      onAttack(ctx) {
        if (ctx.critical && ctx.enemy.hp > 0) ctx.enemy.smolder = 2;
      },
      onTurnStart(ctx) {
        // Fixed snapshot: burning cannot spawn another burn/attack/counterattack.
        for (const enemy of [...ctx.run.enemies]) {
          if (enemy.hp <= 0 || !enemy.smolder) continue;
          enemy.smolder = Math.max(0, enemy.smolder - 1);
          ctx.damageEnemy(enemy, 2, 'Cinza ardente', 'burn');
        }
      }
    }
  };

  const SYNERGIES = [
    {
      id: 'olhar-inexistente',
      name: 'O Olhar que Não Existe',
      relics: ['mirror', 'eye'],
      desc: 'Esquivar expõe o agressor. O próximo golpe contra ele causa +4 de dano.',
      onDodge(ctx) {
        if (!ctx.enemy || ctx.enemy.hp <= 0) return;
        ctx.enemy.exposed = 1;
        ctx.feedback('O Olhar que Não Existe: agressor exposto ao próximo golpe.', '◈');
      },
      onAttack(ctx) {
        if (!ctx.enemy?.exposed) return;
        ctx.enemy.exposed = 0;
        ctx.damage += 4;
      }
    },
    {
      id: 'jardim-da-medula',
      name: 'O Jardim da Medula',
      relics: ['moss', 'rune'],
      desc: 'Enraizar inimigos restaura até 3 pontos de vida, uma vez por conjuração.',
      onRoot(ctx) {
        if (ctx.count > 0) ctx.heal(3);
      }
    },
    {
      id: 'presa-das-cinzas',
      name: 'A Presa das Cinzas',
      relics: ['fang', 'ash'],
      desc: 'Um crítico contra um inimigo que já ardia causa +4 de dano.',
      onAttack(ctx) {
        if (ctx.critical && ctx.wasSmoldering) ctx.damage += 4;
      }
    }
  ];

  function synergiesFor(hero) {
    const relics = new Set(hero?.relics || []);
    return SYNERGIES.filter(pair => pair.relics.every(id => relics.has(id)));
  }

  function dispatch(event, ctx) {
    if (!ctx?.run?.hero || !ctx.hero) return ctx;
    const relics = new Set(ctx.hero.relics || []);
    for (const id of relics) {
      const handler = RELIC_EFFECTS[id]?.[event];
      if (typeof handler === 'function') handler(ctx);
    }
    for (const synergy of synergiesFor(ctx.hero)) {
      const handler = synergy[event];
      if (typeof handler === 'function') handler(ctx);
    }
    return ctx;
  }

  root.GolzdovRelicEffects = Object.freeze({
    dispatch, synergiesFor, RELIC_EFFECTS, SYNERGIES
  });
})(window);
