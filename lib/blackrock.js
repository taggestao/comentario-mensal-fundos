// Sessão do portal da BlackRock (securelink dos relatórios enviados por e-mail).
// O login é feito uma vez, à mão, pelo login_blackrock.bat, que grava os cookies da sessão em
// sessao-blackrock.json; a coleta abre o navegador normal com esses cookies até a sessão expirar.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { ehPdf, novaPagina } = require('./util');

const SESSAO = path.join(__dirname, '..', 'sessao-blackrock.json');
const MSG_LOGIN = 'rode login_blackrock.bat e depois a coleta de novo';

// Janela visível do Edge para o login; grava a sessão a cada 2 s até a janela ser fechada.
async function login() {
  const browser = await chromium.launch({
    headless: false,
    channel: process.platform === 'win32' && !process.env.CHROMIUM_PATH ? 'msedge' : undefined,
    executablePath: process.env.CHROMIUM_PATH || undefined,
  });
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await p.goto('https://www.blackrock.com/authplatform/user/signin', { waitUntil: 'domcontentloaded' }).catch(() => {});
  const gravar = () => ctx.storageState({ path: SESSAO }).catch(() => {});
  const timer = setInterval(gravar, 2000);
  await new Promise(resolve => { browser.on('disconnected', resolve); p.on('close', resolve); });
  clearInterval(timer);
  await gravar();
  await browser.close().catch(() => {});
}

// Baixa os links com a sessão salva; devolve { arquivo -> Buffer }.
async function baixarComSessao(links) {
  if (!fs.existsSync(SESSAO)) throw new Error(`não há sessão da BlackRock salva: ${MSG_LOGIN}`);
  const pagina = await novaPagina({ storageState: SESSAO, acceptDownloads: true });
  const out = {};
  let abriuSite = false;
  for (const { arquivo, link } of links) {
    let buf = null;
    try {
      buf = await (await pagina.context().request.get(link, { timeout: 120000 })).body();
    } catch (e) {
      // reserva: baixa de dentro de uma página do site (mesma sessão)
      if (!abriuSite) {
        await pagina.goto('https://www.blackrock.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
        abriuSite = true;
      }
      buf = Buffer.from(await pagina.evaluate(async u => {
        const r = await fetch(u, { credentials: 'include' });
        return Array.from(new Uint8Array(await r.arrayBuffer()));
      }, link));
    }
    if (!ehPdf(buf)) throw new Error(`a sessão da BlackRock não está ativa (o link abriu a tela de login): ${MSG_LOGIN}`);
    out[arquivo] = buf;
  }
  return out;
}

module.exports = { SESSAO, login, baixarComSessao };
