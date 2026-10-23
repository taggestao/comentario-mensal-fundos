@echo off
rem Copia o Word dos comentarios mensais de Downloads para a pasta de Materiais e salva o PDF
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0publicar_comentario.ps1" %*
pause
