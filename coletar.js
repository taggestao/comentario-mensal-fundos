// Baixa os documentos mais recentes de cada fundo e salva na pasta Institucional do fundo,
// com o nome padrão da equipe. Arquivo que já existe é pulado, então pode rodar várias vezes no mês.
//
// uso: node coletar.js [--destino PASTA] [--fundos pimco,bny]
//   --destino  raiz onde ficam as pastas dos gestores (padrão: G:\Drives compartilhados\Gestao_Assets)
//   --fundos   roda só os fundos listados (nomes dos arquivos em fundos/)
const fs = require('fs');
const path = require('path');
const { fecharPaginas, fecharBrowser } = require('./lib/util');

// erros do navegador (aba travou, navegador fechou) costumam passar na segunda tentativa
const erroDeNavegador = e => /Target crashed|has been closed|ERR_ABORTED|Navigation failed/i.test(e.message);

const TODOS = ['ninetyone', 'oaktree', 'algebris', 'pimco', 'man', 'bny', 'jupiter', 'schroder', 'bsf', 'aqr_apex', 'aqr_delphi'];

function arg(nome, padrao) {
  const i = process.argv.indexOf(`--${nome}`);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : padrao;
}

const DESTINO = arg('destino', 'G:\\Drives compartilhados\\Gestao_Assets');
const FUNDOS = arg('fundos', TODOS.join(',')).split(',');

// As pastas dos fundos usam "\" (Windows); troca pelo separador do sistema para testes fora do Windows
const pastaDo = fundo => path.join(DESTINO, ...fundo.pasta.split('\\'));

(async () => {
  console.log(`== Coleta ${new Date().toLocaleString('pt-BR')} | destino: ${DESTINO}`);
  const resumo = { salvos: [], existentes: [], erros: [] };

  for (const id of FUNDOS) {
    const fundo = require(`./fundos/${id}`);
    const pasta = pastaDo(fundo);
    try {
      if (!fs.existsSync(pasta)) throw new Error(`pasta não existe: ${pasta}`);
      let docs;
      try {
        docs = await fundo.coletar();
      } catch (e) {
        if (!erroDeNavegador(e)) throw e;
        console.log(`[${fundo.nome}] erro do navegador (${e.message.split('\n')[0]}); tentando de novo`);
        await fecharBrowser();
        docs = await fundo.coletar();
      }
      for (const doc of docs) {
        const destino = path.join(pasta, doc.arquivo);
        if (fs.existsSync(destino)) {
          resumo.existentes.push(doc.arquivo);
          console.log(`[${fundo.nome}] já existe: ${doc.arquivo}`);
        } else {
          fs.writeFileSync(destino, doc.buf);
          resumo.salvos.push(doc.arquivo);
          console.log(`[${fundo.nome}] SALVO: ${doc.arquivo}${doc.origem ? `  (origem: ${doc.origem})` : ''}`);
        }
      }
    } catch (e) {
      resumo.erros.push(`${fundo.nome}: ${e.message.split('\n')[0]}`);
      console.log(`[${fundo.nome}] ERRO: ${e.message.split('\n')[0]}`);
    } finally {
      await fecharPaginas();
    }
  }
  await fecharBrowser();

  console.log(`== Resumo: ${resumo.salvos.length} novo(s), ${resumo.existentes.length} já existia(m), ${resumo.erros.length} erro(s)`);
  resumo.salvos.forEach(a => console.log(`   + ${a}`));
  resumo.erros.forEach(a => console.log(`   ! ${a}`));
  process.exitCode = resumo.erros.length ? 1 : 0;
})();
