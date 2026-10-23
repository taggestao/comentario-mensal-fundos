// PIMCO GIS Income Fund – Institutional USD Acc (IE00B87KCF77)
// Site atrás do Akamai: precisa do navegador, aceitar cookies e a tela "Financial Professional"
// (Luxembourg). A lista de documentos vem da API da própria página.
// "Commentary" = o mais recente entre Quarterly Investment Report e Monthly Commentary
// (em mês de fim de trimestre vale o trimestral, como no arquivo de set/2026).
const { novaPagina, baixarNaPagina } = require('../lib/util');

const PAGINA = 'https://www.pimco.com/lu/en/investments/gis/income-fund/inst-usd-accumulation';
const DOCS = {
  'Fact Sheet - Inst USD': ['Fund Fact Sheet'],
  'Commentary': ['Quarterly Investment Report', 'Monthly Commentaries'],
};

module.exports = {
  nome: 'PIMCO',
  pasta: 'PIMCO\\PIMCO GIS Income Fund\\Institucional',
  async coletar() {
    const p = await novaPagina();
    let lista = null;
    p.on('response', async r => {
      if (/fund-detail-api\/api\/funds\/[^/]+\/documents\/literature/.test(r.url())) { try { lista = await r.json(); } catch (e) {} }
    });
    await p.goto(PAGINA, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await p.waitForTimeout(6000);
    await p.click('#onetrust-accept-btn-handler', { timeout: 5000 }).catch(() => {});
    await p.evaluate(() => {
      const r = document.querySelector('input[name=role][value="Financial Professional"]');
      if (!r || !document.querySelector('.visitor-settings-modal__initial-content--active')) return;
      r.click();
      document.querySelectorAll('.visitor-settings-modal__initial-content input[type=checkbox]').forEach(c => { if (!c.checked) c.click(); });
      const btn = [...document.querySelectorAll('button')].find(x => x.innerText.trim() === 'Accept');
      if (btn) btn.click();
    });
    for (let i = 0; i < 40 && !lista; i++) await p.waitForTimeout(1000);
    if (!lista) throw new Error('lista de documentos não carregou');

    const out = [];
    for (const [sufixo, nomes] of Object.entries(DOCS)) {
      // data mais recente vence; no empate vale a ordem da lista (trimestral antes do mensal)
      const d = lista.filter(x => nomes.includes(x.name) && x.fileType === 'pdf')
        .sort((a, z) => z.date.localeCompare(a.date) || nomes.indexOf(a.name) - nomes.indexOf(z.name))[0];
      if (!d) throw new Error(`documento não encontrado: ${nomes.join(' / ')}`);
      const mes = d.date.slice(0, 7).replace('-', '');
      out.push({ mes, arquivo: `PIMCO GIS Income Fund - ${mes} - ${sufixo}.pdf`, buf: await baixarNaPagina(p, d.url) });
    }
    return out;
  },
};
