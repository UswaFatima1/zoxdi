@echo off
setlocal
rem ---------------------------------------------------------------------------
rem  Zoxdi local preview.
rem  Double-click this file. It builds the site if needed, starts a tiny static
rem  server, and opens your browser at http://localhost:4173
rem
rem  Do NOT open out\index.html directly - a built Next.js page only works when
rem  it is served over http, otherwise the CSS and fonts cannot load and the
rem  page looks unstyled.
rem ---------------------------------------------------------------------------

set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js was not found. Install it from https://nodejs.org and try again.
  echo.
  pause
  exit /b 1
)

if not exist "out\index.html" (
  echo   Building the site ^(first run^)...
  call npm.cmd install
  call npm.cmd run build
)

echo.
echo   Zoxdi is starting at http://localhost:4173
echo   Keep this window open while you look around. Press Ctrl+C to stop.
echo.

start "" "http://localhost:4173/"
call node scripts/serve-static.mjs 4173 out

pause
