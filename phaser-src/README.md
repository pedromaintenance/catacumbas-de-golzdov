# Phaser P2B.2 — arte clássica em Phaser (preview jogável)

**Fonte:** `phaser-src/` (Phaser 4.2.1 + Vite 6.3.1). Depois de CI verde
no branch `main`, a workflow constrói o bundle e atualiza **somente**
`/phaser/` e `phaser-src/package-lock.json`. A versão legada continua em
`/catacumbas-de-golzdov/`.

## Como jogar

- [Preview no GitHub Pages](https://pedromaintenance.github.io/catacumbas-de-golzdov/phaser/), após confirmar o deploy.
- Teclado: setas ou WASD movem; **F/Enter** atacam o inimigo visível mais próximo dentro do alcance, **Espaço** espera um turno, **H/P** bebe poção.
- Toque: D-pad e botões ATACAR, ESPERAR, POÇÃO e REINICIAR. Também é possível tocar numa casa adjacente ou inimigo ao alcance no mapa.
- Gamepad: D-pad ou analógico esquerdo, A atacar, X poção e RB esperar.
- `?seed=305419896&floor=4` inicia nova expedição nesse estrato **quando não houver save de preview**. REINICIAR apaga apenas o save de preview.

## Novidades P2B.2 — identidade visual restaurada

- Sprites procedurais dos oito inimigos, herói, itens, chão e paredes reaproveitados diretamente das funções Canvas 1.3.6; cores específicas de cada estrato.
- Palco mais compacto no desktop, barras de vida e foco, modal de derrota/vitória com reinício, tecla R para recomeçar.
- Compatibilidade com saves anteriores do próprio preview que tenham PV zero mas ainda não tragam flag de morte; encerramento sem turno extra.
- Renderização em texturas Canvas Phaser em vez de gerar imagens externas. O estado de jogo/RNG não é alterado pelo desenho.

## O que funciona nesta vertical slice

- Renderização Phaser, câmera, mapa 35×35 e visibilidade alimentados por
  `core/dungeon.js` e `core/navigation.js`.
- Movimento, colisões, ataques, esquiva e dano com a mesma base de RNG,
  dispatcher, IA e ordem de turnos do núcleo extraído. Movimento contra inimigos desencadeia um ataque único.
- Poção e espera, recompensas básicas de inimigos, moedas, cura/foco/poção no chão;
  escadas e exploração dos cinco estratos; término simplificado após vitória/morte.
- Save automático **exclusivamente** em
  `carcaca_golzdov_phaser_preview_run_v1`. Não acessa
  `carcaca_golzdov_run_v1` nem `carcaca_golzdov_meta_v1`.
- Carga inválida de save de preview é ignorada. Nunca migra automaticamente saves
  do jogo anterior.

## Limitações conhecidas — não é paridade P3

- Classe fixa: Vigia; não há seleção de classe, habilidades, talentos, mercador,
  altar, relíquias equipáveis, todos os tipos de coleta nem dois finais narrativos.
  Itens ainda sem interação exibem mensagem de recurso futuro.
- Progressão ao subir de nível é simplificada e será substituída pelos talentos
  e escolhas reais em P3.
- A implementação do motor de turno mantém o combate básico e a IA reutilizável,
  mas **não** promete paridade integral das combinações de relíquias do jogo estável.
- Sem PWA próprio em `/phaser/`, sem teste de hardware Xbox físico confirmado.
  A preview precisa de internet para carregar pela primeira vez.
- O catálogo de inimigos ainda é uma cópia validada do legado; extrair para
  arquivo compartilhado antes de ampliar inimigos e balanceamento.
- Lockfile transitive será salvo no commit de publicação gerado pela workflow.
  Antes disso, CI de PR utiliza `npm install`; depois, mudar para `npm ci`.

## Desenvolvimento

```bash
cd phaser-src
npm install
npm run dev
npm run build
```

A CI executa `node --test tests/*.test.cjs`, a build do Vite, verifica referências locais
e inclui o bundle como artefato. Em PR não publica; em push aprovado na main,
a etapa `publicar-preview` sincroniza apenas os artefatos em `phaser/`.
Confirmar no Pages que a nova rota carrega, pois CI não substitui smoke visual
em desktop/Android/iOS.

**Roteiro:** [Roadmap Phaser](../docs/ROADMAP_PHASER.md) · [Issue #32](https://github.com/pedromaintenance/catacumbas-de-golzdov/issues/32).
