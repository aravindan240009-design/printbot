@echo off
:: Batch script to install Print Bot Code Signing Certificate to Trusted Root Certification Authorities
:: Requires Administrator privileges
setlocal
cd /d "%~dp0"

echo =====================================================================
echo  Print Bot Platform - Installing Trusted Code Signing Certificate
echo =====================================================================
echo.

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] This installer requires Administrator privileges.
    echo Please right-click 'Install-Certificate.bat' and select 'Run as administrator'.
    echo.
    pause
    exit /b 1
)

echo Adding PrintBot_Certificate.cer to Trusted Root store...
certutil -addstore -f "Root" "%~dp0PrintBot_Certificate.cer"

if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] Print Bot Platform certificate installed successfully!
    echo Windows SmartScreen will now trust Print Bot installers and applications on this PC.
    echo.
) else (
    echo.
    echo [FAILED] Failed to install certificate. Error code: %errorlevel%
    echo.
)

pause

