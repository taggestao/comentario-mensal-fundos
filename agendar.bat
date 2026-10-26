@echo off
rem Cria duas tarefas no Agendador do Windows: dias 15 e 25 de cada mes, as 10:00
rem (o schtasks aceita so um dia por tarefa mensal). Se o computador estiver desligado
rem no horario, roda assim que ligar.
cd /d "%~dp0"
for %%D in (15 25) do (
  schtasks /Create /F /TN "Coleta Fundos Offshore - dia %%D" /SC MONTHLY /D %%D /ST 10:00 /TR "\"%~dp0coletar.bat\"" || goto erro
  powershell -NoProfile -Command "$t = Get-ScheduledTask -TaskName 'Coleta Fundos Offshore - dia %%D'; $t.Settings.StartWhenAvailable = $true; Set-ScheduledTask -InputObject $t | Out-Null" || goto erro
)
echo.
echo Tarefas agendadas. Para conferir: Agendador de Tarefas ^> "Coleta Fundos Offshore - dia 15" e "- dia 25".
pause
exit /b 0

:erro
echo.
echo ERRO ao criar o agendamento. Tire um print desta janela e envie.
pause
exit /b 1
