// BSF Global Event Driven – relatórios que a BlackRock manda por e-mail (Monthly Fund Update e
// Quarterly Extended Commentary). O link ("securelink") exige login no portal da BlackRock:
// o Apps Script (apps-script/coleta_email.gs) anota os links em _links_pendentes.json na pasta do
// fundo, e aqui baixamos com a sessão salva pelo login_blackrock.bat.
const fs = require('fs');
const path = require('path');
const { baixarComSessao } = require('../lib/blackrock');

module.exports = {
  nome: 'BSF (e-mail)',
  pasta: 'BlackRock\\BlackRock Strategic Funds\\BSF Global Event Driven Fund\\Institucional',
  async coletar({ pasta }) {
    const arq = path.join(pasta, '_links_pendentes.json');
    if (!fs.existsSync(arq)) return [];
    const faltam = JSON.parse(fs.readFileSync(arq, 'utf8') || '[]')
      .filter(x => x.arquivo && x.link && !fs.existsSync(path.join(pasta, x.arquivo)));
    if (!faltam.length) return [];
    const bufs = await baixarComSessao(faltam);
    return faltam.map(x => ({ mes: (x.arquivo.match(/(\d{6})/) || [])[1], arquivo: x.arquivo, buf: bufs[x.arquivo] }));
  },
};
