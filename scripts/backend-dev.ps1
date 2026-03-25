param(
    [ValidateSet("doctor", "test", "serve", "migrate")]
    [string]$Action = "doctor",
    [string]$BindHost = "127.0.0.1",
    [int]$Port = 8000
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendRoot = Join-Path $repoRoot "backend"

function Get-UsablePythonPath {
    $candidates = @(
        (Join-Path $repoRoot ".venv\Scripts\python.exe"),
        (Join-Path $backendRoot ".venv\Scripts\python.exe"),
        (Join-Path $repoRoot "venv\Scripts\python.exe"),
        (Join-Path $backendRoot "venv\Scripts\python.exe")
    )

    foreach ($candidate in $candidates) {
        if (Test-Path $candidate) {
            return $candidate
        }
    }

    $userPythonRoots = @(
        (Join-Path $env:LocalAppData "Programs\Python"),
        (Join-Path $env:UserProfile "AppData\Local\Programs\Python")
    ) | Select-Object -Unique

    foreach ($root in $userPythonRoots) {
        if (-not (Test-Path $root)) {
            continue
        }

        $installedPython = Get-ChildItem $root -Directory -ErrorAction SilentlyContinue |
            Sort-Object Name -Descending

        foreach ($install in $installedPython) {
            $candidate = Join-Path $install.FullName "python.exe"
            if (Test-Path $candidate) {
                return $candidate
            }
        }
    }

    $commands = @()
    try {
        $commands += Get-Command python -All -ErrorAction Stop
    } catch {
    }

    try {
        $commands += Get-Command py -All -ErrorAction Stop
    } catch {
    }

    foreach ($command in $commands) {
        if (-not $command.Source) {
            continue
        }

        if ($command.Source -like '*WindowsApps\python.exe') {
            continue
        }

        return $command.Source
    }

    return $null
}

function Invoke-BackendPython {
    param(
        [string]$PythonPath,
        [string[]]$Arguments
    )

    Push-Location $backendRoot
    try {
        & $PythonPath @Arguments
        return $LASTEXITCODE
    } finally {
        Pop-Location
    }
}

$pythonPath = Get-UsablePythonPath

if (-not $pythonPath) {
    Write-Error "No usable Python interpreter was found. Install Python 3.12+ or create backend/.venv first. The WindowsApps\\python.exe alias is not enough."
}

switch ($Action) {
    "doctor" {
        Write-Output "Python: $pythonPath"
        Write-Output "Backend root: $backendRoot"
        $exitCode = Invoke-BackendPython -PythonPath $pythonPath -Arguments @("--version")
        exit $exitCode
    }
    "test" {
        $exitCode = Invoke-BackendPython -PythonPath $pythonPath -Arguments @("-m", "pytest", "-q")
        exit $exitCode
    }
    "serve" {
        $exitCode = Invoke-BackendPython -PythonPath $pythonPath -Arguments @(
            "-m",
            "uvicorn",
            "app.main:app",
            "--host",
            $BindHost,
            "--port",
            "$Port"
        )
        exit $exitCode
    }
    "migrate" {
        $exitCode = Invoke-BackendPython -PythonPath $pythonPath -Arguments @(
            "-m",
            "alembic",
            "-c",
            "alembic.ini",
            "upgrade",
            "head"
        )
        exit $exitCode
    }
}
