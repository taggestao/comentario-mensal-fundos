// Neuberger Corporate Hybrid Bond Fund – USD A Acc (IE00BD0PCH68); a tabela usa a USD I Acc (IE00BDHBH503)
// O nb.com tem checagem anti-robô (Vercel) que barra acesso de servidores; do computador da equipe, com o Edge,
// a página do fundo abre. Aqui abrimos a página, pegamos os links de PDF do factsheet e do Manager Commentary e
// lemos o mês dentro de cada PDF. Se o site mudar o endereço da página, ajuste PAGINAS.
// (Não testado de fora do Brasil: o primeiro uso no computador da equipe confirma os links.)
const { novaPagina, baixarNaPagina, textoPdf, mesNumero } = require('../lib/util');

const PAGINAS = [
  'https://www.nb.com/en/lu/funds/ie00bd0pch68',
  'https://www.nb.com/en/global/funds/ie00bd0pch68',
];
const NOME = 'Neuberger Corporate Hybrid Bond Fund';
const DOCS = [
  { sufixo: 'A ACC USD - Fact Sheet', link: /fact\s*sheet/i, url: /fact|fs/i },
  { sufixo: 'Commentary', link: /commentary/i, url: /comment/i },
];
const MES_TEXTO = /(?:\b\d{1,2}\s+)?(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d\d)/i;

module.exports = {
  nome: 'Neuberger',
  pasta: 'Neuberger Berman\\Neuberger Berman Corporate Hybrid\\Institucional',
  async coletar() {
    const p = await novaPagina();
    let links = [];
    for (const pagina of PAGINAS) {
      await p.goto(pagina, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
      await p.waitForTimeout(6000);
      if (/Security Checkpoint/i.test(await p.title())) continue;
      for (const sel of ['#onetrust-accept-btn-handler', 'button:has-text("Accept")', 'button:has-text("I agree")']) {
        await p.click(sel, { timeout: 3000 }).catch(() => {});
      }
      await p.waitForTimeout(2000);
      links = await p.$$eval('a', as => as.map(a => ({ texto: (a.innerText || a.title || '').trim(), href: a.href })));
      if (links.some(l => /\.pdf|documents|literature/i.test(l.href))) break;
    }
    if (!links.length) throw new Error('nb.com não abriu (checagem anti-robô); salve o factsheet e o comentário à mão na pasta');
    const out = [];
    for (const d of DOCS) {
      const l = links.find(x => d.link.test(x.texto) && /\.pdf|documents|literature|download/i.test(x.href))
        || links.find(x => /\.pdf/i.test(x.href) && d.url.test(x.href));
      if (!l) throw new Error(`link não encontrado na página: ${d.sufixo}`);
      const buf = await baixarNaPagina(p, l.href);
      const m = (await textoPdf(buf, 1)).match(MES_TEXTO);
      if (!m) throw new Error(`mês de referência não encontrado no PDF: ${d.sufixo}`);
      const mes = m[2] + mesNumero(m[1]);
      out.push({ mes, arquivo: `${mes} - ${NOME} ${d.sufixo.startsWith('A ACC') ? d.sufixo : '- ' + d.sufixo}.pdf`, buf });
    }
    return out;
  },
};
