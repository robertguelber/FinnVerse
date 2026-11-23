// ===================== FinnVerse — interface e estado =====================
const C = window.FinnCalc;

const ESTADO_NOME = { bom: 'Saudável', atencao: 'Atenção', critico: 'Crítico' };
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const pct = (v) => (Number.isFinite(v) ? `${Math.round(v * 100)}%` : '—');
const num1 = (v) => v.toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: v < 10 && v % 1 ? 1 : 0 });
const fmtNum = (v) => (Number(v) || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
const parseBR = (txt) => { const n = Number(String(txt).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')); return Number.isFinite(n) ? n : 0; };
const meses = (v) => (v === Infinity ? 'ilimitado' : `${num1(v)} ${Math.abs(v - 1) < 0.05 ? 'mês' : 'meses'}`);

const ELEM = {
  fundacao: {
    nome: 'Fundação', icone: '🧱', representa: 'Reserva de emergência',
    valor: (r) => meses(r.elementos.fundacao.valor), rotulo: 'de custo coberto',
    naCasa: 'A fundação sustenta a casa. Com pouca reserva ela racha e, no estado crítico, a casa chega a inclinar.',
    formula: 'Reserva de emergência ÷ custo mensal (fixas + variáveis + parcelas)',
    faixas: 'Saudável: 6 meses ou mais · Atenção: 3 a 6 · Crítico: menos de 3',
    dicas: {
      bom: 'Sua fundação aguenta 6 meses de imprevistos. A partir daqui, o que sobra pode ir para objetivos de longo prazo.',
      atencao: 'Você já resiste a alguns meses de imprevisto. Separar um valor fixo assim que a renda entra ajuda a chegar aos 6 meses.',
      critico: 'Um imprevisto hoje balançaria a casa. Priorize a reserva: aportes pequenos e constantes fazem diferença.',
    },
  },
  caixa: {
    nome: "Caixa d'água", icone: '💧', representa: 'Liquidez (dinheiro disponível)',
    valor: (r) => meses(r.elementos.caixa.valor), rotulo: 'de contas cobertas',
    naCasa: 'A caixa d’água é o dinheiro de uso imediato. Cheia, ela cobre um mês inteiro de custos.',
    formula: 'Dinheiro disponível ÷ custo mensal',
    faixas: 'Saudável: 1 mês ou mais · Atenção: meio mês a 1 · Crítico: menos de meio mês',
    dicas: {
      bom: 'Caixa cheia: as contas do mês estão cobertas sem sustos.',
      atencao: 'Dá para o básico, mas o nível está baixo. Evite antecipar gastos até a próxima entrada de dinheiro.',
      critico: 'Pouca água na caixa aumenta o risco de cair no cheque especial ou no rotativo do cartão, que estão entre os juros mais altos do mercado.',
    },
  },
  medidor: {
    nome: 'Padrão de energia', icone: '⚡', representa: 'Despesas fixas',
    valor: (r) => pct(r.elementos.medidor.valor), rotulo: 'da renda',
    naCasa: 'O medidor mostra o peso das contas que chegam todo mês. Ponteiro à direita significa pouca folga no orçamento.',
    formula: 'Despesas fixas ÷ renda total',
    faixas: 'Saudável: até 50% · Atenção: 50% a 65% · Crítico: acima de 65%',
    dicas: {
      bom: 'Suas contas fixas deixam espaço para o resto da vida. Revise contratos uma vez por ano para manter assim.',
      atencao: 'As contas fixas estão pesando. Vale renegociar planos, assinaturas e serviços que você pouco usa.',
      critico: 'Mais de 65% da renda já tem destino antes do mês começar. Reduzir um custo fixo grande costuma ter mais efeito do que vários cortes pequenos.',
    },
  },
  cozinha: {
    nome: 'Cozinha', icone: '🍳', representa: 'Despesas variáveis',
    valor: (r) => pct(r.elementos.cozinha.valor), rotulo: 'da renda',
    naCasa: 'A fumaça da chaminé mostra o ritmo dos gastos do dia a dia: mercado, lazer, compras e delivery.',
    formula: 'Despesas variáveis ÷ renda total',
    faixas: 'Saudável: até 30% · Atenção: 30% a 40% · Crítico: acima de 40%',
    dicas: {
      bom: 'Gastos do dia a dia sob controle. Manter um teto semanal ajuda a não perceber só no fim do mês.',
      atencao: 'A chaminé está trabalhando bastante. Anotar os gastos por uma semana costuma revelar onde está o vazamento.',
      critico: 'Os gastos variáveis estão consumindo boa parte da renda. Defina um valor semanal e acompanhe por categoria.',
    },
  },
  telhado: {
    nome: 'Telhado', icone: '🏠', representa: 'Dívidas e compromissos',
    valor: (r) => pct(r.elementos.telhado.valor), rotulo: 'da renda em parcelas',
    naCasa: 'Parcelas pesadas abrem goteiras no telhado. No estado crítico, ele precisa de lona.',
    formula: 'Parcelas mensais de dívidas ÷ renda total',
    faixas: 'Saudável: até 15% · Atenção: 15% a 30% · Crítico: acima de 30%',
    dicas: {
      bom: 'Telhado firme. Antes de assumir uma nova parcela, veja se ela cabe sem passar de 15% da renda.',
      atencao: 'Já tem goteira. Evite novas parcelas e, se possível, quite primeiro as dívidas de juros mais altos.',
      critico: 'As parcelas estão comprometendo demais a renda. Procure renegociar: trocar dívida cara por uma mais barata pode aliviar o mês.',
    },
  },
  paineis: {
    nome: 'Painéis solares', icone: '☀️', representa: 'Renda passiva',
    valor: (r) => pct(r.elementos.paineis.valor), rotulo: 'do custo mensal',
    estados: { bom: 'Forte', atencao: 'Crescendo', critico: 'Em construção' },
    naCasa: 'Cada painel aceso é energia que entra sem você precisar trabalhar por ela.',
    formula: 'Renda passiva ÷ custo mensal',
    faixas: 'Forte: 25% ou mais · Crescendo: 5% a 25% · Em construção: abaixo de 5%',
    dicas: {
      bom: 'Seus painéis já cobrem boa parte das contas. Diversificar as fontes reduz o risco de depender de uma só.',
      atencao: 'Os primeiros painéis estão acesos. A renda passiva cresce aos poucos, com aportes regulares ao longo dos anos.',
      critico: 'Renda passiva costuma vir depois da reserva pronta. Eu sou educativo e não recomendo investimentos específicos: para isso, procure um profissional certificado.',
    },
  },
  jardim: {
    nome: 'Jardim', icone: '🌷', representa: 'Saldo do mês (quanto sobra)',
    valor: (r) => pct(r.elementos.jardim.valor), rotulo: 'da renda sobrando',
    naCasa: 'O jardim cresce com o que sobra no fim do mês. Saldo negativo seca a grama.',
    formula: '(Renda total − custo mensal) ÷ renda total',
    faixas: 'Saudável: sobra 20% ou mais · Atenção: 5% a 20% · Crítico: menos de 5%',
    dicas: {
      bom: 'Jardim florido: sobra mais de 20% da renda. Dê um destino a essa sobra antes que ela se perca no mês.',
      atencao: 'Está sobrando, mas pouco. Pequenos ajustes nas despesas variáveis fazem as flores crescerem.',
      critico: 'Quase nada sobra, ou falta. Comece pelo maior gasto variável e veja o jardim reagir na simulação.',
    },
  },
};
const ORDEM = ['fundacao', 'caixa', 'medidor', 'cozinha', 'telhado', 'paineis', 'jardim'];
const nomeEstado = (id, est) => (ELEM[id].estados && ELEM[id].estados[est]) || ESTADO_NOME[est];

const MISSOES = [
  { id: 'explorar', nome: 'Primeira visita', desc: 'Toque em 3 partes diferentes da casa.', prog: () => [Math.min(state.visitados.size, 3), 3] },
  { id: 'inspetor', nome: 'Inspetor da casa', desc: 'Conheça as 7 partes da casa.', prog: () => [state.visitados.size, 7] },
  { id: 'dados', nome: 'Casa própria', desc: 'Troque os dados de exemplo pelos seus e salve.', prog: () => [state.exemplo ? 0 : 1, 1] },
  { id: 'simular', nome: 'E se…?', desc: 'Faça uma simulação de decisão financeira.', prog: () => [state.simulou ? 1 : 0, 1] },
  { id: 'fundacao', nome: 'Fundação firme', desc: 'Tenha reserva para 3 meses ou mais (dados salvos).', prog: () => { const v = C.compute(state.dados).elementos.fundacao.valor; return [Math.min(3, Math.floor(v * 10) / 10), 3]; } },
  { id: 'ceu', nome: 'Céu aberto', desc: 'Chegue ao clima “Poucas nuvens” ou melhor (dados salvos).', prog: () => [C.compute(state.dados).saude >= 62 ? 1 : 0, 1] },
];

// ---------- estado + persistência local ----------
const LS_KEY = 'finnverse.casa.v1';
function load() { try { const s = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); return s && s.dados ? s : null; } catch (e) { return null; } }
function save() {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ dados: state.dados, exemplo: state.exemplo, visitados: [...state.visitados], simulou: state.simulou, tempo: state.tempo, concluidas: [...state.concluidas] })); } catch (e) { /* armazenamento indisponível */ }
}
const saved = load();
const state = {
  dados: saved ? C.sanitize(saved.dados) : { ...C.EXEMPLO },
  exemplo: saved ? !!saved.exemplo : true,
  sim: null, simulou: saved ? !!saved.simulou : false,
  selecionado: null, aba: 'visao', tempo: (saved && saved.tempo) || 'entardecer',
  visitados: new Set(saved ? saved.visitados : []), concluidas: new Set(saved ? saved.concluidas : []),
  painelAberto: true, autoGiro: true,
};
let calc = C.compute(state.sim || state.dados);

// ---------- DOM ----------
const $ = (s, el = document) => el.querySelector(s);
const panelBody = $('#panel-body');
const tooltip = $('#tooltip');
let world = null;

function finnSvg(size = 40) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="fg${size}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5eead4"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient></defs><path d="M24 6c2-4 7-5 9-3-2 1-4 3-5 6" fill="#34d399"/><circle cx="24" cy="27" r="17" fill="url(#fg${size})"/><circle cx="24" cy="27" r="12.5" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.5"/><circle cx="18.5" cy="25" r="2.6" fill="#1b1533"/><circle cx="29.5" cy="25" r="2.6" fill="#1b1533"/><circle cx="19.3" cy="24.1" r=".9" fill="#fff"/><circle cx="30.3" cy="24.1" r=".9" fill="#fff"/><path d="M19.5 31.5q4.5 3.6 9 0" stroke="#1b1533" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="14" cy="30" r="2" fill="#ff8fb1" opacity=".7"/><circle cx="34" cy="30" r="2" fill="#ff8fb1" opacity=".7"/></svg>`;
}
$('#brand-finn').innerHTML = finnSvg(30);

function climaIcone(id) {
  return { ensolarado: '☀️', 'poucas-nuvens': '🌤️', nublado: '☁️', chuva: '🌧️', tempestade: '⛈️' }[id];
}

function piorElemento(r) {
  const ord = { critico: 0, atencao: 1, bom: 2 };
  return ORDEM.filter((id) => id !== 'paineis').sort((a, b) => ord[r.elementos[a].estado] - ord[r.elementos[b].estado] || r.elementos[b].peso - r.elementos[a].peso)[0];
}

function tag(tipo) {
  const map = { cad: ['Dados cadastrados', 't-cad'], sim: ['Simulação', 't-sim'], calc: ['Calculado', 't-calc'], proj: ['Projeção', 't-proj'] };
  const [txt, cls] = map[tipo]; return `<span class="tag ${cls}">${txt}</span>`;
}

// ---------- renderização ----------
const RANK = { critico: 0, atencao: 1, bom: 2 };
const FRASE_MELHORA = {
  fundacao: 'A fundação ficou mais firme!', caixa: 'A caixa d’água encheu!', medidor: 'O ponteiro aliviou!',
  cozinha: 'A chaminé acalmou!', telhado: 'O telhado foi consertado!', paineis: 'Mais painéis acenderam!', jardim: 'O jardim floresceu!',
};
let ultimoEstado = null;
function celebrarMelhoras(r) {
  if (ultimoEstado) {
    const melhorou = ORDEM.filter((id) => RANK[r.elementos[id].estado] > RANK[ultimoEstado[id]]);
    if (melhorou.length) {
      melhorou.forEach((id, i) => setTimeout(() => world && world.celebrate(id), i * 350));
      toast(`✨ ${FRASE_MELHORA[melhorou[0]]}${melhorou.length > 1 ? ` (+${melhorou.length - 1})` : ''}`);
    }
  }
  ultimoEstado = Object.fromEntries(ORDEM.map((id) => [id, r.elementos[id].estado]));
}

function render() {
  calc = C.compute(state.sim || state.dados);
  if (world) world.applyState(calc);
  celebrarMelhoras(calc);
  // topo
  $('#weather').innerHTML = `<span class="wi">${climaIcone(calc.clima.id)}</span><span><b>${calc.clima.nome}</b><small>Saúde ${calc.saude}/100</small></span>`;
  $('#mode-chip').textContent = state.sim ? 'Simulação' : state.exemplo ? 'Casa de exemplo' : 'Minha casa';
  $('#mode-chip').className = 'chip ' + (state.sim ? 'chip-sim' : '');
  $('#sim-banner').hidden = !state.sim;
  document.querySelectorAll('[data-tempo]').forEach((b) => b.classList.toggle('on', b.dataset.tempo === state.tempo));
  $('#btn-giro').classList.toggle('on', state.autoGiro);
  if (world) $('#btn-qual').dataset.q = world.quality;
  document.querySelectorAll('.tabs [data-aba]').forEach((b) => b.classList.toggle('on', b.dataset.aba === state.aba));
  $('#panel').classList.toggle('closed', !state.painelAberto);
  if (world) {
    const mobile = window.matchMedia('(max-width: 860px)').matches;
    world.setBottomInset(mobile ? (state.painelAberto ? window.innerHeight * 0.44 : 104) : 0);
  }

  if (state.aba === 'visao') panelBody.innerHTML = state.selecionado ? viewDetalhe(state.selecionado) : viewVisao();
  else if (state.aba === 'dados') panelBody.innerHTML = viewDados();
  else if (state.aba === 'simular') panelBody.innerHTML = viewSimular();
  else panelBody.innerHTML = viewMissoes();
  checarMissoes();
}

function viewVisao() {
  const r = calc, base = state.sim ? tag('sim') : tag('calc');
  const pior = piorElemento(r);
  const tiles = ORDEM.map((id) => {
    const e = r.elementos[id];
    return `<button class="tile st-${id === 'paineis' && e.estado === 'critico' ? 'build' : e.estado}" data-sel="${id}">
      <span class="tile-top"><span class="ico">${ELEM[id].icone}</span><span class="dot"></span></span>
      <b>${ELEM[id].nome}</b><small>${ELEM[id].representa}</small>
      <span class="tile-val">${ELEM[id].valor(r)}</span></button>`;
  }).join('');
  return `
  <section class="card health">
    <div class="row between"><span class="eyebrow">Saúde financeira</span>${base}</div>
    <div class="score"><b>${r.saude}</b><span>/100</span><em>${climaIcone(r.clima.id)} ${r.clima.nome}</em></div>
    <div class="bar"><i style="width:${r.saude}%"></i></div>
    <div class="stats">
      <div><small>Renda do mês</small><b>${brl.format(r.rendaTotal)}</b></div>
      <div><small>Custo do mês</small><b>${brl.format(r.custoMensal)}</b></div>
      <div><small>Sobra do mês</small><b class="${r.saldoMensal < 0 ? 'neg' : 'pos'}">${brl.format(r.saldoMensal)}</b></div>
    </div>
  </section>
  <div class="row between section-h"><h3>Espelho da casa</h3><small>Toque para inspecionar</small></div>
  <div class="tiles">${tiles}</div>
  <section class="card finn">${finnSvg(40)}<div><b>Finn</b><p>${r.elementos[pior].estado === 'bom' ? 'Sua casa está em ótimo estado! Explore cada parte para entender o que a mantém de pé.' : `O ponto que mais pede atenção agora: <a href="#" data-sel="${pior}">${ELEM[pior].nome}</a>. ${ELEM[pior].dicas[r.elementos[pior].estado]}`}</p></div></section>
  <section class="card">
    <div class="row between"><span class="eyebrow">Daqui a 12 meses</span>${tag('proj')}</div>
    <p class="proj">${r.saldoMensal > 0
      ? `Se a sobra de <b>${brl.format(r.saldoMensal)}</b> por mês for toda para a reserva, ela chega a <b>${brl.format(r.projecao.reserva12)}</b> (${meses(r.projecao.mesesReserva12)} de custo coberto).`
      : 'Hoje não sobra dinheiro no fim do mês, então a reserva não cresce sozinha. Use a aba Simular para testar ajustes.'}</p>
    <small class="muted">Projeção simples: não considera rendimentos, juros nem inflação.</small>
  </section>
  ${state.exemplo ? `<button class="btn primary wide" data-aba-go="dados">Usar meus próprios dados</button>` : ''}`;
}

function viewDetalhe(id) {
  const r = calc, e = r.elementos[id], m = ELEM[id];
  const st = id === 'paineis' && e.estado === 'critico' ? 'build' : e.estado;
  const extra = id === 'telhado' && r.projecao.mesesParaQuitar
    ? `<p class="muted">Mantendo as parcelas atuais, a quitação levaria cerca de ${r.projecao.mesesParaQuitar} meses (estimativa sem juros). ${tag('proj')}</p>` : '';
  return `
  <button class="back" data-back>← Voltar à casa</button>
  <div class="det-h"><span class="ico big">${m.icone}</span><div><h2>${m.nome}</h2><small>Representa: <b>${m.representa}</b></small></div></div>
  <section class="card st-${st} det-val"><span class="badge">${nomeEstado(id, e.estado)}</span>
    <b>${m.valor(r)}</b><small>${m.rotulo}</small>${state.sim ? tag('sim') : tag('calc')}</section>
  <section class="card"><span class="eyebrow">Na sua casa</span><p>${m.naCasa}</p></section>
  <section class="card"><span class="eyebrow">Como calculamos</span><p class="mono">${m.formula}</p><small class="muted">${m.faixas}</small>${extra}</section>
  <section class="card finn">${finnSvg(40)}<div><b>Finn</b><p>${m.dicas[e.estado]}</p></div></section>
  <div class="row gap"><button class="btn" data-aba-go="dados">Ajustar meus dados</button><button class="btn primary" data-aba-go="simular">Simular decisão</button></div>`;
}

function viewDados() {
  const grupo = (tipo, titulo) => C.FIELDS.filter((f) => f.tipo === tipo).map((f) => `
    <label class="field"><span>${f.label}<small>${f.hint}</small></span>
      <div class="money"><i>R$</i><input type="text" inputmode="decimal" autocomplete="off" name="${f.key}" value="${fmtNum(state.dados[f.key])}"></div></label>`).join('');
  return `
  <div class="row between"><h3>Meus dados</h3>${tag('cad')}</div>
  <p class="muted">Valores aproximados já bastam. Seus dados ficam salvos só neste navegador.</p>
  <form id="form-dados" novalidate>
    <div class="eyebrow mt">Por mês</div>${grupo('fluxo')}
    <div class="eyebrow mt">Saldos de hoje</div>${grupo('estoque')}
    <div class="row gap mt"><button type="button" class="btn" data-exemplo>Restaurar exemplo</button><button class="btn primary" type="submit">Salvar e ver a casa</button></div>
  </form>`;
}

const CENARIOS = [
  { id: 'corte', nome: 'Cortar 20% das variáveis', f: (d) => ({ ...d, despesasVariaveis: Math.round(d.despesasVariaveis * 0.8) }) },
  { id: 'aporte', nome: 'Receber R$ 3.000 e guardar na reserva', f: (d) => ({ ...d, reserva: d.reserva + 3000 }) },
  { id: 'quitar', nome: 'Quitar uma dívida (−R$ 400/mês)', f: (d) => ({ ...d, parcelasDividas: Math.max(0, d.parcelasDividas - 400), saldoDividas: Math.max(0, d.saldoDividas - 400 * 12) }) },
  { id: 'parcela', nome: 'Nova parcela de R$ 800', f: (d) => ({ ...d, parcelasDividas: d.parcelasDividas + 800, saldoDividas: d.saldoDividas + 800 * 24 }) },
  { id: 'perda', nome: 'Perder 30% da renda', f: (d) => ({ ...d, rendaAtiva: Math.round(d.rendaAtiva * 0.7) }) },
];

function compareHtml(base, now) {
  const delta = now.saude - base.saude;
  return `<section class="card compare">
    <div><small>Hoje</small><b>${base.saude}</b><em>${climaIcone(base.clima.id)} ${base.clima.nome}</em></div>
    <div class="arrow ${delta > 0 ? 'pos' : delta < 0 ? 'neg' : ''}">${delta > 0 ? '+' : ''}${delta}</div>
    <div><small>Simulado</small><b>${now.saude}</b><em>${climaIcone(now.clima.id)} ${now.clima.nome}</em></div></section>`;
}

function viewSimular() {
  const s = state.sim || state.dados;
  const base = C.compute(state.dados), now = calc;
  const sliders = C.FIELDS.map((f) => {
    const v0 = state.dados[f.key], max = Math.max(1000, Math.ceil((Math.max(v0, s[f.key]) * 2) / 500) * 500);
    const changed = s[f.key] !== v0;
    return `<label class="slider ${changed ? 'changed' : ''}"><span>${f.label}<b>${brl.format(s[f.key])}</b></span>
      <input type="range" min="0" max="${max}" step="50" name="${f.key}" value="${s[f.key]}">
      <small>Cadastrado: ${brl.format(v0)}</small></label>`;
  }).join('');
  return `
  <div class="sticky">${compareHtml(base, now)}</div>
  <div class="row between"><h3>Simular decisão</h3>${tag('sim')}</div>
  <p class="muted">Teste uma decisão e veja a casa reagir. Nada é salvo até você aplicar.</p>
  <div class="chips">${CENARIOS.map((c) => `<button class="chip-btn" data-cen="${c.id}">${c.nome}</button>`).join('')}</div>
  <div class="sliders">${sliders}</div>
  <div class="row gap mt"><button class="btn" data-sim-descartar ${state.sim ? '' : 'disabled'}>Descartar</button><button class="btn primary" data-sim-aplicar ${state.sim ? '' : 'disabled'}>Aplicar aos meus dados</button></div>`;
}

function viewMissoes() {
  const itens = MISSOES.map((m) => {
    const [a, b] = m.prog(); const ok = a >= b;
    return `<div class="mission ${ok ? 'done' : ''}"><span class="check">${ok ? '✓' : ''}</span>
      <div><b>${m.nome}</b><small>${m.desc}</small><div class="bar sm"><i style="width:${Math.min(100, (a / b) * 100)}%"></i></div></div>
      <span class="mprog">${b > 1 ? `${num1(Math.min(a, b))}/${b}` : ok ? 'Feita' : ''}</span></div>`;
  }).join('');
  const feitas = MISSOES.filter((m) => { const [a, b] = m.prog(); return a >= b; }).length;
  return `<div class="row between"><h3>Missões</h3><span class="chip">${feitas}/${MISSOES.length}</span></div>
  <section class="card finn">${finnSvg(40)}<div><b>Finn</b><p>Cada missão ensina uma parte da sua vida financeira. Comece explorando a casa!</p></div></section>
  ${itens}`;
}

function checarMissoes() {
  for (const m of MISSOES) {
    const [a, b] = m.prog();
    if (a >= b && !state.concluidas.has(m.id)) {
      state.concluidas.add(m.id); save();
      toast(`🏅 Missão concluída: ${m.nome}`);
    }
  }
}

let toastTimer = null;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ---------- ações ----------
function selecionar(id) {
  if (!id || !ELEM[id]) return;
  state.selecionado = id; state.aba = 'visao'; state.painelAberto = true;
  state.visitados.add(id); save();
  state.autoGiro = false;
  if (world) world.focus(id);
  render(); panelBody.scrollTop = 0;
}
function voltar() {
  state.selecionado = null; if (world) world.resetView(); render();
}
function irAba(aba) {
  state.aba = aba; state.painelAberto = true;
  // em Meus dados e Simular a câmera volta para a casa inteira, para ver a reação
  if (aba !== 'visao') { state.selecionado = null; if (world) world.resetView(); }
  render(); panelBody.scrollTop = 0;
}

document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-sel],[data-back],[data-aba],[data-aba-go],[data-tempo],[data-cen],[data-exemplo],[data-sim-aplicar],[data-sim-descartar],#btn-giro,#btn-home,#btn-qual,#panel-handle');
  if (!el) return;
  if (el.tagName === 'A') ev.preventDefault();
  if (el.dataset.sel) return selecionar(el.dataset.sel);
  if (el.hasAttribute('data-back')) return voltar();
  if (el.dataset.aba) return irAba(el.dataset.aba);
  if (el.dataset.abaGo) return irAba(el.dataset.abaGo);
  if (el.dataset.tempo) { state.tempo = el.dataset.tempo; if (world) world.setTime(state.tempo); save(); return render(); }
  if (el.dataset.cen) {
    const c = CENARIOS.find((x) => x.id === el.dataset.cen);
    state.sim = C.sanitize(c.f(state.sim || state.dados)); state.simulou = true; save();
    toast(`Simulando: ${c.nome}`); return render();
  }
  if (el.hasAttribute('data-exemplo')) { state.dados = { ...C.EXEMPLO }; state.exemplo = true; state.sim = null; save(); toast('Dados de exemplo restaurados'); return render(); }
  if (el.hasAttribute('data-sim-aplicar')) { if (state.sim) { state.dados = state.sim; state.sim = null; state.exemplo = false; save(); toast('Simulação aplicada aos seus dados'); } return render(); }
  if (el.hasAttribute('data-sim-descartar')) { state.sim = null; toast('Simulação descartada'); return render(); }
  if (el.id === 'btn-giro') { state.autoGiro = !state.autoGiro; if (world) world.setAutoRotate(state.autoGiro); return render(); }
  if (el.id === 'btn-home') { state.selecionado = null; if (world) world.resetView(); return render(); }
  if (el.id === 'btn-qual') {
    if (!world) return;
    const ordem = world.hasEffects ? ['alta', 'media', 'baixa'] : ['baixa'];
    const next = ordem[(ordem.indexOf(world.quality) + 1) % ordem.length];
    world.setQuality(next); toast(`Qualidade visual: ${{ alta: 'alta', media: 'média', baixa: 'econômica' }[next]}`); return render();
  }
  if (el.id === 'panel-handle') { state.painelAberto = !state.painelAberto; return render(); }
});

document.addEventListener('submit', (ev) => {
  if (ev.target.id !== 'form-dados') return;
  ev.preventDefault();
  const fd = new FormData(ev.target); const d = {};
  for (const f of C.FIELDS) d[f.key] = parseBR(fd.get(f.key));
  state.dados = C.sanitize(d); state.exemplo = false; state.sim = null; save();
  toast('Dados salvos. Veja como ficou sua casa!');
  state.aba = 'visao'; state.selecionado = null; if (world) world.resetView(); render();
});

document.addEventListener('focusout', (ev) => {
  const t = ev.target; if (!t.closest || !t.closest('#form-dados') || t.tagName !== 'INPUT') return;
  t.value = fmtNum(parseBR(t.value));
});

let simRaf = null;
document.addEventListener('input', (ev) => {
  const t = ev.target;
  if (t.type !== 'range' || !t.closest('.sliders')) return;
  state.sim = { ...(state.sim || state.dados), [t.name]: Number(t.value) };
  state.simulou = true;
  // atualiza a casa e os números sem recriar os sliders (mantém o arraste fluido)
  const lab = t.closest('.slider'); lab.querySelector('b').textContent = brl.format(Number(t.value));
  lab.classList.toggle('changed', Number(t.value) !== state.dados[t.name]);
  cancelAnimationFrame(simRaf);
  simRaf = requestAnimationFrame(() => {
    calc = C.compute(state.sim); if (world) world.applyState(calc);
    const base = C.compute(state.dados);
    const cmp = panelBody.querySelector('.compare');
    if (cmp) cmp.outerHTML = compareHtml(base, calc);
    celebrarMelhoras(calc);
    $('#weather').innerHTML = `<span class="wi">${climaIcone(calc.clima.id)}</span><span><b>${calc.clima.nome}</b><small>Saúde ${calc.saude}/100</small></span>`;
    $('#mode-chip').textContent = 'Simulação'; $('#mode-chip').className = 'chip chip-sim';
    $('#sim-banner').hidden = false;
    panelBody.querySelectorAll('[data-sim-aplicar],[data-sim-descartar]').forEach((b) => { b.disabled = false; });
  });
});
document.addEventListener('change', (ev) => { if (ev.target.type === 'range' && ev.target.closest('.sliders')) { save(); checarMissoes(); } });

// ---------- tooltip de hover ----------
let hoverId = null;
function onFrame() {
  if (!hoverId || !world) return;
  const p = world.screenPos(hoverId);
  if (!p || !p.visible) { tooltip.hidden = true; return; }
  tooltip.style.transform = `translate(${p.x}px, ${p.y - 26}px) translate(-50%, -100%)`;
}

// ---------- inicialização ----------
function webglOk() {
  try { const c = document.createElement('canvas'); return !!(window.WebGL2RenderingContext && c.getContext('webgl2')) || !!c.getContext('webgl'); } catch (e) { return false; }
}
if (webglOk()) {
  try {
    world = createWorld($('#canvas-wrap'), {
      onPick: (id) => { if (id) selecionar(id); },
      onHover: (id) => {
        hoverId = id; tooltip.hidden = !id;
        if (id) { const e = calc.elementos[id]; tooltip.innerHTML = `<b>${ELEM[id].nome}</b><span>${ELEM[id].representa} · ${nomeEstado(id, e.estado)}</span>`; }
      },
      onUserMove: () => { if (state.autoGiro) { state.autoGiro = false; $('#btn-giro').classList.remove('on'); } },
      onFrame,
      onQuality: (q) => { $('#btn-qual').dataset.q = q; toast(q === 'baixa' ? 'Qualidade reduzida para manter a fluidez' : 'Qualidade ajustada ao seu aparelho'); },
    });
    world.setTime(state.tempo);
  } catch (err) {
    console.error(err); world = null; $('#webgl-error').hidden = false;
  }
} else {
  $('#webgl-error').hidden = false;
}
$('#loading').remove();
window.addEventListener('resize', () => { if (world) { const mobile = window.matchMedia('(max-width: 860px)').matches; world.setBottomInset(mobile ? (state.painelAberto ? window.innerHeight * 0.44 : 104) : 0); } });
render();
if (world) world.setAutoRotate(state.autoGiro);
