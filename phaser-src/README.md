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

## Novidades P4A.2 — marcas de combate (em validação)

- Ao atacar, o mapa exibe dano real causado sobre o inimigo; **CRÍTICO**, **ERROU**, **ABATIDO**, **ESQUIVA** e dano recebido pelo herói usam sinais separados.
- O resumo textual do último combate aparece abaixo dos controles, incluindo `aria-live` para leitores de tela.
- Se o sistema pedir **reduzir movimento**, o texto não flutua; permanece legível por um curto período.
- Os indicadores são efêmeros e não são gravados no save: animações não gastam turnos/RNG nem mudam chances de acerto/dano.
- Testar diferentes classes, armadilhas, falhas de ataque e ataques inimigos. QA visual real no Pages/mobile/Xbox ainda será necessário.

## Novidades P4A.1 — caminhos visíveis e interrupção segura (integrada, 151/151 testes)

- Clique/toque em um ponto explorado para ver **a rota desenhada no mapa**, destino marcado e contador de passos.
- Toque **PARAR CAMINHADA**, pressione **Esc**, **B no Xbox** ou execute movimento/ataque manual para interromper. O B cancela sem conjurar a habilidade 2 acidentalmente.
- Ao avistar inimigo vivo em até três casas, a caminhada pausa antes de movimentar novamente. O herói não luta automaticamente.
- Movimento e coleta continuam gastando os turnos habituais; desenhar ou interromper a rota não gasta turno/RNG e não entra no save.
- Testes de integração cobrem transições entre os cinco estratos em três seeds, menu da escada e final. Inimigos e itens são omitidos nesses testes de **topologia**; ainda falta playtest de combate real em cinco estratos, especialmente no celular e Xbox.

## Novidades P3B.4 — crônicas de expedições (integrada, 145/145 testes)

- Abra **VER HISTÓRICO** abaixo dos controles para consultar partidas encerradas. Somente derrotas e epílogos Luz/Raiz confirmados entram na contagem; decisão pendente não conta.
- Resumo acumulado: expedições, vitórias, derrotas, melhor estrato, abates, Luz e Raiz. Lista de até 20 registros recentes com classe, nível, estrato, turnos, abates, âmbar e seed.
- Histórico usa exclusivamente `carcaca_golzdov_phaser_history_v1`, diferente do save de execução da preview e dos saves/metas clássicos. REINICIAR mantém o histórico e só substitui a campanha depois da escolha de classe.
- Recarregar o epílogo não repete a contagem; falhas/indisponibilidade de armazenamento não produzem um resultado fictício.
- A próxima etapa deve verificar replay completo dos cinco estratos e compatibilidade mobile/PWA real.

## Novidades P3B.3 — finais Luz/Raiz (integrada, 135/135 testes)

- Ao derrotar o Escrivão Sem Nome, o combate pára e aparece **O NOME SEPULTADO**. Escolha **Revelar o Nome (Luz 光)** ou **Guardar o Nome (Raiz 根)**. As narrativas são as mesmas do HTML clássico.
- Use 1/2, setas e Enter, toque/clique nas cartas ou direcional e A no Xbox. A escolha é definitiva na expedição, sem gastar um turno.
- Fechar/reabrir a página mantém a decisão pendente ou o epílogo escolhido, na chave isolada da preview.
- Quem já tinha um save encerrado com `previewOutcome='victory'` recebe essa escolha ao atualizar, sem perder progresso.
- Para testar rapidamente o último estrato, abra `/phaser/?floor=5&seed=305419896` e confirme uma **nova expedição**: o parâmetro de estrato só vale quando se inicia uma nova run (um save anterior pode ser retomado).
- A meta/histórico de vitórias e QA real de cinco estratos serão tratados em etapa posterior.

## Novidades P3B.2 — mercador entre estratos (integrada, 127/127 testes)

- Na escada dos estratos 1–4, escolha **MERCADOR** para abrir seis serviços pelos preços oficiais do HTML: 20/16/16/38/38/54 âmbar.
- O estoque de duas inscrições é único por estrato. Recusar, reabrir e recarregar o save não muda a oferta. Troca de relíquias só debita 54 após confirmar a equipagem e as substituições.
- Sem saldo, compras não modificam estado, RNG ou turnos. Ao sair, volte à escada sem descer automaticamente.
- Use 1–9, setas e Enter, clique/toque ou direcional e A no controle, com Esc para retornar.
- Finais Luz/Raiz completos e QA físico permanecem na fila.

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
