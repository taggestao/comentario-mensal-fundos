// AQR Delphi Long-Short Equity UCITS Fund (LU2694862363 / LU1842781202)
// Documentos só para usuários logados no MyAQR: precisa de AQR_USUARIO e AQR_SENHA (ver lib/aqr.js).
// O "Custom Risk Report" e o "Since Inception Performance" chegam só no pacote mensal por e-mail.
const { coletarFundo } = require('../lib/aqr');

module.exports = {
  nome: 'AQR Delphi',
  pasta: 'AQR\\AQR Alternative Strategies\\AQR Delphi Long-Short Equity Strategy\\Institucional',
  coletar: () => coletarFundo(
    /delphi/i,
    { 'Update': /monthly update/i, 'Quarterly Letter': /quarterly letter/i },
    (mes, sufixo) => `AQR Delphi Long Short Equity UCITS Fund - ${mes} - ${sufixo}.pdf`,
  ),
};
