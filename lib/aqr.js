// Acesso ao site de UCITS da AQR (ucits.aqr.com). Os documentos dos fundos só aparecem para
// usuários logados no MyAQR, então o login usa as variáveis de ambiente AQR_USUARIO e AQR_SENHA
// (nunca gravar a senha no código). Uma única sessão é compartilhada entre os fundos da AQR.
const fs = require('fs');
const path = require('path');
const { novaPagina, baixarNaPagina, textoPdf, mesNumero } = require('./util');

const BASE = 'https://ucits.aqr.com';
let sessao = null;

async function entrar() {
  const usuario = process.env.AQR_USUARIO, senha = process.env.AQR_SENHA;
  if (!usuario || !senha) {
    throw new Error('o site da AQR exige login: defina as variáveis de ambiente AQR_USUARIO e AQR_SENHA (conta MyAQR)');
  }
  const p = await novaPagina();
  await p.goto(`${BASE}/Login?returnUrl=/fund-finder`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForTimeout(3000);
  await confirmarPerfil(p);
  await p.fill('#Login_Email', usuario);
  await p.fill('#Login_Password', senha);
  // Enter não envia este formulário: é preciso clicar no botão Login (o envio é via /api/feature/myaqr/login)
  await Promise.all([
    p.waitForResponse(r => /\/api\/feature\/myaqr\/login/i.test(r.url()), { timeout: 60000 }).catch(() => {}),
    // só o botão do formulário de login (o topo da página tem outro botão de envio, o da busca)
    p.locator('#loginForm button[type=submit], #loginForm input[type=submit], form:has(#Login_Email) button[type=submit]').first().click(),
  ]);
  await p.waitForTimeout(5000);
  await confirmarPerfil(p);
  const corpo = await p.innerText('body').catch(() => '');
  if (process.env.AQR_DEBUG) console.log('[AQR debug]', p.url(), corpo.replace(/\s+/g, ' ').slice(0, 300));
  const aindaNoLogin = /\/login/i.test(new URL(p.url()).pathname) && await p.locator('#Login_Password').isVisible().catch(() => false);
  if (/login failed/i.test(corpo) || aindaNoLogin) {
    // guarda um print da tela para diagnóstico (logs/aqr-login.png)
    fs.mkdirSync('logs', { recursive: true });
    await p.screenshot({ path: path.join('logs', 'aqr-login.png'), fullPage: true }).catch(() => {});
    const msg = (corpo.match(/The login failed[^.]*\./i) || [''])[0];
    throw new Error(`login na AQR falhou${msg ? ` (site: "${msg}")` : ''}; confira AQR_USUARIO / AQR_SENHA e o print em logs\\aqr-login.png`);
  }
  return p;
}

// Janela de "investidor institucional / não residente nos EUA / termos de uso"
async function confirmarPerfil(p) {
  for (const id of ['#institutionalChk', '#TnCChk']) {
    const c = p.locator(id);
    if (await c.isVisible().catch(() => false) && !(await c.isChecked().catch(() => true))) await c.check().catch(() => {});
  }
  for (const nome of ['Confirm', 'Proceed']) {
    const b = p.getByRole('link', { name: nome }).or(p.getByRole('button', { name: nome })).first();
    if (await b.isVisible().catch(() => false)) { await b.click().catch(() => {}); await p.waitForTimeout(1500); }
  }
}

// Mês de referência lido do próprio PDF: "September 2026" ou, em cartas trimestrais, "Q3 2026"
async function mesDoPdf(buf) {
  const t = await textoPdf(buf, 1);
  const m = t.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d\d)/i);
  if (m) return m[2] + mesNumero(m[1]);
  const q = t.match(/Q([1-4])\s*(20\d\d)/);
  if (q) return q[2] + String(q[1] * 3).padStart(2, '0');
  throw new Error('mês de referência não encontrado no PDF');
}

// Baixa os documentos do fundo listados na central de documentos.
// tipos: { 'Monthly update': /monthly update/i, ... } -> sufixo do arquivo e regex do título do documento
async function coletarFundo(reFundo, tipos, nomeArquivo) {
  if (!sessao || sessao.isClosed()) sessao = await entrar();
  const p = sessao;
  await p.goto(`${BASE}/fund-finder#panel-documents`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForTimeout(6000);
  // cada link de documento com o texto do bloco onde aparece (nome do fundo + nome do documento)
  const links = await p.$$eval('a[href]', as => as.map(a => {
    const bloco = a.closest('tr, li, article, .card, .document, div');
    return { href: a.href, texto: `${a.innerText} ${a.title || ''} ${bloco ? bloco.innerText : ''}`.replace(/\s+/g, ' ') };
  }).filter(l => /\.pdf|download|document|media/i.test(l.href)));
  const doFundo = links.filter(l => reFundo.test(l.texto));
  if (!doFundo.length) throw new Error('nenhum documento do fundo na central da AQR (mudou o site?)');

  const out = [];
  for (const [sufixo, re] of Object.entries(tipos)) {
    const l = doFundo.find(x => re.test(x.texto));
    if (!l) { if (sufixo === Object.keys(tipos)[0]) throw new Error(`documento "${sufixo}" não encontrado`); continue; }
    const buf = await baixarNaPagina(p, l.href);
    const mes = await mesDoPdf(buf);
    out.push({ mes, arquivo: nomeArquivo(mes, sufixo), buf });
  }
  return out;
}

module.exports = { coletarFundo, mesDoPdf };
