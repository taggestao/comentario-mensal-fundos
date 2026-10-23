# Comentário mensal – fundos de crédito offshore

Baixa dos sites dos gestores os factsheets e comentários mensais dos fundos de crédito offshore e salva cada arquivo na pasta `Institucional` do fundo, no drive compartilhado `Gestao_Assets`, com o nome padrão da equipe.

| Fundo | Documentos | Pasta |
|---|---|---|
| Ninety One GSF EM Corporate Debt (I Acc USD) | Fact Sheet | `Ninety One\Ninety One GSF Emerging Markets Corporate Debt Fund\Institucional` |
| Oaktree Global Credit (Class I USD Acc) | Fact Sheet | `Oaktree\Oaktree Global Credit Fund\Institucional` |
| Algebris Financial Credit (I EUR Acc) | Fact Sheet | `Algebris Investments\Algebris Financial Credit Fund\Institucional` |
| PIMCO GIS Income (Inst USD Acc) | Fact Sheet, Commentary | `PIMCO\PIMCO GIS Income Fund\Institucional` |
| Man High Yield Opportunities (I Acc USD) | Fact Sheet, Commentary | `Man Group\GLG\Man High Yield Opportunities\Institucional` |
| BNY Multi-Sector Credit Income | Factsheet, Commentary | `BNY Mellon\BNY Multi-Sector Credit Income Fund\Institucional` |

Exemplo de nome: `PIMCO GIS Income Fund - 202610 - Fact Sheet - Inst USD.pdf`. O mês (`AAAAMM`) é lido do próprio documento.

## Instalação (uma vez)

1. Instale o **Node.js LTS**: https://nodejs.org
2. Baixe este repositório (botão **Code > Download ZIP**, ou `git clone`) para uma pasta do computador, por exemplo `C:\coleta-fundos`.
3. Dê dois cliques em **`instalar.bat`**.
4. Dê dois cliques em **`coletar.bat`** para testar. O resultado aparece na tela e fica em `logs\`.
5. Dê dois cliques em **`agendar.bat`**: cria a tarefa no Agendador do Windows para os dias **15 e 25 de cada mês, às 10h**. Se o computador estiver desligado nesse horário, ela roda assim que ligar.

O Google Drive para computador precisa estar aberto, com o drive `G:` disponível.

## Como funciona

- Cada execução baixa a versão **mais recente** publicada no site. Se o arquivo já existe na pasta, ele é pulado. Por isso rodar duas vezes no mês é seguro: o que ainda não tinha saído no dia 15 é pego no dia 25.
- Ao final, o log mostra o que foi salvo, o que já existia e os erros.
- Para rodar só alguns fundos: `node coletar.js --fundos pimco,bny`.
- Para testar sem mexer no drive: `node coletar.js --destino C:\teste` (a pasta precisa ter as mesmas subpastas dos gestores).

## Pontos de atenção

- **Ninety One – Quarterly Reporting**: não está no site. Chega por e-mail de `noreplyclientopsreporting@ninetyone.com` e continua manual.
- **Man**: o site escolhe o catálogo pelo IP do computador. Não foi possível testar fora do Brasil; na primeira execução confira no log o campo `origem` (título do documento escolhido) para garantir que é o factsheet da classe I Acc USD.
- **PIMCO – Commentary**: em mês de fim de trimestre o site publica o *Quarterly Investment Report*; nos outros meses, o *Monthly Commentary*. O script salva o mais recente dos dois.
- **Algebris**: costuma publicar o factsheet só depois do dia 20 do mês seguinte.
- Se um gestor mudar o site, só aquele fundo dá erro no log; os outros continuam funcionando. Cada fundo fica em um arquivo próprio em `fundos/`.
