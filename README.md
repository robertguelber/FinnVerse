# 🏠 FinnVerse

**Educação financeira gamificada em 3D:** suas finanças viram uma casa que reage aos seus números.

O **FinnVerse** é uma plataforma de educação financeira gamificada que transforma a vida financeira do usuário em uma **casa 3D interativa**. Em vez de gráficos e planilhas, cada parte da casa representa um componente das finanças e muda de aparência conforme os números do usuário.

A **fundação** representa a reserva de emergência: quando ela é pequena, aparecem rachaduras e a casa chega a inclinar. A **caixa d'água** mostra a liquidez, com o nível de água subindo ou descendo conforme o dinheiro disponível. O **padrão de energia** indica o peso das despesas fixas com um ponteiro, e a **chaminé da cozinha** solta mais fumaça quanto maiores os gastos variáveis. As **dívidas** abrem goteiras no **telhado**, que precisa de lona no estado crítico. A **renda passiva** acende **painéis solares**, e o **jardim** floresce ou seca de acordo com o que sobra no fim do mês.

Todos esses indicadores formam uma **pontuação de saúde financeira de 0 a 100**, que define o **clima** ao redor da casa: do sol aberto à tempestade com chuva, poças e raios. A cena tem ciclo de **dia, entardecer e noite**, com iluminação, reflexos e efeitos visuais inspirados em jogos.

O usuário pode **girar e aproximar a câmera**, tocar em cada parte da casa para entender o que ela representa e como o indicador é calculado, e receber dicas educativas do **Finn**, o assistente virtual. Na área de **simulação**, é possível testar decisões ("e se eu cortar 20% dos gastos variáveis?", "e se eu assumir uma nova parcela?") e ver a casa reagir antes de decidir. **Missões** guiam o aprendizado, e partículas e mensagens celebram cada melhora.

Os dados ficam salvos **apenas no navegador** de cada usuário, e o projeto funciona em computador e celular. O FinnVerse é uma ferramenta **educativa**: o Finn explica conceitos, mas não recomenda investimentos específicos.

**Versão atual:** protótipo MVP v2.3

🔗 **Jogue agora:** https://robertguelber.github.io/FinnVerse/

---

## ✨ Como funciona

Cada parte da casa representa um componente da sua vida financeira:

| Parte da casa | Representa | Indicador |
|---|---|---|
| 🧱 Fundação | Reserva de emergência | Meses de custo cobertos |
| 💧 Caixa d'água | Liquidez | Dinheiro disponível ÷ custo mensal |
| ⚡ Padrão de energia | Despesas fixas | % da renda |
| 🍳 Cozinha (chaminé) | Despesas variáveis | % da renda |
| 🏠 Telhado | Dívidas | Parcelas ÷ renda |
| ☀️ Painéis solares | Renda passiva | Renda passiva ÷ custo mensal |
| 🌷 Jardim | Sobra do mês | (Renda − custo) ÷ renda |

O **clima** (ensolarado, poucas nuvens, nublado, chuva ou tempestade) reflete a saúde financeira geral, de 0 a 100.

## 🎮 Funcionalidades

- **Casa 3D interativa:** gire, aproxime e toque em cada parte para ver o indicador.
- **Clima financeiro dinâmico:** sol, nuvens, chuva, poças e raios, além de dia, entardecer e noite.
- **Simulação de decisões:** teste cenários ("cortar 20% das variáveis", "nova parcela") e veja a casa reagir antes de decidir.
- **Missões educativas:** desafios que ensinam cada conceito.
- **Finn, o assistente:** dicas educativas para cada situação.
- **Privacidade:** os dados ficam apenas no seu navegador.

## 🚀 Como abrir

Acesse o link acima ou abra o arquivo `docs/index.html` em qualquer navegador com internet.

## 🗂️ Estrutura

```
src/
  calc.js               motor de cálculo financeiro (puro, sem dependências)
  world.js              cena 3D (Three.js): casa, clima, câmera e efeitos
  app.js                interface, estado, simulação e missões
  index.template.html   layout e estilos
build.py                junta tudo em docs/index.html (arquivo único)
docs/index.html         versão pronta para abrir ou publicar
test/
  calc.test.js          testes dos cálculos
  ui_test.py            teste da interface no Chrome (Playwright)
  mock_three.py         substitutos da biblioteca 3D para testes offline
```

## 🛠️ Desenvolvimento

```bash
python3 build.py          # gera docs/index.html a partir de src/
node test/calc.test.js    # roda os testes dos cálculos
```

## 🧰 Tecnologias

- [Three.js](https://threejs.org/): renderização 3D e pós-processamento
- JavaScript, HTML e CSS
- Python: script de build e testes de interface

## 🗺️ Próximos passos

- [ ] Migração para Vite + React + React Three Fiber + Zustand + Supabase
- [ ] Mais detalhes e vida na casa (objetos, vegetação animada, Finn em 3D)
- [ ] Máquina do tempo: a casa daqui a 1, 5 e 10 anos
- [ ] Simulador de financiamento imobiliário (tabelas SAC e Price)
- [ ] Contas de usuário e sincronização na nuvem

## ⚠️ Aviso

O FinnVerse é uma ferramenta **educativa**. O Finn não recomenda investimentos específicos. Para decisões financeiras, procure um profissional certificado.

---

Desenvolvido por **Robert Guelber** · Protótipo MVP v2.3