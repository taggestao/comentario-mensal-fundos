@echo off
rem Cria a tarefa "Coleta Fundos Offshore" no Agendador do Windows: dias 15 e 25 de cada mes, as 10:00.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0agendar.ps1"
pause
