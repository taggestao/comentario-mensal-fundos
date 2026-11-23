// JPMorgan Investment Funds – Global High Yield Bond Fund – A (acc) USD (LU0344579056)
// A API de dados do site (am.jpmorgan.com) devolve o link do factsheet da classe (jp.techrules.com), que só
// entrega o PDF com o Referer do site da JPM. O comentário do gestor vem por e-mail ("Early Commentary for
// Global HY fund and ETF") e é salvo pelo Apps Script.
const { textoPdf, mesNumero, ehPdf } = require('../lib/util');

const ISIN = 'LU0344579056';
const DADOS = `https://am.jpmorgan.com/FundsMarketingHandler/product-data?cusip=${ISIN}&country=lu&role=per&language=en`;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';

module.exports = {
  nome: 'JPM Global HY',
  pasta: 'JP Morgan\\JPM Funds\\JPM Funds - Global High Yield Bond Fund\\Institucional',
  async coletar() {
    const r = await fetch(DADOS, { headers: { 'User-Agent': UA } });
    if (!r.ok) throw new Error(`HTTP ${r.status} na API de dados da JPM`);
    const url = (await r.json())?.fundData?.factsheetUrl;
    if (!url) throw new Error('link do factsheet não veio na API da JPM');
    const f = await fetch(url, { headers: { 'User-Agent': UA, Referer: 'https://am.jpmorgan.com/' } });
    const buf = Buffer.from(await f.arrayBuffer());
    if (!f.ok || !ehPdf(buf)) throw new Error(`HTTP ${f.status} / não é PDF: ${url}`);
    // "Factsheet | 31 October 2026"
    const m = (await textoPdf(buf, 1)).match(/Factsheet\s*\|\s*\d{1,2}\s+([A-Za-z]+)\s+(20\d\d)/);
    if (!m) throw new Error('mês de referência não encontrado no factsheet');
    const mes = m[2] + mesNumero(m[1]);
    return [{ mes, arquivo: `JPM Global High Yield Bond Fund - ${mes} - Fact Sheet - A Acc USD.pdf`, buf }];
  },
};
