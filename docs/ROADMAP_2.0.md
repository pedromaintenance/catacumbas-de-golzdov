# Roadmap executável — Catacumbas de Golzdov 2.0

Atualizado em: 15/10/2026. Planejamento detalhado: [GAME_DESIGN_2.0.md](GAME_DESIGN_2.0.md). A migração técnica paralela para Phaser 4 está em [ROADMAP_PHASER.md](ROADMAP_PHASER.md).

> Convenções: [x] concluído e conferido; [ ] pendente. Mudanças de código devem incluir teste e confirmação antes de marcar [x]. Cada PR/etapa deve atualizar este arquivo.

## Histórico de execução

- 16/10/2026: **P3B.3 — finais da preview Phaser (em validação)**. A queda do Escrivão abre a decisão Luz 光/Raiz 根, com narrativa canônica, interface teclado/toque/Xbox e epílogo persistido no save experimental. Saves P2B–P3B.2 já encerrados com vitória são migrados para uma decisão pendente sem alterar seed/RNG/turnos. Testes de paridade narrativa e CI pendentes da validação final. Próximos: histórico/pós-jogo e campanha completa; jogo HTML/PWA preservado.



- 16/10/2026: **P3B.2 — mercador da preview Phaser (integrada)**. Na escada, seis ofertas idênticas ao HTML clássico; compras usam âmbar e não geram turnos, preços preservados. O relicário possui sorteio determinístico persistido por estrato (sem reroll ao cancelar/recarregar), quatro slots e troca com débito de ◈54 apenas ao confirmar. UI usa controles de escolha existentes. [PR #40](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/40) integrado, **127/127 testes** e build verde; workflow [#38992297739](https://github.com/pedromaintenance/catacumbas-de-golzdov/actions/runs/38992297739) publicou somente `/phaser/`. QA no Pages/dispositivo permanece pendente; finais narrativos continuam pendentes.



- 16/10/2026: **P3B.1 Phaser — correção de interação com itens (integrada)**. Completar todas as oito categorias de coleta pelo núcleo de loot, relicários com catálogo canônico, quatro slots e trocas confirmadas, altares, escadas com opção e caminhada até o item pelo mapa conhecido. HUD com âmbar/bolsa, controles por teclado/toque/Xbox, eventos de relicário integrados. [PR #39](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/39) integrado; **117/117 testes** e compilação verde. Workflow pós-merge publicou a nova build em `/phaser/`, sem alterar o HTML clássico; QA de navegador/dispositivo físico continua pendente.



- 16/10/2026: **P3A.2 Phaser — ascensão por escolha, integrada à main**. Os 9 talentos exclusivos e as 3 melhorias universais da build clássica foram portados sem mudar balanceamento; preview interrompe turnos para mostrar 3 alternativas, permite escolha por teclado/toque/Xbox, preserva opções no save experimental, sem escrever nas chaves do clássico. Habilitados efeitos defensivos de Muralha Viva/Último Juramento e crítico de Olho Predador. [PR #38](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/38) integrado; **107/107 testes** e build aprovados na CI; workflow pós-merge publicou novo bundle em `/phaser/`. Teste HTTP/visual no Pages e dispositivos reais continuam pendentes. Preview permanece separada de `index.html`, e a P3B ainda prevê relíquias, mercado e finais.


- 15/10/2026: **1.2C integrada à `main`** via PR #9, com 31 testes verdes. Inclui cinco raridades, duas ofertas por relicário, quatro espaços, troca transacional, maldição Nome Roubado e migração aditiva de saves. Publicação via Pages depende do mecanismo de deploy configurado; conferir visualmente no site público.

- 14/10/2026: diagnóstico técnico no repositório (5 estratos, 3 classes, 10 relíquias, 7 inimigos comuns + chefe, 2 finais); priorização de builds e diferenças qualitativas entre partidas.
- 14/10/2026: documento mestre de design criado.
- 14/10/2026: fundações implementadas na branch de trabalho: versão 2 do formato de save, migração dos saves v1, seed persistida, RNG de simulação, cache offline v3, correção da checagem de prontidão e documentação no README.
- 14/10/2026: teste de execução instrumentada aprovado (nova corrida, seed repetida, migração v1, salvar/retomar); 1.000 mapas simulados, 200 por estrato, sem perda de conectividade, inimigos ou itens inacessíveis.
- 14/10/2026: suíte persistente em tests/smoke.test.cjs e workflow de CI adicionados; **a execução real de CI no GitHub ainda precisa ser conferida**.
- 14/10/2026: 1.1 integrada à main pelo PR #2, com suíte de GitHub Actions concluída com sucesso.
- 14/10/2026: início da 1.2: nove talentos de classe (três por classe), escolha progressiva, efeitos sobre combate, histórico de talentos no inventário e proteção dos saves existentes. O sistema genérico de eventos de efeitos e as sinergias de relíquias seguem pendentes.
- 14/10/2026: [PR #3](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/3) integrado à main e verificado pelo GitHub Actions com resultado **success**; entrega inicial da 1.2 disponível no jogo.
- Próximas tarefas rastreadas: [#8 — raridade e troca de relíquias](https://github.com/pedromaintenance/catacumbas-de-golzdov/issues/8), [#5 — validação do PWA no celular](https://github.com/pedromaintenance/catacumbas-de-golzdov/issues/5).
- Histórico anterior: [#4 — efeitos e relíquias sinérgicas](https://github.com/pedromaintenance/catacumbas-de-golzdov/issues/4) e [#5 — validar PWA offline no celular](https://github.com/pedromaintenance/catacumbas-de-golzdov/issues/5).
- 15/10/2026: **1.2B integrada na main pelo [PR #7](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/7)**; GitHub Actions aprovou testes de seis relíquias, três sinergias, migração de saves e regressões. [Issue #4](https://github.com/pedromaintenance/catacumbas-de-golzdov/issues/4) concluída. Próximo incremento: [#8 — raridade, escolha de relíquias e balanceamento](https://github.com/pedromaintenance/catacumbas-de-golzdov/issues/8).
- 14/10/2026: implementação das fundações técnicas iniciada na branch de trabalho.

## Integrações de plataforma — Xbox / Gamepad API (15/10/2026)

**Integração:** [PR #6](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/6) concluído e integrado à main (commit `ac5b0e4`). GitHub Actions: testes automáticos aprovados. Também validamos em ambiente instrumentado o fluxo RT → turno, X → mira, B → cancelar e Menu → pausa. Teste com controle físico continua pendente.

- [x] Novo módulo gamepad.js: detectar controle conectado e desconectado sem afetar o jogo.
- [x] D-pad/analógico esquerdo com zona morta, espera inicial e repetição de movimento.
- [x] Botões Xbox A, B, X, Y, LB, RB, LT, RT, View e Menu.
- [x] Navegação por controle em tela inicial, seleção de classe, modais, mercador e evolução.
- [x] Mira com analógico direito/D-pad, retículo no Canvas e seleção de inimigos via LB/RB.
- [x] Indicador de controle e instruções no manual e README.
- [x] gamepad.js adicionado ao precache com incremento de cache v5.
- [x] Testes automáticos usando controle simulado para comandos, reconexão, repetição e navegação.
- [ ] Teste manual com **controle Xbox real** via USB e Bluetooth, e no PWA instalado.
- [ ] Confirmar comportamento em Android/iOS caso haja interesse em controle conectado ao celular.

Esta entrega é **independente das versões de conteúdo 1.2/1.3**, e não altera a progressão salva. A detecção depende de suporte do navegador à Gamepad API. A execução dos testes automáticos não comprova conexão física.

## Trilha técnica paralela — Migração para Phaser 4 (planejada)

- Documento: [Roadmap Phaser 4](ROADMAP_PHASER.md); tracker de execução: [issue #11](https://github.com/pedromaintenance/catacumbas-de-golzdov/issues/11).
- Primeiro passo: [P0 — corrigir service worker para não redirecionar /phaser/ ao HTML legado](https://github.com/pedromaintenance/catacumbas-de-golzdov/issues/12).
- 15/10/2026: correção do roteamento do PWA implementada (cache v8), com testes simulados de navegação raiz/subrotas e ativação. Validação do CI, do Pages e do dispositivo físico é registrada no [Roadmap Phaser](ROADMAP_PHASER.md).
- 15/10/2026: P1A extraiu RNG e geração procedural para `core/rng.js` e `core/dungeon.js`, com 50 snapshots de referência do gerador anterior para testar a paridade em 5 estratos. CI e integração rastreados em [Roadmap Phaser](ROADMAP_PHASER.md).
- 15/10/2026: P1B integrado pelo [PR #17](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/17): LOS, visibilidade e pathfinding em `core/navigation.js`, 50 cenários de referência, cache v10 e CI aprovada.
- 15/10/2026: **P1C.1 integrado** pelo [PR #19](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/19) — `core/combat.js`, 192 snapshots pré-refatoração (3 classes × 8 seeds × 8 situações), rolagens, mitigação e turnos; **50 testes verdes**. Cache offline v11. Próximo: [P1C.2 — habilidades](https://github.com/pedromaintenance/catacumbas-de-golzdov/issues/20) e P1C.3 — IA/dispatch conforme [ROADMAP_PHASER.md](ROADMAP_PHASER.md).
- 16/10/2026: **P1C.2 integrado** pelo [PR #21](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/21): `core/skills.js`, seis habilidades e talentos associados; **252 replays idênticos ao legado, 53 testes verdes**. Cache offline v12. Próxima fase: [P1C.3 — IA e dispatch](https://github.com/pedromaintenance/catacumbas-de-golzdov/issues/22).
- 16/10/2026: **P1C.3A integrado** pelo [PR #23](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/23): IA em `core/enemies.js` e turnos em `core/turns.js`, 660 replays idênticos e **57/57 testes verdes**. Cache offline v13.
- 16/10/2026: **P1C.3B.1 integrado**, [PR #24](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/24), `core/actions.js` para WAIT/POTION, 192 replays e **61 testes verdes**; cache PWA v14.
- 16/10/2026: **P1C.3B.2 integrado** pelo [PR #25](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/25), commit `c30f052`: comando MOVE no despachante, **408 replays idênticos** de movimentação/coleta/armadilhas/salas, **65 testes verdes**. **BUILD 1.3.1 · CACHE V15** visível para conferir no Pages. Ataque, loot puro e finais P1C.3B.3 pendentes.
- 16/10/2026: **P1C.3B.3A concluída** pelo [PR #26](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/26) — `core/loot.js` e `core/rewards.js` extraem oito tipos de coleta, XP/âmbar, morte e `bossDown`. `COLLECT` não consome um turno extra; **336 replays dedicados** contra código congelado, além dos 408 de movimento. **69/69 testes verdes**; PWA v16, build 1.3.2. Resta ataque/eventos finais P1C.3B.3B para concluir P1C.
- 16/10/2026: **P1C.3B.3B.1 integrada** pelo [PR #28](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/28) — `ATTACK` e dano direto via eventos ordenados, 504 replays comparativos de três classes, crítico/alcance/riposte, chefes, relíquias e saves. **73/73 testes verdes**; cache offline v17 e identificação de build 1.3.3. Próxima etapa: dano recebido, condições terminais e replay completo em P1C.3B.3B.2.
- 16/10/2026: **P1C.3B.3B.2A integrada** pelo [PR #29](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/29) — `core/defense.js` separa dano recebido, mitigação/correntes, eventos defensivos e Último Juramento, com **576 replays** de três classes contra handler original congelado. **76/76 testes verdes**; build **1.3.4 / PWA v18**; próximos: resultados terminais, SKILL e replay sequencial.
- 16/10/2026: **P1C.3B.3B.2B integrada** pelo [PR #30](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/30) — `core/endings.js` extrai morte, decisão Luz/Raiz e vitória para transições de estado e eventos ordenados; meta calculada sem armazenamento no núcleo. **288 replays pareados** incluindo botões, modal, save e RNG. **78/78 testes verdes**; build 1.3.5 / PWA v19. Pendente teste real no Pages.
- 16/10/2026: **P1C.3B.3B.2C integrada** pelo [PR #31](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/31) — comando SKILL (duas fases) integra seis habilidades ao dispatcher. Preservados 252 replays de habilidades; novos **480 replays multi-ação** de três classes × cinco estratos × oito seeds × quatro roteiros. **80/80 testes verdes**; build 1.3.6, cache PWA v20. Próximo: validar atualização no Pages/PWA e avançar P2A Phaser/Vite.
- 16/10/2026: **P2A.1 integrada** pelo [PR #33](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/33) — novo `phaser-src/` com Phaser 4.2.1/Vite 6.3.1, cena que desenha mapas reais do núcleo, câmera e visibilidade. A [CI #38969595128](https://github.com/pedromaintenance/catacumbas-de-golzdov/actions/runs/38969595128) aprovou **84/84 testes**, compilou bundle Vite/Phaser sem CDN e guardou o artefato. Sem comandos de jogador ou save nesta fase. **Nenhuma preview jogável publicada no Pages**. Próximo: P2B, [issue #32](https://github.com/pedromaintenance/catacumbas-de-golzdov/issues/32).
- 16/10/2026: **P3A.1 integrada** pelo [PR #37](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/37) — seleção de Vigia, Arcanista e Errante com atributos/armas originais e duas habilidades cada no dispatcher compartilhado. Mira, foco e turnos usam o núcleo determinístico; seleção preserva o save da preview até confirmar nova classe. [CI #38988576891](https://github.com/pedromaintenance/catacumbas-de-golzdov/actions/runs/38988576891) **100/100 testes aprovados**; novos `phaser/index.html` e assets JS/CSS confirmados na main. Testes reais do Pages/dispositivo permanecem pendentes. P3A.2/P3B segue com talentos, relíquias e progressão completa.
- 17/10/2026: **P2B.2 integrada** pelo [PR #36](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/36) — reaproveitamento fiel dos sprites procedurais, pisos/paredes e cinco paletas do HTML em texturas Phaser. HUD de vida/foco, modal de morte/vitória e recuperação de saves P2B com PV zerado. [CI #38987541337](https://github.com/pedromaintenance/catacumbas-de-golzdov/actions/runs/38987541337): **94/94 testes verdes** e bundle Vite/Phaser. Novo `phaser/index.html` e bundles JS/CSS confirmados na `main`; a propagação HTTP e o QA visual permanecem pendentes. A paridade P3/P4 completa permanece pendente.
- 16/10/2026: **P2B.1 integrada** pelo [PR #34](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/34) — preview Phaser com movimento, combate básico, HUD responsivo e controle por teclado/toque/gamepad; save isolado `carcaca_golzdov_phaser_preview_run_v1`. [CI #38985209433](https://github.com/pedromaintenance/catacumbas-de-golzdov/actions/runs/38985209433) **90/90** aprovada; arquivos `phaser/index.html`, assets compilados e lockfile confirmados na `main`. Propagação real do Pages não comprovada. **P3 permanece pendente** para paridade do jogo completo; testar Pages e controles físicos antes de chamar release final.
- O jogo atual permanece em `/catacumbas-de-golzdov/`. A futura preview funcional, após build e deploy, será em `/catacumbas-de-golzdov/phaser/`.
- A engine não muda automaticamente nenhuma das metas de conteúdo de 1.2, 1.3, 2.0 ou 2.1; saves de produção permanecem isolados até migração final.

## 1.1 — Fundações (em andamento)

- [x] Documentar arquitetura atual, lacunas de replay e escopo.
- [x] Definir critérios de aceitação para as releases.
- [x] Corrigir divergência no nome de cache entre worker e interface offline.
- [x] Publicar nova versão de cache para que usuários instalados recebam os arquivos corrigidos.
- [x] Preservar chaves locais de save e metaprogressão existentes.
- [x] Introduzir schemaVersion e migração de saves anteriores.
- [x] Permitir exportação/importação de saves legados com validação.
- [x] Introduzir seed e RNG determinístico de simulação com estado persistido.
- [x] Executar testes de sintaxe e lógica básica, inclusive retorno de uma expedição.
- [ ] Verificar PWA instalado **em dispositivo real**: inicialização online, fechamento, modo avião, retorno e atualização.
- [ ] Publicar notas de release 1.1.

**Pronto quando:** campanha atual preservada, saves legados carregáveis, RNG reproduzível para ações equivalentes, serviço offline coerente e nenhum bloqueio na jogabilidade.

### Observações da 1.1

- A migração de saves v1 recebe uma seed nova no momento da conversão porque as versões antigas não tinham um estado aleatório persistido; assim, o histórico anterior permanece, mas a sequência futura não pode ser reproduzida retroativamente.
- O teste instrumentado é uma validação lógica, não substitui o teste manual de PWA instalado no celular.
- O teste das 1.000 gerações cobre **o algoritmo atual**; depois das novas salas procedurais, repetir a mesma bateria.

### Incremento 1.2B — Motor de Relíquias (15/10/2026)

- Contrato implementado em `relic-effects.js` com eventos **onAttack**, **onKill**, **onDodge**, **onTurnStart**, **onEnterRoom**, **onDefend**, **onHurt** e **onRoot**.
- Relíquias reformuladas: Presa de Golzdov, Musgo de Ironwood, Espelho Afogado, Selo Rachado, Marca de Raiz e Cinza do Crepúsculo. Quatro relíquias mantêm seus efeitos anteriores.
- Três sinergias: O Olhar que Não Existe (Espelho + Olho), O Jardim da Medula (Musgo + Marca) e A Presa das Cinzas (Presa + Cinza). Exibidas no inventário, com aviso ao formar um par.
- Corrigido o erro anterior de regeneração: o código procurava `regen`, embora a relíquia fosse armazenada como `moss`.
- Queimadura e exposição sinalizadas no mapa e persistidas nos saves; nenhum efeito dispara ataques recursivos.
- Um ID de relíquia repetido não acumula bônus; recargas, escudos e combos possuem limites de ativação.
- Chaves de saves existentes preservadas (`schemaVersion: 2`), com estado das relíquias e salas visitadas migrado de forma aditiva.
- `relic-effects.js` pré-carregado no service worker com cache v6; CI cobre efeitos isolados, integração, saves e 1.000 gerações.
- **Ainda pendente:** medição de equilíbrio com jogadores, regras gerais de raridade/espaços (**issue #8**), validação do PWA instalado com hardware real (**issue #5**) e 3 builds equilibradas de cada classe.

## 1.2 — Novas Builds (em andamento)

- [x] Definir contrato de efeitos (onAttack/onKill/onDodge/onTurnStart/onEnterRoom).
- [ ] Catálogo declarativo de talentos com ID e requisitos.
- [x] 3 talentos para Vigia; 3 para Arcanista; 3 para Errante.
- [x] Escolha entre 3 talentos válidos em cada avanço de nível.
- [ ] Regras de exclusividade, repetição, raridade e balanceamento.
- [x] Reimaginar 6 relíquias com efeitos comportamentais.
- [x] Criar 3 sinergias entre relíquias.
- [ ] Testar 3 builds viáveis e diferentes por classe, inclusive chefes.

### Observações da 1.2

- O primeiro avanço oferece três talentos de classe. Os avanços seguintes oferecem os talentos ainda disponíveis e melhorias universais; até dois talentos de classe podem ser aprendidos por expedição.
- Os talentos desta primeira fatia foram implementados com ganchos pontuais de combate para minimizar regressões. O sistema declarativo de efeitos, modificadores permanentes das habilidades e as sinergias continuam na fila.
- O limite de dois talentos de classe é provisório e deve ser reavaliado quando cada especialização ganhar talentos aprofundados.

### Incremento 1.2C — Escolhas de Relíquias (15/10/2026)

- [x] Raridades no catálogo: comum, rara, épica, ancestral e amaldiçoada; chances de sorteio ponderadas por raridade.
- [x] Relicários de chão e altares exibem **duas relíquias distintas**, com opção de recusar.
- [x] Mercador oferece duas opções fixas por estrato; custo cobrado **somente após** uma escolha confirmada.
- [x] Quatro espaços por nova expedição; relíquia ancestral ocupa dois. Ao exceder a capacidade, o jogador decide quais itens substituir antes que os efeitos sejam alterados.
- [x] Nova relíquia amaldiçoada **Nome Roubado** (+4 ataque, −7 vida máxima enquanto equipada).
- [x] Migrar saves legados sem descartar itens; preservar temporariamente a capacidade de quem já possuía mais de quatro espaços.
- [x] Persistência de escolhas de relicário ainda não resolvidas; retomada após fechar o aplicativo.
- [x] Precache do novo catálogo em `relic-offers.js` e incremento do service worker para `golzdov-offline-v7`.
- [x] Testes de raridades, ofertas determinísticas, trocas transacionais, atributos e saves antigos adicionados à suíte.
- [ ] Testes de balanceamento com as três classes em partidas completas e revisão das chances/pesos após feedback.
- [ ] Validar visualmente a experiência no Pages e o controle Xbox real, sem presumir que o teste automático equivale ao playtest.

**Integração realizada:** [PR #9](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/9) integrado à `main` (commit `e7b3712`) após **31/31 testes aprovados** no GitHub Actions. Release funcional pronta para publicação pelo GitHub Pages configurado para a branch principal; a confirmação externa do deploy e o playtest permanecem pendentes. Balanceamento acompanha a [issue #8](https://github.com/pedromaintenance/catacumbas-de-golzdov/issues/8).

## 1.3 — Catacumbas Vivas (pendente)

- [ ] 6 tipos de salas especiais.
- [ ] 5 eventos com escolhas e consequências.
- [ ] 3 papéis táticos de inimigos existentes.
- [ ] 4 afixos de elite.
- [ ] 1 chefe intermediário opcional.
- [ ] Diretor de salas e encontros com limites de equilíbrio.
- [ ] Teste automático de conectividade em 1.000 mapas.

## 2.0 — O Nome Desperta (pendente)

- [ ] Facções: Corte das Sombras, Resistência, Guardiões Yokai.
- [ ] Estados narrativos de facção e consequências reais de escolhas.
- [ ] Tríade Sonho 夢, Raiz 根, Luz 光 integrada às decisões.
- [ ] Dívida do Nome 0–6 com benefícios, riscos e purificação.
- [ ] Finais condicionais além dos caminhos atuais, sem apagar os antigos.
- [ ] Escrivão Sem Nome com padrões e fases reativas.
- [ ] Revisão do equilíbrio e da coerência da lore.

## 2.1 — O Ciclo Eterno (pendente)

- [ ] Santuário dos Nomes Esquecidos, com registro de cada expedição.
- [ ] Desbloqueios horizontais e conquistas.
- [ ] Contratos da Resistência.
- [ ] Ciclo da Medula com modificadores qualitativos.
- [ ] Desafios de classe e expedição diária com seed.
- [ ] Descida sem fim (escopo opcional posterior).

## Regras de manutenção

- Nunca marcar uma etapa como concluída somente porque o código foi escrito: verificar o comportamento.
- Cada release deve preservar o salvamento da anterior ou oferecer migração documentada.
- Não alterar a base do jogo em refatoração total sem uma versão testável.
- PWA e acessibilidade no celular fazem parte dos critérios de aceite, não são acessórios.
- GitHub é a fonte de acompanhamento; atualizar este arquivo no mesmo PR/commit da evolução.
