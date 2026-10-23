@echo off
rem Login no portal da BlackRock (uma vez, ou quando a coleta pedir)
cd /d "%~dp0"
node login_blackrock.js
pause
