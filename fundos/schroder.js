// Schroder GAIA Contour Tech Equity Fund – C Acc USD (LU1725199621)
// O fund centre da schroders.com aponta para links fixos no document-store, sobrescritos a cada
// mês e sem barreira de perfil: factsheet da classe C Acc USD e o "Monthly Fund Update" da Contour.
const { baixar, textoPdf, mesNumero } = require('../lib/util');

const BASE = 'https://api.schroders.com/document-store/';
const FACTSHEET = BASE + 'GAIA-Contour-Tech-Equity-C-Acc-FMR-UKEN.pdf';
const COMENTARIO = BASE + 'Schroder-GAIA-Contour-Tech-Equity-Monthly-Fund-Update.pdf';
const MES = 'January|February|March|April|May|June|July|August|September|October|November|December';

module.exports = {
  nome: 'Schroder',
  pasta: 'Contour Asset Mgmt\\Schroder GAIA Contour Tech Equity Fund\\Institucional',
  async coletar() {
    const fs = await baixar(FACTSHEET);
    const tf = await textoPdf(fs, 1);
    if (!tf.includes('LU1725199621')) throw new Error('ISIN LU1725199621 não encontrado no factsheet');
    // cabeçalho da performance anual discreta: "... Sep 25 ... 26" -> último período termina em set/2026
    const per = [...tf.matchAll(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{2})\b/g)].pop();
    if (!per) throw new Error('mês de referência não encontrado no factsheet');
    const mesFs = `20${String(+per[2] + 1).padStart(2, '0')}${mesNumero(per[1])}`;

    const cm = await baixar(COMENTARIO);
    const m = (await textoPdf(cm, 1)).match(new RegExp(`Fund update:\\s*(${MES})\\s+(20\\d\\d)`, 'i'));
    if (!m) throw new Error('mês de referência não encontrado no comentário');
    const mesCm = m[2] + mesNumero(m[1]);

    return [
      { mes: mesFs, arquivo: `Schroder GAIA Contour Tech Equity Fund - ${mesFs}- Fact Sheet - C Acc USD.pdf`, buf: fs },
      { mes: mesCm, arquivo: `Schroder GAIA Contour Tech Equity Fund - ${mesCm}- Commentary.pdf`, buf: cm },
    ];
  },
};
