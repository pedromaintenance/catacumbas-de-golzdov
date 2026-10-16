# Catacumbas de Golzdov — roguelike offline (PWA)

Esta versão é um PWA de verdade: instala a partir do GitHub Pages e funciona depois **sem conexão**, inclusive depois de fechar e reabrir o aplicativo.

## Evolução 2.0 (em desenvolvimento)

A evolução está documentada e acompanhada em:

- [Documento de Game Design 2.0](docs/GAME_DESIGN_2.0.md) — visão, classes, relíquias, facções, inimigos, combate, modo de jogo e arquitetura.
- [Roadmap 2.0](docs/ROADMAP_2.0.md) — etapas, checklists, critérios de aceite e registro do que foi realizado.
- [Roadmap de migração para Phaser 4](docs/ROADMAP_PHASER.md) — plano de extração do núcleo, cenas, preview em Pages, Gamepad API, PWA offline e preservação de saves.

A versão 1.1 introduziu migração de saves e geração com seed persistida sem alterar as regras essenciais. O primeiro incremento da 1.2 acrescenta **9 talentos de classe**, efeitos específicos no combate e escolhas de evolução. O armazenamento local mantém as chaves legadas para que o progresso não suma após atualizar o PWA.

### Verificações de desenvolvimento

Execute, com Node.js 22 ou superior:

```sh
node --test tests/*.test.cjs
```

A suíte verifica sintaxe, coerência do cache offline, migração de saves antigos, seed, talentos, conectividade de 1.000 mapas comandos de controle Xbox com gamepad simulado e as relíquias/sinergias da atualização 1.2B. O GitHub Actions executa a suíte automaticamente em push e pull requests.

## Próxima arquitetura: Phaser 4 (P1 — núcleo em extração)

A migração de engine está [planejada e em execução](docs/ROADMAP_PHASER.md). Os incrementos P1A–P1C.3B.3B.2B **não incluem uma interface Phaser jogável**: extrai o RNG para `core/rng.js` e o gerador procedural para `core/dungeon.js`, módulos independentes do navegador reutilizáveis no futuro Phaser. Foram congelados 50 snapshots da geração original para evitar alterações acidentais de seed, spawn e loot. A versão atual continua neste endereço. O service worker do jogo atual não captura as navegações de `/phaser/` e foi atualizado para v19, incluindo os módulos core em cache. Uma preview jogável só será adicionada à subpasta `/phaser/` depois de criar o projeto Phaser/Vite e passar nos testes. A rota experimental **ainda não contém o jogo Phaser**. O plano mantém o save da versão atual intacto durante os testes. Atualize o jogo principal conectado à internet para permitir que o PWA instalado receba o service worker novo. Acompanhe a [issue #11](https://github.com/pedromaintenance/catacumbas-de-golzdov/issues/11).


**Build integrada em 16/10/2026:** [PR #30](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/30), **78/78 testes verdes**, incluindo 288 replays de morte, vitória e escolhas finais, mantendo as regressões anteriores de combate, defesa, loot, movimento e saves. **Como conferir o Pages:** na tela inicial, procure `BUILD 1.3.5 · CACHE V19 · P1C.3B.3B.2B` abaixo do status offline. Se aparecer uma versão anterior, atualize online e recarregue o PWA. A atualização não reinicia a expedição nem altera as chaves do save. **Roteiro de teste de movimento, combate, itens e atualização offline:** [Roadmap Phaser — Validação BUILD 1.3.5](docs/ROADMAP_PHASER.md#roteiro-de-validação-no-pages--build-135).

### Núcleo compartilhado (P1A–P1C.3B.3B.2B)

- `core/rng.js`: xorshift32, escolha de inteiros e sorteio sem relógio, render ou dependência Phaser. Atualiza apenas `rngState` do estado explícito da expedição.
- `core/dungeon.js`: geração dos cinco estratos, posicionamento de inimigos, itens, altar, chefe e escada; os resultados continuam idênticos aos snapshots originais.
- `core/navigation.js`: linha de visão, campo de visibilidade e caminhos BFS com ordem idêntica às rotas do jogo original.
- `core/combat.js`: rolagens de ataque, crítico, esquiva, ataque à distância, mitigação inicial e início de turno sem DOM ou Phaser; o jogo legado consome esses cálculos.
- `core/defense.js`: dano recebido em etapas para preservar `onDefend`, `onHurt`, Grilhões Partidos, buffs e Último Juramento, emitindo log, som e pedido de morte sem acessar navegador.
- `core/endings.js`: transições de morte, escolha final e vitória; cálculo de estatísticas de meta, com eventos de persistência/UI interpretados no browser, sem dependências de navegador no núcleo.
- `core/skills.js`: habilidades das três classes, validação de alvo e mana, estados e talentos; callbacks de domínio para dano e relíquias, sem som, menus ou saves.
- `core/enemies.js`: IA determinística de movimentação, stun/root, ataques e recarga, sem render e com callbacks de dano do jogo atual.
- `core/turns.js`: orquestração do ciclo de rodada, vitória, morte e subida de nível. Uma rodada só ocorre por ação explícita, nunca pelo loop de desenho.
- `core/actions.js`: despachante `dispatch(run,action)` para WAIT, POTION, MOVE, COLLECT e ATTACK. Registra passos e salas, remove o item sob o herói e produz eventos ordenados; nenhum turno extra na coleta.
- `core/loot.js`: resolve oito tipos de tesouro e armadilha com RNG explícito; a UI só interpreta eventos de log/dano/som.
- `core/rewards.js`: aplica XP, âmbar, foco e remoção do inimigo; devolve eventos ordenados para `onKill` e derrota do chefe.
- `tests/fixtures/legacy-dungeon-golden.json`: 50 casos produzidos **antes** da extração, a partir do jogo original. A suíte compara hash do mundo completo e RNG final, sem precisar renderizar canvas.
- `tests/fixtures/legacy-navigation-golden.json`: 50 casos de visão, neblina, LOS e rotas BFS calculados antes do P1B e conferidos depois.
- `tests/fixtures/legacy-combat-golden.json`: 192 execuções reais antes do P1C.1, para comparar HP, RNG, inimigos, turnos e logs em oito situações nas três classes.
- `tests/fixtures/legacy-skills.js`: cópia imutável das duas funções originais de habilidade; `tests/core-skills.test.cjs` compara 252 execuções originais e novas, com três classes e seis seeds.
- `tests/fixtures/legacy-ai-turns.js`: cópia das duas funções originais de IA e rodada; `tests/core-ai-turns.test.cjs` compara 660 cenários idênticos entre legado e novo.
- `tests/fixtures/legacy-utility-actions.js`: cópia das ações `drink` e `waitTurn` anteriores. `tests/core-actions.test.cjs` compara 192 replays das três classes com o novo dispatch.
- `tests/fixtures/legacy-movement.js` e `tests/core-movement.test.cjs`: 408 replays entre `doMove` original e o novo fluxo de eventos com sala, loot e armadilhas.
- `tests/fixtures/legacy-loot-rewards.js` e `tests/core-loot-rewards.test.cjs`: 240 replays de coleta e 96 de abates, incluindo chefe, fontes de recompensa e relíquias.
- `tests/fixtures/legacy-attack-damage.js` e `tests/core-attacks.test.cjs`: 504 replays de ataque básico e dano direto com funções legadas congeladas, cobrindo RNG, relíquias, crítico, riposte, morte de chefe e saves.
- `tests/fixtures/legacy-received-damage.js` e `tests/core-defense.test.cjs`: 576 replays de dano recebido/Último Juramento, correntes, defesa e saves comparados com a build 1.3.3 congelada.
- `tests/fixtures/legacy-endings.js` e `tests/core-endings.test.cjs`: 288 replays de morte, escolha dos dois finais, vitória e metadados, comparando modais e salvamentos contra funções anteriores.

Os ataques de habilidade, dano recebido, resultados terminais de partidas, progressão e controles ainda dependem do adaptador `index.html`; serão extraídos em P1C.3B.3B e etapas seguintes. Movimento, coleta e recompensas comuns já estão no núcleo. A mira e o feedback audiovisual continuam no adaptador legado. O PWA continua jogável na rota principal, sem gravação em novas chaves de save.

## Relicários e raridades — versão 1.2C

Os relicários encontrados pelo mapa, as bênçãos de relíquias nos altares e o mercador agora oferecem **duas opções diferentes**, em vez de conceder um item sem escolha. Você pode aceitar uma ou recusar. As ofertas usam a seed salva da expedição; o mercador mantém as mesmas opções dentro do mesmo estrato, impedindo rerolls gratuitos.

- **Espaços de bolsa:** quatro para novas partidas. Relíquias ancestrais podem ocupar dois espaços; as demais ocupam um.
- **Troca segura:** quando a bolsa não tem espaço suficiente, escolha as relíquias a substituir. Caso sejam necessárias duas retiradas, ambas são selecionadas antes de qualquer mudança. Cancelar preserva todos os itens e o âmbar.
- **Cinco raridades:** comum, rara, épica, ancestral e amaldiçoada, com chances diferentes de aparecer.
- **Nova relíquia amaldiçoada, Nome Roubado:** +4 ataque, mas −7 pontos de vida máxima enquanto equipada. A penalidade desaparece se você a trocar.
- **Saves anteriores:** nenhuma relíquia é removida automaticamente. Se uma expedição antiga possuía mais de quatro espaços de equipamento, ela mantém os itens e sua capacidade anterior enquanto essa composição permanecer; a restrição de quatro vale para novas expedições.
- **Recuperação após fechamento:** se o app for fechado durante uma oferta do chão/altar, a escolha fica pendente no save e reaparece ao continuar.
- **Mercador:** paga-se pelas relíquias somente depois de confirmar; recusar não consome âmbar.

Os controles por toque, teclado e Xbox continuam disponíveis nos menus de escolha, inclusive na tela de substituição de relíquias.

## Relíquias e sinergias — atualização 1.2B

Seis relíquias mantêm seus benefícios antigos e agora mudam as decisões de combate:

| Relíquia | Novo efeito |
| --- | --- |
| Presa de Golzdov | +3 dano contra inimigos enraizados; abate básico devolve 1 foco (no máximo uma vez por turno) |
| Musgo de Ironwood | Regeneração corrigida: +2 vida a cada 6 turnos e +2 ao entrar pela primeira vez em uma sala |
| Espelho Afogado | Ao esquivar, prepara +3 de dano para o próximo golpe (sem empilhar) |
| Selo Rachado | Depois de receber dano, protege o próximo golpe recebido em 2 pontos |
| Marca de Raiz 根 | +1 foco a cada 3 turnos e +1 em magias que enraízam inimigos |
| Cinza do Crepúsculo | Críticos deixam queimadura: 2 de dano no início de cada um dos próximos dois turnos |

As três **sinergias de relíquias** aparecem automaticamente no inventário quando você junta os itens necessários:

- **O Olhar que Não Existe** (Espelho Afogado + Olho de Vandar): desviar de um ataque marca o agressor como Exposto; o próximo golpe contra ele tem +4 dano.
- **O Jardim da Medula** (Musgo de Ironwood + Marca de Raiz): magias que enraízam adversários restauram até 3 PV, uma vez por conjuração.
- **A Presa das Cinzas** (Presa de Golzdov + Cinza do Crepúsculo): crítico contra alvo que já estava queimando causa +4 de dano.

**Nota de compatibilidade:** saves da versão anterior conservam suas relíquias sem recolhê-las de novo. Os campos novos são preenchidos automaticamente quando a partida é retomada; não alteramos as chaves de armazenamento. O módulo relic-effects.js não depende de bibliotecas externas e faz parte do cache offline. As sinergias desta release não criam ataques extra nem efeitos recursivos.

## Controle Xbox (USB ou Bluetooth)

O jogo reconhece automaticamente um controle Xbox compatível com a **Gamepad API**. Não é necessário instalar extensões nem remapear teclas. O suporte depende do sistema operacional e do navegador; em alguns navegadores, pressione um botão depois de abrir a página para ativar a conexão. Ainda é necessário testar com um controle físico real e no PWA instalado.

| Xbox | Ação |
| --- | --- |
| Analógico esquerdo / D-pad | Andar; navegar entre opções nos menus |
| A | Ataque básico / confirmar / lançar habilidade mirando |
| B | Cancelar mira, voltar de menus fecháveis; no jogo abre pausa |
| X / Y | Habilidade 1 / habilidade 2 |
| LB / RB | Bolsa / mapa; ao mirar, alternar inimigos |
| LT / RT | Beber poção / esperar um turno e recuperar foco |
| View (dois quadrados) | Registros e histórico |
| Menu (☰) | Pausa e opções de salvar/sair/exportar |
| Analógico direito durante a mira | Mover a mira das magias; A lança, B cancela |

- O direcional possui zona morta e repetição controlada; botões de ação não repetem quando ficam pressionados.
- Evolução, mercadores, altares e finais podem ser navegados com direcional e A.
- Um retículo aparece na mira de habilidades; o Arcanista pode selecionar terreno válido para magias de área.
- O teclado e os comandos de toque continuam disponíveis, mesmo com o controle desconectado.
- A versão offline inclui gamepad.js no cache do service worker.

## Publicação no GitHub Pages

1. Crie um repositório público (ex.: `catacumbas-de-golzdov`).
2. Extraia o ZIP e envie os **7 itens** diretamente para a raiz do repositório:
   - `index.html`
   - `gamepad.js`
   - `relic-effects.js`
   - `relic-offers.js`
   - `manifest.webmanifest`
   - `sw.js`
   - pasta `icons` (com `icon-192.png` e `icon-512.png`)
3. Confirme a alteração em **Commit changes**.
4. Em **Settings > Pages**, escolha **Deploy from a branch**, branch **main**, pasta **/(root)** e salve.
5. Abra `https://SEU-USUARIO.github.io/catacumbas-de-golzdov/` **online pela primeira vez**.
6. Na tela inicial do jogo, confirme o texto **✓ PRONTO PARA JOGAR SEM INTERNET**.
7. **Android (Chrome)**: menu ⋮ > *Adicionar à tela inicial* ou *Instalar app* (texto varia conforme o navegador).
   **iPhone (Safari)**: Compartilhar > *Adicionar à Tela de Início* > *Abrir como App Web* > Adicionar.
8. **Abra o app recém-instalado pelo ícone ainda com internet**, aguarde aparecer **✓ PRONTO PARA JOGAR SEM INTERNET** dentro dele (especialmente importante no iPhone, que pode usar armazenamento separado do Safari).
9. Ative o **modo avião**, feche o app e abra novamente pelo ícone da tela inicial para comprovar.

## Não cometa estes erros

- Não faça upload apenas do `index.html`; o PWA precisa dos arquivos `manifest.webmanifest`, `sw.js` e dos ícones.
- Não envie o ZIP fechado para o repositório: os arquivos devem ficar na raiz.
- **Não use o endereço `github.com/usuario/repositorio` para instalar**. Acesse a página pública **`usuario.github.io/repositorio/`**.
- O GitHub Pages precisa estar em HTTPS (o domínio `github.io` já atende a isso).
- A primeira instalação precisa de internet. Depois disso, o cache permite jogar offline. Se limpar os dados do navegador ou desinstalar, o cache e os saves podem desaparecer.
- Os saves ficam no armazenamento **local daquele aplicativo/navegador**, não são sincronizados automaticamente entre dispositivos ou instalações. Use **Exportar Save** para guardar cópias.
- Abrir `index.html` localmente em `file://` **não instala o PWA**; a instalação deve partir do endereço HTTPS.

## Arquivos

| Arquivo | Uso |
|---|---|
| `index.html` | HTML, estilos e motor principal do jogo |
| `gamepad.js` | Mapeamento Xbox, navegação por foco e repetição de direções |
| `relic-effects.js` | Despachante declarativo de efeitos de relíquias, bônus e sinergias |
| `relic-offers.js` | Catálogo de raridades, limite de espaços e seleção reproduzível de ofertas |
| `manifest.webmanifest` | Nome, ícone e aparência do aplicativo instalado |
| `sw.js` | Armazena os arquivos no dispositivo e atende offline |
| `icons/icon-192.png`, `icons/icon-512.png` | Ícones na tela inicial |

## Atualizações futuras

Para publicar uma nova versão distribuída, atualize os arquivos do jogo e **aumente a versão da constante `CACHE` em `sw.js`** (por exemplo, `golzdov-offline-v8`). A verificação de prontidão procura automaticamente os recursos precacheados e não precisa repetir o nome do cache no `index.html`. O jogo deverá atualizar-se quando o service worker novo for instalado e ativado; feche e reabra o PWA após a atualização, se necessário. As chaves legadas do `localStorage` continuam sendo usadas; o estado recebe `schemaVersion` e migração para preservar saves anteriores.
