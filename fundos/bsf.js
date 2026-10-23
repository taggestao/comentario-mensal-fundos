// BSF Global Event Driven Fund – Class A2 USD (LU1251620883)
// Factsheet mensal em link fixo da BlackRock (sem barreira de perfil), sobrescrito a cada mês.
// O "Fund Update" (relatório do gestor em PowerPoint) não está no site público; chega por outro canal.
const { baixar, textoPdf, mesNumero } = require('../lib/util');

const ISIN = 'LU1251620883';
const FACTSHEET = 'https://www.blackrock.com/gls-download/literature/fact-sheet/bsf-global-event-driven-fund-class-a2-usd-factsheet-lu1251620883-lu-en-individual.pdf';

module.exports = {
  nome: 'BSF',
  pasta: 'BlackRock\\BlackRock Strategic Funds\\BSF Global Event Driven Fund\\Institucional',
  async coletar() {
    const buf = await baixar(FACTSHEET);
    const t = await textoPdf(buf, 1);
    if (!t.includes(ISIN)) throw new Error(`ISIN ${ISIN} não encontrado no factsheet`);
    const m = t.match(/information as at:\s*\d{1,2}-([A-Za-z]{3})-(20\d\d)/i);
    if (!m) throw new Error('mês de referência não encontrado no factsheet');
    const mes = m[2] + mesNumero(m[1]);
    return [{ mes, arquivo: `BSF Global Event Driven Fund - ${mes} - Fact Sheet - A2 Acc USD.pdf`, buf }];
  },
};
