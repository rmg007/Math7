@echo off
title Questerix Superpower Watcher
cd /d "%~dp0"
echo.
echo ========================================
echo   SUPERPOWER MODE - Task Watcher
echo ========================================
echo.
echo Watching for tasks.json files...
echo Press Ctrl+C to stop.
echo.
python ops_runner.py --watch .
pause
