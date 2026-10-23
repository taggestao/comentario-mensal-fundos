// Algebris Financial Credit Fund (UCITS) – I EUR Acc (IE00B81TMV64)
// O servidor de PDFs da Algebris publica o factsheet mensal com o mês no nome e aceita download
// direto, sem a tela de país/perfil do site (que muda conforme o país de quem acessa).
// Tentamos do mês atual para trás e ficamos com o primeiro que existir.
const { baixar } = require('../lib/util');

const MESES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const BASE = 'https://media.algebris.com/algebris/Factsheets/Archives/GFU/EN/';
// já vimos as duas grafias no nome do arquivo
const nomes = (mes, ano) => [
  `Algebris_Financial_Credit_Fund_(UCITS)_-_I_EUR_-_${mes}_-_${ano}_-_EN.pdf`,
  `Algebris_Financial_Credit_Fund_(UCITS)_-_I_EUR_-_${mes}-${ano}_-_EN.pdf`,
];

module.exports = {
  nome: 'Algebris',
  pasta: 'Algebris Investments\\Algebris Financial Credit Fund\\Institucional',
  async coletar() {
    const hoje = new Date();
    for (let atras = 0; atras < 4; atras++) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - atras, 1);
      const ano = d.getFullYear(), i = d.getMonth();
      for (const n of nomes(MESES[i], ano)) {
        let buf;
        try { buf = await baixar(BASE + n); } catch { continue; }
        const mes = `${ano}${String(i + 1).padStart(2, '0')}`;
        return [{ mes, arquivo: `Algebris Financial Credit Fund - ${mes} - Fact Sheet - I Acc EUR.pdf`, buf }];
      }
    }
    throw new Error('nenhum factsheet I EUR encontrado nos últimos 4 meses (mudou o nome do arquivo?)');
  },
};
