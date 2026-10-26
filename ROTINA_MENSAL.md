# Rotina mensal – TAG Offshore UCITS Mutual Funds: Resultados e Comentários

Passo a passo da tarefa: de onde vem cada material, o que roda sozinho e o que precisa ser feito à mão
todo mês. A instalação (feita uma vez) está no [README](README.md).

## Visão geral

| Etapa | Quem faz | Quando | Resultado |
|---|---|---|---|
| 1. Coleta nos sites dos gestores | `coletar.bat` (agendado no Windows) | dias 15 e 25, às 10h | PDFs nas pastas `Institucional` de cada fundo |
| 2. Coleta por e-mail | Apps Script `coleta_email.gs` (conta Google) | todo dia, às 9h | AQR e Ninety One trimestral nas pastas `Institucional` |
| 3. Fund Update do BSF | você (clicar no link do e-mail) + `coletar.bat` | quando chegar o e-mail | PDF do BSF na pasta `Institucional` |
| 4. Tabela de resultados | você (exportar o Excel do Morningstar) | depois do fechamento do mês | `RetornosCarteirasFoFs_AAAAMM.xlsx` em `Resultados Offshore` |
| 5. Comentários | Claude, a pedido | quando os materiais estiverem salvos | Word do mês |
| 6. Publicação | você (`publicar_comentario.bat`) | depois de revisar o Word | Word + PDF na pasta de Materiais |

## Onde ficam os arquivos

| O quê | Pasta |
|---|---|
| Materiais de cada fundo | `G:\Drives compartilhados\Gestao_Assets\<gestor>\<fundo>\Institucional` |
| Excel da tabela de resultados | `G:\Drives compartilhados\Gestao_Base_Dados\OFF\Resultados Offshore` |
| Documento do mês (Word e PDF) | `G:\Drives compartilhados\Gestao_Base_Dados\OFF\Documentos\Estudos, Demandas, Trades, Projetos\Projetos - Rotinas Mensais\Materiais - TAG Offshore UCITS Mutual Funds - Resultados e Comentários` |
| Scripts | `C:\comentario-mensal-fundos-main` (cópia deste repositório) |

## De onde vem cada material

Os nomes seguem o padrão `<Fundo> - AAAAMM - <Documento> - <Classe>.pdf`. O mês `AAAAMM` é o de referência,
lido de dentro do PDF.

### Fundos de ações / multiestratégia

| Fundo (classe) | Material | Origem | Como chega |
|---|---|---|---|
| AQR Delphi Long-Short Equity (IAU1) | Monthly Update; Custom Risk Report e Since Inception Performance | e-mails da AQR (link "Access Your Report" e anexos do Monthly Reporting Package) | Apps Script |
| AQR Apex (PRAU1T) | Monthly Update, Quarterly Letter; Performance e Risk Report | e-mails da AQR (link e anexos) | Apps Script |
| BSF Global Event Driven (A2 USD; relatório do gestor em D2) | Fact Sheet | blackrock.com (link fixo) | `coletar.bat` |
| | Monthly Fund Update, Quarterly Extended Commentary | e-mail da BlackRock (securelink, exige o seu login) | **você clica no link**; `coletar.bat` renomeia e salva |
| Schroder GAIA Contour Tech Equity (C Acc USD) | Fact Sheet, Commentary (Monthly Fund Update da Contour) | api.schroders.com (document-store) | `coletar.bat` |
| Jupiter Merian Global Equity Absolute Return – GEAR (I USD Acc) | Fact Sheet, Fund Monthly Investment Report | jupiteram.com (fund centre, perfil profissional) | `coletar.bat` |

### Fundos de crédito

| Fundo (classe) | Material | Origem | Como chega |
|---|---|---|---|
| Algebris Financial Credit (I EUR Acc) | Fact Sheet | media.algebris.com (arquivo com o mês no nome) | `coletar.bat` (costuma sair depois do dia 20) |
| Ninety One GSF EM Corporate Debt (I Acc USD) | Fact Sheet | ninetyone.com (link fixo) | `coletar.bat` |
| | Quarterly Reporting | e-mail noreplyclientopsreporting@ninetyone.com (anexo) | Apps Script |
| Oaktree Global Credit (Class I USD Acc) | Fact Sheet | oaktreesicav.com (link fixo) | `coletar.bat` |
| PIMCO GIS Income (Inst USD Acc) | Fact Sheet, Commentary (Monthly Commentary ou, no fim do trimestre, Quarterly Investment Report) | pimco.com (página do fundo, perfil Financial Professional) | `coletar.bat` |
| Man GLG High Yield Opportunities (I H USD) | Fact Sheet, Commentary | man.com; se falhar, `Man Group.zip` do e-mail "HMC/Gama \| Atualização Mensal MAN" | `coletar.bat` |
| BNY Multi-Sector Credit Income | Factsheet, Commentary | FE fundinfo (digital.feprecisionplus.com, links fixos) | `coletar.bat` |

### E-mails monitorados pelo Apps Script

| Remetente | Assunto | Fundo |
|---|---|---|
| LuxFundServices@mail.aqr.com | AQR Apex UCITS Fund - Monthly Update / Quarterly Letter | AQR Apex |
| LuxFundServices@mail.aqr.com | AQR Delphi Long-Short Equity - Monthly Update / Quarterly Letter | AQR Delphi |
| LuxFundServices@aqr.com | … Monthly Reporting Package (com anexos) | AQR Apex e Delphi |
| noreplyclientopsreporting@ninetyone.com | Ninety One - TAG … Quarterly Reporting | Ninety One |
| alt-clientsupport@blackrock.com | … Global Event Driven_Monthly Fund Update / Quarterly Extended Commentary | BSF (só anota o link) |

Se um gestor mudar o remetente ou o assunto, o e-mail deixa de ser reconhecido: ajuste a regra em
`apps-script/coleta_email.gs` e cole de novo no script.google.com.

### Tabela de resultados

`RetornosCarteirasFoFs_AAAAMM.xlsx`, exportado do Morningstar (relatório "LB - RetornosCarteirasFoFs") e salvo
na pasta `Resultados Offshore`. A imagem da tabela no Word é gerada desse Excel: colunas 1M, 3M, YTD, 12M,
3Y, 5Y e ITD, sem as colunas 1M (-1) e 1M (-2) e sem o grupo ALT Onshore, com a escala de cores do Excel.
Se houver uma aba já limpa ("Sheet1 (2)"), ela é usada como está.

## Passo a passo do mês

### 1. Coleta automática (dias 15 e 25)
Roda sozinha. Para conferir, veja o log em `C:\comentario-mensal-fundos-main\logs\` ou rode `coletar.bat` à mão:
o resumo mostra o que foi salvo, o que já existia e os erros. Rodar mais de uma vez é seguro, porque o que já
está na pasta é pulado. O que não tinha saído no dia 15 é pego no dia 25.

### 2. E-mails (todo dia, 9h)
Também roda sozinho. Cada e-mail processado recebe o rótulo `coleta-fundos-salvo` no Gmail. Para conferir,
abra o projeto em script.google.com > **Execuções**.

### 3. BSF – Fund Update (manual, todo mês)
1. Quando chegar o e-mail "… BlackRock Global Event Driven_Monthly Fund Update", clique no link e faça login
   no portal da BlackRock.
2. Baixe o PDF. Ele vai para Downloads com um nome como
   `BlackRock_Global_Event_Driven_Monthly_Fund_Update.<números>.portfolio.AAAAMMDD`.
3. Rode `coletar.bat` (ou espere o próximo dia 15/25). Ele salva como
   `BSF Global Event Driven Fund - AAAAMM - Fund Update.pdf`.
   No trimestre, faça o mesmo com o Quarterly Extended Commentary.

### 4. Excel da tabela (manual, todo mês)
Exporte o relatório do Morningstar com a data de retorno no fim do mês de referência e salve como
`RetornosCarteirasFoFs_AAAAMM.xlsx` em `Resultados Offshore`.

### 5. Pedir os comentários ao Claude
Com os materiais salvos, peça os comentários do mês (por exemplo: "faça os comentários de outubro").
O Claude:
1. parte do Word do mês anterior na pasta de Materiais, que é a versão revisada pela equipe;
2. lê **todos** os materiais do mês nas pastas `Institucional` e confere o mês dentro de cada PDF;
3. escreve cada fundo na estrutura do documento: resultado vs. benchmark (só a direção, sem os números,
   porque a tabela já mostra) e contexto de mercado; contribuidores e detratores; posicionamento,
   movimentações e visão do gestor; composição da carteira; nos fundos de crédito, a linha final com
   YTW/YTM e duration;
4. gera o Word com `comentarios/montar.py`, que troca os textos, a tabela (do Excel) e o mês do cabeçalho
   e mantém a formatação;
5. entrega o Word e lista os pontos para revisão: material faltante, classe diferente, número estimado.

### 6. Revisar e publicar
1. Revise o Word.
2. Com o Word na pasta Downloads (ou arrastando o arquivo para cima do .bat), rode `publicar_comentario.bat`.
   Ele copia para a pasta de Materiais com o nome padrão
   `AAAAMM - TAG Offshore UCITS Mutual Funds - Resultados e Comentários.docx` e salva o PDF pelo Word.
   Se já existir um arquivo do mês, pergunta antes de substituir.

## Checklist mensal

- [ ] Coleta dos dias 15 e 25 sem erros no log (Algebris pode sair só no dia 25)
- [ ] AQR (Apex e Delphi) salvos pelo Apps Script
- [ ] BSF: Fund Update baixado pelo link do e-mail e salvo pela coleta
- [ ] Ninety One: Quarterly Reporting (meses de fim de trimestre)
- [ ] `RetornosCarteirasFoFs_AAAAMM.xlsx` salvo em `Resultados Offshore`
- [ ] Pedir os comentários ao Claude
- [ ] Revisar o Word
- [ ] `publicar_comentario.bat`: Word e PDF na pasta de Materiais

## Manutenção e problemas comuns

| Sintoma | O que fazer |
|---|---|
| Um fundo dá erro na coleta | Os outros continuam. Provavelmente o gestor mudou o site: peça ao Claude para ajustar o arquivo do fundo em `fundos/`. |
| "Cannot find module playwright" | Rode `instalar.bat` dentro de `C:\comentario-mensal-fundos-main`. |
| Apps Script diz "Nada novo" mas o e-mail chegou | Confira se o e-mail já tem o rótulo `coleta-fundos-salvo` ou se o arquivo já existe na pasta (o script pula o que já existe). |
| BSF não salvo | Falta baixar o PDF pelo link do e-mail (passo 3). O log avisa os links pendentes. |
| `publicar_comentario.bat` com ERRO | Feche o Word e rode de novo. Se persistir, mande o print da janela. |
| Atualizar os scripts | Baixe o ZIP do repositório (**Code > Download ZIP**) e extraia por cima de `C:\comentario-mensal-fundos-main`. |

Mudança de classe, de fundo ou de pasta: cada fundo tem um arquivo em `fundos/` (site, classe, nome do arquivo
e pasta). Os e-mails estão em `apps-script/coleta_email.gs` (remetente, assunto e pasta de destino), e a ordem e
o estilo do documento em `CLAUDE.md`.
