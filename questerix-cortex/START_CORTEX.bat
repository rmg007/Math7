@echo off
setlocal enableextensions enabledelayedexpansion

title Questerix Cortex Launcher

set "ROOT=%~dp0"
set "LOG=%ROOT%cortex-launch.log"
set "PORT=5050"

echo ============================================ > "%LOG%"
echo  Questerix Cortex Launcher                  >> "%LOG%"
echo  %date% %time%                              >> "%LOG%"
echo ============================================ >> "%LOG%"
echo. >> "%LOG%"

cd /d "%ROOT%"
echo [LOG] ROOT = %ROOT% >> "%LOG%"
echo [LOG] Changed dir OK >> "%LOG%"

echo.
echo ===== Questerix Cortex Launcher =====
echo.

rem --- Step 1: Read port from config ---
echo [LOG] Step 1: Reading port from cortex.config.json >> "%LOG%"
if not exist "%ROOT%cortex.config.json" (
  echo [LOG] ERROR: cortex.config.json not found >> "%LOG%"
  echo ERROR: cortex.config.json not found in %ROOT%
  goto :fail
)
for /f "tokens=2 delims=: " %%a in ('findstr "dashboardPort" "%ROOT%cortex.config.json"') do set "PORT=%%a"
echo [LOG] PORT = %PORT% >> "%LOG%"
echo Port: %PORT%

rem --- Step 2: Check node and npm ---
echo [LOG] Step 2: Checking node >> "%LOG%"
where node > nul 2> nul
if errorlevel 1 (
  echo [LOG] ERROR: node not found on PATH >> "%LOG%"
  echo ERROR: Node.js is not on PATH. Install Node.js first.
  goto :fail
)
for /f "delims=" %%n in ('where node') do echo [LOG] node = %%n >> "%LOG%"
echo [OK] node found

echo [LOG] Checking npm >> "%LOG%"
where npm > nul 2> nul
if errorlevel 1 (
  echo [LOG] ERROR: npm not found on PATH >> "%LOG%"
  echo ERROR: npm is not on PATH. Install Node.js first.
  goto :fail
)
for /f "delims=" %%n in ('where npm') do echo [LOG] npm = %%n >> "%LOG%"
echo [OK] npm found

rem --- Step 3: Kill any existing process on this port ---
echo [LOG] Step 3: Checking if port %PORT% is in use >> "%LOG%"
set "PORT_PID="
for /f "tokens=5" %%i in ('netstat -ano 2^>nul ^| findstr ":%PORT% " ^| findstr "LISTENING"') do (
  if not defined PORT_PID set "PORT_PID=%%i"
)

if defined PORT_PID (
  echo [LOG] Port %PORT% in use by PID %PORT_PID% >> "%LOG%"
  echo Port %PORT% in use by PID %PORT_PID%. Killing it...
  taskkill /PID %PORT_PID% /F > nul 2> nul
  timeout /t 2 /nobreak > nul
  echo [LOG] Killed PID %PORT_PID% >> "%LOG%"
) else (
  echo [LOG] Port %PORT% is free >> "%LOG%"
  echo [OK] Port %PORT% is free
)

rem --- Step 4: Install cortex deps if missing ---
echo [LOG] Step 4: Checking cortex node_modules >> "%LOG%"
if not exist "%ROOT%node_modules" (
  echo Installing Cortex dependencies...
  echo [LOG] npm install cortex >> "%LOG%"
  call npm install
  if errorlevel 1 (
    echo [LOG] ERROR: npm install failed >> "%LOG%"
    goto :fail
  )
  echo [LOG] npm install cortex OK >> "%LOG%"
) else (
  echo [OK] Cortex node_modules present
  echo [LOG] Cortex node_modules present >> "%LOG%"
)

rem --- Step 5: Install dashboard deps if missing ---
echo [LOG] Step 5: Checking dashboard node_modules >> "%LOG%"
if not exist "%ROOT%dashboard\node_modules" (
  echo Installing Dashboard dependencies...
  echo [LOG] npm install dashboard >> "%LOG%"
  pushd "%ROOT%dashboard"
  call npm install
  popd
  if errorlevel 1 (
    echo [LOG] ERROR: dashboard npm install failed >> "%LOG%"
    goto :fail
  )
  echo [LOG] npm install dashboard OK >> "%LOG%"
) else (
  echo [OK] Dashboard node_modules present
  echo [LOG] Dashboard node_modules present >> "%LOG%"
)

rem --- Step 6: Build dashboard ---
echo [LOG] Step 6: Building dashboard >> "%LOG%"
echo Building dashboard...
pushd "%ROOT%dashboard"
call npm run build
if errorlevel 1 (
  popd
  echo [LOG] ERROR: dashboard build failed >> "%LOG%"
  goto :fail
)
popd
echo [LOG] Dashboard build OK >> "%LOG%"
echo [OK] Dashboard built

rem --- Step 7: Start the Cortex server ---
echo [LOG] Step 7: Starting server >> "%LOG%"
echo.
echo Starting Cortex server...
start "Questerix Cortex Server" cmd /k "cd /d "%ROOT%" && npm run health"
echo [LOG] Server window launched >> "%LOG%"

rem --- Step 8: Wait for port to be ready ---
echo [LOG] Step 8: Waiting for port %PORT% >> "%LOG%"
echo Waiting for http://localhost:%PORT% ...
set "ATTEMPTS=0"
:wait_loop
set /a ATTEMPTS+=1
if %ATTEMPTS% gtr 30 (
  echo [LOG] ERROR: Server did not start within 30s >> "%LOG%"
  echo ERROR: Server did not start within 30 seconds.
  echo Check the "Questerix Cortex Server" window for errors.
  goto :fail
)
timeout /t 1 /nobreak > nul
netstat -ano 2>nul | findstr ":%PORT% " | findstr "LISTENING" > nul 2> nul
if errorlevel 1 goto :wait_loop

echo [LOG] Port %PORT% is now listening >> "%LOG%"
echo [OK] Server is ready!

rem --- Step 9: Open browser ---
echo [LOG] Step 9: Opening browser >> "%LOG%"
echo Opening http://localhost:%PORT%/ ...
start "" "http://localhost:%PORT%/"

echo.
echo ===== Cortex is running =====
echo Dashboard: http://localhost:%PORT%/
echo Server is in the other window titled "Questerix Cortex Server".
echo You can close THIS window. The server keeps running.
echo.
echo [LOG] %date% %time% DONE >> "%LOG%"
pause
exit /b 0

:fail
echo.
echo ===== FAILED =====
echo See log: %LOG%
echo [LOG] %date% %time% FAILED >> "%LOG%"
echo.
pause
exit /b 1
