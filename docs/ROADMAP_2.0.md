# Roadmap executável — Catacumbas de Golzdov 2.0

Atualizado em: 14/10/2026. Planejamento detalhado: [GAME_DESIGN_2.0.md](GAME_DESIGN_2.0.md).

> Convenções: [x] concluído e conferido; [ ] pendente. Mudanças de código devem incluir teste e confirmação antes de marcar [x]. Cada PR/etapa deve atualizar este arquivo.

## Histórico de execução

- 14/10/2026: diagnóstico técnico no repositório (5 estratos, 3 classes, 10 relíquias, 7 inimigos comuns + chefe, 2 finais); priorização de builds e diferenças qualitativas entre partidas.
- 14/10/2026: documento mestre de design criado.
- 14/10/2026: fundações implementadas na branch de trabalho: versão 2 do formato de save, migração dos saves v1, seed persistida, RNG de simulação, cache offline v3, correção da checagem de prontidão e documentação no README.
- 14/10/2026: teste de execução instrumentada aprovado (nova corrida, seed repetida, migração v1, salvar/retomar); 1.000 mapas simulados, 200 por estrato, sem perda de conectividade, inimigos ou itens inacessíveis.
- 14/10/2026: suíte persistente em tests/smoke.test.cjs e workflow de CI adicionados; **a execução real de CI no GitHub ainda precisa ser conferida**.
- 14/10/2026: 1.1 integrada à main pelo PR #2, com suíte de GitHub Actions concluída com sucesso.
- 14/10/2026: início da 1.2: nove talentos de classe (três por classe), escolha progressiva, efeitos sobre combate, histórico de talentos no inventário e proteção dos saves existentes. O sistema genérico de eventos de efeitos e as sinergias de relíquias seguem pendentes.
- 14/10/2026: implementação das fundações técnicas iniciada na branch de trabalho.

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

## 1.2 — Novas Builds (em andamento)

- [ ] Definir contrato de efeitos (onAttack/onKill/onDodge/onTurnStart/onEnterRoom).
- [ ] Catálogo declarativo de talentos com ID e requisitos.
- [x] 3 talentos para Vigia; 3 para Arcanista; 3 para Errante.
- [x] Escolha entre 3 talentos válidos em cada avanço de nível.
- [ ] Regras de exclusividade, repetição, raridade e balanceamento.
- [ ] Reimaginar 6 relíquias com efeitos comportamentais.
- [ ] Criar 3 sinergias entre relíquias.
- [ ] Testar 3 builds viáveis e diferentes por classe, inclusive chefes.

### Observações da 1.2

- O primeiro avanço oferece três talentos de classe. Os avanços seguintes oferecem os talentos ainda disponíveis e melhorias universais; até dois talentos de classe podem ser aprendidos por expedição.
- Os talentos desta primeira fatia foram implementados com ganchos pontuais de combate para minimizar regressões. O sistema declarativo de efeitos, modificadores permanentes das habilidades e as sinergias continuam na fila.
- O limite de dois talentos de classe é provisório e deve ser reavaliado quando cada especialização ganhar talentos aprofundados.

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
