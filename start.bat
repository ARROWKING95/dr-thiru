@echo off
title MedGuard MERN Stack - Full Application
echo ===================================================
echo   MedGuard Healthcare Clinical System - MERN Stack
echo ===================================================
echo.
echo [1/2] Checking dependencies...
if not exist "node_modules\" (
    echo [INFO] Installing required dependencies...
    call npm install
)

echo.
echo [2/2] Starting Express API (Port 5000) ^& Vite Frontend (Port 5173)...
echo.
echo ---------------------------------------------------
echo   - Backend API:  http://localhost:5000/api/health
echo   - Frontend App: http://localhost:5173/
echo ---------------------------------------------------
echo.

call npm run dev
pause
