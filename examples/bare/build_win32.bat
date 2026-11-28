@echo off
cd /d %~dp0
rmdir /s /q node_modules\react-native-windows\target 2>nul
rmdir /s /q node_modules\react-native-windows\build 2>nul
"C:\Program Files\Microsoft Visual Studio\2022\Enterprise\MSBuild\Current\Bin\amd64\MSBuild.exe" windows\BareExample.sln /p:Configuration=Debug /p:Platform=x64 /m /v:minimal
