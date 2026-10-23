// Man GLG High Yield Opportunities – I H USD (IE00BDTYYM31)
// Duas fontes, nesta ordem:
//  1. Central de documentos da man.com. O site escolhe o catálogo pelo IP: do Brasil/Europa o
//     fundo aparece; de um IP dos EUA ele não existe.
//  2. "Man Group.zip" que a HMC/Gama publica junto do e-mail "Atualização Mensal MAN"
//     (botão "Acessar materiais"). O endereço é sempre o mesmo e o conteúdo é trocado a cada mês.
const AdmZip = require('adm-zip');
const { UA, baixar, ehPdf } = require('../lib/util');

const BASE = 'https://www.man.com';
const ZIP_HMC = 'https://content.hmccap.com/hubfs/Man%20Group.zip';

// "..._28-08-2026.pdf" / título com dd-mm-aaaa -> aaaamm
const mesDe = t => { const m = t.match(/(\d{2})-(\d{2})-(\d{4})/); return m ? m[3] + m[2] : null; };
const maisRecente = (lista, re) => lista.filter(d => re.test(d.titulo) && mesDe(d.titulo))
  .sort((a, b) => mesDe(b.titulo).localeCompare(mesDe(a.titulo)))[0];

const ALVOS = {
  'Fact Sheet - I Acc USD': /I_?H_?USD.*fact\s*sheet|fact\s*sheet.*I H USD/i,
  'Commentary': /commentary/i,
};

function montar(escolhidos) {
  return Object.entries(escolhidos).map(([sufixo, d]) => {
    const mes = mesDe(d.titulo);
    return { mes, arquivo: `Man High Yield Opportunities Fund - ${mes} - ${sufixo}.pdf`, buf: d.buf, origem: d.titulo };
  });
}

async function viaSite() {
  const q = new URLSearchParams({ page: '1', size: '50', name: 'High Yield Opportunities' });
  q.append('years[]', 'latest');
  const r = await fetch(`${BASE}/documents/list?${q}`, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
  if (!r.ok) throw new Error(`HTTP ${r.status} na lista de documentos`);
  const docs = [...((await r.json()).list || '').matchAll(/data-document-title="([^"]*)"[\s\S]*?href="([^"]*)"/g)]
    .map(m => ({ titulo: m[1], href: m[2] }))
    .filter(d => /High Yield Opportunities/i.test(d.titulo) && !/ETF/i.test(d.titulo));
  if (!docs.length) throw new Error('fundo não aparece na man.com (bloqueio por país)');
  const escolhidos = {};
  for (const [sufixo, re] of Object.entries(ALVOS)) {
    const d = maisRecente(docs, re);
    if (!d) throw new Error(`man.com: não achei "${sufixo}" entre: ${docs.map(x => x.titulo).join(' | ')}`);
    escolhidos[sufixo] = { titulo: d.titulo, buf: await baixar(BASE + d.href) };
  }
  return montar(escolhidos);
}

async function viaZipHmc() {
  const r = await fetch(ZIP_HMC, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`HTTP ${r.status} no zip da HMC`);
  const entradas = new AdmZip(Buffer.from(await r.arrayBuffer())).getEntries()
    .filter(e => /High Yield Opportunities\/Offshore\/.+\.pdf$/i.test(e.entryName))
    .map(e => ({ titulo: e.entryName.split('/').pop(), e }));
  const escolhidos = {};
  for (const [sufixo, re] of Object.entries(ALVOS)) {
    const d = maisRecente(entradas, re);
    if (!d) throw new Error(`zip da HMC: não achei "${sufixo}"`);
    const buf = d.e.getData();
    if (!ehPdf(buf)) throw new Error(`zip da HMC: ${d.titulo} não é PDF`);
    escolhidos[sufixo] = { titulo: `zip HMC: ${d.titulo}`, buf };
  }
  return montar(escolhidos);
}

module.exports = {
  nome: 'Man',
  pasta: 'Man Group\\GLG\\Man High Yield Opportunities\\Institucional',
  async coletar() {
    try {
      return await viaSite();
    } catch (e) {
      console.log(`[Man] site indisponível (${e.message}); tentando o zip da HMC/Gama`);
      return viaZipHmc();
    }
  },
};
