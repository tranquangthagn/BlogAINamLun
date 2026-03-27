@echo off
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\dev-stack.ps1" -Action down %*
