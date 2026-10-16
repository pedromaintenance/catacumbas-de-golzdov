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

## Próxima arquitetura: Phaser 4 (preparação P0)

A migração de engine foi [planejada separadamente](docs/ROADMAP_PHASER.md), mas **a versão Phaser ainda não está implementada nem publicada**. A versão atual continua neste endereço. O service worker do jogo atual já foi corrigido para não responder às navegações de `/phaser/` com o HTML legado (cache offline v8). Uma preview jogável só será adicionada à subpasta `/phaser/` depois de criar o projeto Phaser/Vite e passar nos testes. A rota experimental **ainda não contém o jogo Phaser**. O plano mantém o save da versão atual intacto durante os testes. Atualize o jogo principal conectado à internet para permitir que o PWA instalado receba o service worker novo. Acompanhe a [issue #11](https://github.com/pedromaintenance/catacumbas-de-golzdov/issues/11).

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
