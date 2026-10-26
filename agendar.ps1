# Cria a tarefa "Coleta Fundos Offshore" no Agendador do Windows: dias 15 e 25 de cada mes, as 10:00.
# Se o computador estiver desligado no horario, roda assim que ligar (StartWhenAvailable).
# A tarefa e criada inteira por XML: o schtasks so aceita um dia por tarefa mensal e o
# Set-ScheduledTask nao consegue alterar tarefas mensais ("Parametro incorreto").
$ErrorActionPreference = 'Stop'
try {
  $nome = 'Coleta Fundos Offshore'
  $pasta = $PSScriptRoot
  $bat = Join-Path $pasta 'coletar.bat'
  $usuario = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
  $esc = { param($s) [System.Security.SecurityElement]::Escape($s) }
  $inicio = (Get-Date -Day 1).Date.AddHours(10).ToString('yyyy-MM-ddTHH:mm:ss')
  $meses = ('January','February','March','April','May','June','July','August','September','October','November','December' | ForEach-Object { "<$_ />" }) -join ''

  $xml = @"
<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo><Description>Coleta mensal de factsheets e comentarios dos fundos UCITS offshore</Description></RegistrationInfo>
  <Triggers>
    <CalendarTrigger>
      <StartBoundary>$inicio</StartBoundary>
      <Enabled>true</Enabled>
      <ScheduleByMonth>
        <DaysOfMonth><Day>15</Day><Day>25</Day></DaysOfMonth>
        <Months>$meses</Months>
      </ScheduleByMonth>
    </CalendarTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <UserId>$(& $esc $usuario)</UserId>
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>LeastPrivilege</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <StartWhenAvailable>true</StartWhenAvailable>
    <ExecutionTimeLimit>PT2H</ExecutionTimeLimit>
    <Enabled>true</Enabled>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>"$(& $esc $bat)"</Command>
      <WorkingDirectory>$(& $esc $pasta)</WorkingDirectory>
    </Exec>
  </Actions>
</Task>
"@

  # remove as tarefas das versoes anteriores, se existirem
  foreach ($velha in 'Coleta Fundos Credito Offshore', 'Coleta Fundos Offshore - dia 15', 'Coleta Fundos Offshore - dia 25') {
    if (Get-ScheduledTask -TaskName $velha -ErrorAction SilentlyContinue) {
      Unregister-ScheduledTask -TaskName $velha -Confirm:$false
      Write-Host "Removida tarefa antiga: $velha"
    }
  }

  Register-ScheduledTask -TaskName $nome -Xml $xml -Force | Out-Null
  $prox = (Get-ScheduledTaskInfo -TaskName $nome).NextRunTime
  Write-Host ''
  Write-Host "Tarefa agendada: '$nome' - dias 15 e 25, as 10h (roda ao ligar se o PC estiver desligado)."
  Write-Host "Proxima execucao: $prox"
  Write-Host "Executa: $bat"
  exit 0
} catch {
  Write-Host ''
  Write-Host "ERRO ao criar o agendamento: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host 'Tire um print desta janela e envie.'
  exit 1
}
