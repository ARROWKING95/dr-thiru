@echo off
title MedGuard Healthcare System - Dev Server
echo ===================================================
echo   Starting MedGuard Healthcare Decision Support
echo ===================================================
echo.

:: Check node_modules
if not exist "node_modules\" (
    echo [INFO] Installing required dependencies first...
    call npm install
)

echo [INFO] Starting Vite development server...
call npm run dev
pause
