// Ninety One GSF Emerging Markets Corporate Debt Fund – I Acc USD (LU0611395327)
// Factsheet mensal. O link é fixo e o gestor sobrescreve a cada mês; o site fica atrás do
// Cloudflare, então abrimos a página do fundo antes e baixamos de dentro dela.
// O "Quarterly Reporting" não está no site: chega por e-mail (noreplyclientopsreporting@ninetyone.com).
const { novaPagina, baixarNaPagina, textoPdf, mesNumero } = require('../lib/util');

const PAGINA = 'https://ninetyone.com/en/international/funds-strategies/funds/emerging-markets-corporate-debt-i-acc-usd-lu0611395327';
const FACTSHEET = 'https://ninetyone.com/-/media/documents/factsheet/91-gsf-emerging-markets-corporate-debt-fund-i-usd-factsheet-en.pdf';

module.exports = {
  nome: 'Ninety One',
  pasta: 'Ninety One\\Ninety One GSF Emerging Markets Corporate Debt Fund\\Institucional',
  async coletar() {
    const page = await novaPagina();
    await page.goto(PAGINA, { waitUntil: 'domcontentloaded', timeout: 60000 });
    for (let i = 0; i < 20 && /just a moment/i.test(await page.title()); i++) await page.waitForTimeout(2000);
    await page.waitForTimeout(3000);
    const buf = await baixarNaPagina(page, FACTSHEET);
    const t = await textoPdf(buf);
    if (!t.includes('LU0611395327')) throw new Error('ISIN LU0611395327 não encontrado no factsheet');
    const m = t.match(/end\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d\d)/i)
           || t.match(/\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d\d)/i);
    if (!m) throw new Error('mês de referência não encontrado no factsheet');
    const mes = m[2] + mesNumero(m[1]);
    return [{ mes, arquivo: `Ninety One GSF Emerging Markets Corporate Debt Fund - ${mes} - Fact Sheet - I Acc USD.pdf`, buf }];
  },
};
