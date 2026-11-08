@echo off
REM Run HeritageBD on this laptop: double-click this file.
REM Starts XAMPP MySQL, the PHP API (port 8080) and the website (port 8443), then opens the browser.
REM To stop: close the "HeritageBD API" and "HeritageBD Web" windows.
title HeritageBD launcher
cd /d "%~dp0"

set "XAMPP=C:\xampp"
set "PHP=%XAMPP%\php\php.exe"
if not exist "%PHP%" set "PHP=php"

echo [1/4] Starting MySQL...
tasklist /fi "imagename eq mysqld.exe" | find /i "mysqld.exe" >nul
if errorlevel 1 (
  if exist "%XAMPP%\mysql\bin\mysqld.exe" (
    start "HeritageBD MySQL" /min "%XAMPP%\mysql\bin\mysqld.exe" --defaults-file="%XAMPP%\mysql\bin\my.ini" --standalone
    timeout /t 5 /nobreak >nul
  ) else (
    echo MySQL not found at %XAMPP%. Start it from XAMPP Control Panel, then press a key.
    pause >nul
  )
) else (
  echo MySQL is already running.
)

REM First run only: create the heritagebd database with demo data (schema.sql already includes all columns).
set "MYSQL=%XAMPP%\mysql\bin\mysql.exe"
if exist "%MYSQL%" (
  "%MYSQL%" -u root -e "USE heritagebd" 2>nul
  if errorlevel 1 (
    echo Creating database heritagebd with demo data...
    "%MYSQL%" -u root -e "CREATE DATABASE heritagebd CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    "%MYSQL%" -u root heritagebd < "%~dp0backend\database\schema.sql"
    "%MYSQL%" -u root heritagebd < "%~dp0backend\database\seed.sql"
  )
)

echo [2/4] Checking packages...
if not exist node_modules (
  call npm install || (echo npm install failed & pause & exit /b 1)
)
if not exist .env copy .env.example .env >nul

echo [3/4] Starting API on http://localhost:8080 ...
start "HeritageBD API" /d "%~dp0backend" "%PHP%" -S localhost:8080 index.php

echo [4/4] Starting website on http://localhost:8443 ...
set "PORT=8443"
set "VITE_API_URL=http://localhost:8080"
start "HeritageBD Web" /d "%~dp0" cmd /k npm run dev

timeout /t 8 /nobreak >nul
start "" http://localhost:8443
echo.
echo Website: http://localhost:8443
echo API:     http://localhost:8080/api/health
echo Close the API and Web windows to stop.
pause
