# Comentário mensal – fundos de crédito offshore

Baixa dos sites dos gestores os factsheets e comentários mensais dos fundos UCITS offshore (crédito e ações/multiestratégia) e salva cada arquivo na pasta `Institucional` do fundo, no drive compartilhado `Gestao_Assets`, com o nome padrão da equipe.

| Fundo | Documentos | Pasta |
|---|---|---|
| Ninety One GSF EM Corporate Debt (I Acc USD) | Fact Sheet | `Ninety One\Ninety One GSF Emerging Markets Corporate Debt Fund\Institucional` |
| Oaktree Global Credit (Class I USD Acc) | Fact Sheet | `Oaktree\Oaktree Global Credit Fund\Institucional` |
| Algebris Financial Credit (I EUR Acc) | Fact Sheet | `Algebris Investments\Algebris Financial Credit Fund\Institucional` |
| PIMCO GIS Income (Inst USD Acc) | Fact Sheet, Commentary | `PIMCO\PIMCO GIS Income Fund\Institucional` |
| Man GLG High Yield Opportunities (I H USD) | Fact Sheet, Commentary | `Man Group\GLG\Man High Yield Opportunities\Institucional` |
| BNY Multi-Sector Credit Income | Factsheet, Commentary | `BNY Mellon\BNY Multi-Sector Credit Income Fund\Institucional` |
| Jupiter Merian Global Equity Absolute Return (I USD Acc) | Fact Sheet, Fund Monthly Investment Report | `Jupiter Asset Mgmt\Jupiter Merian Global Equity Absolute Return Fund - GEAR\Institucional` |
| Schroder GAIA Contour Tech Equity (C Acc USD) | Fact Sheet, Commentary | `Contour Asset Mgmt\Schroder GAIA Contour Tech Equity Fund\Institucional` |
| BSF Global Event Driven (A2 Acc USD) | Fact Sheet | `BlackRock\BlackRock Strategic Funds\BSF Global Event Driven Fund\Institucional` |

Exemplo de nome: `PIMCO GIS Income Fund - 202610 - Fact Sheet - Inst USD.pdf`. O mês (`AAAAMM`) é lido do próprio documento.

## Instalação (uma vez)

1. Instale o **Node.js LTS**: https://nodejs.org
2. Baixe este repositório (botão **Code > Download ZIP**, ou `git clone`) para uma pasta do computador, por exemplo `C:\coleta-fundos`.
3. Dê dois cliques em **`instalar.bat`**.
4. Dê dois cliques em **`coletar.bat`** para testar. O resultado aparece na tela e fica em `logs\`.
5. Dê dois cliques em **`agendar.bat`**: cria duas tarefas no Agendador do Windows ("Coleta Fundos Offshore - dia 15" e "- dia 25"), **às 10h**. Se o computador estiver desligado nesse horário, ela roda assim que ligar.

O Google Drive para computador precisa estar aberto, com o drive `G:` disponível.

## Coleta por e-mail (AQR e Ninety One trimestral)

Alguns materiais só chegam por e-mail. O script `apps-script/coleta_email.gs` roda na sua conta Google, uma vez por dia, e salva direto nas pastas `Institucional` do Drive:

| Fundo | E-mail | Arquivos |
|---|---|---|
| AQR Apex | Monthly Update e Quarterly Letter (link "Access Your Report") | `AQR APEX UCITS Fund - AAAAMM - Monthly update.pdf`, `... - Quarterly Letter.pdf` |
| AQR Apex | Monthly Reporting Package (anexos) | `... - Monthly Performance Report.pdf`, `... - Monthly Risk Report.pdf` |
| AQR Delphi | Monthly Update (link) | `AQR Delphi Long Short Equity UCITS Fund - AAAAMM - Update.pdf` |
| AQR Delphi | Monthly Reporting Package (anexos) | `AQR Delphi Long-Short Equity UCITS Fund - AAAAMM - Custom Risk Report.pdf`, `... - Since Inception Performance.pdf` |
| Ninety One | Quarterly Reporting (anexo) | `Ninety One GSF Emerging Markets Corporate Debt Fund - AAAAMM - Quarterly Reporting.pdf` |
| BSF Global Event Driven | Monthly Fund Update e Quarterly Extended Commentary (securelink, exige login) | `BSF Global Event Driven Fund - AAAAMM - Fund Update.pdf`, `... - Quarterly Extended Commentary.pdf` |

**BlackRock (BSF):** o link do e-mail exige o seu login pessoal no portal da BlackRock. Todo mês, quando chegar o e-mail "… BlackRock Global Event Driven_Monthly Fund Update", clique no link no seu navegador de sempre: o PDF vai para **Downloads** e a próxima coleta (`coletar.bat`) renomeia com o nome padrão e salva na pasta do BSF. O Apps Script anota os links em `_links_pendentes.json` e o log da coleta avisa quando algum ainda não foi baixado. (Opcional: com uma sessão salva pelo `login_blackrock.bat`, a coleta baixa sozinha.)

Instalação (uma vez):
1. Abra https://script.google.com logado no e-mail que recebe os relatórios e clique em **Novo projeto**.
2. Apague o conteúdo do editor e cole todo o conteúdo de `apps-script/coleta_email.gs`. Salve (ícone de disquete) e dê um nome ao projeto, por exemplo "Coleta fundos por e-mail".
3. No menu de funções (ao lado de **Executar**), escolha **`instalar`** e clique em **Executar**.
4. O Google pede autorização: **Revisar permissões**, escolha sua conta, **Avançado > Acessar (não seguro)** e **Permitir**. (O aviso aparece porque o script é seu, não publicado.)
5. Em **Registro de execução** aparece o que foi salvo. A partir daí roda sozinho todo dia às 9h.

Cada e-mail processado recebe o rótulo `coleta-fundos-salvo` no Gmail. Arquivo que já existe na pasta é pulado.

## Comentários do mês

Depois de baixar o Word dos comentários que o Claude gerou, dê dois cliques em **`publicar_comentario.bat`**: ele pega o arquivo mais recente em Downloads, copia para a pasta `Materiais - TAG Offshore UCITS Mutual Funds - Resultados e Comentários` (em `Gestao_Base_Dados`) com o nome padrão e salva a cópia em PDF pelo Word. Se o arquivo já existir na pasta, pergunta antes de substituir.

## Como funciona

- Cada execução baixa a versão **mais recente** publicada no site. Se o arquivo já existe na pasta, ele é pulado. Por isso rodar duas vezes no mês é seguro: o que ainda não tinha saído no dia 15 é pego no dia 25.
- Ao final, o log mostra o que foi salvo, o que já existia e os erros.
- Para rodar só alguns fundos: `node coletar.js --fundos pimco,bny`.
- Para testar sem mexer no drive: `node coletar.js --destino C:\teste` (a pasta precisa ter as mesmas subpastas dos gestores).

## Pontos de atenção

- **Man**: primeiro tenta a central de documentos da man.com, que escolhe o catálogo pelo IP do computador (do Brasil o fundo aparece). Se falhar, usa o `Man Group.zip` que a HMC/Gama publica junto do e-mail "HMC/Gama | Atualização Mensal MAN" (botão "Acessar materiais"). O endereço do zip é sempre o mesmo e o conteúdo é trocado a cada mês. Na primeira execução, confira no log o campo `origem` para ver de onde veio cada arquivo.
- **PIMCO – Commentary**: em mês de fim de trimestre o site publica o *Quarterly Investment Report*; nos outros meses, o *Monthly Commentary*. O script salva o mais recente dos dois.
- **Algebris**: costuma publicar o factsheet só depois do dia 20 do mês seguinte.
- Se um gestor mudar o site, só aquele fundo dá erro no log; os outros continuam funcionando. Cada fundo fica em um arquivo próprio em `fundos/`.
