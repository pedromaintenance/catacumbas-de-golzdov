# Phaser P3A.2 — ascensão e talentos (integrada; 107/107 testes)

A P3A.1 está integrada à main (CI 100/100). A P3A.2 adiciona ascensão por três alternativas, nove talentos exclusivos + três melhorias universais, e bloqueio de ações enquanto a escolha estiver pendente. As opções ficam no mesmo save de preview (sem modificar a versão estável). [PR #38](https://github.com/pedromaintenance/catacumbas-de-golzdov/pull/38) integrado com 107/107 testes e build Vite/Phaser aprovados. O workflow pós-merge já atualizou somente `/phaser/` na main; verificar a execução no Pages e controles físicos antes de declarar QA concluído.

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

## Novidades P3B.1 — itens do cenário (integrada, 117/117 testes)

- Armas, armaduras, poções, ouro, foco, vida, armadilhas e relicários agora passam pelas regras oficiais de coleta do núcleo, sem objetos falsamente interativos.
- Relíquias: raridade e slots oficiais, sorteio persistente, escolha/recusa/substituição com confirmação; gatilhos de ataque, dano, morte, salas, raízes e turno conectados ao motor.
- Altar: uma bênção entre cura, foco e relicário; escada: confirmar descida ou seguir explorando, sem gastar turno na escolha.
- Interação: tecla **E**, botão INTERAGIR, clique/toque na casa atual; clique em destino já explorado inicia caminhada automática por turnos (para ao encontrar obstáculo, combate ou decisão).
- Preview ainda não tem mercador integrado ou finais narrativos completos; estes são marcos subsequentes.

## Novidades P3A.2 — evolução por escolha

- Ao subir de nível, selecione um dos três talentos; 1/2/3 no teclado, toque nas cartas, D-pad/analógico e A no gamepad.
- A escolha pendente fica salva, bloqueia comandos de combate e não consome outro turno/RNG ao ser confirmada.
- Até dois talentos exclusivos por expedição; melhorias universais podem repetir. Atributos e talentos seguem o HTML clássico.
- Efeitos do Último Juramento, Muralha Viva e Olho Predador são ativados na preview; demais efeitos associados a habilidades usam o núcleo original.
- Relíquias e sinergias, altares, mercado, e finais narrativos integrais ainda pendentes de paridade.

## Novidades P3A.1 — classe e magia

- Vigia de Thargrid, Arcanista Yokai e Errante de Ironwood, com os atributos da versão HTML. Seleção ao iniciar ou pedir nova expedição; o save experimental só é substituído ao confirmar outra classe.
- Duas habilidades por classe: **1/2** no teclado ou botões da interface. Mira pelo toque/clique no alvo ou **F** para selecionar inimigo próximo; **Esc** cancela mira.
- Gamepad: **Y/B** ativam as habilidades; **A** confirma o alvo. Há limitação de mira por cursor/controle físico ainda a resolver em P3A.2.
- Foco e linha de visão são validados pelo dispatcher de habilidades; ações inválidas não gastam turno.

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

- Três classes selecionáveis e seis habilidades básicas integradas, mas não há talentos, mercador,
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
