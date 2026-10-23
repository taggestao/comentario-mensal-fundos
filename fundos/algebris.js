// Algebris Financial Credit Fund (UCITS) – I EUR Acc (IE00B81TMV64)
// A página de documentos exige escolher país/perfil; escolhemos Luxembourg > Professional investors.
// O nome do PDF traz o mês, então lemos a lista e pegamos o mais recente.
const { novaPagina, baixar, mesNumero } = require('../lib/util');

module.exports = {
  nome: 'Algebris',
  pasta: 'Algebris Investments\\Algebris Financial Credit Fund\\Institucional',
  async coletar() {
    const p = await novaPagina();
    await p.goto('https://www.algebris.com/documents/?d=factsheet', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await p.waitForTimeout(4000);
    await p.locator('#CybotCookiebotDialogBodyButtonDecline').click({ timeout: 3000 }).catch(() => {});
    if (await p.locator('.country__name[data-country="8"]').first().isVisible().catch(() => false)) {
      await p.locator('.country__name[data-country="8"]').first().click();
      await p.waitForTimeout(800);
      await p.locator('.country__name[data-country="8"] + ul li[data-investor="professional"][data-lang="en"]').first().click();
      await p.locator('button.disclaimer__accept-button').first().click({ timeout: 15000 });
      await p.waitForTimeout(6000);
    }
    const re = /\/GFU\/EN\/Algebris_Financial_Credit_Fund_\(UCITS\)_-_I_EUR_-_([A-Za-z]+)_?-_?(\d{4})_-_EN\.pdf$/i;
    const links = [...new Set(await p.$$eval('a', as => as.map(a => a.href)))]
      .map(u => { const m = decodeURI(u).match(re); return m && { url: u, mes: m[2] + mesNumero(m[1]) }; })
      .filter(Boolean)
      .sort((a, b) => b.mes.localeCompare(a.mes));
    if (!links.length) throw new Error('nenhum factsheet I EUR na página (mudou o layout ou a tela de perfil?)');
    const { url, mes } = links[0];
    return [{ mes, arquivo: `Algebris Financial Credit Fund - ${mes} - Fact Sheet - I Acc EUR.pdf`, buf: await baixar(url) }];
  },
};
