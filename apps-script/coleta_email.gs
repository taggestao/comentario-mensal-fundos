/**
 * Coleta por e-mail – salva no Google Drive (Gestao_Assets) os materiais que os gestores mandam por e-mail.
 * Roda na conta Google da usuária (script.google.com), uma vez por dia. Ver README, seção "Coleta por e-mail".
 *
 * Para cada regra: procura e-mails recentes ainda não processados, salva os PDFs na pasta Institucional do
 * fundo com o nome padrão (pulando arquivos que já existem) e marca a conversa com o rótulo ROTULO.
 */

const ROTULO = 'coleta-fundos-salvo';

const PASTAS = {
  aqrApex: '1EymdlnRFJDb7e5Kim5D9v56WGGQyHhUH',    // AQR\AQR Alternative Strategies\AQR Apex Strategy\Institucional
  aqrDelphi: '1QAdor8fhfeoyW6atYRp-ak2bgzedjGar',  // AQR\AQR Alternative Strategies\AQR Delphi Long-Short Equity Strategy\Institucional
  ninetyOne: '1bjQ0MArQU5dTzbwUvXXcfKEJ5pxPZsGO',  // Ninety One\Ninety One GSF Emerging Markets Corporate Debt Fund\Institucional
  bsf: '1_0S1oayznlfr7UwiD34IVsGrTp7EUuCX',        // BlackRock\BlackRock Strategic Funds\BSF Global Event Driven Fund\Institucional
};

// Links que exigem login no portal do gestor: o script só anota (link + nome do arquivo) neste arquivo da
// pasta do fundo, e a rotina do computador baixa com a sessão salva pelo login_blackrock.bat.
const PENDENTES = '_links_pendentes.json';

const APEX = 'AQR APEX UCITS Fund';
const DELPHI = 'AQR Delphi Long-Short Equity UCITS Fund';

const REGRAS = [
  // BlackRock – "securelink" exige login no portal da BlackRock
  {
    nome: 'BSF – Monthly Fund Update',
    busca: 'from:alt-clientsupport@blackrock.com subject:"Global Event Driven_Monthly Fund Update"',
    pasta: PASTAS.bsf,
    pendente: mes => `BSF Global Event Driven Fund - ${mes} - Fund Update.pdf`,
  },
  {
    nome: 'BSF – Quarterly Extended Commentary',
    busca: 'from:alt-clientsupport@blackrock.com subject:"Global Event Driven Fund - Quarterly Extended Commentary"',
    pasta: PASTAS.bsf,
    pendente: mes => `BSF Global Event Driven Fund - ${mes} - Quarterly Extended Commentary.pdf`,
  },
  // anexos – o nome do anexo traz o mês: "APEXUCITS.Monthly Performance Report.202609.pdf"
  {
    nome: 'AQR Apex – Monthly Reporting Package',
    busca: 'from:LuxFundServices@aqr.com subject:"AQR Apex UCITS Fund - Monthly Reporting Package" has:attachment',
    pasta: PASTAS.aqrApex,
    anexo: (nome, mes) => {
      const m = nome.match(/^APEXUCITS\.(.+?)\.\d{6}\.pdf$/i);
      return m ? `${APEX} - ${mes} - ${m[1]}.pdf` : null;
    },
  },
  {
    nome: 'AQR Delphi – Monthly Reporting Package',
    busca: 'from:LuxFundServices@aqr.com subject:"AQR Delphi Long-Short Equity UCITS Fund - Monthly Reporting Package" has:attachment',
    pasta: PASTAS.aqrDelphi,
    anexo: (nome, mes) => {
      if (/Custom Risk Report/i.test(nome)) return `${DELPHI} - ${mes} - Custom Risk Report.pdf`;
      if (/Since Inception/i.test(nome)) return `${DELPHI} - ${mes} - Since Inception Performance.pdf`;
      return null;
    },
  },
  {
    nome: 'Ninety One – Quarterly Reporting (TAG)',
    busca: 'from:noreplyclientopsreporting@ninetyone.com subject:"Ninety One - TAG" subject:"Quarterly Reporting" has:attachment',
    pasta: PASTAS.ninetyOne,
    anexo: (nome, mes) => (/\.pdf$/i.test(nome) ? `Ninety One GSF Emerging Markets Corporate Debt Fund - ${mes} - Quarterly Reporting.pdf` : null),
  },
  // links – botão "Access Your Report"; o mês de referência é o anterior ao do e-mail
  {
    nome: 'AQR Apex – Monthly Update',
    busca: 'from:LuxFundServices@mail.aqr.com subject:"AQR Apex UCITS Fund - Monthly Update"',
    pasta: PASTAS.aqrApex,
    link: mes => `${APEX} - ${mes} - Monthly update.pdf`,
  },
  {
    nome: 'AQR Apex – Quarterly Letter',
    busca: 'from:LuxFundServices@mail.aqr.com subject:"AQR Apex UCITS Fund - Quarterly Letter"',
    pasta: PASTAS.aqrApex,
    link: mes => `${APEX} - ${mes} - Quarterly Letter.pdf`,
  },
  {
    nome: 'AQR Delphi – Monthly Update',
    busca: 'from:LuxFundServices@mail.aqr.com subject:"AQR Delphi Long-Short Equity - Monthly Update"',
    pasta: PASTAS.aqrDelphi,
    link: mes => `AQR Delphi Long Short Equity UCITS Fund - ${mes} - Update.pdf`,   // nome que a equipe já usava
  },
  {
    nome: 'AQR Delphi – Quarterly Letter',
    busca: 'from:LuxFundServices@mail.aqr.com subject:"AQR Delphi" subject:"Quarterly Letter"',
    pasta: PASTAS.aqrDelphi,
    link: mes => `${DELPHI} - ${mes} - Quarterly Letter.pdf`,
  },
];

/** Roda uma vez para criar o gatilho diário e já fazer a primeira coleta. */
function instalar() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'coletar')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('coletar').timeBased().everyDays(1).atHour(9).create();
  coletar();
}

function coletar() {
  const rotulo = GmailApp.getUserLabelByName(ROTULO) || GmailApp.createLabel(ROTULO);
  const resumo = [];
  for (const regra of REGRAS) {
    const threads = GmailApp.search(`${regra.busca} newer_than:60d -label:${ROTULO}`, 0, 20);
    for (const thread of threads) {
      try {
        for (const msg of thread.getMessages()) {
          const salvos = regra.pendente ? anotarPendente(regra, msg) : regra.link ? salvarLink(regra, msg) : salvarAnexos(regra, msg);
          salvos.forEach(s => resumo.push(`${regra.nome}: ${s}`));
        }
        thread.addLabel(rotulo);
      } catch (e) {
        resumo.push(`ERRO ${regra.nome} (${thread.getFirstMessageSubject()}): ${e.message}`);
      }
    }
  }
  Logger.log(resumo.length ? resumo.join('\n') : 'Nada novo.');
  return resumo;
}

function salvarAnexos(regra, msg) {
  const salvos = [];
  for (const a of msg.getAttachments()) {
    const mes = mesDoTexto(a.getName()) || mesDoTexto(msg.getSubject()) || mesAnterior(msg.getDate());
    const nome = regra.anexo(a.getName(), mes);
    if (nome && salvar(regra.pasta, nome, a.copyBlob())) salvos.push(nome);
  }
  return salvos;
}

function salvarLink(regra, msg) {
  const m = msg.getBody().match(/https:\/\/home\.aqr\.com\/e\/[^"'\s]*-link-[^"'\s]*/);
  if (!m) throw new Error('link "Access Your Report" não encontrado no e-mail');
  const nome = regra.link(mesDoTexto(msg.getSubject()) || mesAnterior(msg.getDate()));
  if (existe(regra.pasta, nome)) return [];
  // home.aqr.com/e/... redireciona para digital.aqr.com/?link=CODIGO; o PDF vem de um POST com esse link
  let url = m[0];
  for (let i = 0; i < 5 && !/digital\.aqr\.com\/\?link=/.test(url); i++) {
    const r = UrlFetchApp.fetch(url, { followRedirects: false, muteHttpExceptions: true });
    const destino = r.getHeaders()['Location'] || r.getHeaders()['location'];
    if (!destino) throw new Error(`o link não redirecionou para digital.aqr.com (HTTP ${r.getResponseCode()})`);
    url = destino;
  }
  const r = UrlFetchApp.fetch('https://digital.aqr.com/api/proxy/download/link', {
    method: 'post',
    contentType: 'application/json',
    headers: { Accept: 'application/json, text/plain, */*' },
    payload: JSON.stringify({ link: url, policies: [] }),
    muteHttpExceptions: true,
  });
  const blob = r.getBlob();
  if (r.getResponseCode() !== 200 || blob.getBytes().slice(0, 4).map(b => String.fromCharCode(b)).join('') !== '%PDF') {
    throw new Error(`a AQR não devolveu um PDF (HTTP ${r.getResponseCode()}); o link pode ter expirado`);
  }
  return salvar(regra.pasta, nome, blob) ? [nome] : [];
}

/** Anota o securelink no arquivo de pendências da pasta (a rotina do computador baixa depois). */
function anotarPendente(regra, msg) {
  const m = msg.getBody().match(/https:\/\/www\.blackrock\.com\/securelink\/report\/[^"'\s)\]<>]+/);
  if (!m) throw new Error('securelink não encontrado no e-mail');
  const arquivo = regra.pendente(mesDoTexto(msg.getSubject()) || mesDoTexto(m[0]) || mesAnterior(msg.getDate()));
  if (existe(regra.pasta, arquivo)) return [];
  const pasta = DriveApp.getFolderById(regra.pasta);
  const atual = pasta.getFilesByName(PENDENTES);
  const f = atual.hasNext() ? atual.next() : null;
  const lista = f ? JSON.parse(f.getBlob().getDataAsString() || '[]') : [];
  if (lista.some(x => x.arquivo === arquivo)) return [];
  lista.push({ arquivo, link: m[0], recebido: msg.getDate().toISOString() });
  const json = JSON.stringify(lista, null, 2);
  if (f) f.setContent(json); else pasta.createFile(PENDENTES, json, 'application/json');
  return [`${arquivo} (link anotado; a rotina do computador baixa)`];
}

/** Cria o arquivo na pasta, a menos que já exista um com o mesmo nome. */
function salvar(pastaId, nome, blob) {
  if (existe(pastaId, nome)) return false;
  DriveApp.getFolderById(pastaId).createFile(blob.setName(nome).setContentType('application/pdf'));
  return true;
}

function existe(pastaId, nome) {
  return DriveApp.getFolderById(pastaId).getFilesByName(nome).hasNext();
}

const MESES = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 };

const MES3 = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12 };

/** "…202609…", "…20260930…", "30-SEP-2026" ou "September 2026" -> "202609" */
function mesDoTexto(t) {
  const c = t.match(/\b\d{1,2}-(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)-(20\d\d)\b/i);
  if (c) return c[2] + String(MES3[c[1].toUpperCase()]).padStart(2, '0');
  const n = t.match(/(20\d\d)(0[1-9]|1[0-2])(?:\d{2})?(?!\d)/);
  if (n) return n[1] + n[2];
  const e = t.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d\d)/i);
  return e ? e[2] + String(MESES[e[1].toLowerCase()]).padStart(2, '0') : null;
}

/** Mês anterior ao da data do e-mail (os relatórios chegam no mês seguinte ao de referência). */
function mesAnterior(data) {
  const d = new Date(data.getFullYear(), data.getMonth() - 1, 1);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
}
