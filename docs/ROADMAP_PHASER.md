# Roadmap de migração — Catacumbas de Golzdov → Phaser 4

**Status:** P0–P1C.3B.3B.2C integrados à `main`. [PR #31](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/31): **80/80 testes verdes**, 252 replays de habilidades e 480 sequências multi-ação com saves. Build 1.3.6 / cache v20 no código principal para teste no Pages. P2A.1 **concluída** no [PR #33](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/33), CI **84/84** + bundle Vite/Phaser validado. P2B.1 **integrada** pelo [PR #34](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/34), CI **90/90**; o job pós-merge colocou `phaser/index.html` e assets na `main`. A rota [`/phaser/`](https://pedromaintenance.github.io/catacumbas-de-golzdov/phaser/) está preparada para teste, **sem confirmação externa de propagação do Pages ou teste de navegador físico**. P3A.1 **integrada** pelo [PR #37](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/37), CI **100/100**, novo bundle de classes e magias na main. P2B.2 **integrada** pelo [PR #36](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/36), CI **94/94 testes** e bundle Vite compilado. **Bundle atualizado em `phaser/` na `main`**, ainda sem playtest externo/browser confirmado. Rota clássica preservada.
## P3A.2 — Ascensão e escolha de talentos (16/10/2026; integrada)

- [x] Portar sem rebalanceamento os nove talentos específicos (3 por classe) e as três melhorias universais do HTML clássico para `phaser-src/src/preview-talents.js`.
- [x] Substituir a progressão simplificada P2B por `nextXP = floor(nextXP * 1.48 + 6)`, recuperação de 4 PV sem alterar o máximo, e três alternativas de talento; no máximo **dois talentos exclusivos** por expedição.
- [x] Persistir `pendingTalentChoices` no save da preview v1, com opções sorteadas **uma única vez** pelo RNG do núcleo; bloqueio de movimentos, combate e habilidades enquanto a escolha estiver pendente.
- [x] Modal responsivo com suporte a mouse, toque, 1/2/3, D-pad e A; escolha válida sem turno adicional e sem nova rolagem aleatória.
- [x] Habilitar Muralha Viva, Olho Predador e Último Juramento na ponte de combate/defesa. Os efeitos de seis talentos ofensivos já existiam em `core/skills.js`.
- [x] Testes de igualdade com as tabelas canônicas, pausa, RNG, persistência, seleção, limite de talentos e juramento.
- [x] [PR #38](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/38) integrado na `main` (`9d2a838`), [CI #38989453125](https://github.com/pedromaintenance/catacumbas-de-golzdov/actions/runs/38989453125) **107/107** e compilação Vite/Phaser. [Workflow pós-merge #38989521087](https://github.com/pedromaintenance/catacumbas-de-golzdov/actions/runs/38989521087) publicou `phaser/index.html`, `index-VYWbE8gZ.js` e `index-B9Wb8Tj2.css` na `main`. QA de navegador público e Xbox físico continuam pendentes.
- [ ] Verificar via HTTP/visual a atualização no Pages e em Xbox/celular reais; sem presumir confirmação.
- [ ] Próximos blocos P3: relíquias e gatilhos (`onAttack`, `onRoot`, `onDefend` etc.), loot/altar/mercador, finais Luz/Raiz, importação de cópia e paridade dos replays. **Preview não substitui o jogo clássico.**

## P3B.3 — O Nome Sepultado: Luz e Raiz (16/10/2026; integrada)

- [x] Substituir o término genérico ao derrotar o Escrivão Sem Nome pela **decisão final**: revelar o Nome (Luz 光) ou guardar o Nome (Raiz 根), com os textos originais de `showFinalChoice` e `showVictoryEnding` da versão HTML.
- [x] Encerrar a simulação e impedir novos turnos/RNG ao matar o chefe. Escolher Luz ou Raiz uma única vez, sem consumo adicional de turno ou sorteio; exibir epílogo específico e estatísticas da expedição.
- [x] Persistir decisão pendente e caminho escolhido na chave isolada `carcaca_golzdov_phaser_preview_run_v1`. Ao recarregar, reabrir a decisão ou exibir o epílogo já finalizado, sem trocar o resultado.
- [x] Migrar saves da preview anterior com `bossDown`, `over` e `previewOutcome='victory'` para a nova decisão, sem tocar no estado de herói, seed, RNG ou contagem de turnos.
- [x] Interface narrativa responsiva com controles 1/2, setas + Enter, mouse/toque e direcional + A no Xbox; botão de nova expedição só após resolver a decisão. Tela de derrota utiliza o texto canônico.
- [x] Testes de coerência narrativa com a base HTML, ambos os finais, bloqueio de entradas, idempotência, morte, saves antigos/novos e compatibilidade das chaves do clássico.
- [x] [PR #41](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/41) integrado à `main` (squash `bc86ea7`). [CI da branch #38992996657](https://github.com/pedromaintenance/catacumbas-de-golzdov/actions/runs/38992996657) **135/135 testes** e compilação Phaser/Vite. [Workflow pós-merge #38993049907](https://github.com/pedromaintenance/catacumbas-de-golzdov/actions/runs/38993049907) publicou `phaser/index.html`, `assets/index-BBnVlTOT.js` e `assets/index-AZsgjZtz.css` na `main`; QA visual no navegador físico ainda pendente.
- [ ] QA visual/HTTP no Pages, caminho completo até o chefe e Xbox/celular físicos. O recorte da preview permanece **separado do PWA HTML**.
- [ ] Próximos marcos: tela de início/pós-jogo, histórico de expedições (metadados exclusivos da preview), replays de cinco estratos, paridade de interface, PWA/QA mobile.

## P3B.2 — Mercador e economia entre estratos (16/10/2026; integrada)

- [x] Integrar à escada o mercador do HTML clássico com os mesmos seis serviços e preços: poção (◈20), cura de 18 PV (◈16), foco cheio (◈16), ataque +1 (◈38), defesa +1 (◈38) e relicário (◈54).
- [x] Manter a compra por ação determinística, sem turno nem RNG extra; impedir compras sem saldo e permitir retorno à escadaria sem descer.
- [x] Persistir as **duas ofertas** de relíquia por estrato na propriedade existente `shopOffers`; não ressorteá-las ao recusar, voltar ao mercado, recarregar o save ou comprar uma delas.
- [x] Cobrar 54 âmbar **somente após a equipagem confirmada**, inclusive em trocas por slots: nenhuma cobrança ao escolher, marcar remoções, recusar ou cancelar a transação. O estoque esgotado não concede recompensas gratuitas.
- [x] Usar o mesmo modal de decisões para mouse, teclado (1–9/Enter/Esc), toque e gamepad; exibir saldo e falta de âmbar.
- [x] Testes de paridade dos seis preços com o HTML, compras, saldo insuficiente, persistência de ofertas, cobrança única, mercado esgotado e transação de troca.
- [x] [PR #40](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/40) integrado à `main` (`e8e9c4d`); [CI da branch #38992226895](https://github.com/pedromaintenance/catacumbas-de-golzdov/actions/runs/38992226895) **127/127** testes e build Phaser/Vite. [Workflow pós-merge #38992297739](https://github.com/pedromaintenance/catacumbas-de-golzdov/actions/runs/38992297739) publicou `phaser/index.html`, `assets/index-DMglLbkv.js` e `assets/index-BbSzixHU.css` na `main`. QA HTTP/visual real ainda pendente.
- [ ] QA HTTP/visual real no Pages e controle/celular físicos.
- [ ] Próximas entregas: finais narrativos Luz/Raiz e pós-jogo, fluxos de progresso, replays completos e balanceamento. HTML/PWA clássico continuam preservados.

## P3B.1 — Interação de itens no Phaser (16/10/2026, integrada)

- [x] Corrigir o recorte P3A que desenhava objetos, mas ignorava quatro tipos de coleta: arma, armadura, armadilha e relicário. Agora todas as oito categorias passam por `GolzdovActions.dispatch(COLLECT)` e `core/loot.js` (incluindo RNG determinístico, dano, status e consumo único).
- [x] Usar o catálogo canônico de **11 relíquias**, ofertas ponderadas, quatro espaços e substituição **transacional** com confirmação, sem perder itens antes da escolha. As ofertas pendentes persistem no save independente e não são sorteadas novamente ao reabrir.
- [x] Integrar eventos de domínio das relíquias (`onAttack/onKill/onRoot/onEnterRoom/onTurnStart/onDodge/onDefend/onHurt`) e recompensas de inimigos ao núcleo da preview.
- [x] Fazer o altar oferecer cura, foco ou relicário; impedir a descida automática pela escada (explorar/descer com confirmação).
- [x] Implementar `E` / botão **INTERAGIR** na casa atual e clique no mapa com caminho BFS até posições conhecidas, um turno por passo e interrupção quando houver escolha, obstáculo ou combate.
- [x] Exibir âmbar e capacidade da bolsa no HUD; modal responsivo para mouse, toque, teclado e Xbox.
- [x] [PR #39](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/39) integrado à `main` (`f0cbb977`); [CI da branch #38991556082](https://github.com/pedromaintenance/catacumbas-de-golzdov/actions/runs/38991556082) **117/117 testes** e build verde. [Workflow pós-merge #38991631866](https://github.com/pedromaintenance/catacumbas-de-golzdov/actions/runs/38991631866) publicou `phaser/index.html`, `index-OZQXHKtv.js` e `index-BbSzixHU.css` na `main`. QA HTTP/visual externo e hardware pendentes.
- [ ] QA manual no Pages/celular/Xbox e checagem de instalação/atualização do cache.
- [ ] P3B seguinte: mercador completo, narrativa de finais Luz/Raiz, fluxo integral de batalha, importação segura de cópia de save, paridade de replays contra HTML. Rota principal e saves clássicos preservados.

**Data do diagnóstico:** 15/10/2026.
**Acompanhamento GitHub:** [issue #11 — migração Phaser](https://github.com/pedromaintenance/catacumbas-de-golzdov/issues/11); [issue #12 — corrigir roteamento PWA](https://github.com/pedromaintenance/catacumbas-de-golzdov/issues/12).
**Objetivo:** migrar a apresentação, a composição das cenas e a entrada para Phaser 4 sem alterar silenciosamente as regras do roguelike, perder os saves ou bloquear o GitHub Pages.

> **Regra de ouro:** cada incremento de código só entra na `main` depois dos testes. A versão estável em `/catacumbas-de-golzdov/` deve permanecer jogável; a versão Phaser será testada em `/catacumbas-de-golzdov/phaser/`. Este caminho experimental é planejado, **não está publicado ainda**.

## 1. Inventário do jogo real (15/10/2026)

Inspecionado diretamente na branch principal do repositório:

- Jogo de HTML único (`index.html`, aproximadamente 94 KB, 500 linhas de código altamente compactado), com layout CSS, telas, interface, desenho no Canvas 2D, entradas e regras de gameplay fortemente acopladas.
- Mapa procedural de **35 × 35**, cinco estratos, salas, corredores, campo de visão, neblina, busca de caminho e mapa menor; a renderização atual é em pixel art procedural por comandos Canvas (`drawSprite`, `drawFloor`, `drawWall`, `drawItem`, `render`).
- **Três classes**, nove talentos de classe, upgrades universais, ataque básico, duas habilidades ativas, poções, combate e IA por **turnos**, mercador, altars, escolhas de nível, chefe e dois finais existentes.
- RNG próprio com `seed` e `rngState` persistidos. Save local `carcaca_golzdov_run_v1` com `schemaVersion: 2`; metaprogressão em `carcaca_golzdov_meta_v1`; importação e exportação JSON.
- Módulos separados `gamepad.js`, `relic-effects.js` e `relic-offers.js`. Onze relíquias após 1.2C, três sinergias, cinco categorias de raridade, slots e troca confirmada.
- PWA `sw.js` com cache `golzdov-offline-v7`; `manifest.webmanifest` e ícones. Testes Node em `tests/*.test.cjs` via GitHub Actions, incluindo mil mapas.
- Roadmap de conteúdo 2.0 permanece em `docs/ROADMAP_2.0.md`; migração de engine é **trilha técnica paralela**, não substitui aquele planejamento.

### Por que migrar

Phaser oferece estrutura de cenas, câmeras, sprite/textura, efeitos, áudio e entrada unificada. Não é necessário usar física de tempo real: Golzdov continuará em grade e por turnos; Phaser será o **renderer e adaptador de entradas**, não o dono das regras.

**Stack-base recomendada:** Phaser **4.2.1** (versão estável verificada em 15/10/2026; fixar dependências no início da implementação), JavaScript moderno com **Vite** e módulos ES. Evitar adicionar React ou grandes frameworks de UI nesta migração. O código de gameplay deve ser puro, importável sem DOM, Phaser ou Canvas. Evolução para TypeScript pode ocorrer mais tarde, de forma independente.

Referências técnicas oficiais:
- https://github.com/phaserjs/phaser/releases
- https://github.com/phaserjs/template-vite
- https://docs.phaser.io/phaser/getting-started/installation
- https://docs.phaser.io/phaser/concepts/input
- https://docs.phaser.io/api-documentation/class/input-gamepad-gamepad

## 2. Estratégia de publicação e saves (decisões obrigatórias)

### Duas rotas no mesmo GitHub Pages

| Rota | Conteúdo | Quem pode mudar |
| --- | --- | --- |
| `/catacumbas-de-golzdov/` | Jogo atual, estável (HTML/Canvas/PWA) | PR próprio com testes; não substituir até paridade |
| `/catacumbas-de-golzdov/phaser/` | Preview da nova engine | Builds funcionais e verificadas, publicadas por PR |
| `/docs/` no repositório | Roadmaps, design, matriz de paridade e changelog | Cada entrega documenta o estado |

**IMPORTANTE — bug de roteamento antes de qualquer preview:** o `sw.js` atual responde a *todas* as navegações de seu escopo com o `index.html` legado em cache. Isso inclui `/phaser/`! Criar PR inicial para restringir a resposta de navegação do SW raiz somente a `/` e `/index.html` relativos à raiz do projeto. Navegações fora dessas rotas devem ir à rede/cache correto, sem retornar o HTML legado. Testar com PWA previamente instalado e sem limpar saves. A versão Phaser poderá usar seu próprio SW com `scope: './'` na pasta `phaser/` e nome de cache distinto.

**Publicação do preview:** código-fonte em `phaser-app/` e build Vite versionado/distribuído estaticamente em `phaser/`, compatível com um Pages servido de `main/(root)`. Ajustar `base: '/catacumbas-de-golzdov/phaser/'` e validar todas as referências de assets. Primeiro confirmar a configuração real do Pages; se a publicação estiver por Actions, adaptar o workflow para servir as duas rotas num mesmo artefato. Nunca trocar settings do Pages sem confirmar o modo existente. Preferir CI que executa `npm ci`, `npm run build`, testes e validação de links da build antes do merge. Não considerar o merge como prova de propagação do Pages; fazer teste HTTP do caminho público quando possível.

### Compatibilidade e isolamento de armazenamento

**Durante preview**, o Phaser não pode escrever automaticamente na chave de save do jogo estável, apesar das rotas terem a mesma origem e compartilharem `localStorage`.

- Legacy somente leitura: `carcaca_golzdov_run_v1` e `carcaca_golzdov_meta_v1`.
- Preview escreve sob prefixos próprios, por exemplo `carcaca_golzdov_phaser_preview_run_v1` e `carcaca_golzdov_phaser_preview_meta_v1`.
- Ferramenta `Importar cópia da expedição atual`: clona e migra o estado, sem alterar a chave original. Exportação JSON segue disponível.
- Definir versão de schema explicitamente; validar alterações compatíveis e estados recuperáveis, inclusive escolhas de relicário pendentes, poções, talentos, relíquias, queimadura, cursor/target, lojas, salas visitadas e carregamento de saves v1/v2.
- Manter `seed` e `rngState` e preservar ordem de chamadas RNG em regras equivalentes. Animação, partículas, UI e áudio usam RNG visual separado (ou não usam RNG).
- Só propor unificar as chaves quando o Phaser substituir a versão estável **e** a migração bidirecional/backup de rollback for resolvida.

## 3. Arquitetura-alvo

```text
phaser-app/
  package.json
  package-lock.json
  vite.config.js
  index.html
  public/
    assets/               # sprites, tiles, áudio e fontes do próprio projeto
    manifest.webmanifest
    icons/
    sw.js                 # escopo restrito à preview Phaser
  src/
    main.js
    core/                 # SEM Phaser, DOM, áudio ou render
      state.js
      actions.js          # MOVE, ATTACK, SKILL, WAIT, POTION, CHOOSE...
      rng.js
      dungeon.js          # grade 35×35, salas, conectividade e seeds
      visibility.js
      pathfinding.js
      combat.js
      enemies.js
      relics.js
      rewards.js
      progression.js
      narrative.js
      save.js
    adapters/
      input.js            # teclado, toque e controle para as mesmas ações
      storage.js          # chaves da preview, migrador, export/import
    phaser/
      config.js
      scenes/
        BootScene.js
        HomeScene.js
        SelectScene.js
        DungeonScene.js
        ModalScene.js
        EndScene.js
      render/
        TileLayer.js
        EntityLayer.js
        EffectsLayer.js
        CameraController.js
    ui/
      hud.js               # inicialmente reaproveitar HUD DOM responsivo
      modal.js             # modal acessível, foco e confirmação
    styles/
      main.css
  tests/
    core.test.js
    migration.test.js
    parity.test.js
    input.test.js
phaser/                    # arquivos estáticos gerados para teste em Pages
docs/
  ROADMAP_PHASER.md
  ROADMAP_2.0.md
```

**Divisão de responsabilidades:**
- `core` recebe uma ação e devolve novo estado + eventos (`MOVE`, `ATTACK`, `DAMAGE`, `SHOW_MODAL`). Um turno só avança quando o núcleo aceita uma ação, nunca por `scene.update()`.
- `Phaser Scenes` e camadas representam o estado e animam eventos, mas não alteram `hp`, `mana`, RNG de simulação, inventário ou IA.
- HUD e escolhas podem continuar em DOM inicialmente (inclusive acessibilidade e layouts mobile). Migrar para UI totalmente Phaser só se houver vantagem demonstrada.
- Sprites atuais desenhados por código podem ser usados como **texturas geradas** em uma primeira versão. Não exigir refazer todos os assets para começar.
- Não usar Arcade Physics ou gravidade para navegação em grade; colisão, visão e pathfinding permanecem no núcleo.
- Uma fila visual pode esperar a conclusão de uma animação **sem** permitir múltiplos turnos ou perda de input; pausar e retomar sem bloquear o save.

## 4. Roadmap incremental — pequenas entregas publicáveis

### P0 — Proteger o Pages atual (pré-requisito; PR isolado)

- [x] Corrigir o fallback de `navigate` no SW legado para não devolver index antigo sob `/phaser/`. (cache v8)
- [x] Simular root online/offline, subrotas, instalação, ativação e cache antigo em testes de Node. **Teste manual com PWA previamente instalado ainda pendente.**
- [ ] Confirmar pelo painel de Settings → Pages se o site serve `main/(root)` ou Actions. A conexão disponível com GitHub não expõe as configurações do Pages; URL pública não foi acessível pelo verificador automático. **Não inferir modo de deploy.**
- [x] Criar smoke test de rotas e de cache para regressões (`tests/sw-routing.test.cjs`).
- [ ] Criar link de preview **apenas quando existir uma página funcional**.

**Aceite:** jogo atual continua utilizável; subpasta acessível sem ser sequestrada pelo SW; saves não mudam. Publicar na `main` porque este PR é uma correção funcional.
**Registro P0 (15/10/2026):** [PR #14](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/14) integrado à main (commit `15df229`), GitHub Actions `success`. [Issue #12](https://github.com/pedromaintenance/catacumbas-de-golzdov/issues/12) fechada.  O handler de `navigate` só chama `respondWith` quando a URL requisitada é exatamente a raiz do projeto ou `index.html`; para `/phaser/` e quaisquer páginas da subpasta ele se abstém, permitindo navegação pela rede ou pelo futuro service worker independente. `golzdov-offline-v8` elimina apenas caches antigos com prefixo legado; cache da futura engine permanece intocado. O jogo principal continua sem alteração de gameplay e as chaves de save existentes não foram alteradas. Deploy real e teste em dispositivo físico ainda a confirmar.


#### Incremento P1A — RNG e geração de masmorras (15/10/2026)

- [x] Extrair o xorshift32 para `core/rng.js`, independente de DOM, áudio, render e Phaser.
- [x] Extrair a geração de mapa, salas, escadas, altar, inimigos, boss e loot para `core/dungeon.js`.
- [x] Fazer o jogo atual usar os módulos novos, preservando as chamadas de render/HUD/visão no adaptador legado.
- [x] Gravar **50 golden snapshots da implementação original** (10 seeds × 5 estratos), com hash de mapa/salas/itens/inimigos/spawn e estado final do RNG.
- [x] Acrescentar testes de paridade por golden snapshots, repetibilidade e isolamento de instâncias.
- [x] Atualizar service worker e verificação de cache para **golzdov-offline-v9**.
- [ ] Extrair campo de visão, pathfinding, ações, IA e efeitos para módulos sem DOM (P1B).
- [ ] Implementar `dispatch(action)` puramente testável com snapshots de combate (P1B/P1C).

**Integração:** concluída pelo [PR #15](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/15), commit `10abed3`. **GitHub Actions: 42/42 testes aprovados.** O jogo legado continua na raiz e inclui o novo núcleo; **não existe preview Phaser jogável ainda**.
#### Incremento P1B — Visibilidade e navegação (15/10/2026)

- [x] Extrair linha de visão (LOS), neblina/tiles visíveis e pathfinding BFS para `core/navigation.js`, independente de DOM, Canvas, Phaser, RNG e armazenamento.
- [x] Fazer jogo legado delegar cálculos de visão e percurso ao módulo; manter `reveal()` marcando o mapa como explorado e HUD/controle como adaptadores.
- [x] Gravar 50 referências anteriores à extração (10 seeds × 5 estratos), comparando neblina, áreas visíveis, LOS e BFS para 16 destinos por mapa.
- [x] Cobrir caminhos bloqueados por inimigos, destinos não revelados e paredes em testes próprios.
- [x] Atualizar cache offline para `golzdov-offline-v10` e testes da versão instalada.
- [ ] Extrair combate, IA, turnos e dispatch(action) sem dependências gráficas (P1C).

**Integração:** [PR #17](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/17) integrado à main, commit `b8c8fa4`, GitHub Actions `success`. Goldens de 50 cenários e 1.000 masmorras verdes. O jogo original continua jogável; preview Phaser ainda não publicada.
### P1C.3B.3B.2C — Seis habilidades via SKILL e replays sequenciais (16/10/2026)

- [x] Acrescentar `SKILL` ao despachante `core/actions.js` com duas fases: `instant` (Bastião e Círculo de Espinhos) e `targeted` (Martelo Rúnico, Glifo de Luz, Sonho Afundado e Tiro Fantasma).
- [x] Preservar validações de foco, alcance, linha de visão, mira, talentos, ricochetes, enraizamento e efeitos síncronos de relíquias. O núcleo de habilidades `core/skills.js` continua responsável pela resolução determinística, sem DOM/Phaser.
- [x] Eventos de log, áudio e avanço de turno produzidos pelo dispatcher; o adaptador `index.html` continua gerenciando mira, exibição e saves nas mesmas posições do ciclo.
- [x] Manter os **252 replays originais** de habilidades e acrescentar **480 sequências multi-ação**: 3 classes × 5 estratos × 8 seeds × 4 roteiros, misturando SKILL, WAIT, POTION, MOVE e ATTACK, conferindo estado completo e mira depois de cada ação.
- [x] Atualizar PWA para `golzdov-offline-v20` e identificar **BUILD 1.3.6 · CACHE V20 · P1C.3B.3B.2C** no menu.
- [x] Integrar à `main` após CI verde ([PR #31](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/31)); **propagação real no Pages, PWA e controle físico continuam pendentes de confirmação**.
- [ ] Consolidar checklist de validação do núcleo e iniciar [P2A/P2B (issue #32)](https://github.com/pedromaintenance/catacumbas-de-golzdov/issues/32), com Phaser/Vite e armazenamento isolado, sem afetar a rota estável. Os callbacks de domínio de `core/skills.js` ainda são síncronos, não uma fila de eventos puramente serializável.

**Concluído:** [PR #31](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/31), squash `a312365` em `main`. [CI #38966706705](https://github.com/pedromaintenance/catacumbas-de-golzdov/actions/runs/38966706705): **80/80 testes aprovados**, incluindo 480 sequências (com estado, mira, save e meta após cada ação) e 252 replays de habilidades. Os callbacks de efeitos de domínio são síncronos e podem requerer posterior serialização para Phaser. A preview `/phaser/` ainda **não** está jogável; P2A e P2B continuam pendentes.

### P1C.3B.3B.2B — Morte, escolha final e vitória por eventos (16/10/2026)

- [x] Congelar literalmente `die`, `finalDecision`, `victory` e `endMeta` da build 1.3.4 em `tests/fixtures/legacy-endings.js` **antes** de extrair o código.
- [x] Criar `core/endings.js` sem DOM, Phaser, armazenamento ou RNG. `loss(run)` marca a morte, `decision(run)` marca escolha final e `victory(run,ending)` emite os efeitos finais; `updateMeta(run,meta,win)` calcula o registro sem acessar localStorage.
- [x] Emitir eventos ordenados para `end-meta`, `clear-save`, modal de morte/escolha/vitória e som; interpretação permanece no adaptador `index.html`, preservando os textos e botões anteriores.
- [x] Criar **288 replays** (3 classes × 8 seeds × 12 cenários) de morte, escolha Luz/Raiz, cliques, repetição de chamadas, estatísticas de meta, mensagens dos modais, save e RNG.
- [x] Atualizar a PWA para `golzdov-offline-v19`, com identificação visível **BUILD 1.3.5 · CACHE V19 · P1C.3B.3B.2B**.
- [x] Integrar à `main` após CI verde ([PR #30](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/30)); **verificar Pages propagado e PWA em dispositivo físico ainda pendente**.
- [ ] **P1C.3B.3B.2C:** unificar habilidades `SKILL` e replay de sequências de ações em três classes e cinco estratos.

**Concluído:** [PR #30](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/30), squash `7821d82`, integrado à `main`. [CI #38965206701](https://github.com/pedromaintenance/catacumbas-de-golzdov/actions/runs/38965206701) aprovou **78/78 testes, zero falhas**, incluindo 288 replays sem diferenças de modais, meta, saves e RNG. A propagação real no Pages e testes de gamepad/PWA instalado ainda precisam de confirmação.

### P1C.3B.3B.2A — Dano recebido, Grilhões e Último Juramento (16/10/2026)

- [x] Congelar `receiveDamage` original **antes** da extração em `tests/fixtures/legacy-received-damage.js`.
- [x] Criar `core/defense.js` sem DOM, Phaser, áudio ou armazenamento, separando três momentos: `reduce` (mitigação/buffs/correntes), `apply` (PV e eventos de log/som), `afterHurt` (Último Juramento ou evento `die`).
- [x] Preservar exatamente os gatilhos `onDefend` após mitigação e `onHurt` após redução de PV; **o Juramento só dispara depois de `onHurt`**, permitindo efeitos de relíquias na ordem original.
- [x] Adaptar o `receiveDamage` existente aos eventos, mantendo o modal de morte e a lógica de meta/save legados intactos.
- [x] Acrescentar **576 replays de regressão** (3 classes × 8 seeds × 24 cenários), incluindo golpe fatal, correntes, buffs defensivos, Riposte, Juramento esgotado, dois golpes consecutivos, zero/negativo e relíquias.
- [x] Atualizar PWA `golzdov-offline-v18` e identificação do menu **BUILD 1.3.4 · CACHE V18 · P1C.3B.3B.2A**.
- [x] Integrar à `main` após CI verde ([PR #29](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/29)); **validar propagação no Pages e PWA instalado ainda pendente**.
- [ ] **P1C.3B.3B.2B:** resultados terminais (`die`, `finalDecision`, `victory`) como transições de estado e eventos de UI/meta.
- [ ] **P1C.3B.3B.2C:** unificar `SKILL` no dispatcher, replay de sequências longas de ações/saves e ciclo dos cinco estratos.

**Concluído:** [PR #29](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/29), squash `34e1866`, integrado à `main`. [CI #38963042502](https://github.com/pedromaintenance/catacumbas-de-golzdov/actions/runs/38963042502): **76 testes aprovados, zero falhas**, incluindo 576 replays pareados (HP, logs, RNG, meta, morte e saves) e 408 replays de movimento. Não há alteração de chaves de save; o jogo legado continua jogável na rota principal. **A propagação no Pages/PWA e teste em dispositivo real continuam pendentes.**

### P1C.3B.3B.1 — Ataque básico e dano direto via eventos (16/10/2026)

- [x] Congelar **antes** da refatoração os handlers `attack`, `heroHit`, `hitEnemy` e `receiveDamage` em `tests/fixtures/legacy-attack-damage.js`.
- [x] Adicionar `ATTACK` a `core/actions.js`, com alvo e alcance válidos, linha de visão, acerto, crítico, talentos Olho Predador e Muralha Viva e consumo de riposte. O dispatcher devolve eventos ordenados `log`, `hero-hit`, `sound`, `turn`.
- [x] Extrair a redução direta de PV do inimigo para `core/combat.js::damageEnemy`, devolvendo eventos `log` e `defeat-enemy` para que `relicEvent(onAttack)` e `onKill` permaneçam na ordem legada.
- [x] Adaptar `attack` e `hitEnemy` no `index.html` sem modificar esquema do save, mira, hit effects, resultados terminais ou áudio.
- [x] Criar **504 replays comparativos** (360 ataques: três classes × oito seeds × 15 cenários; 144 impactos diretos: três classes × oito seeds × seis cenários), comparando run, RNG, save, meta, log, morte e relíquias.
- [x] Testar ação sem alvo / fora de alcance sem turno nem consumo de RNG; manter 408 replays de movimento, 336 de coleta/abates e 192 de combate básico como regressão.
- [x] Bump da aplicação para **BUILD 1.3.3 · CACHE V17 · P1C.3B.3B.1** e atualização do PWA `golzdov-offline-v17`.
- [x] Integrar à `main` após CI verde ([PR #28](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/28)); **verificação real da propagação no Pages e PWA instalado ainda pendente**.
- [ ] **P1C.3B.3B.2** — dano recebido (defesa/Último Juramento), escolha de finais, morte permanente, `SKILL` como ação unificada e replay de múltiplas ações.

**Integrado:** [PR #28](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/28), merge `6d3cf03`. [CI #38961207182](https://github.com/pedromaintenance/catacumbas-de-golzdov/actions/runs/38961207182) com **73/73 testes verdes**, incluindo 504 replays idênticos. Uma referência já morta em chamada direta a `attack` continua consumindo turno e RNG, como no legado (o buscador normal de alvos não permite selecioná-la). Os eventos `heroHit` e de relíquias ainda são síncronos; P1C.3B.3B.2 continua pendente. **Nenhuma preview Phaser jogável em `/phaser/`.**

### P1C.3B.3A — Coleta e recompensas por eventos (16/10/2026)

- [x] Congelar `collect(item)` e `killEnemy(enemy,source)` originais **antes** da refatoração em `tests/fixtures/legacy-loot-rewards.js`.
- [x] Criar `core/loot.js`: coleta dos oito tipos de itens (âmbar, poção, mana, cura, armadilha, relicário, arma e armadura), com RNG xorshift compartilhado e eventos ordenados `log`, `damage`, `sound` sem DOM, Canvas, Phaser ou armazenamento.
- [x] Criar `core/rewards.js`: experiência, âmbar, foco, remoção do inimigo e eventos ordenados de `onKill`, log e `boss-down`; manter efeitos de relíquias **antes** da derrota do chefe ser finalizada, como no jogo anterior.
- [x] Adicionar `COLLECT` a `GolzdovActions.dispatch`: remover do mundo somente o primeiro item sob o herói; não gastar turno extra, recursos ou RNG para ações sem item.
- [x] Adaptar `doMove`, `collect` e `killEnemy` para consumir eventos preservando dano, sons, logs, armadilhas fatais, relíquias, recompensas e saves; nenhuma nova chave de armazenamento.
- [x] **336 replays** dedicados: 240 de coleta (3 classes × 8 seeds × 10 cenários) + 96 de abates (3 classes × 8 seeds × 4 cenários); 408 replays anteriores de movimento permanecem como regressão integrada.
- [x] Bump do PWA para `golzdov-offline-v16` e menu **BUILD 1.3.2 · CACHE V16 · P1C.3B.3A**.
- [x] Publicar no código principal após CI verde ([PR #26](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/26)); **verificação manual do Pages/PWA ainda pendente**.
- [ ] **[P1C.3B.3B](https://github.com/pedromaintenance/catacumbas-de-golzdov/issues/27):** extrair resolução completa de `ATTACK`, efeitos de dano, vitória, morte e fila de eventos; replay de sequências antes da preview Phaser.

**Integração concluída:** [PR #26](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/26), merge `ec6e707` em `main`; [CI #38957375374](https://github.com/pedromaintenance/catacumbas-de-golzdov/actions/runs/38957375374): **69/69 testes aprovados**, incluindo 336 replays de coleta/recompensas, 408 replays de movimento e regressões de RNG, saves e PWA. A build fica na rota raiz; **ainda não existe preview Phaser jogável**. Teste real de Pages, gamepad e cache antigo instalado continua pendente.

### P1C.3B.2 — Movimento por eventos + identificação da versão (16/10/2026)

- [x] Preservar `doMove(dx,dy)` original em `tests/fixtures/legacy-movement.js`, anterior à refatoração.
- [x] Acrescentar `MOVE` ao `GolzdovActions.dispatch`: verificar direção cardinal, paredes/limites, colisões com inimigos, coordenadas, passos e salas visitadas sem acessar DOM/Phaser.
- [x] Retornar eventos ordenados de movimentação, ataque delegado, descoberta de sala, coleta e conclusão de turno. O adaptador do legado ainda executa os efeitos de relíquias/loot, modal, som e salvamento na mesma ordem antiga.
- [x] Cobrir **408 replays pareados** (3 classes × 8 seeds × 17 cenários): salas novas/visitadas, bloqueios, inimigos, moedas, poção, foco, cura, armadilhas/fatalidade, relicários, armas, armaduras, altar e escadas.
- [x] Validar que movimentos inválidos/diagonais não gastam turno, RNG nem recursos; bater em um inimigo delega ao ataque preexistente.
- [x] Exibir no menu inicial **BUILD 1.3.1 · CACHE V15 · P1C.3B.2** para diferenciar atualização realmente carregada, sem tocar no save.
- [x] Bump do service worker para `golzdov-offline-v15` e atualização das regressões de cache.
- [x] Integrar após CI verde (PR #25, 65/65); validação visual no Pages e no PWA instalado ainda pendente.
- [ ] **P1C.3B.3**: migrar ataques direcionados, coleta, recompensas e estados finais para eventos de domínio; replay multi-turno antes da primeira preview Phaser.

**Integrado:** [PR #25](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/25), commit `c30f052` em `main`. [CI #38955997010](https://github.com/pedromaintenance/catacumbas-de-golzdov/actions/runs/38955997010) **65/65 testes verdes**, incluindo 408 replays idênticos. A página de produção pode receber a versão PWA v15 após publicação/atualização do cache. A engine Phaser **ainda não** é jogável em `/phaser/`.


#### Roteiro de validação no Pages — BUILD 1.3.6

1. Abra [o Pages](https://pedromaintenance.github.io/catacumbas-de-golzdov/) **conectado à internet**; recarregue até ver `BUILD 1.3.6 · CACHE V20 · P1C.3B.3B.2C` abaixo do estado offline. Se a versão não aparecer, feche/reabra o PWA instalado após atualização online.
2. Inicie uma expedição com cada uma das três classes e tente andar em parede/limite, entrar em sala, pisar sobre moedas e consumir poção; nenhum movimento inválido deve consumir um turno.
3. Ande contra um inimigo: deve atacar em vez de mover. Teste espera e poção: inimigos agem **uma vez** por turno. Derrote inimigos comuns e, ao final, o chefe; confira XP, âmbar e comportamento do encerramento.
4. Teste os oito tipos de coleta, especialmente equipamento, armadilhas (inclusive fatal), relicário, altar e escada. A expedição deve continuar normalmente após fechar e reabrir o PWA; importe/exporte um save com cuidado, sem sobrescrever um backup.
5. Ataque de perto e à distância com as três classes; provoque críticos, teste alvos fora de alcance e efeitos de relíquias de ataque/abate. Ataques inválidos não devem avançar o turno, e cada ataque válido deve avançar uma vez.
6. Teste a defesa ativa do Vigia, danos fatais e o talento Último Juramento: ele deve impedir a primeira morte e deixar a guarda enfraquecida, mas não salvar o segundo golpe fatal. Se possível, confira correntes e efeitos de relíquias que respondem ao dano recebido.
7. Termine uma expedição: deixe o personagem morrer, confira a tela de morte, meta e remoção do save da campanha. Em uma vitória, compare as escolhas **REVELAR O NOME** e **GUARDAR O NOME**, o retorno ao menu e o contador de vitórias. Use um backup antes de um teste de morte permanente.
8. Use **as duas habilidades das três classes**. Confira falta de foco, mira em parede/inimigo fora do alcance, ricochete do Arcanista, espinhos do Errante e Bastião do Vigia. Alternar habilidade, andar, beber poção e atacar não pode causar turno duplo.
9. Confirme que o status `✓ PRONTO PARA JOGAR SEM INTERNET` aparece e teste a abertura offline. **Não validado aqui em dispositivo físico:** CI não substitui teste de Android/iOS/Xbox e serviço GitHub Pages propagado.

**Não confundir build e cache:** o texto no menu informa a versão do HTML carregado, não prova por si só que todos os assets estão atualizados; o status offline e o teste sem rede completam a verificação.

### P1C.3B.1 — Despachante de ações e eventos (16/10/2026)

- [x] Congelar as funções `drink()` e `waitTurn()` do jogo original antes de alterá-las, em `tests/fixtures/legacy-utility-actions.js`.
- [x] Criar `core/actions.js` com `dispatch(run,{type}) → {state,status,consumesTurn,events}`. O módulo só altera o estado de simulação; não invoca UI, áudio, armazenamento, temporizadores ou Phaser.
- [x] Extrair as ações `WAIT` e `POTION` do `index.html`, com consumo de foco, cura, validações e eventos ordenados para mensagens, áudio e uma única solicitação de turno.
- [x] Comparar **192 replays** (3 classes × 8 seeds × 8 cenários) entre funções legadas congeladas e novo despachante, incluindo efeitos de relíquias, inimigos, morte, estado salvo e RNG.
- [x] Rejeitar ação inválida, ausência de poção, vida cheia ou campanha encerrada sem consumir um turno, poção ou RNG.
- [x] Atualizar PWA `golzdov-offline-v14` com `core/actions.js` e regressões de cache.
- [ ] **P1C.3B.2** — movimento, coleta e ataques através do mesmo despachante, com eventos em vez de chamadas de UI.
- [ ] **P1C.3B.3** — sequências completas de ações, recompensas e finais comparadas ao legado em três classes e cinco estratos.
- [ ] Playtest real de navegador, controle Xbox e PWA previamente instalado.

**P1C.3B.1 concluído:** [PR #24](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/24) integrado à main, commit `6d67da7`, [CI #38952682930](https://github.com/pedromaintenance/catacumbas-de-golzdov/actions/runs/38952682930) com **61/61 testes verdes** e 192 replays. O incremento de motor não cria página `/phaser/` jogável.

### P1C.3A — IA e sequência de turnos (16/10/2026)

- [x] Congelar `enemyStep` e `worldTurn` do legado antes da refatoração em `tests/fixtures/legacy-ai-turns.js`.
- [x] Criar `core/enemies.js`: stun, root, melee, ataque à distância, recarga, perseguição, obstáculos, limiar de detecção e escolha de direção. Depende de dados explícitos e de `GolzdovCombat`/`GolzdovCoreRng`, sem DOM ou Phaser.
- [x] Criar `core/turns.js`: rodadas explícitas, `onTurnStart`, ação de IA por inimigo, atualização de campo de visão, morte, vitória, level-up e save via adaptador; zero turnos disparados por render.
- [x] Fazer `index.html` consumir os dois módulos novos e preservar a interface, save e efeitos sonoros existentes.
- [x] Testar a nova implementação **contra funções legadas originais** em 360 cenários de IA (3 classes × 10 seeds × 12 situações) e 300 cenários de rodada inteira (3 classes × 10 seeds × 10 situações).
- [x] Garantir que turnos já encerrados não sejam contabilizados de novo.
- [x] Precaching do PWA atualizado para `golzdov-offline-v13`, mantendo escopo protegido da futura rota `/phaser/`.
- [ ] P1C.3B: despachante `dispatch(state,action)`, ações sem efeitos de UI, fila de eventos, replay de sequências. **O P1C completo ainda depende desta entrega.**
- [ ] Testes manuais de browser/PWA previamente instalado e de controle Xbox físico.

**P1C.3A concluído:** [PR #23](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/23) integrado à main (commit `be2d0b9`), **57/57 testes verdes**, incluindo 660 comparações de IA/rodadas. Esta etapa é um avanço de arquitetura no jogo atual, não uma preview Phaser.

### P1C.2 — Habilidades de classe compartilhadas (16/10/2026)

- [x] Congelar `skill(which)` e `castOn(x,y)` do legado *antes* da refatoração em `tests/fixtures/legacy-skills.js`, sem alterar seu comportamento.
- [x] Criar `core/skills.js` independente de DOM, Canvas, Phaser, áudio e `localStorage`; selecionar as habilidades pelo catálogo existente (custo, alcance e alvo).
- [x] Extrair **seis habilidades**: Martelo Rúnico, Bastião, Glifo de Luz, Sonho Afundado, Tiro Fantasma e Círculo de Espinhos.
- [x] Preservar regras de três classes e talentos: Runa Estilhaçante, Glifo Ricochete, Glifo Faminto, Sonho Profundo, Tiro Calculado e Espinhos Drenantes.
- [x] Manter callbacks de domínio síncronos para `heroHit` e `relicEvent('onRoot')`, com efeitos de UI (som, mensagens, mira, HUD e save) exclusivamente no adaptador legado; migrar para eventos puros somente em P1C.3.
- [x] Criar **252 replays comparativos** (3 classes × 6 seeds × 14 cenários) entre as funções originais congeladas e o novo módulo; comparar HP, foco, turnos, RNG, estados dos inimigos, relíquias, logs e mortes.
- [x] Atualizar scripts e cache offline do PWA para `golzdov-offline-v12`.
- [ ] Realizar playtest manual do Xbox e das seis habilidades no Pages após propagação do merge.
- [ ] Implementar a fase P1C.3 de IA e ações independentes de renderer, com `dispatch(state, action)`.

**Integração concluída:** [PR #21](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/21), merge `e579ec5`, CI [#38880680139](https://github.com/pedromaintenance/catacumbas-de-golzdov/actions/runs/38880680139) com **53/53 testes aprovados**, incluindo **252 replays idênticos**. Saves e modo offline preservados nos testes. **Não há preview Phaser publicada**; P1C.3 ainda é necessária.

### P1C.1 — Núcleo básico de combate e turnos (15/10/2026)

- [x] Congelar **192 snapshots de combate antes de qualquer refatoração**: três classes × oito seeds × oito cenários. Cobre ataque, crítico, esquiva, mitigação, ataques à distância, palavra proibida e avanço de turno.
- [x] Criar `core/combat.js`, sem DOM, Phaser, canvas, áudio ou localStorage, usando RNG de `core/rng.js` e estado explícito.
- [x] Adaptar o jogo legado para consumir as rolagens de ataque básico, a esquiva/ataque corpo a corpo do inimigo, os ataques à distância, a mitigação inicial e o início do turno pelo novo módulo.
- [x] **Manter** o `GolzdovRelicEffects` como responsável pelos eventos de relicários (`onAttack`, `onDefend`, `onHurt`, etc.); nenhum disparo duplicado no módulo.
- [x] Preservar ordem de consumo do RNG, buff do Vigia, Grilhões Partidos, riposte, dodge, crítico, bênção da Marca/Musgo e efeitos de ward.
- [x] Ampliar regressões automatizadas, golden hashes e precache do PWA para `golzdov-offline-v11`.
- [ ] Extrair ataques de habilidade, efeitos de talento e composição de turnos completos: **P1C.2**.
- [ ] Refatorar `enemyStep`/IA, morte e resultado de ações para `dispatch(action, state)`: **P1C.3**.

**P1C.1 integrado:** [PR #19](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/19), merge `e275783` em `main`; **50/50 testes aprovados** na [execução CI #38838973493](https://github.com/pedromaintenance/catacumbas-de-golzdov/actions/runs/38838973493), incluindo os 192 golden scenarios de combate, os 50 snapshots de dungeon e as regressões de navegação, saves e gamepad. O módulo de combate **não encerra P1C**; a primeira preview Phaser só poderá ser disponibilizada depois de um vertical slice jogável.

### Próximos passos rastreáveis

| Etapa | Entrega | Bloqueio para publicação |
| --- | --- | --- |
| P1C.2 | **Concluído**: seis habilidades, custos de foco, talentos, raiz, sono e AOE | [PR #21](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/21) e 53/53 testes verdes |
| P1C.3A | **Concluído** — IA e `worldTurn` compartilhados | 660 replays, 57/57 testes e [PR #23](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/23) |
| P1C.3B.1 | **Concluído**: WAIT/POTION e eventos ordenados | 192 replays, PR #24 e CI 61/61 |
| P1C.3B.2 | **Concluído**: MOVE, salas, coleta delegada e build visível | PR #25, 408 replays, CI **65/65**, build 1.3.1 |
| P1C.3B.3A | **Concluído**: coleta, recompensas e chefe via eventos; build 1.3.2 | [PR #26](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/26), 336 replays e CI **69/69** |
| P1C.3B.3B.1 | **Concluído**: ATTACK e dano direto por eventos | [PR #28](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/28), 504 replays, **73/73 testes** |
| P1C.3B.3B.2A | **Concluído**: dano recebido, defesa e Último Juramento | [PR #29](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/29), 576 replays, **76/76 testes**, build 1.3.4 |
| P1C.3B.3B.2B | **Concluído**: morte, escolha e vitória por eventos | [PR #30](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/30), 288 replays, **78/78 testes**, cache v19 |
| P1C.3B.3B.2C | **Concluído**: SKILL instant/targeted e 480 sequências | [PR #31](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/31), CI **80/80**, build 1.3.6 |
| P2A.1 | **Concluído**: Phaser 4/Vite, câmera/mapa compartilhado e build CI isolado | [PR #33](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/33), **84/84 testes**; não jogável/não publicado |
| P2B.1 | **Integrada**: preview jogável limitada, HUD e save isolado | [PR #34](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/34), **90/90**, bundle na main; testar Pages real |
| P2B | Movimento, combate básico, HUD, controle e save isolado na preview | Primeira build realmente jogável em `/phaser/` |
| P3–P6 | Paridade completa, UI/polimento, PWA e lançamento | Playtests reais e plano de rollback |

### P1 — Extrair o núcleo determinístico (2–3 PRs)

- [ ] Separar RNG, entidades, estado, geração de dungeon, visibilidade e pathfinding dos acessos a Canvas/DOM.
- [ ] Criar interface de `dispatch(action) → {state, events}`; manter regras de turnos, acertos, custo de habilidades e finalizações.
- [ ] Portar talentos, relíquias, trocas, merchant e progressão sem efeitos DOM dentro do núcleo.
- [ ] Produzir fixtures estáveis de seeds e ações + snapshots de mapa, XP, HP, recursos e inimigos para comparar legado e novo.
- [ ] Assegurar que o gameplay ainda seja jogável pela interface atual, sem introduzir dois motores divergentes.
- [ ] Cobrir migração de save e determinismo em milhares de gerações, incluindo troca de relíquias e escolhas pendentes.

**Aceite:** teste `core` roda em Node sem browser, e uma mesma seed + sequência de ações gera o mesmo estado lógico (excluindo campos meramente visuais). Código antigo não é removido até o novo núcleo alcançar o comportamento desejado.

### P3A.1 — Três classes e seis habilidades na prévia Phaser (16/10/2026)

- [x] Copiar os **dados canônicos do HTML 1.3.6** (atributos, armas, armaduras, nomes e seis habilidades) para `phaser-src/src/preview-classes.js`, sem inventar novo balanceamento.
- [x] Criar Vigia, Arcanista e Errante com os respectivos PV, foco, ataque, defesa, esquiva e alcance de arma; os desenhos dos heróis já distinguem as classes no renderer clássico.
- [x] Introduzir seletor de classe antes da primeira expedição e ao reiniciar, acessível em desktop e celular. **O save da preview só é substituído ao confirmar a classe**, sem tocar nas chaves do HTML.
- [x] Integrar as duas habilidades de cada classe no `GolzdovActions.dispatch({type:'SKILL'})`: instantânea ou com mira. Usar `core/skills.js` para efeito, `core/combat.js` para dano, `core/turns.js` para **um turno por ação válida**.
- [x] Adicionar botões de habilidade, mira por clique/toque ou alvo próximo por F/A, seleção por teclas 1/2 e comandos de gamepad Y/B. Foco insuficiente e alvo inválido não devem consumir turno/RNG.
- [x] Criar testes de paridade de classe/dados contra `index.html`, 3 classes × 3 estratos determinísticos, seis habilidades, validação de custo/alcance, save e controles. 
- [x] [PR #37](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/37) integrado à main (squash `2aff702`) após [CI #38988576891](https://github.com/pedromaintenance/catacumbas-de-golzdov/actions/runs/38988576891) **100/100 testes verdes**, sintaxe e build Vite aprovadas. Publicados `phaser/index.html`, `assets/index-DyEWuZGx.js` e `assets/index-Dq7KlHNq.css`.
- [ ] Confirmar carregamento real do Pages, seletor de classe, seis magias, gamepad e responsividade em navegador/dispositivo.
- [ ] **P3A.2/P3B:** gatilhos de relíquias `onAttack`/`onRoot`, talentos, mira avançada Xbox, seleção/progressão de talentos, loot completo, mercador e finais. **A seleção de classe e as seis magias não significam paridade completa.**

**Segurança:** usa `carcaca_golzdov_phaser_preview_run_v1` e não importa nem substitui saves do jogo clássico. Não muda `index.html` raiz ou `sw.js`. [Issue #35 — P3](https://github.com/pedromaintenance/catacumbas-de-golzdov/issues/35).

### P2B.2 — Paridade visual inicial e tela de derrota (17/10/2026)

- [x] **Portar a arte procedural da versão HTML**, e não criar uma segunda estética: sprites de herói e oito criaturas, itens, pisos, paredes e as cinco paletas originais em `phaser-src/src/classic-art.js`.
- [x] Integrar a composição original ao Phaser usando texturas Canvas atualizadas por ação (sem sorteio nem novo turno na renderização); câmera e mundo compartilham o núcleo determinístico.
- [x] Enriquecer HUD com barras visíveis de PV/foco e reorganizar o palco para manter a leitura da masmorra em desktop e celular; botões táteis e gamepad continuam como no P2B.
- [x] Tela de derrota/vitória na própria cena, com comando de nova expedição; corrigir saves P2B que guardavam **PV 0 sem flag `over`**, bloqueando turnos indevidos ao retomar.
- [x] Adicionar testes de paleta idêntica à original, sprites/pisos, desenho sem mutação de RNG, save legado intocado e encerramento de partida.
- [x] [PR #36](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/36) integrado com [CI #38987541337](https://github.com/pedromaintenance/catacumbas-de-golzdov/actions/runs/38987541337): **94/94 testes verdes**, sintaxe dos módulos validada e bundle Phaser/Vite concluído.
- [x] Bundle gerado pelo job pós-merge: `phaser/index.html` com `run-ending` e barras de PV/foco; assets `index-Dw9sLxcB.js` e `index-D_J-jb0i.css` confirmados na `main`.
- [ ] Confirmar **carregamento HTTP do Pages, renderização, controles e desempenho no navegador**; verificação dos arquivos no repositório não equivale a teste interativo.
- [ ] Teste visual real e de desempenho com dispositivo: o screenshot de referência mostra o P2B rudimentar; QA manual do P2B.2 ainda é necessário.
- [ ] A paridade funcional P3 (classes, talentos, magia, relíquias, mercador e finais narrativos) e a interface P4 completa permanecem **pendentes**.

**Aceite:** o jogo da rota clássica segue na **build 1.3.6 / cache v20** sem mudanças; o renderer Phaser passa a apresentar **a mesma linguagem visual** dos sprites, pisos e itens originais, mantendo os saves em chaves isoladas. [Issue #35 — P3](https://github.com/pedromaintenance/catacumbas-de-golzdov/issues/35).

### P2B.1 — Primeira prévia jogável de exploração/combate (16/10/2026)

- [x] Motor `phaser-src/src/preview-engine.js` conectado ao dispatcher `MOVE`, `ATTACK`, `WAIT`, `POTION`, ao RNG/combate `GolzdovCombat` e à IA/ordem de turnos `GolzdovEnemies`/`GolzdovTurns`.
- [x] Cena `DungeonScene` com câmera seguindo o herói, mapa/visibilidade reativos e HUD (PV, foco, nível, turno, estrato, poções e abates); teclas, clique em casa adjacente, D-pad toque e gamepad via Gamepad API.
- [x] Save experimental em **`carcaca_golzdov_phaser_preview_run_v1`**, sem ler/gravar as chaves do jogo clássico. Recuperação e reinício separados.
- [x] Ciclo simplificado de exploração nos cinco estratos, coleta básica, inimigos e derrota/vitória no recorte de combate; **não** reivindica a paridade da versão 1.3.6.
- [x] Novos testes de turnos, combate, bloqueio, cinco estratos, input e isolamento de armazenamento.
- [x] Workflow de publicação: CI de PR compila sem deploy; quando mesclado à main **após testes verdes**, gera `phaser/` com bundle Vite e guarda lockfile. Não altera a raiz, nem SW do legado.
- [x] [PR #34](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/34) integrado à main (merge `a6f042f`), [CI #38985209433](https://github.com/pedromaintenance/catacumbas-de-golzdov/actions/runs/38985209433) **90/90 verdes**. Job de publicação criou `phaser/index.html`, `phaser/assets/` e `phaser-src/package-lock.json` na main.
- [ ] Conferir HTTP real do Pages e fazer smoke visual/interativo em browser; ambiente local bloqueou navegação do Chromium durante tentativa de teste.
- [ ] Confirmar controles em navegador desktop/Android e gamepad Xbox físico.
- [ ] **P3:** paridade das três classes, habilidades, relíquias, mercador, progressão, menus e finais. **P5:** PWA próprio da preview.

**Aceite parcial:** primeira expedição interativa em `/phaser/`, testável separadamente; o jogo clássico **BUILD 1.3.6 / CACHE V20** permanece intacto. [Issue #32](https://github.com/pedromaintenance/catacumbas-de-golzdov/issues/32).

### P2A.1 — Laboratório Phaser 4/Vite e primeira cena (16/10/2026)

- [x] Criar fonte separada `phaser-src/`, **sem substituir `index.html` da versão estável** e sem publicar `/phaser/` antecipadamente.
- [x] Fixar dependências diretas Phaser **4.2.1** e Vite **6.3.1**, usar `base:'./'` e construir o bundle em `phaser-src/dist/` (artefato de CI, não Pages).
- [x] Criar `BootScene` e `DungeonScene` com câmera, paredes, chão, campo de visão, herói, inimigos, itens, escada e santuário desenhados com Graphics/Text provisórios.
- [x] Gerar o mapa a partir de **`core/rng.js`, `core/dungeon.js` e `core/navigation.js` originais**; seeds e estratos determinísticos por URL. O catálogo mínimo de inimigos no adaptador é conferido contra o legado.
- [x] Criar testes específicos de paridade de catálogo, conectividade de 20 mapas de cinco estratos, ausência de escrita nos saves, rotas e ausência de CDN/SW da preview.
- [x] CI: instalar dependências, compilar Phaser/Vite, validar caminhos relativos e bundle autocontido e armazenar artefato privado de CI sem publicá-lo no Pages.
- [x] [PR #33](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/33) integrado à `main` após [CI #38969595128](https://github.com/pedromaintenance/catacumbas-de-golzdov/actions/runs/38969595128): **84/84 testes verdes**, build Vite/Phaser com 11 módulos transformados, paths relativos verificados e artefato `golzdov-phaser-p2a` enviado para a CI.
- [ ] Registrar `package-lock.json` com árvore transitiva fixada antes de P2B. P2A fixa somente versões diretas (não reivindicar reprodutibilidade total).
- [ ] **P2B:** input, comandos/turnos, HUD, isolamento de save e **primeira preview realmente jogável** em `/phaser/`.

**Integração concluída:** squash `7386064` em `main`. O build técnico ainda não foi publicado em `/phaser/` e não existe cena jogável na rota experimental. Renderização em navegador real ainda não foi inspecionada; o build/CI, por si só, não comprova FPS, câmera ou compatibilidade mobile.

**Segurança da publicação:** não alterar `sw.js`, as chaves `carcaca_golzdov_run_v1`/`carcaca_golzdov_meta_v1` nem a rota principal. Uma cena renderizada sem movimento **não** é jogo jogável. [Tracker #32](https://github.com/pedromaintenance/catacumbas-de-golzdov/issues/32).

### P2 — Phaser vertical slice jogável (primeira preview em Pages; 1–2 PRs)

- [ ] Gerar aplicativo Vite + Phaser 4 com build reproduzível e `base` correto.
- [ ] Criar BootScene + DungeonScene lendo mapas 35×35 e posição do herói do núcleo extraído.
- [ ] Mostrar paredes, chão, fog-of-war, câmera seguindo herói, ao menos um inimigo e um item; usar gráficos/texturas provisórias ou convertidas do Canvas legado.
- [ ] Ligar teclado e controle Xbox básicos ao mesmo `dispatch`; movimento em grade, um ataque, esperar e consumir turno.
- [ ] Renderizar HUD mínimo (vida, foco, estrato, mensagem) e salvar/retomar uma expedição de preview sob chaves próprias.
- [ ] Gerar `npm run build` e publicar **exclusivamente o conteúdo funcional** em `/phaser/` depois dos checks.

**Aceite:** jogar e interagir num estrato diretamente pelo Pages em PC e celular, sem mexer na versão antiga. Este é o **primeiro marco de playtest público**.

### P3 — Paridade de combate e progressão (2–3 PRs)

**Execução rastreada:** [issue #35 — P3A/P3B](https://github.com/pedromaintenance/catacumbas-de-golzdov/issues/35), com três classes, habilidades, relíquias, progressão e finais completos. A preview P2B.1 é limitada e não substitui estas etapas.

- [ ] Três classes + ambas as habilidades, mira e projéteis, custo de mana, alcance, linha de visão e interrupções.
- [ ] Todo o ciclo de turnos: movimento, busca de caminho, inimigos corpo a corpo/distância, IA e boss.
- [ ] Onze relíquias, cinco raridades, três sinergias, 4 slots/legado e trocas confirmadas; 9 talentos de classe.
- [ ] Equipamentos, coleta, loot, mercador, altar, escadas, morte permanente, três estatísticas de progresso (turnos, kills, tesouro) e dois finais atuais.
- [ ] Comparar estado final do mesmo roteiro simulado entre legado e Phaser, com seed e condições de entrada iguais.

**Aceite:** pelo menos uma run completa por classe, vitória/derrota/reentrada e importação de partida legada sem perda de itens ou turnos.

### P4 — Interface, gamepad e polimento do mundo (2 PRs)

- [ ] Cenas de título, seleção, diário, inventário, mapa, nível, mercador, altar, finais e confirmacões de abandono.
- [ ] Input único teclado/mouse/toque/Xbox, incluindo A/B/X/Y, D-pad, analógicos, gatilhos e câmera/mira. Um pressionamento não deve duplicar turno.
- [ ] Reaproveitar botões/estrutura HUD atual e melhorar escalonamento celular, safe areas, fonte/tamanho de modal, navegação por foco.
- [ ] Converter sprites atuais para texturas com pixel art nítida; depois evoluir para atlas/spritesheets com animações 2D.
- [ ] Transições curtas, feedback visual de golpe, queimadura, exposição, crítico e descoberta; efeitos devem ser cosméticos e dispensáveis.
- [ ] Preferências: som, intensidade de efeitos, desligar shake e animações. Se houver opção de qualidade, testá-la em mobile.

**Aceite:** jogo inteiro navegável com **apenas controle Xbox**, apenas toque ou apenas teclado. Poder retomar após mudar de aba/tela.

### P5 — PWA independente, testes e publicação em paralelo (1–2 PRs)

- [ ] Service worker próprio, escopo limitado a `/phaser/`, com cache versionado dos JS/CSS/assets hashados do Vite.
- [ ] Teste de instalação, atualização, fechamento/reabertura offline e tratamento de cache antigo.
- [ ] Importar **cópia** de save legado; exportação do preview e backups íntegros. Não compartilhar escrita em storage com o jogo antigo.
- [ ] CI: `npm ci`, build, testes do núcleo, verificação de bundle, smoke browser de carregamento e testes antigos; inspeção das rotas e das referências `/phaser/assets/...`.
- [ ] Testar ao menos Chrome/Edge desktop, Android, um navegador móvel adicional se disponível e controle Xbox físico.
- [ ] Medir responsividade, memória, tamanho de download e animações em dispositivo fraco; desligar efeitos visualmente caros sem mudar o combate.

**Aceite:** preview realmente jogável offline e atualizável com saves preservados, sem interferir no PWA raiz.

### P6 — Paridade certificada e corte controlado (1–2 PRs)

- [ ] Checklist de todos os fluxos do jogo antigo versus novo, incluindo boss, finais, morte permanente, altar, relíquias, classe, cheat-proof de saves/seed e UI Xbox.
- [ ] Testes determinísticos de ao menos 1.000 mapas em cada variação de dungeon já implementada.
- [ ] Checar diferenças de regras intencionais versus bugs; mudanças de game design ficam em PR de conteúdo separado e documentado.
- [ ] Criar backup da versão estável e plano explícito de **rollback**.
- [ ] Exibir aviso e opção de migrar save ao Phaser; nunca sobrescrever automaticamente o save da versão anterior.
- [ ] Após aceite no Pages e validação de um playtest completo por classe, levar Phaser à rota principal. Manter rota de fallback para o legado durante uma janela de transição.

**Aceite:** Phaser torna-se versão oficial **somente** quando tiver paridade funcional verificada; nenhuma interrupção não planejada para o jogador.

## 5. Matriz obrigatória de paridade

| Sistema | Mínimo exigido antes do corte |
| --- | --- |
| Geração de mapas | 5 estratos, conexão total das células relevantes, mesmos pesos/premissas, seeds |
| Combate | Ataque, skills, visão, linha de tiro, inimigos, estados alterados, morte |
| Classes | Vigia, Arcanista, Errante; respectivos upgrades e talentos |
| Inventário | 11 relíquias, sinergias, raridades, maldição, 4 slots e trocas |
| Exploração | Fog, itens, altar, mercador, escadas, salas conhecidas, pathfinding |
| Progressão | XP, nível, vitórias, derrota, estatísticas e 2 finais |
| Controles | Teclado, pointer/touch, gamepad Xbox, mira e navegação por menus |
| Continuidade | Saves de v1/v2, import/export JSON, seed RNG, sem conflitos storage |
| Distribuição | GitHub Pages, HTTPS, PWA offline, atualização, cache e fallback |

**A versão Phaser não precisa ter arte final para ser testável.** Precisa manter as regras corretas.

## 6. Dependências, riscos e mitigação

1. **Service worker existente sequestra /phaser/:** P0 obrigatório; não só criar uma subpasta e presumir que funcionará.
2. **Save com duas versões na mesma origem:** preview usa chaves separadas, importa apenas cópia. Nunca converter automaticamente o save da produção.
3. **Reescrita altera ordem do RNG:** snapshots de eventos/ações, RNG só em core, RNG visual independente.
4. **Animation lock ou múltiplos turnos:** fila simples e única; rejeitar input duplicado durante turnos/overlays.
5. **Desempenho mobile/WebGL:** validar fallback/compatibilidade nos dispositivos reais, priorizar poucos draw calls, texturas agrupadas e filtros opcionais.
6. **Pacotes Vite/Phaser ou assets online quebram PWA:** travar lockfile, empacotar dependências; não usar Phaser de CDN na release offline.
7. **Build incompatível com subdiretório GitHub Pages:** testar `base`, ícones, manifesto, worker, import/export e cache com URLs relativas.
8. **Paridade de interface:** manter DOM onde for superior para texto longo e acessibilidade; engine não obriga tudo a virar canvas.
9. **Escopo do Game Design 2.0 cresce durante migração:** versionar alterações de gameplay em paralelo, mas congelar uma versão de referência para os testes de equivalência.

## 7. Sequência sugerida de pull requests

| PR | Primeiro ganho observável | Publicação |
| --- | --- | --- |
| P0 | Bug do SW raiz corrigido + rota do Pages protegida | main estável |
| P1A | Núcleo extraído: RNG/mapa/estado com golden tests | main sem mudança de gameplay |
| P1B | Núcleo de combate/itens/migração com testes | main sem mudança de gameplay |
| P2A | Cena Phaser exibe dungeon + camera e herói | preview quando funcional |
| P2B | Movimento/combate simples e save isolado | `/phaser/`, primeira build jogável |
| P3A | Combate, inimigos e classes | `/phaser/` |
| P3B | Progressão, 11 relíquias, mercador, vitória/morte | `/phaser/` |
| P4A | UI, Xbox, touch e animações iniciais | `/phaser/` |
| P5 | PWA, QA mobile, regressões e offline | `/phaser/` |
| P6 | Comparação final, backup, corte e rollback | rota principal depois da aprovação |

A sequência pode ser repartida em PRs menores. **Nenhum deploy experimental deve substituir o `index.html` estável prematuramente.**

## 8. Interface de revisão a cada entrega

Em cada PR registrar:
- Quais recursos estão **jogáveis no Pages** e em qual rota.
- Evidências: testes verdes, prints se relevantes, inputs suportados, versão cache e hash da build.
- Saves suportados e se a leitura/escrita afeta produção (deve ser `não` até P6).
- Limitações visíveis, problemas conhecidos e instrução simples de teste.
- Critério objetivo para liberar merge e regressão coberta.
- Atualização de `docs/ROADMAP_PHASER.md` e ligação ao roadmap de conteúdo `docs/ROADMAP_2.0.md`.

**Progresso:** P0, P1A ([PR #15](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/15)), P1B ([PR #17](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/17)), P1C.1 ([PR #19](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/19)) e P1C.2 ([PR #21](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/21)) concluídos com CI verde. IA e turnos P1C.3A concluídos ([PR #23](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/23)); despacho WAIT/POTION P1C.3B.1 concluído ([PR #24](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/24)); MOVE P1C.3B.2 concluído ([PR #25](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/25), 65 testes verdes), P1C.3B.3 e P2–P6 pendentes. Verificação real do Pages/PWA e Xbox físico ainda pendentes.
