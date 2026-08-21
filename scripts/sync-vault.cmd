@echo off
REM sync-vault.cmd — Vo boc cho Windows Scheduled Task.
REM
REM Vi sao can: post-commit hook chi dong bo KHI CO COMMIT. Cac file ghi tay
REM (GHI_NHAN_TUAN.md, VIEC_TUONG_LAI.md, THEO_DOI_BAO_CAO_TUAN.md) doi bat cu
REM luc nao, khong keo theo commit — nen ban trong vault se tut cho toi commit ke.
REM Task chay dinh ky goi file nay de bit khoang do.
REM
REM Tu suy ra duong dan: %~dp0 la scripts\, ".." la goc repo. Tim sh.exe qua
REM git.exe tren PATH. Nho vay chay duoc tren ca hai may (OneDrive mount F: laptop,
REM G: PC nha) va khong nhung duong dan cua may nao vao file duoc version hoa.
REM
REM Cai task (chay 1 lan, can quyen cua nguoi dung):
REM   schtasks /Create /TN "QA-AMO-sync-vault" /TR "\"<duong dan day du toi file nay>\"" /SC MINUTE /MO 15 /F
REM Go:
REM   schtasks /Delete /TN "QA-AMO-sync-vault" /F

cd /d "%~dp0.." || exit /b 0

for /f "delims=" %%G in ('where git 2^>nul') do set "GITEXE=%%G"
if not defined GITEXE exit /b 0
for %%P in ("%GITEXE%") do set "GITDIR=%%~dpP"

set "SH=%GITDIR%..\bin\sh.exe"
if not exist "%SH%" set "SH=%GITDIR%..\..\bin\sh.exe"
if not exist "%SH%" exit /b 0

"%SH%" -c "sh scripts/sync-workspace-docs.sh; sh scripts/sync-repo-docs.sh"
exit /b 0
