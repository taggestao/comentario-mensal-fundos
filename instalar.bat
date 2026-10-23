@echo off
rem Instala as dependências (rodar uma vez, e de novo se atualizar o repositório)
cd /d "%~dp0"
call npm install || goto erro
call npx playwright install chromium || goto erro
echo.
echo Instalacao concluida.
pause
exit /b 0
:erro
echo.
echo ERRO na instalacao. Confira se o Node.js esta instalado: https://nodejs.org
pause
exit /b 1
