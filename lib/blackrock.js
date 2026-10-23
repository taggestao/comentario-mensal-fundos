// Sessão do portal da BlackRock (securelink dos relatórios enviados por e-mail).
// O login é feito uma vez, à mão, pelo login_blackrock.bat; a sessão fica salva em perfil-blackrock\
// e é reaproveitada pela coleta até expirar.
const path = require('path');
const { chromium } = require('playwright');
const { ehPdf } = require('./util');

const PERFIL = path.join(__dirname, '..', 'perfil-blackrock');

function abrirPerfil(headless) {
  return chromium.launchPersistentContext(PERFIL, {
    headless,
    channel: process.platform === 'win32' && !process.env.CHROMIUM_PATH ? 'msedge' : undefined,
    executablePath: process.env.CHROMIUM_PATH || undefined,
    acceptDownloads: true,
  });
}

// Baixa os links com a sessão salva; devolve { arquivo -> Buffer }.
async function baixarComSessao(links) {
  const ctx = await abrirPerfil(true);
  try {
    const out = {};
    let pagina = null;
    for (const { arquivo, link } of links) {
      let buf = null;
      try {
        buf = await (await ctx.request.get(link, { timeout: 120000 })).body();
      } catch (e) {
        // reserva: baixa de dentro de uma página do site (mesma sessão)
        if (!pagina) {
          pagina = ctx.pages()[0] || await ctx.newPage();
          await pagina.goto('https://www.blackrock.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
        }
        buf = Buffer.from(await pagina.evaluate(async u => {
          const r = await fetch(u, { credentials: 'include' });
          return Array.from(new Uint8Array(await r.arrayBuffer()));
        }, link));
      }
      if (!ehPdf(buf)) {
        throw new Error('a sessão da BlackRock não está ativa (o link abriu a tela de login): rode login_blackrock.bat e depois a coleta de novo');
      }
      out[arquivo] = buf;
    }
    return out;
  } finally {
    await ctx.close();
  }
}

module.exports = { PERFIL, abrirPerfil, baixarComSessao };
