// Abre o portal da BlackRock numa janela do Edge para você fazer login uma vez.
// Os cookies da sessão ficam em sessao-blackrock.json e a coleta usa para baixar os relatórios do BSF.
const { login, SESSAO } = require('./lib/blackrock');

console.log('Faça login na janela do Edge que vai abrir (use seu e-mail da TAG).');
console.log('Quando aparecer a área logada, FECHE a janela do Edge.');
login()
  .then(() => console.log(`Sessão salva em ${SESSAO}. Pode rodar a coleta.`))
  .catch(e => { console.error('Erro no login:', e.message); process.exitCode = 1; });
