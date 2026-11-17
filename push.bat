@echo off
title Push to GitHub - MedGuard
echo ===================================================
echo   MedGuard - One-Click Git & GitHub Auto-Push
echo ===================================================
echo.

:: Locate git
set "GIT_EXE=C:\Users\ASUS\AppData\Local\GitHubDesktop\app-3.5.8\resources\app\git\cmd\git.exe"
if not exist "%GIT_EXE%" (
    where git >nul 2>nul
    if %errorlevel% equ 0 (
        set "GIT_EXE=git"
    ) else (
        echo [ERROR] Git could not be located.
        pause
        exit /b 1
    )
)

echo [1/4] Staging all changed files...
"%GIT_EXE%" add .

set /p MSG="Enter commit message (Press Enter for auto-date): "
if "%MSG%"=="" (
    for /f "tokens=1-4 delims=/ " %%a in ("%date%") do set "DATE_STR=%%a-%%b-%%c"
    set "MSG=Update MedGuard clinical system %DATE% %TIME%"
)

echo [2/4] Committing changes...
"%GIT_EXE%" commit -m "%MSG%"

echo [3/4] Ensuring branch is main...
"%GIT_EXE%" branch -M main

echo [4/4] Pushing to GitHub (https://github.com/ARROWKING95/dr-thiru.git)...
"%GIT_EXE%" push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ===================================================
    echo   [SUCCESS] Successfully pushed to GitHub!
    echo   Repository: https://github.com/ARROWKING95/dr-thiru
    echo ===================================================
) else (
    echo.
    echo [ERROR] Push failed. Check your internet connection or GitHub credentials.
)

echo.
pause
