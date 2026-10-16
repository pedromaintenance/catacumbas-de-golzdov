# Catacumbas de Golzdov — roguelike offline (PWA)

Esta versão é um PWA de verdade: instala a partir do GitHub Pages e funciona depois **sem conexão**, inclusive depois de fechar e reabrir o aplicativo.

## Evolução 2.0 (em desenvolvimento)

A evolução está documentada e acompanhada em:

- [Documento de Game Design 2.0](docs/GAME_DESIGN_2.0.md) — visão, classes, relíquias, facções, inimigos, combate, modo de jogo e arquitetura.
- [Roadmap 2.0](docs/ROADMAP_2.0.md) — etapas, checklists, critérios de aceite e registro do que foi realizado.

A versão 1.1 introduziu migração de saves e geração com seed persistida sem alterar as regras essenciais. O primeiro incremento da 1.2 acrescenta **9 talentos de classe**, efeitos específicos no combate e escolhas de evolução. O armazenamento local mantém as chaves legadas para que o progresso não suma após atualizar o PWA.

### Verificações de desenvolvimento

Execute, com Node.js 22 ou superior:

```sh
node --test tests/*.test.cjs
```

A suíte verifica sintaxe, coerência do cache offline, migração de saves antigos, seed, talentos, conectividade de 1.000 mapas e comandos de controle Xbox com um gamepad simulado. O GitHub Actions executa a suíte automaticamente em push e pull requests.

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
2. Extraia o ZIP e envie os **5 itens** diretamente para a raiz do repositório:
   - `index.html`
   - `gamepad.js`
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
| `manifest.webmanifest` | Nome, ícone e aparência do aplicativo instalado |
| `sw.js` | Armazena os arquivos no dispositivo e atende offline |
| `icons/icon-192.png`, `icons/icon-512.png` | Ícones na tela inicial |

## Atualizações futuras

Para publicar uma nova versão distribuída, atualize os arquivos do jogo e **aumente a versão da constante `CACHE` em `sw.js`** (por exemplo, `golzdov-offline-v6`). A verificação de prontidão procura automaticamente os recursos precacheados e não precisa repetir o nome do cache no `index.html`. O jogo deverá atualizar-se quando o service worker novo for instalado e ativado; feche e reabra o PWA após a atualização, se necessário. As chaves legadas do `localStorage` continuam sendo usadas; o estado recebe `schemaVersion` e migração para preservar saves anteriores.
