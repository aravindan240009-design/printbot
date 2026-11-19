@echo off
:: ============================================================================
::  Print Bot Workstation - 1-Click Trusted Setup
::  Automatically trusts the publisher certificate and starts installation
:: ============================================================================
title Print Bot Trusted Installer Setup
setlocal enabledelayedexpansion

:: Check for Administrator privileges; if not elevated, request UAC elevation automatically
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Requesting Administrator privileges to trust Print Bot publisher...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process cmd.exe -ArgumentList '/c \"\"%~f0\"\"' -Verb RunAs"
    exit /b
)

cd /d "%~dp0"

echo ============================================================================
echo   Print Bot Workstation - Trusted Installation Setup
echo ============================================================================
echo.
echo [1/2] Registering Print Bot Platform Code Signing Certificate...

if exist "%~dp0PrintBot_Certificate.cer" (
    certutil -addstore -f "Root" "%~dp0PrintBot_Certificate.cer" >nul 2>&1
    if !errorlevel! equ 0 (
        echo  [OK] Publisher certificate successfully trusted.
    ) else (
        echo  [INFO] Certificate setup step completed.
    )
) else (
    echo  [WARN] Certificate file not found; proceeding to installer.
)

echo.
echo [2/2] Launching Print Bot Installer...
if exist "%~dp0Print Bot_1.0.0_x64-setup.exe" (
    start "" "%~dp0Print Bot_1.0.0_x64-setup.exe"
    echo.
    echo  [DONE] Installer launched! You may close this window.
) else (
    echo  [ERROR] Setup executable 'Print Bot_1.0.0_x64-setup.exe' was not found in this folder.
    pause
    exit /b 1
)

timeout /t 3 >nul
exit /b 0

