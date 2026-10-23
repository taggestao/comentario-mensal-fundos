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

// Baixa de dentro da página, para usar os cookies que o site gravou (Cloudflare, Akamai etc.)
async function baixarNaPagina(page, url) {
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
async function novaPagina() {
  if (!browser) {
    browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH || undefined,
      args: ['--disable-blink-features=AutomationControlled'],
    });
  }
  const ctx = await browser.newContext({ userAgent: UA, locale: 'en-GB' });
  return ctx.newPage();
}
async function fecharBrowser() {
  if (browser) await browser.close();
  browser = null;
}

module.exports = { UA, mesNumero, ehPdf, baixar, textoPdf, baixarNaPagina, novaPagina, fecharBrowser };
