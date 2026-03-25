param(
    [switch]$SkipSandbox,
    [switch]$WithGeminiPreview,
    [int]$ApiPort = 8010
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendScript = Join-Path $PSScriptRoot "backend-dev.ps1"
$mysqlSandboxScript = Join-Path $PSScriptRoot "mysql-sandbox.ps1"
$frontendRoot = Join-Path $repoRoot "frontend"

if (-not $SkipSandbox) {
    & $mysqlSandboxScript -Action start
}

& $backendScript -Action doctor -Port $ApiPort
& $backendScript -Action test -Port $ApiPort
& $backendScript -Action migrate -Port $ApiPort

if ($WithGeminiPreview) {
    & $backendScript -Action smoke -Port $ApiPort -RunPreview
} else {
    & $backendScript -Action smoke -Port $ApiPort
}

Push-Location $frontendRoot
try {
    npm test
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }

    npm run build
    exit $LASTEXITCODE
} finally {
    Pop-Location
}
