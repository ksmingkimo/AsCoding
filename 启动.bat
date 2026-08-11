@echo off
chcp 65001 >nul
title Sunlike ERP - One-Click Start

echo.
echo   ============================================
echo     Sunlike ERP Report System
echo     One-Click Launcher
echo   ============================================
echo.

REM Check if we're in the right directory
if not exist "index.html" (
    echo   [ERROR] index.html not found!
    echo   Please put this file in the project root directory.
    echo   Project root should contain: index.html, css/, js/
    echo.
    pause
    exit /b 1
)

REM Launch PowerShell script
powershell.exe -ExecutionPolicy Bypass -File "%~dp0install.ps1" -Mode quick

pause
