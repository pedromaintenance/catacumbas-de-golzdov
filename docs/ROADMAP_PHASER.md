# Roadmap de migração — Catacumbas de Golzdov → Phaser 4

**Status:** P0 concluído em código e integrado à main (PR #14, testes CI aprovados). P1 e preview Phaser ainda não iniciados.
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


### P1 — Extrair o núcleo determinístico (2–3 PRs)

- [ ] Separar RNG, entidades, estado, geração de dungeon, visibilidade e pathfinding dos acessos a Canvas/DOM.
- [ ] Criar interface de `dispatch(action) → {state, events}`; manter regras de turnos, acertos, custo de habilidades e finalizações.
- [ ] Portar talentos, relíquias, trocas, merchant e progressão sem efeitos DOM dentro do núcleo.
- [ ] Produzir fixtures estáveis de seeds e ações + snapshots de mapa, XP, HP, recursos e inimigos para comparar legado e novo.
- [ ] Assegurar que o gameplay ainda seja jogável pela interface atual, sem introduzir dois motores divergentes.
- [ ] Cobrir migração de save e determinismo em milhares de gerações, incluindo troca de relíquias e escolhas pendentes.

**Aceite:** teste `core` roda em Node sem browser, e uma mesma seed + sequência de ações gera o mesmo estado lógico (excluindo campos meramente visuais). Código antigo não é removido até o novo núcleo alcançar o comportamento desejado.

### P2 — Phaser vertical slice jogável (primeira preview em Pages; 1–2 PRs)

- [ ] Gerar aplicativo Vite + Phaser 4 com build reproduzível e `base` correto.
- [ ] Criar BootScene + DungeonScene lendo mapas 35×35 e posição do herói do núcleo extraído.
- [ ] Mostrar paredes, chão, fog-of-war, câmera seguindo herói, ao menos um inimigo e um item; usar gráficos/texturas provisórias ou convertidas do Canvas legado.
- [ ] Ligar teclado e controle Xbox básicos ao mesmo `dispatch`; movimento em grade, um ataque, esperar e consumir turno.
- [ ] Renderizar HUD mínimo (vida, foco, estrato, mensagem) e salvar/retomar uma expedição de preview sob chaves próprias.
- [ ] Gerar `npm run build` e publicar **exclusivamente o conteúdo funcional** em `/phaser/` depois dos checks.

**Aceite:** jogar e interagir num estrato diretamente pelo Pages em PC e celular, sem mexer na versão antiga. Este é o **primeiro marco de playtest público**.

### P3 — Paridade de combate e progressão (2–3 PRs)

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

**Progresso neste documento:** P0 implementado e validado por CI; ainda faltam validação manual no PWA instalado e verificação da configuração de Pages. P1–P6 permanecem pendentes.
