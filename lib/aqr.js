// Acesso ao site de UCITS da AQR (ucits.aqr.com). Os documentos dos fundos só aparecem para
// usuários logados no MyAQR, então o login usa as variáveis de ambiente AQR_USUARIO e AQR_SENHA
// (nunca gravar a senha no código). Uma única sessão é compartilhada entre os fundos da AQR.
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
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
  await p.locator('#Login_Email').waitFor({ state: 'visible', timeout: 30000 }).catch(() => {});
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

// Telas antes do login: aviso de cookies e a janela "Consent" (não residente nos EUA, investidor
// profissional, termos de uso -> "I Agree & Continue"). Do Brasil a AQR mostra a janela Consent;
// em outros acessos aparece a versão com #institutionalChk / #TnCChk e Confirm/Proceed.
async function confirmarPerfil(p) {
  const cookies = p.getByRole('button', { name: /^\s*accept\s*$/i }).first();
  if (await cookies.isVisible().catch(() => false)) { await cookies.click().catch(() => {}); await p.waitForTimeout(800); }

  // janela de consentimento: marca todas as caixas visíveis dentro dela e confirma
  // a janela é o menor bloco que tem o texto do consentimento e o botão "I Agree"
  const botaoOk = p.getByRole('button', { name: /I Agree/i }).or(p.getByRole('link', { name: /I Agree/i }));
  const janela = p.locator('div, form, [role=dialog]')
    .filter({ hasText: /I am not a resident of the United States/i })
    .filter({ has: botaoOk }).last();
  if (await janela.isVisible().catch(() => false)) {
    const caixas = janela.locator('input[type=checkbox]');
    for (let i = 0; i < await caixas.count(); i++) {
      const c = caixas.nth(i);
      if (!(await c.isChecked().catch(() => true))) {
        await c.check({ force: true }).catch(async () => {
          // caixas estilizadas: clica no rótulo
          const id = await c.getAttribute('id').catch(() => null);
          if (id) await p.locator(`label[for="${id}"]`).click().catch(() => {});
        });
      }
    }
    const ok = botaoOk.first();
    if (await ok.isVisible().catch(() => false)) { await ok.click().catch(() => {}); await p.waitForTimeout(2000); }
  }

  for (const id of ['#institutionalChk', '#TnCChk']) {
    const c = p.locator(id);
    if (await c.isVisible().catch(() => false) && !(await c.isChecked().catch(() => true))) await c.check().catch(() => {});
  }
  for (const nome of ['Confirm', 'Proceed']) {
    const b = p.getByRole('link', { name: nome }).or(p.getByRole('button', { name: nome })).first();
    if (await b.isVisible().catch(() => false)) { await b.click().catch(() => {}); await p.waitForTimeout(1500); }
  }
}

// Mês de referência lido do próprio PDF: "September 2026", "Q3 2026" ou uma data numérica (9/30/2026)
async function mesDoPdf(buf) {
  const t = await textoPdf(buf, 1);
  const m = t.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(?:\d{1,2},\s+)?(20\d\d)/i);
  if (m) return m[2] + mesNumero(m[1]);
  const q = t.match(/Q([1-4])\s*(20\d\d)/);
  if (q) return q[2] + String(q[1] * 3).padStart(2, '0');
  const d = t.match(/\b(\d{1,2})\/(\d{1,2})\/(20\d\d)\b/);
  if (d) { const mes = +d[1] > 12 ? +d[2] : +d[1]; return d[3] + String(mes).padStart(2, '0'); }
  throw new Error('mês de referência não encontrado no PDF');
}

// Baixa um documento da página do fundo. Os documentos aparecem como lista com caixas de seleção
// (Fund Literature / Fund Reporting); se o nome for um link, baixa direto; senão marca a caixa e
// usa o botão de download. Se vier um zip, extrai o PDF.
async function baixarDocumento(p, reDoc) {
  const item = p.getByText(reDoc).first();
  if (!(await item.count())) return null;
  const href = await item.evaluate(el => (el.closest('a[href]') || {}).href || '').catch(() => '');
  if (/^https?:/.test(href) && !/#/.test(href.slice(-1))) {
    try { return await baixarNaPagina(p, href); } catch (e) { /* tenta pela caixa de seleção */ }
  }
  // marca a caixa do documento (clicar no texto do rótulo marca a caixa)
  const caixa = item.locator('xpath=ancestor-or-self::*[.//input[@type="checkbox"]][1]//input[@type="checkbox"]').first();
  if (await caixa.count()) await caixa.check({ force: true }).catch(() => item.click());
  else await item.click();
  await p.waitForTimeout(1000);
  const botao = p.getByRole('button', { name: /download/i }).or(p.getByRole('link', { name: /download/i })).first();
  const [download] = await Promise.all([
    p.waitForEvent('download', { timeout: 90000 }),
    botao.click(),
  ]);
  const buf = fs.readFileSync(await download.path());
  if (await caixa.count()) await caixa.uncheck({ force: true }).catch(() => {});
  if (buf.subarray(0, 2).toString() === 'PK') {   // zip
    const pdf = new AdmZip(buf).getEntries().find(e => /\.pdf$/i.test(e.entryName));
    if (!pdf) throw new Error('o zip baixado da AQR não tem PDF');
    return pdf.getData();
  }
  return buf;
}

// urlFundo: página do fundo no site; tipos: { sufixo do arquivo: regex do nome do documento }.
// O primeiro tipo é obrigatório; os demais são salvos quando existirem.
async function coletarFundo(urlFundo, tipos, nomeArquivo) {
  if (!sessao || sessao.isClosed()) sessao = await entrar();
  const p = sessao;
  await p.goto(`${BASE}${urlFundo}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForTimeout(6000);
  await confirmarPerfil(p);
  if (/\/login/i.test(new URL(p.url()).pathname)) throw new Error('a sessão da AQR caiu (voltou para a tela de login)');

  const out = [];
  for (const [sufixo, re] of Object.entries(tipos)) {
    const buf = await baixarDocumento(p, re);
    if (!buf) {
      if (sufixo === Object.keys(tipos)[0]) {
        // diagnóstico: print da página e os nomes de documentos visíveis (com "UCITS" no nome)
        fs.mkdirSync('logs', { recursive: true });
        const arq = path.join('logs', `aqr-${urlFundo.split('/').pop()}.png`);
        await p.screenshot({ path: arq, fullPage: true }).catch(() => {});
        const vistos = (await p.innerText('body').catch(() => '')).split('\n').map(x => x.trim()).filter(x => /ucits/i.test(x) && x.length < 90).slice(0, 15);
        throw new Error(`documento "${sufixo}" não encontrado na página do fundo (vistos: ${vistos.join(' | ') || 'nenhum'}); print em ${arq}`);
      }
      continue;
    }
    if (buf.subarray(0, 4).toString() !== '%PDF') throw new Error(`"${sufixo}" não veio em PDF`);
    const mes = await mesDoPdf(buf);
    out.push({ mes, arquivo: nomeArquivo(mes, sufixo), buf });
  }
  return out;
}

module.exports = { coletarFundo, mesDoPdf };
