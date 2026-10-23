// AQR Apex UCITS Fund (classe A1 USD, LU2793907176)
// A página do fundo só abre para usuários logados no MyAQR: precisa de AQR_USUARIO e AQR_SENHA (ver lib/aqr.js).
// Na seção Fund Literature: Monthly Summary Report (obrigatório) e FactSheet Class A1 USD.
// A "Quarterly Letter" chega por e-mail e não está na página.
const { coletarFundo } = require('../lib/aqr');

module.exports = {
  nome: 'AQR Apex',
  pasta: 'AQR\\AQR Alternative Strategies\\AQR Apex Strategy\\Institucional',
  coletar: () => coletarFundo(
    '/Funds/Alternatives/AQR-Apex-UCITS-Fund',
    { 'Monthly Summary Report': /monthly summary report/i, 'Fact Sheet - A1 USD': /factsheet/i },
    (mes, sufixo) => `AQR APEX UCITS Fund - ${mes} - ${sufixo}.pdf`,
  ),
};
