# Copia o Word dos comentários mensais (baixado da conversa com o Claude) para a pasta de Materiais
# e salva uma cópia em PDF usando o próprio Word.
# uso: publicar_comentario.bat  (procura em Downloads o .docx mais recente com o nome padrão)
param([string]$Origem = (Join-Path $env:USERPROFILE 'Downloads'))

$destino = 'G:\Drives compartilhados\Gestao_Base_Dados\OFF\Documentos\Estudos, Demandas, Trades, Projetos\Projetos - Rotinas Mensais\Materiais - TAG Offshore UCITS Mutual Funds - Resultados e Comentários'

if (-not (Test-Path $destino)) { Write-Host "Pasta de destino não encontrada (o Google Drive está aberto?): $destino"; exit 1 }

$arq = Get-ChildItem -Path $Origem -Filter '*TAG Offshore UCITS Mutual Funds - Resultados e Coment*.docx' |
  Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $arq) { Write-Host "Nenhum Word de comentários encontrado em $Origem"; exit 1 }

# o navegador acrescenta " (1)", " (2)"... quando o arquivo já existe em Downloads
$nome = $arq.Name -replace ' \(\d+\)(?=\.docx$)', ''
if ($nome -notmatch '^\d{6}') { Write-Host "O nome não começa com AAAAMM: $nome"; exit 1 }
$docx = Join-Path $destino $nome
$pdf = [IO.Path]::ChangeExtension($docx, '.pdf')

Write-Host "Arquivo: $($arq.FullName)"
Write-Host "Destino: $docx"
if (Test-Path $docx) {
  $r = Read-Host 'Já existe um arquivo com esse nome na pasta. Substituir? (S/N)'
  if ($r -notmatch '^[sS]') { Write-Host 'Cancelado.'; exit 0 }
}
Copy-Item -LiteralPath $arq.FullName -Destination $docx -Force

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
