@echo off
setlocal
pushd "%~dp0"

echo Building TwosFood ERP launcher...
dotnet publish ERPLauncher.csproj -c Release -r win-x64 --self-contained true
if errorlevel 1 (
    echo.
    echo EXE build failed.
    popd
    exit /b 1
)

echo.
echo EXE build completed.
echo.
dir /b "bin\Release\net8.0-windows\win-x64\publish\*.exe"
echo Location: launcher\bin\Release\net8.0-windows\win-x64\publish
popd
endlocal
