// AQR Delphi Long-Short Equity UCITS Fund
// A página do fundo só abre para usuários logados no MyAQR: precisa de AQR_USUARIO e AQR_SENHA (ver lib/aqr.js).
// Na seção Fund Literature: Monthly Summary Report (obrigatório) e FactSheet.
// O "Custom Risk Report" e o "Since Inception Performance" chegam só no pacote mensal por e-mail.
const { coletarFundo } = require('../lib/aqr');

module.exports = {
  nome: 'AQR Delphi',
  pasta: 'AQR\\AQR Alternative Strategies\\AQR Delphi Long-Short Equity Strategy\\Institucional',
  coletar: () => coletarFundo(
    '/Funds/Alternatives/AQR-Delphi-Long-Short-Equity-UCITS-Fund',
    { 'Monthly Summary Report': /monthly summary report/i, 'Fact Sheet': /factsheet/i },
    (mes, sufixo) => `AQR Delphi Long Short Equity UCITS Fund - ${mes} - ${sufixo}.pdf`,
  ),
};
