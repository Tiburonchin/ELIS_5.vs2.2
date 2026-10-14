@echo off
setlocal enabledelayedexpansion

title ELIS 5.0 - Onboarding e Instalacion Automatizada
color 0B

echo ===============================================================================
echo                ELIS 5.0 - ENTORNO LOCAL INTELIGENTE Y SEGURO
echo    Plataforma Cloud-Native para Gestion de Evidencias Forenses y Control HSE
echo ===============================================================================
echo.

:: 1. Verificacion rapida de Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [ERROR] No se detecto Node.js en este equipo.
    echo Por favor instala Node.js desde: https://nodejs.org/ (Version LTS)
    echo y luego vuelve a ejecutar este archivo.
    echo.
    pause
    exit /b 1
)

:: 2. Posicionamiento en el directorio del frontend
cd /d "%~dp0frontend"

:: 3. Asegurar archivo .env preconfigurado
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
    ) else if exist "..\.env.example" (
        copy "..\.env.example" ".env" >nul
    )
    echo [OK] Credenciales cloud preconfiguradas listas.
)

:: 4. Descarga e instalacion de dependencias
echo [1/2] Instalando componentes y librerias del sistema (npm install)...
call npm install
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo.
    echo [ERROR] Hubo un problema descargando las dependencias.
    echo Revisa tu conexion a Internet y vuelve a intentarlo.
    pause
    exit /b %ERRORLEVEL%
)
echo [OK] Librerias instaladas correctamente.
echo.

:: 5. Abrir navegador automaticamente e iniciar servidor local
echo [2/2] Iniciando ELIS 5.0...
echo El navegador web se abrira automaticamente en unos segundos.
echo Servidor expuesto para computadoras y celulares en la misma red WiFi.
echo Para detener la aplicacion, simplemente cierra esta ventana.
echo.

:: Lanzar navegador en segundo plano tras 3 segundos
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:5173"

:: Iniciar Vite dev server
call npm run dev -- --host

pause
