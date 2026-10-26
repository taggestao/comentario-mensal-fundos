# Copia o Word dos comentários mensais (baixado da conversa com o Claude) para a pasta de Materiais
# e salva uma cópia em PDF usando o próprio Word.
# uso: publicar_comentario.bat  (procura em Downloads o .docx mais recente com o nome padrão)
#   ou arraste o .docx para cima do publicar_comentario.bat (usa esse arquivo, de qualquer pasta)
param([string]$Origem = (Join-Path $env:USERPROFILE 'Downloads'))

$destino = 'G:\Drives compartilhados\Gestao_Base_Dados\OFF\Documentos\Estudos, Demandas, Trades, Projetos\Projetos - Rotinas Mensais\Materiais - TAG Offshore UCITS Mutual Funds - Resultados e Comentários'

if (-not (Test-Path $destino)) { Write-Host "Pasta de destino não encontrada (o Google Drive está aberto?): $destino"; exit 1 }

if (Test-Path -LiteralPath $Origem -PathType Leaf) {
  $arq = Get-Item -LiteralPath $Origem
} else {
  $arq = Get-ChildItem -Path $Origem -Filter '*TAG Offshore UCITS Mutual Funds - Resultados e Coment*.docx' |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
}
if (-not $arq) {
  Write-Host "Nenhum Word de comentários encontrado em $Origem"
  Write-Host 'Dica: arraste o arquivo .docx para cima do publicar_comentario.bat.'
  exit 1
}

# o navegador acrescenta " (1)", " (2)"... quando o arquivo já existe em Downloads; espaços duplos viram um só
$nome = ($arq.Name -replace ' \(\d+\)(?=\.docx$)', '') -replace '\s{2,}', ' '
if ($nome -notmatch '^\d{6}') { Write-Host "O nome não começa com AAAAMM: $nome"; exit 1 }
$docx = Join-Path $destino $nome
$pdf = [IO.Path]::ChangeExtension($docx, '.pdf')

# versões do mesmo arquivo já na pasta com outro espaçamento no nome (ex.: "202609  - ...")
$normaliza = { param($n) $n -replace '\s+', ' ' }
$antigos = @(Get-ChildItem -LiteralPath $destino -File | Where-Object {
  (& $normaliza $_.BaseName) -eq (& $normaliza ([IO.Path]::GetFileNameWithoutExtension($nome))) -and
  $_.Extension -in '.docx', '.pdf' })

Write-Host "Arquivo: $($arq.FullName)"
Write-Host "Destino: $docx"
if ($antigos) {
  $antigos | ForEach-Object { Write-Host "Já existe na pasta: $($_.Name)  ($($_.LastWriteTime))" }
  $r = Read-Host 'Substituir? (S/N)'
  if ($r -notmatch '^[sS]') { Write-Host 'Cancelado.'; exit 0 }
}
Copy-Item -LiteralPath $arq.FullName -Destination $docx -Force
$antigos | Where-Object { $_.Name -ne $nome -and $_.Name -ne [IO.Path]::GetFileName($pdf) } |
  ForEach-Object { Remove-Item -LiteralPath $_.FullName; Write-Host "Removido (nome antigo): $($_.Name)" }

$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {
  $doc = $word.Documents.Open($docx, $false, $true)   # somente leitura
  $doc.SaveAs2($pdf, 17)                              # 17 = PDF
  $doc.Close($false)
} finally {
  $word.Quit()
}
Write-Host ''
Write-Host "Salvo: $docx"
Write-Host "Salvo: $pdf"
