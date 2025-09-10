@echo off
echo 🔨 Building Sample Buddy for Windows...

REM Build React app
echo 📦 Building React application...
cd ..
call npm run build
if %errorlevel% neq 0 (
    echo ❌ React build failed!
    pause
    exit /b %errorlevel%
)

REM Install electron dependencies
echo ⚡ Installing Electron dependencies...
cd electron
call npm install
if %errorlevel% neq 0 (
    echo ❌ Electron dependencies installation failed!
    pause
    exit /b %errorlevel%
)

REM Build executable
echo 🚀 Building Windows executable...
call npm run dist
if %errorlevel% neq 0 (
    echo ❌ Executable build failed!
    pause
    exit /b %errorlevel%
)

echo ✅ Build completed successfully!
echo 📁 Your executable is in: electron\dist\Sample Buddy Setup.exe
echo.
echo You can now distribute this .exe file to any Windows PC
echo The app will work without requiring Node.js or any other dependencies
pause