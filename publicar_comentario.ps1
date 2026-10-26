# Copia o Word dos comentários mensais (baixado da conversa com o Claude) para a pasta de Materiais
# e salva uma cópia em PDF usando o próprio Word.
# uso: publicar_comentario.bat  (procura em Downloads o .docx mais recente com o nome padrão)
#   ou arraste o .docx para cima do publicar_comentario.bat (usa esse arquivo, de qualquer pasta)
# O caminho completo na pasta de Materiais passa de 260 caracteres: os comandos comuns do Windows
# (Copy-Item, Remove-Item, Word) falham nele. Por isso o PDF é gerado numa pasta temporária e a
# cópia/remoção na pasta de Materiais usa o prefixo \\?\ (caminho longo) do .NET.
param([string]$Origem = (Join-Path $env:USERPROFILE 'Downloads'))
$ErrorActionPreference = 'Stop'

$destino = 'G:\Drives compartilhados\Gestao_Base_Dados\OFF\Documentos\Estudos, Demandas, Trades, Projetos\Projetos - Rotinas Mensais\Materiais - TAG Offshore UCITS Mutual Funds - Resultados e Comentários'
$longo = { param($p) if ($p.StartsWith('\\?\')) { $p } else { '\\?\' + $p } }

try {
  if (-not (Test-Path -LiteralPath $destino)) { throw "Pasta de destino não encontrada (o Google Drive está aberto?): $destino" }

  if (Test-Path -LiteralPath $Origem -PathType Leaf) {
    $arq = Get-Item -LiteralPath $Origem
  } else {
    $arq = Get-ChildItem -Path $Origem -Filter '*TAG Offshore UCITS Mutual Funds - Resultados e Coment*.docx' |
      Sort-Object LastWriteTime -Descending | Select-Object -First 1
  }
  if (-not $arq) { throw "Nenhum Word de comentários encontrado em $Origem. Dica: arraste o arquivo .docx para cima do publicar_comentario.bat." }

  # o navegador acrescenta " (1)", " (2)"... quando o arquivo já existe em Downloads; espaços duplos viram um só
  $nome = ($arq.Name -replace ' \(\d+\)(?=\.docx$)', '') -replace '\s{2,}', ' '
  if ($nome -notmatch '^\d{6}') { throw "O nome não começa com AAAAMM: $nome" }
  $nomePdf = [IO.Path]::ChangeExtension($nome, '.pdf')
  $docx = Join-Path $destino $nome
  $pdf = Join-Path $destino $nomePdf

  # versões do mesmo arquivo já na pasta, inclusive com outro espaçamento no nome (ex.: "202609  - ...")
  $base = [IO.Path]::GetFileNameWithoutExtension($nome)
  $antigos = @(Get-ChildItem -LiteralPath $destino -File | Where-Object {
    ($_.BaseName -replace '\s+', ' ') -eq $base -and $_.Extension -in '.docx', '.pdf' })

  Write-Host "Arquivo: $($arq.FullName)"
  Write-Host "Destino: $docx"
  if ($antigos) {
    $antigos | ForEach-Object { Write-Host "Já existe na pasta: $($_.Name)  ($($_.LastWriteTime))" }
    $r = Read-Host 'Substituir? (S/N)'
    if ($r -notmatch '^[sS]') { Write-Host 'Cancelado.'; exit 0 }
  }

  # trabalha numa pasta temporária local (caminho curto) e gera o PDF lá
  $tmp = Join-Path $env:TEMP 'publicar_comentario'
  New-Item -ItemType Directory -Force -Path $tmp | Out-Null
  $tmpDocx = Join-Path $tmp $nome
  $tmpPdf = Join-Path $tmp $nomePdf
  [IO.File]::Copy((& $longo $arq.FullName), $tmpDocx, $true)
  if (Test-Path -LiteralPath $tmpPdf) { Remove-Item -LiteralPath $tmpPdf }

  $word = New-Object -ComObject Word.Application
  $word.Visible = $false
  try {
    $doc = $word.Documents.Open($tmpDocx, $false, $true)   # somente leitura
    if (-not $doc) { throw "O Word não abriu o arquivo: $tmpDocx" }
    $doc.SaveAs2($tmpPdf, 17)                              # 17 = PDF
    $doc.Close($false)
  } finally {
    $word.Quit()
  }
  if (-not (Test-Path -LiteralPath $tmpPdf)) { throw 'O Word não gerou o PDF.' }

  # copia para a pasta de Materiais (caminho longo) e remove as versões com nome antigo
  [IO.File]::Copy($tmpDocx, (& $longo $docx), $true)
  [IO.File]::Copy($tmpPdf, (& $longo $pdf), $true)
  foreach ($a in $antigos) {
    if ($a.Name -ne $nome -and $a.Name -ne $nomePdf) {
      [IO.File]::Delete((& $longo (Join-Path $destino $a.Name)))
      Write-Host "Removido (nome antigo): $($a.Name)"
    }
  }
  foreach ($f in $docx, $pdf) {
    if (-not [IO.File]::Exists((& $longo $f))) { throw "Não encontrei o arquivo depois de copiar: $f" }
  }
  Remove-Item -LiteralPath $tmpDocx, $tmpPdf -ErrorAction SilentlyContinue

  Write-Host ''
  Write-Host "Salvo: $docx"
  Write-Host "Salvo: $pdf"
} catch {
  Write-Host ''
  Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host 'Nada foi marcado como salvo. Tire um print desta janela e envie.'
  exit 1
}
