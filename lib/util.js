const { chromium } = require('playwright');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const MESES = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

// "September" / "SEP" / "Sept" -> "09"
function mesNumero(nome) {
  const i = MESES.findIndex(m => m.startsWith(nome.toLowerCase().slice(0, 3)));
  if (i < 0) throw new Error(`mês desconhecido: ${nome}`);
  return String(i + 1).padStart(2, '0');
}

function ehPdf(buf) {
  return buf && buf.length > 4 && buf.subarray(0, 4).toString() === '%PDF';
}

async function baixar(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
  if (!r.ok) throw new Error(`HTTP ${r.status} em ${url}`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (!ehPdf(buf)) throw new Error(`não é PDF: ${url}`);
  return buf;
}

// Texto das primeiras páginas do PDF (usado para ler o mês de referência)
async function textoPdf(buf, paginas = 2) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf), verbosity: 0 }).promise;
  let texto = '';
  for (let i = 1; i <= Math.min(paginas, doc.numPages); i++) {
    const c = await (await doc.getPage(i)).getTextContent();
    texto += c.items.map(x => x.str + (x.hasEOL ? '\n' : ' ')).join('') + '\n';
  }
  await doc.destroy();
  return texto.replace(/[ \t]+/g, ' ');
}

// Baixa usando a sessão da página (cookies de Cloudflare, Akamai etc.). Primeiro pelo cliente HTTP do
// navegador, que não carrega o PDF na memória da aba; se falhar (ex.: proxy), baixa de dentro da página.
async function baixarNaPagina(page, url) {
  try {
    const r = await page.context().request.get(url, { timeout: 120000 });
    const buf = await r.body();
    if (r.ok() && ehPdf(buf)) return buf;
  } catch (e) { /* tenta de dentro da página */ }
  const r = await page.evaluate(async u => {
    const res = await fetch(u, { credentials: 'include' });
    const a = new Uint8Array(await res.arrayBuffer());
    let s = '';
    for (let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000));
    return { status: res.status, b64: btoa(s) };
  }, url);
  const buf = Buffer.from(r.b64, 'base64');
  if (r.status !== 200 || !ehPdf(buf)) throw new Error(`HTTP ${r.status} / não é PDF: ${url}`);
  return buf;
}

let browser = null;
let contextos = [];
async function novaPagina() {
  // reabre o navegador se ele caiu em um fundo anterior
  if (!browser || !browser.isConnected()) {
    const args = ['--disable-blink-features=AutomationControlled', '--disable-gpu', '--disable-dev-shm-usage'];
    browser = null;
    // no Windows usa o Microsoft Edge instalado: o Chromium baixado pela rotina foi encerrado
    // no meio da coleta no computador da equipe (antivírus/política), o Edge costuma ser liberado
    if (process.platform === 'win32' && !process.env.CHROMIUM_PATH) {
      browser = await chromium.launch({ channel: 'msedge', args }).catch(() => null);
    }
    if (!browser) browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args });
  }
  const ctx = await browser.newContext({ userAgent: UA, locale: 'en-GB' });
  contextos.push(ctx);
  return ctx.newPage();
}
// fecha as abas abertas por um fundo, para não acumular memória entre os fundos
async function fecharPaginas() {
  await Promise.all(contextos.map(c => c.close().catch(() => {})));
  contextos = [];
}
async function fecharBrowser() {
  await fecharPaginas();
  if (browser) await browser.close().catch(() => {});
  browser = null;
}

module.exports = { UA, mesNumero, ehPdf, baixar, textoPdf, baixarNaPagina, novaPagina, fecharPaginas, fecharBrowser };
