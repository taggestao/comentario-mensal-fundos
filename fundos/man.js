// Man High Yield Opportunities – I Acc USD (IE00BL6VJ735)
// Usa a API da central de documentos da man.com. O site escolhe o catálogo pelo IP:
// do Brasil/Europa o fundo aparece; de um IP dos EUA ele não existe.
// Não foi possível testar daqui (servidor nos EUA): na primeira execução confira o log.
const { UA, baixar } = require('../lib/util');

const BASE = 'https://www.man.com';

async function listar() {
  const q = new URLSearchParams({ page: '1', size: '50', name: 'High Yield Opportunities' });
  q.append('years[]', 'latest');
  const r = await fetch(`${BASE}/documents/list?${q}`, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
  if (!r.ok) throw new Error(`HTTP ${r.status} na lista de documentos`);
  const html = (await r.json()).list || '';
  return [...html.matchAll(/data-document-title="([^"]*)"[\s\S]*?href="([^"]*)"/g)]
    .map(m => ({ titulo: m[1], href: m[2] }))
    .filter(d => /High Yield Opportunities/i.test(d.titulo) && !/ETF|DE\b/i.test(d.titulo));
}

// título com data dd-mm-aaaa -> aaaamm
const mesDoTitulo = t => { const m = t.match(/(\d{2})-(\d{2})-(\d{4})/); return m ? m[3] + m[2] : null; };

module.exports = {
  nome: 'Man',
  pasta: 'Man Group\\GLG\\Man High Yield Opportunities\\Institucional',
  async coletar() {
    const docs = await listar();
    if (!docs.length) throw new Error('fundo não apareceu na lista da man.com (bloqueio por país?)');
    const maisRecente = re => docs.filter(d => re.test(d.titulo) && mesDoTitulo(d.titulo))
      .sort((a, b) => mesDoTitulo(b.titulo).localeCompare(mesDoTitulo(a.titulo)))[0];
    const alvo = {
      'Fact Sheet - I Acc USD': maisRecente(/fact\s*sheet/i),
      'Commentary': maisRecente(/commentary/i),
    };
    const out = [];
    for (const [sufixo, d] of Object.entries(alvo)) {
      if (!d) throw new Error(`não achei "${sufixo}" entre: ${docs.map(x => x.titulo).join(' | ')}`);
      const mes = mesDoTitulo(d.titulo);
      out.push({ mes, arquivo: `Man High Yield Opportunities Fund - ${mes} - ${sufixo}.pdf`, buf: await baixar(BASE + d.href), origem: d.titulo });
    }
    return out;
  },
};
