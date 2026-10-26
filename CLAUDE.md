# Comentário mensal – fundos UCITS offshore (TAG)

Este repositório tem duas rotinas mensais da área de Gestão Offshore.

## 1. Coleta de materiais (roda no computador da equipe)
`coletar.bat` / `node coletar.js` baixa factsheets e comentários dos gestores e salva em
`G:\Drives compartilhados\Gestao_Assets\<gestor>\<fundo>\Institucional` com o nome padrão
(ver README). Agendado para os dias 15 e 25. Cada fundo é um módulo em `fundos/`.
O computador da equipe é Windows, acessa do Brasil e usa o Edge (`channel: 'msedge'`).
AQR e o trimestral da Ninety One vêm por e-mail: `apps-script/coleta_email.gs` (Google Apps Script na conta da
usuária) salva anexos e links "Access Your Report" direto nas pastas do Drive.
O BSF (BlackRock) vem por securelink que exige login: o script anota em `_links_pendentes.json` e
`fundos/bsf_relatorios.js` pega o PDF que a usuária baixou pelo link (pasta Downloads) e renomeia; opcionalmente
baixa sozinho com a sessão salva por `login_blackrock.bat` (cookies em `sessao-blackrock.json`).

## 2. Comentários do mês (feito pelo Claude, a pedido)
Documento: `AAAAMM - TAG Offshore UCITS Mutual Funds - Resultados e Comentários.docx`, na pasta
`G:\Drives compartilhados\Gestao_Base_Dados\OFF\Documentos\Estudos, Demandas, Trades, Projetos\Projetos - Rotinas Mensais\Materiais - TAG Offshore UCITS Mutual Funds - Resultados e Comentários`
(no Drive: pasta "Materiais - TAG Offshore UCITS Mutual Funds - Resultados e Comentários").

Passos:
1. Partir do documento do mês anterior (ou do rascunho do mês, se a equipe já tiver salvo) na pasta acima —
   é a versão revisada pela equipe, então serve de modelo de estilo.
2. Usar **todos** os materiais do mês de referência salvos nas pastas `Institucional` de cada fundo
   (factsheets, comentários, cartas, relatórios trimestrais). Conferir o mês dentro do PDF: às vezes o
   nome do arquivo traz o mês em que foi salvo, não o de referência.
3. Estrutura de cada fundo: performance vs. benchmark e contexto de mercado; contribuidores e detratores;
   posicionamento/movimentações e visão do gestor; composição da carteira; nos fundos de crédito, linha final
   com YTW/YTM e duration.
   **Não escrever o retorno do próprio fundo no mês/ano (nem o do benchmark ao lado)**: a tabela de resultados
   já mostra; no texto vai só a direção ("devolveu levemente no mês, abaixo do benchmark"). Na revisão de
   setembro/2026 a equipe tirou esses números. Atribuição, exposições, posições e YTW/duration ficam com números.
4. Tabela de resultados (imagem no início do documento): vem do Excel `RetornosCarteirasFoFs_AAAAMM.xlsx`
   em `G:\Drives compartilhados\Gestao_Base_Dados\OFF\Resultados Offshore` (no Drive: pasta "Resultados Offshore"),
   que a equipe salva todo mês. `comentarios/tabela_resultados.py` gera a imagem (usa a aba limpa "Sheet1 (2)" se
   existir; senão tira 1M (-1), 1M (-2) e o grupo ALT Onshore). Conferir que a data de retorno é o fim do mês de
   referência. Se o Excel do mês não estiver lá, manter a imagem anterior e avisar.
5. Gerar o .docx com `comentarios/montar.py` (texto em um arquivo `COMENTARIOS = {título: [parágrafos]}`):
   `python3 comentarios/montar.py BASE.docx comentarios_AAAAMM.py SAIDA.docx --tabela RetornosCarteirasFoFs_AAAAMM.xlsx --mes Outubro`
   Ele mantém a formatação (Calibri, vermelho EE0000, títulos 14 pt), troca o mês no cabeçalho e não repete
   `w14:paraId`/`w14:textId` (o Word recusa o arquivo). Em janeiro, conferir o ano no cabeçalho.
6. Entregar o .docx à usuária e pedir que rode `publicar_comentario.bat`: ele copia o Word de Downloads para a
   pasta de Materiais e salva a cópia em PDF pelo Word.
7. Listar no fim os pontos para revisão (materiais faltantes, classes diferentes, números estimados).

Fundos (ordem do documento): AQR Delphi, AQR Apex, BSF Global Event Driven, Schroder GAIA Contour Tech,
Jupiter Merian GEAR, Algebris Financial Credit, Ninety One EM Corp Debt, Oaktree Global Credit,
PIMCO GIS Income, Man High Yield Opportunities, BNY Multi-Sector Credit.
