@echo off
powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\dev-stack.ps1" -Action up %*
