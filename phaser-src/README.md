# Phaser P2A — laboratório de cena

Esta pasta contém **código-fonte**, não uma publicação no GitHub Pages. A rota
`/phaser/` **não** está disponível/jogável ainda. **Não** adicionar link no
menu do jogo principal até P2B.

## Desenvolvimento

É necessário Node.js 22:

```bash
cd phaser-src
npm install
npm run dev
npm run build
```

A CI instala e compila os pacotes em versões diretas fixas:
Phaser `4.2.1` e Vite `6.3.1`. Ainda falta **registrar
`package-lock.json`** antes do deploy P2B para congelar também a árvore de
dependências transitivas: o build atual comprova a integração, mas não substitui
um lockfile reproduzível.

A saída local está em `phaser-src/dist/`, com `base: './'` para servir sob
`/catacumbas-de-golzdov/phaser/`. A GitHub Actions armazena a compilação como
artefato, **não a publica** na rota principal.

## Limites P2A

- Reutiliza `core/rng.js`, `core/dungeon.js` e `core/navigation.js`.
- Gera o mesmo estado de mapa a partir de uma seed fixa; teste também
  `?seed=305419896&floor=4`. Sem seed informada: `0x52c4a190`.
- Desenha apenas as células visíveis, o herói, inimigos, itens e indicadores,
  com câmera seguindo o herói, mas **sem movimento, combate ou save**.
- O catálogo mínimo de inimigos em `src/world.js` é verificado contra
  `index.html` por teste de paridade. P2B deve removê-lo em favor de conteúdo
  compartilhado para não permitir divergência futura.
- Não escreve em `carcaca_golzdov_run_v1` ou
  `carcaca_golzdov_meta_v1`; não registra service worker.

## Próximos critérios P2B

Adicionar input (teclado, toque, Xbox), dispatcher de ações, turnos, HUD de
vida/foco e save **isolado**; CI + teste em navegador e Pages antes de tornar
`/phaser/` uma preview pública. A rota do jogo estável continua intocada.
