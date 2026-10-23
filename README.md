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
| AQR Apex UCITS | Monthly update, Quarterly Letter | `AQR\AQR Alternative Strategies\AQR Apex Strategy\Institucional` |
| AQR Delphi Long-Short Equity UCITS | Update, Quarterly Letter | `AQR\AQR Alternative Strategies\AQR Delphi Long-Short Equity Strategy\Institucional` |

Exemplo de nome: `PIMCO GIS Income Fund - 202610 - Fact Sheet - Inst USD.pdf`. O mês (`AAAAMM`) é lido do próprio documento.

## Instalação (uma vez)

1. Instale o **Node.js LTS**: https://nodejs.org
2. Baixe este repositório (botão **Code > Download ZIP**, ou `git clone`) para uma pasta do computador, por exemplo `C:\coleta-fundos`.
3. Dê dois cliques em **`instalar.bat`**.
4. Dê dois cliques em **`coletar.bat`** para testar. O resultado aparece na tela e fica em `logs\`.
5. Dê dois cliques em **`agendar.bat`**: cria a tarefa no Agendador do Windows para os dias **15 e 25 de cada mês, às 10h**. Se o computador estiver desligado nesse horário, ela roda assim que ligar.

O Google Drive para computador precisa estar aberto, com o drive `G:` disponível.

**AQR (login):** o site da AQR só mostra os documentos para quem está logado no MyAQR. Para a rotina entrar sozinha, grave o usuário e a senha como variáveis de ambiente do Windows (uma vez, no Prompt de Comando, e depois feche e abra o terminal):

```
setx AQR_USUARIO "seu.email@taginvest.com.br"
setx AQR_SENHA "sua-senha"
```

A senha fica salva no seu usuário do Windows, não neste repositório. Sem essas variáveis, só os fundos da AQR dão erro no log; os outros funcionam normalmente.

## Comentários do mês

Depois de baixar o Word dos comentários que o Claude gerou, dê dois cliques em **`publicar_comentario.bat`**: ele pega o arquivo mais recente em Downloads, copia para a pasta `Materiais - TAG Offshore UCITS Mutual Funds - Resultados e Comentários` (em `Gestao_Base_Dados`) com o nome padrão e salva a cópia em PDF pelo Word. Se o arquivo já existir na pasta, pergunta antes de substituir.

## Como funciona

- Cada execução baixa a versão **mais recente** publicada no site. Se o arquivo já existe na pasta, ele é pulado. Por isso rodar duas vezes no mês é seguro: o que ainda não tinha saído no dia 15 é pego no dia 25.
- Ao final, o log mostra o que foi salvo, o que já existia e os erros.
- Para rodar só alguns fundos: `node coletar.js --fundos pimco,bny`.
- Para testar sem mexer no drive: `node coletar.js --destino C:\teste` (a pasta precisa ter as mesmas subpastas dos gestores).

## Pontos de atenção

- **Ninety One – Quarterly Reporting**: não está no site. Chega por e-mail de `noreplyclientopsreporting@ninetyone.com` e continua manual.
- **Man**: primeiro tenta a central de documentos da man.com, que escolhe o catálogo pelo IP do computador (do Brasil o fundo aparece). Se falhar, usa o `Man Group.zip` que a HMC/Gama publica junto do e-mail "HMC/Gama | Atualização Mensal MAN" (botão "Acessar materiais"). O endereço do zip é sempre o mesmo e o conteúdo é trocado a cada mês. Na primeira execução, confira no log o campo `origem` para ver de onde veio cada arquivo.
- **PIMCO – Commentary**: em mês de fim de trimestre o site publica o *Quarterly Investment Report*; nos outros meses, o *Monthly Commentary*. O script salva o mais recente dos dois.
- **AQR**: o acesso logado não pôde ser testado daqui (sem conta). Na primeira execução com usuário e senha, confira o log; se der erro, mande o log para ajuste. Os relatórios "Custom Risk Report" e "Since Inception Performance" da Delphi chegam só por e-mail (`LuxFundServices@aqr.com`) e continuam manuais.
- **BSF – Fund Update**: o "Fund Update" mensal não está no site público da BlackRock (chega por outro canal) e continua manual; a rotina salva só o factsheet.
- **Algebris**: costuma publicar o factsheet só depois do dia 20 do mês seguinte.
- Se um gestor mudar o site, só aquele fundo dá erro no log; os outros continuam funcionando. Cada fundo fica em um arquivo próprio em `fundos/`.
