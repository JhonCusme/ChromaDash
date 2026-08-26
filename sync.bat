@echo off
:: ChromaDash — Sync script (Windows CMD batch)
:: Run this after any code change to push updates to Android Studio
:: Usage: sync.bat

echo.
echo  ChromaDash Sync
echo  ===============

:: Create www subfolders
if not exist "www" mkdir "www"
if not exist "www\css" mkdir "www\css"
if not exist "www\js" mkdir "www\js"
if not exist "www\js\config" mkdir "www\js\config"
if not exist "www\js\scenes" mkdir "www\js\scenes"
if not exist "www\js\objects" mkdir "www\js\objects"
if not exist "www\js\systems" mkdir "www\js\systems"

:: Copy web assets
echo  Copying web assets...
copy /Y "index.html" "www\" >nul
copy /Y "css\style.css" "www\css\" >nul
copy /Y "js\main.js" "www\js\" >nul
copy /Y "js\config\*" "www\js\config\" >nul
copy /Y "js\scenes\*" "www\js\scenes\" >nul
copy /Y "js\objects\*" "www\js\objects\" >nul
copy /Y "js\systems\*" "www\js\systems\" >nul
echo  Assets copied OK

:: Sync to Capacitor Android
echo  Running cap sync android...
call npx cap sync android
echo.
echo  Done! Open Android Studio and press Run to deploy.
echo.
