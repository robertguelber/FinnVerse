const assert = require('assert');
const C = require('../src/calc.js');
let n = 0;
const t = (name, fn) => { fn(); n++; console.log('ok -', name); };

t('exemplo: fluxos sem dupla contagem', () => {
  const r = C.compute(C.EXEMPLO);
  assert.strictEqual(r.rendaTotal, 6750);
  assert.strictEqual(r.custoMensal, 5700);
  assert.strictEqual(r.saldoMensal, 1050);
});
t('exemplo: estados esperados', () => {
  const e = C.compute(C.EXEMPLO).elementos;
  assert.strictEqual(e.fundacao.estado, 'critico');      // 7000/5700 = 1.23 meses
  assert.strictEqual(e.medidor.estado, 'bom');           // 3200/6750 = 47%
  assert.strictEqual(e.telhado.estado, 'bom');           // 900/6750 = 13%
  assert.strictEqual(e.cozinha.estado, 'bom');           // 1600/6750 = 23.7%
  assert.strictEqual(e.jardim.estado, 'atencao');        // 1050/6750 = 15.6%
});
t('liquidez 0.39 meses é crítico (< 0.5)', () => {
  assert.strictEqual(C.compute(C.EXEMPLO).elementos.caixa.estado, 'critico');
});
t('entradas inválidas viram zero', () => {
  const s = C.sanitize({ rendaAtiva: 'abc', despesasFixas: -50, reserva: '1200.5' });
  assert.strictEqual(s.rendaAtiva, 0); assert.strictEqual(s.despesasFixas, 0); assert.strictEqual(s.reserva, 1200.5);
});
t('tudo zerado não gera NaN', () => {
  const r = C.compute({});
  assert.ok(Number.isFinite(r.saude));
  for (const k in r.elementos) assert.ok(!Number.isNaN(r.elementos[k].nivel), k);
});
t('sem renda e com gastos -> crítico e tempestade', () => {
  const r = C.compute({ despesasFixas: 2000, despesasVariaveis: 500, parcelasDividas: 300, saldoDividas: 5000 });
  assert.strictEqual(r.elementos.medidor.estado, 'critico');
  assert.strictEqual(r.elementos.jardim.estado, 'critico');
  assert.strictEqual(r.clima.id, 'tempestade');
});
t('finanças saudáveis -> ensolarado', () => {
  const r = C.compute({ rendaAtiva: 10000, rendaPassiva: 2000, despesasFixas: 4000, despesasVariaveis: 2000,
    reserva: 40000, saldoDisponivel: 7000 });
  assert.strictEqual(r.saude, 100); assert.strictEqual(r.clima.id, 'ensolarado');
});
t('dívida sem parcela é atenção', () => {
  const r = C.compute({ rendaAtiva: 5000, saldoDividas: 3000 });
  assert.strictEqual(r.elementos.telhado.estado, 'atencao');
});
t('projeção soma só saldo positivo', () => {
  const r = C.compute(C.EXEMPLO);
  assert.strictEqual(r.projecao.reserva12, 7000 + 1050 * 12);
  assert.strictEqual(r.projecao.mesesParaQuitar, Math.ceil(14000 / 900));
  const neg = C.compute({ rendaAtiva: 1000, despesasFixas: 2000, reserva: 500 });
  assert.strictEqual(neg.projecao.reserva12, 500);
});
t('limites de faixa exatos', () => {
  const r = C.compute({ rendaAtiva: 1000, despesasFixas: 500, reserva: 3000 }); // 50% fixas, 6 meses
  assert.strictEqual(r.elementos.medidor.estado, 'bom');
  assert.strictEqual(r.elementos.fundacao.estado, 'bom');
});
console.log(`\n${n} testes passaram`);
