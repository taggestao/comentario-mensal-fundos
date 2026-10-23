@echo off
rem Cria a tarefa no Agendador do Windows: dias 15 e 25 de cada mes, as 10:00.
rem Se o computador estiver desligado no horario, roda assim que ligar.
cd /d "%~dp0"
schtasks /Create /F /TN "Coleta Fundos Credito Offshore" /SC MONTHLY /D 15,25 /ST 10:00 /TR "\"%~dp0coletar.bat\""
powershell -NoProfile -Command "$t = Get-ScheduledTask -TaskName 'Coleta Fundos Credito Offshore'; $t.Settings.StartWhenAvailable = $true; Set-ScheduledTask -InputObject $t | Out-Null"
echo.
echo Tarefa agendada. Para conferir: Agendador de Tarefas ^> "Coleta Fundos Credito Offshore".
pause
