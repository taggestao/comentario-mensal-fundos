// Jupiter Merian Global Equity Absolute Return Fund (GEAR) – I USD Acc (IE00BLP5S684)
// A página do fundo (perfil profissional, Luxemburgo) lista os PDFs no serviço de documentos da
// Jupiter, com a data de referência no nome (…-AAAAMMDD.pdf). Os links baixam direto, sem login.
const { novaPagina, baixar, textoPdf, mesNumero } = require('../lib/util');

const PAGINA = 'https://www.jupiteram.com/lu/en/professional/fund-centre/?language=en&externalId=JAM_IE00BLP5S684&r=%2Ffund%2FJAM_IE00BLP5S684&fundName=jupiter-merian-global-equity-absolute-return-fund--i-usd-acc';
const NOME = 'Jupiter Merian Global Equity Absolute Return Fund';
const DOCS = {
  'Fact Sheet - I Acc USD': /IUSDACC_PA_Retail_IE00BLP5S684_en-GB-(\d{8})\.pdf$/,
  'Fund Monthly Investment Report - I Acc USD': /MIR-pro-jgear1-.*-(\d{8})\.pdf$/,
};

module.exports = {
  nome: 'Jupiter',
  pasta: 'Jupiter Asset Mgmt\\Jupiter Merian Global Equity Absolute Return Fund - GEAR\\Institucional',
  async coletar() {
    const p = await novaPagina();
    await p.goto(PAGINA, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await p.click('#onetrust-accept-btn-handler', { timeout: 8000 }).catch(() => {});
    let links = [];
    for (let i = 0; i < 30; i++) {
      links = [...new Set(await p.$$eval('a', as => as.map(a => a.href)))].filter(u => /dms-api\.jupiteram/.test(u));
      if (Object.values(DOCS).every(re => links.some(u => re.test(u)))) break;
      await p.waitForTimeout(1000);
    }
    const out = [];
    for (const [sufixo, re] of Object.entries(DOCS)) {
      const url = links.filter(u => re.test(u)).sort((a, b) => b.match(re)[1].localeCompare(a.match(re)[1]))[0];
      if (!url) throw new Error(`link não encontrado na página: ${sufixo}`);
      const buf = await baixar(url);
      // confirma no texto do PDF a data de referência que vem no nome do link
      const mes = url.match(re)[1].slice(0, 6);
      const texto = await textoPdf(buf, 2);
      const meses = [
        ...[...texto.matchAll(/\d{1,2}[./](\d{1,2})[./](20\d\d)/g)].map(m => m[2] + m[1].padStart(2, '0')),
        ...[...texto.matchAll(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d\d)/gi)].map(m => m[2] + mesNumero(m[1])),
      ];
      if (!meses.includes(mes)) throw new Error(`mês ${mes} não encontrado no texto do PDF: ${sufixo}`);
      out.push({ mes, arquivo: `${NOME} - ${mes}- ${sufixo}.pdf`, buf });
    }
    return out;
  },
};
