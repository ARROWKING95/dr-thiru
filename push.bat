@echo off
title Push to GitHub - MedGuard MERN Stack
echo ===================================================
echo   MedGuard MERN - One-Click Git ^& GitHub Auto-Push
echo ===================================================
echo.

:: Locate git
set "GIT_EXE="
if exist "C:\Users\ASUS\AppData\Local\GitHubDesktop\app-3.5.8\resources\app\git\cmd\git.exe" (
    set "GIT_EXE=C:\Users\ASUS\AppData\Local\GitHubDesktop\app-3.5.8\resources\app\git\cmd\git.exe"
) else if exist "C:\Program Files\Git\cmd\git.exe" (
    set "GIT_EXE=C:\Program Files\Git\cmd\git.exe"
) else (
    for /f "delims=" %%g in ('where git 2^>nul') do if not defined GIT_EXE set "GIT_EXE=%%g"
)

if not defined GIT_EXE (
    echo [ERROR] Git was not found on your system.
    echo Please install Git or GitHub Desktop.
    pause
    exit /b 1
)

echo [1/4] Staging all files (MERN backend, models, routes, React frontend)...
"%GIT_EXE%" add .

set /p MSG="Enter commit message (Press Enter for auto-date): "
if "%MSG%"=="" (
    for /f "tokens=1-4 delims=/ " %%a in ("%date%") do set "DATE_STR=%%a-%%b-%%c"
    set "MSG=Convert MedGuard to full functional MERN Stack %DATE% %TIME%"
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
    echo   [SUCCESS] Successfully pushed MERN Stack to GitHub!
    echo   Repository: https://github.com/ARROWKING95/dr-thiru
    echo ===================================================
) else (
    echo.
    echo [ERROR] Push failed. Check your network or GitHub credentials.
)

echo.
pause
