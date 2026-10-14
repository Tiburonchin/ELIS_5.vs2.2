@echo off
setlocal enabledelayedexpansion

title ELIS 5.0 - Entorno Local Inteligente y Seguro
color 0B

echo ===============================================================================
echo                ELIS 5.0 - ENTORNO LOCAL INTELIGENTE Y SEGURO
echo    Plataforma Cloud-Native para Gestion de Evidencias Forenses y Control HSE
echo ===============================================================================
echo.

:: 1. Verificacion inteligente de Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    color 0E
    echo ===============================================================================
    echo  [AVISO] No se detecto Node.js instalado en esta computadora.
    echo ===============================================================================
    echo.
    echo  ELIS 5.0 requiere el motor ligero Node.js (Version LTS gratuita).
    echo.
    echo  Abriendo automaticamente la pagina oficial de descarga en tu navegador:
    echo  https://nodejs.org/
    echo.
    echo  Instrucciones:
    echo   1. Descarga el instalador "LTS" (Recomendado).
    echo   2. Ejecuta el instalador con las opciones por defecto (Siguiente -> Instalar).
    echo   3. Vuelve a hacer doble clic en este archivo setup.bat.
    echo.
    echo ===============================================================================
    start https://nodejs.org/
    pause
    exit /b 1
)

:: Mostrar version detectada de Node.js
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [OK] Node.js detectado correctamente (!NODE_VERSION!).
echo.

:: 2. Posicionamiento en el directorio del frontend
cd /d "%~dp0frontend"

:: 3. Asegurar archivo .env preconfigurado
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
    ) else if exist "..\.env.example" (
        copy "..\.env.example" ".env" >nul
    )
    echo [OK] Credenciales Cloud Supabase preconfiguradas y activadas.
)

:: 4. Descarga e instalacion de dependencias
echo.
echo [1/2] Sincronizando librerias y componentes del sistema (npm install)...
call npm install
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo.
    echo [ERROR] Hubo un problema al instalar las librerias.
    echo Verifica tu conexion a Internet y vuelve a ejecutar setup.bat.
    pause
    exit /b %ERRORLEVEL%
)
echo [OK] Dependencias instaladas exitosamente.
echo.

:: 5. Lanzamiento del servidor y apertura automatica del navegador
echo [2/2] Iniciando ELIS 5.0...
echo.
echo ===============================================================================
echo  Acceso Local PC:   http://localhost:5173
echo  Acceso Celular:    Disponible en tu misma red WiFi (ver direccion Network abajo)
echo.
echo  Para detener el sistema, simplemente cierra esta ventana.
echo ===============================================================================
echo.

:: Abrir navegador predeterminado tras 3 segundos
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:5173"

:: Ejecutar servidor de desarrollo Vite con --host
call npm run dev -- --host

pause
