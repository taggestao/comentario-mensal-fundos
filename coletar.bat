@echo off
rem Roda a coleta e grava o log em logs\coleta-AAAA-MM-DD.txt
cd /d "%~dp0"
if not exist logs mkdir logs
for /f %%d in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd"') do set HOJE=%%d
node coletar.js %* >> "logs\coleta-%HOJE%.txt" 2>&1
type "logs\coleta-%HOJE%.txt"
