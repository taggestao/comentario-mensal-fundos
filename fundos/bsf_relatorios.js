// BSF Global Event Driven – relatórios que a BlackRock manda por e-mail (Monthly Fund Update e
// Quarterly Extended Commentary). O link ("securelink") exige login pessoal no portal da BlackRock.
//
// Caminho principal: você clica no link do e-mail no seu navegador de sempre (já logado), o PDF vai
// para Downloads, e aqui o arquivo é renomeado com o nome padrão e salvo na pasta do fundo.
// Alternativa: se houver sessão salva pelo login_blackrock.bat, baixa sozinho os links que o
// Apps Script anotou em _links_pendentes.json.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { SESSAO, baixarComSessao } = require('../lib/blackrock');

const NOME = 'BSF Global Event Driven Fund';
const DOWNLOADS = process.env.PASTA_DOWNLOADS || path.join(os.homedir(), 'Downloads');

// "BlackRock_Global_Event_Driven_Monthly_Fund_Update.371849.391725.portfolio.20260930.pdf"
function nomePadrao(arquivoBaixado) {
  if (!/Global[_ ]Event[_ ]Driven/i.test(arquivoBaixado) || !/\.pdf$/i.test(arquivoBaixado)) return null;
  const d = arquivoBaixado.match(/(20\d\d)(0[1-9]|1[0-2])\d{2}(?!\d)/);
  if (!d) return null;
  const mes = d[1] + d[2];
  if (/Monthly[_ ]Fund[_ ]Update/i.test(arquivoBaixado)) return { mes, arquivo: `${NOME} - ${mes} - Fund Update.pdf` };
  if (/Extended/i.test(arquivoBaixado)) return { mes, arquivo: `${NOME} - ${mes} - Quarterly Extended Commentary.pdf` };
  return null;
}

module.exports = {
  nome: 'BSF (e-mail)',
  pasta: 'BlackRock\\BlackRock Strategic Funds\\BSF Global Event Driven Fund\\Institucional',
  nomePadrao,
  async coletar({ pasta }) {
    const out = [];
    // 1) PDFs da BlackRock que você baixou pelo link do e-mail (pasta Downloads)
    if (fs.existsSync(DOWNLOADS)) {
      for (const f of fs.readdirSync(DOWNLOADS)) {
        const alvo = nomePadrao(f);
        if (alvo && !out.some(o => o.arquivo === alvo.arquivo)) {
          out.push({ ...alvo, buf: fs.readFileSync(path.join(DOWNLOADS, f)), origem: `Downloads\\${f}` });
        }
      }
    }
    // 2) links anotados pelo Apps Script que ainda faltam
    const arq = path.join(pasta, '_links_pendentes.json');
    const faltam = fs.existsSync(arq)
      ? JSON.parse(fs.readFileSync(arq, 'utf8') || '[]').filter(x => x.arquivo && x.link
          && !fs.existsSync(path.join(pasta, x.arquivo)) && !out.some(o => o.arquivo === x.arquivo))
      : [];
    if (faltam.length) {
      if (!fs.existsSync(SESSAO)) {
        if (out.length) return out;
        throw new Error(`falta baixar ${faltam.map(x => x.arquivo).join(', ')}: clique no link do e-mail da BlackRock no seu navegador (o PDF vai para Downloads) e rode a coleta de novo`);
      }
      const bufs = await baixarComSessao(faltam);
      faltam.forEach(x => out.push({ mes: (x.arquivo.match(/(\d{6})/) || [])[1], arquivo: x.arquivo, buf: bufs[x.arquivo] }));
    }
    return out;
  },
};
