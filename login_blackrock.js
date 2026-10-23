// Abre o portal da BlackRock numa janela do Edge para você fazer login uma vez.
// A sessão fica salva em perfil-blackrock\ e a coleta usa para baixar os relatórios do BSF.
const { abrirPerfil } = require('./lib/blackrock');

(async () => {
  const ctx = await abrirPerfil(false);
  const p = ctx.pages()[0] || await ctx.newPage();
  await p.goto('https://www.blackrock.com/authplatform/user/signin', { waitUntil: 'domcontentloaded' }).catch(() => {});
  console.log('Faça login na janela do Edge que abriu (use seu e-mail da TAG).');
  console.log('Depois de entrar, FECHE a janela do Edge para salvar a sessão.');
  await new Promise(resolve => ctx.on('close', resolve));
  console.log('Sessão salva. Pode rodar a coleta.');
})();
