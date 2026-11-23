/* FinnVerse — motor de cálculo financeiro (puro, sem dependências).
 * Regras: entradas são valores mensais (fluxos) ou saldos (estoques).
 * Fluxos e estoques nunca são somados entre si, evitando dupla contagem. */
(function (root) {
  'use strict';

  const FIELDS = [
    { key: 'rendaAtiva', label: 'Renda do trabalho', hint: 'Salário, pró-labore, freelas (por mês)', tipo: 'fluxo' },
    { key: 'rendaPassiva', label: 'Renda passiva', hint: 'Aluguéis, dividendos, juros (por mês)', tipo: 'fluxo' },
    { key: 'despesasFixas', label: 'Despesas fixas', hint: 'Moradia, contas, escola, planos (por mês)', tipo: 'fluxo' },
    { key: 'despesasVariaveis', label: 'Despesas variáveis', hint: 'Mercado, lazer, compras, delivery (por mês)', tipo: 'fluxo' },
    { key: 'parcelasDividas', label: 'Parcelas de dívidas', hint: 'Financiamentos, empréstimos, cartão parcelado (por mês)', tipo: 'fluxo' },
    { key: 'saldoDividas', label: 'Saldo devedor total', hint: 'Quanto falta pagar de todas as dívidas', tipo: 'estoque' },
    { key: 'reserva', label: 'Reserva de emergência', hint: 'Dinheiro guardado só para imprevistos', tipo: 'estoque' },
    { key: 'saldoDisponivel', label: 'Dinheiro disponível', hint: 'Conta corrente e saldo de uso imediato', tipo: 'estoque' },
  ];

  const EXEMPLO = {
    rendaAtiva: 6500, rendaPassiva: 250, despesasFixas: 3200, despesasVariaveis: 1600,
    parcelasDividas: 900, saldoDividas: 14000, reserva: 7000, saldoDisponivel: 2200,
  };

  const SCORE = { bom: 1, atencao: 0.5, critico: 0 };

  function sanitize(d) {
    const out = {};
    for (const f of FIELDS) {
      const v = Number(d && d[f.key]);
      out[f.key] = Number.isFinite(v) && v > 0 ? Math.round(v * 100) / 100 : 0;
    }
    return out;
  }

  // Faixa "quanto maior, melhor"
  function faixaAlta(v, bom, atencao) {
    if (v >= bom) return 'bom';
    if (v >= atencao) return 'atencao';
    return 'critico';
  }
  // Faixa "quanto menor, melhor"
  function faixaBaixa(v, bom, atencao) {
    if (v <= bom) return 'bom';
    if (v <= atencao) return 'atencao';
    return 'critico';
  }
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  function compute(raw) {
    const d = sanitize(raw);
    const rendaTotal = d.rendaAtiva + d.rendaPassiva;
    const custoMensal = d.despesasFixas + d.despesasVariaveis + d.parcelasDividas;
    const saldoMensal = rendaTotal - custoMensal;

    // meses cobertos por um estoque; sem custo → cobertura ilimitada se houver saldo
    const meses = (estoque) => (custoMensal > 0 ? estoque / custoMensal : (estoque > 0 ? Infinity : 0));
    // fração da renda; sem renda → 0 se não há gasto, senão "infinito" (crítico)
    const fracRenda = (v) => (rendaTotal > 0 ? v / rendaTotal : (v > 0 ? Infinity : 0));

    const mesesReserva = meses(d.reserva);
    const mesesLiquidez = meses(d.saldoDisponivel);
    const pctFixas = fracRenda(d.despesasFixas);
    const pctVariaveis = fracRenda(d.despesasVariaveis);
    const pctParcelas = fracRenda(d.parcelasDividas);
    const coberturaPassiva = custoMensal > 0 ? d.rendaPassiva / custoMensal : (d.rendaPassiva > 0 ? 1 : 0);
    const taxaPoupanca = rendaTotal > 0 ? saldoMensal / rendaTotal : (saldoMensal < 0 ? -Infinity : 0);

    let estadoDividas;
    if (d.parcelasDividas === 0 && d.saldoDividas === 0) estadoDividas = 'bom';
    else if (d.parcelasDividas === 0 && d.saldoDividas > 0) estadoDividas = 'atencao'; // dívida sem plano de pagamento
    else estadoDividas = faixaBaixa(pctParcelas, 0.15, 0.30);

    const elementos = {
      fundacao: { estado: faixaAlta(mesesReserva, 6, 3), valor: mesesReserva, nivel: clamp(mesesReserva / 6, 0, 1), peso: 1.2 },
      caixa: { estado: faixaAlta(mesesLiquidez, 1, 0.5), valor: mesesLiquidez, nivel: clamp(mesesLiquidez, 0, 1), peso: 1 },
      medidor: { estado: faixaBaixa(pctFixas, 0.5, 0.65), valor: pctFixas, nivel: clamp(pctFixas, 0, 1), peso: 1 },
      cozinha: { estado: faixaBaixa(pctVariaveis, 0.3, 0.4), valor: pctVariaveis, nivel: clamp(pctVariaveis / 0.5, 0, 1), peso: 0.8 },
      telhado: { estado: estadoDividas, valor: pctParcelas, nivel: clamp(pctParcelas / 0.4, 0, 1), peso: 1.2 },
      paineis: { estado: faixaAlta(coberturaPassiva, 0.25, 0.05), valor: coberturaPassiva, nivel: clamp(coberturaPassiva / 0.25, 0, 1), peso: 0.4 },
      jardim: { estado: faixaAlta(taxaPoupanca, 0.2, 0.05), valor: taxaPoupanca, nivel: clamp(taxaPoupanca / 0.2, 0, 1), peso: 1.2 },
    };

    let soma = 0, pesos = 0;
    for (const k in elementos) { soma += SCORE[elementos[k].estado] * elementos[k].peso; pesos += elementos[k].peso; }
    const saude = Math.round((soma / pesos) * 100);

    let clima;
    if (saude >= 80) clima = { id: 'ensolarado', nome: 'Ensolarado', intensidade: 0 };
    else if (saude >= 62) clima = { id: 'poucas-nuvens', nome: 'Poucas nuvens', intensidade: 0.22 };
    else if (saude >= 45) clima = { id: 'nublado', nome: 'Nublado', intensidade: 0.45 };
    else if (saude >= 28) clima = { id: 'chuva', nome: 'Chuva', intensidade: 0.72 };
    else clima = { id: 'tempestade', nome: 'Tempestade', intensidade: 1 };

    // Projeção simples: todo saldo positivo do mês vai para a reserva, sem rendimento
    const reserva12 = d.reserva + Math.max(saldoMensal, 0) * 12;
    const projecao = {
      reserva12,
      mesesReserva12: meses(reserva12),
      mesesParaQuitar: d.saldoDividas > 0 && d.parcelasDividas > 0 ? Math.ceil(d.saldoDividas / d.parcelasDividas) : null,
    };

    return { dados: d, rendaTotal, custoMensal, saldoMensal, taxaPoupanca, elementos, saude, clima, projecao };
  }

  const api = { FIELDS, EXEMPLO, sanitize, compute, SCORE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.FinnCalc = api;
})(typeof window !== 'undefined' ? window : globalThis);
