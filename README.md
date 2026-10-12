# Catacumbas de Golzdov — aplicativo instalável offline (PWA)

Esta versão é um PWA de verdade: instala a partir do GitHub Pages e funciona depois **sem conexão**, inclusive depois de fechar e reabrir o aplicativo.

## Publicação no GitHub Pages

1. Crie um repositório público (ex.: `catacumbas-de-golzdov`).
2. Extraia o ZIP e envie os **4 itens** diretamente para a raiz do repositório:
   - `index.html`
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
| `index.html` | Jogo completo: HTML, CSS e JavaScript embutidos |
| `manifest.webmanifest` | Nome, ícone e aparência do aplicativo instalado |
| `sw.js` | Armazena os arquivos no dispositivo e atende offline |
| `icons/icon-192.png`, `icons/icon-512.png` | Ícones na tela inicial |

## Atualizações futuras

Para publicar nova versão do jogo, atualize o `index.html`, altere `golzdov-offline-v1` nos arquivos `index.html` e `sw.js` para um novo número de versão (por exemplo `golzdov-offline-v2`) e publique. O aplicativo atualizará seu cache quando voltar à internet. O salvamento em `localStorage` é preservado enquanto o armazenamento do site não for apagado.
