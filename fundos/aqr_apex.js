// AQR Apex UCITS Fund (LU2793907176)
// Documentos só para usuários logados no MyAQR: precisa de AQR_USUARIO e AQR_SENHA (ver lib/aqr.js).
// O "Monthly update" é obrigatório; a "Quarterly Letter" é salva quando estiver publicada.
const { coletarFundo } = require('../lib/aqr');

module.exports = {
  nome: 'AQR Apex',
  pasta: 'AQR\\AQR Alternative Strategies\\AQR Apex Strategy\\Institucional',
  coletar: () => coletarFundo(
    /apex/i,
    { 'Monthly update': /monthly update/i, 'Quarterly Letter': /quarterly letter/i },
    (mes, sufixo) => `AQR APEX UCITS Fund - ${mes} - ${sufixo}.pdf`,
  ),
};
