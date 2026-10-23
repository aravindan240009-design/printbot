@echo off
title Print Bot Workstation Counter
cd /d "%~dp0"
echo ===================================================
echo   PRINT BOT XEROX COUNTER WORKSTATION
echo ===================================================
echo [1/2] Starting Background Spooler & Agent Services...
start /b "" "target\debug\print-agent.exe" run
timeout /t 1 /nobreak >nul
echo [2/2] Launching Native Desktop App Window...
start "" msedge.exe --app="http://localhost:5173" --window-size=1280,840 --user-data-dir="%LOCALAPPDATA%\PrintBotWorkstation"
echo Desktop Workstation is running!
