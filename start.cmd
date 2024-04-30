@echo off

rem Vérifier si Node.js est installé
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo "Node.js n'est pas installé sur ce système."
    set /p "install=Voulez-vous installer Node.js ? (O/N) :"
    if /i "%install%"=="O" (
        start https://nodejs.org/
    ) else (
        exit /b
    )
)

rem Se placer dans le dossier courant
cd /d %~dp0

rem Lancer le fichier main.js s'il existe
if exist dist\main.js (
    node dist\main.js %*
) else (
    echo "Le fichier dist\main.js n'existe pas dans ce répertoire."
)

pause