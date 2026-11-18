@echo off
title Seed MedGuard Database (MongoDB)
echo ===================================================
echo   Populate MedGuard MongoDB Demo Records
echo ===================================================
echo.
call npm run seed
echo.
pause
