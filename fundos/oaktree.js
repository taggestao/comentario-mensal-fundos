// Oaktree Fund (Lux) III – Oaktree Global Credit Fund – Class I USD Acc (LU1617687584)
// Factsheet mensal em link fixo por classe, sem barreira de perfil.
const { baixar, textoPdf, mesNumero } = require('../lib/util');

const ISIN = 'LU1617687584';
const FACTSHEET = 'https://www.oaktreesicav.com/docs/librariesprovider7/factsheets/nonucits/oaktree-global-credit-fund---class-i-en.pdf';

module.exports = {
  nome: 'Oaktree',
  pasta: 'Oaktree\\Oaktree Global Credit Fund\\Institucional',
  async coletar() {
    const buf = await baixar(FACTSHEET);
    const t = await textoPdf(buf, 1);
    if (!t.includes(ISIN)) throw new Error(`ISIN ${ISIN} não encontrado no factsheet`);
    const m = t.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+(20\d\d)\s*\|\s*Monthly Factsheet/i);
    if (!m) throw new Error('mês de referência não encontrado no factsheet');
    const mes = m[2] + mesNumero(m[1]);
    return [{ mes, arquivo: `Oaktree Fund (Lux) III – Oaktree Global Credit Fund - ${mes} - Fact Sheet - I Acc USD.pdf`, buf }];
  },
};
