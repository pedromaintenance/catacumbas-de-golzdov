# Catacumbas de Golzdov 2.0 — Documento de Game Design

> Estado: planejamento aprovado como direção de desenvolvimento; implementação incremental.
> Início: 14/10/2026. Fonte: análise do jogo existente em index.html, README.md, manifest.webmanifest e sw.js.
> Documento vivo: a cada etapa implementada, atualizar também ROADMAP_2.0.md e registrar critérios de aceite.

## 1. Visão de produto

Transformar o roguelike tático da Carcaça em um jogo compacto, mobile-first, offline e altamente rejogável. Manter os cinco estratos, a exploração em grade por turnos, o estilo gótico/pixel art, o combate tático, a morte permanente e as três classes. Priorizar a diversidade de builds, eventos consequentes, facções e masmorras reativas em vez de somente mais andares, mais dano ou mais PV.

### Problema identificado no código

- Três classes: Vigia de Thargrid, Arcanista Yokai e Errante de Ironwood; duas habilidades fixas em cada.
- Cinco estratos temáticos em mapas 35×35; mesmo algoritmo de salas retangulares com corredores conectando centros.
- Sete inimigos comuns e um chefe final: Escrivão Sem Nome; poucos comportamentos e nenhuma estrutura geral de padrões anunciados.
- Dez relíquias, majoritariamente bônus numéricos; progressão por nível sempre oferece vida, ataque e foco.
- Altares, mercador e armadilhas; poucas escolhas que transformam a corrida.
- Duas escolhas de encerramento, Luz e Raiz, exibidas após derrotar o chefe.
- Estatísticas persistentes, mas sem desbloqueios, desafios nem histórico narrativo.

Diagnóstico: aleatoriedade de distribuição é forte; variedade de decisões e consequências ainda é baixa. Vencer com as três classes reduz o incentivo para uma quarta expedição.

### Princípios inegociáveis

1. Decisões irreversíveis com trade-offs inteligíveis.
2. Builds distintas mesmo dentro da mesma classe.
3. Masmorras com variedade funcional, não somente topográfica.
4. História que responde a decisões do jogador.
5. Vitórias liberando opções, desafios e registros; não atributos permanentes obrigatórios.
6. Telas curtas, controles grandes, jogo totalmente funcional offline.
7. Compatibilidade de saves e metadados anteriores, sempre que tecnicamente possível.

## 2. Classes e progressão

### Vigia de Thargrid

- Bastião Ancestral: mitigar dano, contra-atacar, guardar posições.
- Martelo Rúnico: atordoar, destruir obstáculos, explosão de impacto.
- Fúria da Montanha: aceitar vulnerabilidade por dano e agressividade crescentes.

### Arcanista Yokai

- Escriba da Luz: glifos, revelação, ataques penetrantes.
- Tecelão de Sonhos: duplicatas, confusão e manipulação de posições.
- Mestre dos Nomes: inscrições rituais com efeitos significativos e custos concretos.

### Errante de Ironwood

- Predador das Sombras: ataques de emboscada, furtividade e crítico.
- Guardião da Floresta: imobilização, venenos, regeneração ligada a raízes.
- Atirador Fantasma: tiros atravessando alvos, reposicionamento e sequência de disparos.

### Sistema de talentos

- Em cada nível, apresentar 3 opções: preferencialmente 2 da classe e 1 universal.
- Desencorajar resultados sem escolha real: impedir oferta de talentos únicos já possuídos e garantir ao menos 1 opção útil.
- Talentos com identificadores estáveis, categorias, pré-requisitos, raridades e efeitos.
- Permitir combinações entre caminhos da mesma classe, sem exigir subclasse rígida.
- Vertical slice: 9 talentos novos (3 por classe). Expansão posterior: 27–36.
- Preservar os 2 botões de habilidade do HUD; modificar habilidades por efeitos/passivas em vez de adicionar botões.
- Exemplo: Glifo Perfurante; Glifo Explosivo; Glifo Faminto; Glifo de Revelação.

## 3. Relíquias e equipamentos

### Refatorar as dez relíquias existentes

- Presa de Golzdov: dano adicional em cadeia de golpes.
- Osso Pulsante: vida com possíveis reações rituais.
- Taça de Medula: interação entre gasto de foco e escudo.
- Musgo de Ironwood: regeneração interagindo com raízes.
- Espelho Afogado: esquiva gerando imagem ilusória.
- Selo Rachado: defesa convertendo bloqueio em contra-ataque.
- Marca de Raiz 根: foco restaurado por imobilização, com limite.
- Cinza do Crepúsculo: críticos deixam cinzas que podem ser ativadas.
- Grilhões Partidos: quebrar selos e libertar cativos produz benefício.
- Olho de Vandar: encontrar segredos e revelar perigos.

### Sinergias intencionais

- Olho de Vandar + Espelho Afogado = O Olhar que Não Existe: alvos confundidos ficam expostos ao próximo ataque.
- Outras sinergias devem ser inscritas no catálogo, com testes para combinações fortes e ciclos infinitos.
- Qualidade dos efeitos é mais importante que multiplicar quantidades.

### Regras de escolha

- Raridades: comum, rara, épica, amaldiçoada e ancestral.
- Proposta: 4 espaços de relíquias equipadas; ancestrais podem consumir 2 espaços.
- Bolsa, descarte e sacrifício em altares devem permitir escolhas interessantes.
- Cuidado com softlocks e com descrições que não correspondem ao efeito.

## 4. Masmorras vivas

### Identidade dos estratos

1. Costelas do Silêncio: criptas, túneis estreitos, cárceres.
2. Medula Fraturada: lagos orgânicos e terreno mutável.
3. Veias Petrificadas: correntes ancestrais e instalações da Corte.
4. Salão das Vértebras: guarnições militares, arquivos e selos.
5. O Nome Sepultado: labirinto simbólico e confronto final variante.

### Componentes procedurais

- Criar salas especiais: relíquias, cárcere, santuário, arquivo, arena de elite, ossuário instável, mercador, sepulcro, contrabandistas, cripta de desafio.
- Gerar 3–4 modelos por estrato antes de ampliar a quantidade de estratos.
- Diretor de expedição: seleção contextual de encontro e recompensas, com limites para não punir builds específicas indevidamente.
- Permitir três maneiras de lidar com alguns obstáculos (força, magia, mobilidade/conhecimento).
- Seed determinística e reproduzível: separar RNG de simulação do visual; não consumir sorte aleatória ao desenhar um quadro.
- Validar geração: mapa conectado, escada alcançável, início livre, posições de eventos/chefes válidas, recursos essenciais suficientes.

## 5. Combate 2.0

### Papéis de inimigos

- Perseguidor, atirador, guardião, conjurador, invocador e manipulador.
- Implementar primeiro 3 papéis reutilizando os sprites existentes; estender para 6 após testes.
- Novos inimigos propostos: Coletor de Nomes, Carcereiro das Vértebras, Devorador de Medula, Escriba Desfigurado, Caçador Sem Rosto.
- Modificadores de elite: Rúnico, Faminto, Espectral, Juramentado, Flagelador, Coroado.
- Condições: Sangramento, Queimadura, Enraizado, Atordoado, Exposto, Confuso.
- Intenções de chefes anunciadas no mapa, com uma rodada para resposta.
- Preservar turnos discretos e controles adequados ao celular.

### Chefes

- O Coração da Medula: invoca e modifica terreno.
- O Inquisidor das Vértebras: guardas, selos e marcas anunciadas.
- Escrivão Sem Nome: padrões/fases reativas a relíquias, símbolos e Dívida do Nome.
- Chefes intermediários opcionais ou dependentes de rotas: não exigir um chefe longo em cada andar.

## 6. Facções e eventos

### Três vetores

- Corte das Sombras: ocupa, extrai, regula e monopoliza nomes.
- Resistência da Carcaça: redes de Thargrid/Ironwood, resgate, sabotagem e libertação.
- Guardiões da Palavra Antiga: Yokai, memória, legitimidade, ritos próprios, nem sempre aliados da Resistência.

Evitar maniqueísmo mecânico: nenhum medidor abstrato deve substituir decisões reais; consequências precisam de causas explícitas.

### Conteúdo narrativo

- Objetivo de maturidade: 20–30 eventos curtos, com consequências registradas no estado da corrida.
- Exemplo: Escriba Acorrentado — libertar (arquivo, perseguição), entregar (recompensa da Corte, hostilidade Yokai) ou roubar saber (inscrição, dívida).
- Tríade simbólica: 夢 Sonho (futuro), 根 Raiz (pertencimento), 光 Luz (revelação).
- Desfechos: Luz, Raiz, Sonho Recuperado, Decreto da Corte, Nome Destruído.
- Desfechos devem reconhecer escolhas e ações anteriores; os dois finais originais são preservados.
- Expandir a experiência sem declarar automaticamente essas variações como cânone global da Carcaça.

## 7. Dívida do Nome

- Escala inicial proposta 0–6, provocada por relíquias/rituais proibidos.
- Dívida concede vantagens reais e mudanças perigosas no mundo, não apenas punições.
- 0: nome íntegro; 1–2: ecos; 3–4: manifestações; 5–6: nome reclamado.
- Sistema deve interagir com encontros, facções, rituais e uma possível fase do chefe.
- Incluir vias custosas de purificação e efeitos legíveis antes de o jogador aceitar um preço.
- Introduzir somente depois de estabilizar combate e relíquias.

## 8. Metaprogressão e modalidades

### Santuário dos Nomes Esquecidos

- Registrar classe, talentos, relíquias, profundidade, morte, alianças, finais, seed e um título narrativo.
- Desbloqueios horizontais: talentos, relíquias, crônicas, desafios, variantes, cosméticos.
- Evitar progressão numérica permanente obrigatória.

### Modos

1. Expedição Clássica — manter e aprimorar.
2. Contratos da Resistência — objetivos laterais e mudanças de rota.
3. Ciclo da Medula — modificadores qualitativos após vitória.
4. Expedição Diária — seed derivada da data e versão do gerador; offline; placares locais.
5. Desafios de Classe — restrições e objetivos específicos.
6. Descida Sem Fim — posterior e menor prioridade.

## 9. UX e direção de arte

- Preservar Canvas em grade, visual sombrio, proporção vertical e entrada por toque/deslize/teclado.
- Condições legíveis, telegráficos sobre o mapa e mensagens curtas.
- Códice de inimigos, talentos, relíquias e inscrições, progressivamente descoberto.
- Dois botões de habilidade permanecem no HUD. Novos efeitos não devem congestionar controles.
- Pixel art sombria de baixa resolução, consistente com arte existente; não priorizar remake visual.

## 10. Arquitetura

Código atual reside principalmente em index.html, aproximadamente 76 KB. Migração incremental recomendada:

- src/core: game-state, combat, progression, rng, save-manager.
- src/world: dungeon-generator, room-director, encounters, factions.
- src/content: classes, talents, relics, enemies, events, stories.
- src/ui: renderer, hud, modals.
- src/systems: unlocks, achievements, challenges.
- tests: geração, migração e balanceamento.
- assets: sprites, áudio e interface.

Primeiro desacoplar sorteio e persistência; depois sistema de efeitos; por fim mundo/diretor. Não realizar reescrita total numa só entrega.

### Persistência e PWA

- Estado versionado; preservar chaves legadas e migrar objetos antigos.
- Exportação/importação com versão de formato e validação, retrocompatibilidade planejada.
- Cache: sw.js referenciava golzdov-offline-v2 enquanto checkReady() abria golzdov-offline-v1. Corrigir e testar o modo avião.
- Service worker deve publicar nova versão de cache sempre que conteúdo distribuído mudar.
- GitHub Pages/PWA devem funcionar sem servidor e sem conta.

## 11. Roadmap

| Release | Entrega | Aceite |
| --- | --- | --- |
| 1.1 — Fundações | Corrigir cache, versão de saves, RNG, verificações e testes | Mesmo jogo preservado, offline e saves antigos |
| 1.2 — Novas Builds | 9 talentos, efeitos, 6 relíquias, 3 sinergias | 3 builds viáveis e distintas por classe |
| 1.3 — Catacumbas Vivas | 6 salas, 5 eventos, 3 papéis táticos, 4 elites, 1 chefe | Partidas diferem em desafios e decisões |
| 2.0 — O Nome Desperta | Facções, Dívida, finais, narrativa reativa, chefe | Escolhas ao longo da corrida alteram encontros e final |
| 2.1 — O Ciclo Eterno | Santuário, modos, contratos, histórico, conquistas | Pós-vitória oferece novos objetivos |

Cada release deve ter PR revisável, checklist, testes de regressão e atualização de ROADMAP_2.0.md.

## 12. Validação e métricas

- Pelo menos 3 builds viáveis e reconhecíveis por classe.
- Testar 1.000 gerações sem mapa desconectado/escada inalcançável.
- Funcionamento offline de menu, combate, save, importação/exportação e retomada.
- Preservação dos registros de runs e estatísticas existentes.
- Nenhuma mecânica nova pode tornar a vitória impossibilitada exclusivamente por sorte.
- Após 3 vitórias, jogadores ainda identificam objetivos e estratégias inéditas.
- Comparar duração de partidas e distribuição de escolha de talentos sem enviar dados externos.

## 13. Riscos

- Inflar conteúdo sem variedade real de decisões.
- Congestionar controles no mobile.
- Progressão permanente eliminando a tensão roguelike.
- Aleatoriedade resultando em runs sem solução.
- Narrativa interrompendo excessivamente o ritmo.
- Quebrar saves/cache instalados no celular.
- Implementar tudo em index.html antes de modularizar.

## 14. Ordem prática de implementação

1. Criar documentos de design e acompanhamento (este documento e ROADMAP_2.0.md).
2. Corrigir cache PWA e esclarecer o procedimento de atualização.
3. Acrescentar estado/schemaVersion e migração de saves v1.
4. Acrescentar seed e RNG persistido, sem alterar mecânicas de combate.
5. Criar testes automáticos para validação do gerador e retrocompatibilidade.
6. Construir vertical slice de builds nos estratos I e II.
7. Validar sinergias e equilíbrio antes de ampliar narrativa e conteúdo.

**Critério de direção:** cada sistema novo deve criar uma decisão significativa, mudar a estratégia ou tornar o mundo reativo. Não adicionar funcionalidades apenas por volume.
