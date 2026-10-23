# Comentário mensal – fundos UCITS offshore (TAG)

Este repositório tem duas rotinas mensais da área de Gestão Offshore.

## 1. Coleta de materiais (roda no computador da equipe)
`coletar.bat` / `node coletar.js` baixa factsheets e comentários dos gestores e salva em
`G:\Drives compartilhados\Gestao_Assets\<gestor>\<fundo>\Institucional` com o nome padrão
(ver README). Agendado para os dias 15 e 25. Cada fundo é um módulo em `fundos/`.
O computador da equipe é Windows, acessa do Brasil e usa o Edge (`channel: 'msedge'`);
a AQR exige login via `AQR_USUARIO` / `AQR_SENHA`.

## 2. Comentários do mês (feito pelo Claude, a pedido)
Documento: `AAAAMM - TAG Offshore UCITS Mutual Funds - Resultados e Comentários.docx`, na pasta
`G:\Drives compartilhados\Gestao_Base_Dados\OFF\Documentos\Estudos, Demandas, Trades, Projetos\Projetos - Rotinas Mensais\Materiais - TAG Offshore UCITS Mutual Funds - Resultados e Comentários`
(no Drive: pasta "Materiais - TAG Offshore UCITS Mutual Funds - Resultados e Comentários").

Passos:
1. Partir do documento do mês anterior (ou do rascunho do mês, se a equipe já tiver salvo) na pasta acima.
   Manter a formatação (Calibri, vermelho EE0000, títulos 14 pt) e trocar o mês no cabeçalho (header1.xml, aparece 2 vezes).
2. Usar **todos** os materiais do mês de referência salvos nas pastas `Institucional` de cada fundo
   (factsheets, comentários, cartas, relatórios trimestrais). Conferir o mês dentro do PDF: às vezes o
   nome do arquivo traz o mês em que foi salvo, não o de referência.
3. Estrutura de cada fundo: performance vs. benchmark e contexto de mercado; contribuidores e detratores;
   posicionamento/movimentações e visão do gestor; composição da carteira; nos fundos de crédito, linha final
   com YTW/YTM e duration. Citar a classe usada quando o retorno vier de uma classe específica.
4. Ao gerar o .docx, os parágrafos copiados não podem repetir `w14:paraId`/`w14:textId` (o Word recusa o arquivo).
5. Entregar o .docx à usuária e pedir que rode `publicar_comentario.bat`: ele copia o Word de Downloads para a
   pasta de Materiais e salva a cópia em PDF pelo Word.
6. Listar no fim os pontos para revisão (materiais faltantes, classes diferentes, números estimados).

Fundos (ordem do documento): AQR Delphi, AQR Apex, BSF Global Event Driven, Schroder GAIA Contour Tech,
Jupiter Merian GEAR, Algebris Financial Credit, Ninety One EM Corp Debt, Oaktree Global Credit,
PIMCO GIS Income, Man High Yield Opportunities, BNY Multi-Sector Credit.
