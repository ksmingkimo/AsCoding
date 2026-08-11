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

REM Locate PowerShell and launch installer
set "PS_EXE="
if exist "%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" (
    set "PS_EXE=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
)
if exist "%SystemRoot%\SysWOW64\WindowsPowerShell\v1.0\powershell.exe" (
    set "PS_EXE=%SystemRoot%\SysWOW64\WindowsPowerShell\v1.0\powershell.exe"
)
if not defined PS_EXE (
    for %%p in (powershell.exe pwsh.exe) do (
        for /f "delims=" %%f in ('where %%p 2^>nul') do (
            if exist "%%f" set "PS_EXE=%%f"
        )
    )
)
if not defined PS_EXE (
    echo   [ERROR] PowerShell is not installed or not in PATH!
    echo   Please install PowerShell and try again.
    pause
    exit /b 1
)
echo   Using PowerShell: %PS_EXE%
"%PS_EXE%" -ExecutionPolicy Bypass -File "%~dp0install.ps1" -Mode quick

pause
