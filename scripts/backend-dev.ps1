param(
    [ValidateSet("doctor", "test", "serve", "migrate", "smoke")]
    [string]$Action = "doctor",
    [string]$BindHost = "127.0.0.1",
    [int]$Port = 8000,
    [string]$DatabaseUrl,
    [switch]$RunPreview
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendRoot = Join-Path $repoRoot "backend"
$runRoot = Join-Path $repoRoot ".run"
$defaultSandboxDatabaseUrl = "mysql+pymysql://blogai:blogai@127.0.0.1:3307/blog_ai_nam_lun"

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

function Get-BackendEnvironment {
    param(
        [switch]$DisableScheduler
    )

    $databaseUrl = if ($DatabaseUrl) {
        $DatabaseUrl
    } elseif ($env:DATABASE_URL) {
        $env:DATABASE_URL
    } else {
        $defaultSandboxDatabaseUrl
    }

    $environment = @{
        "DATABASE_URL" = $databaseUrl
    }

    if ($DisableScheduler) {
        $environment["ENABLE_SCHEDULER"] = "false"
    }

    return $environment
}

function Invoke-WithTemporaryEnvironment {
    param(
        [hashtable]$Environment,
        [scriptblock]$Script
    )

    $previousValues = @{}
    foreach ($key in $Environment.Keys) {
        $previousValues[$key] = [Environment]::GetEnvironmentVariable($key, "Process")
        $value = $Environment[$key]
        if ($null -eq $value) {
            Remove-Item "Env:$key" -ErrorAction SilentlyContinue
        } else {
            Set-Item "Env:$key" -Value $value
        }
    }

    try {
        & $Script
    } finally {
        foreach ($key in $Environment.Keys) {
            $previousValue = $previousValues[$key]
            if ($null -eq $previousValue) {
                Remove-Item "Env:$key" -ErrorAction SilentlyContinue
            } else {
                Set-Item "Env:$key" -Value $previousValue
            }
        }
    }
}

function Invoke-BackendPython {
    param(
        [string]$PythonPath,
        [string[]]$Arguments,
        [hashtable]$Environment = @{}
    )

    Invoke-WithTemporaryEnvironment -Environment $Environment -Script {
        Push-Location $backendRoot
        try {
            & $PythonPath @Arguments
            return $LASTEXITCODE
        } finally {
            Pop-Location
        }
    }
}

function Invoke-BackendRequest {
    param(
        [string]$Uri,
        [string]$Method = "Get",
        [object]$Body = $null,
        [int]$TimeoutSec = 5
    )

    $requestArguments = @{
        Uri = $Uri
        Method = $Method
        TimeoutSec = $TimeoutSec
    }

    if ($null -ne $Body) {
        $requestArguments["ContentType"] = "application/json"
        $requestArguments["Body"] = ($Body | ConvertTo-Json -Depth 6)
    }

    return Invoke-RestMethod @requestArguments
}

function Wait-ForBackendEndpoint {
    param(
        [string]$Uri,
        [int]$Attempts = 80
    )

    for ($index = 0; $index -lt $Attempts; $index += 1) {
        try {
            return Invoke-BackendRequest -Uri $Uri
        } catch {
            Start-Sleep -Milliseconds 250
        }
    }

    throw "Backend did not become ready for $Uri in time."
}

function Start-BackendProcess {
    param(
        [string]$PythonPath,
        [hashtable]$Environment
    )

    New-Item -ItemType Directory -Force -Path $runRoot | Out-Null
    $stdoutLog = Join-Path $runRoot "backend-smoke.out.log"
    $stderrLog = Join-Path $runRoot "backend-smoke.err.log"

    return Invoke-WithTemporaryEnvironment -Environment $Environment -Script {
        Push-Location $backendRoot
        try {
            Start-Process `
                -FilePath $PythonPath `
                -ArgumentList @("-m", "uvicorn", "app.main:app", "--host", $BindHost, "--port", "$Port") `
                -PassThru `
                -WindowStyle Hidden `
                -RedirectStandardOutput $stdoutLog `
                -RedirectStandardError $stderrLog
        } finally {
            Pop-Location
        }
    }
}

function Stop-BackendProcess {
    param(
        [System.Diagnostics.Process]$Process
    )

    if ($null -eq $Process) {
        return
    }

    try {
        if (-not $Process.HasExited) {
            Stop-Process -Id $Process.Id -Force
            Wait-Process -Id $Process.Id -ErrorAction SilentlyContinue
        }
    } catch {
    }
}

$pythonPath = Get-UsablePythonPath

if (-not $pythonPath) {
    Write-Error "No usable Python interpreter was found. Install Python 3.12+ or create backend/.venv first. The WindowsApps\python.exe alias is not enough."
}

$defaultEnvironment = Get-BackendEnvironment

switch ($Action) {
    "doctor" {
        Write-Output "Python: $pythonPath"
        Write-Output "Backend root: $backendRoot"
        Write-Output "DATABASE_URL: $($defaultEnvironment['DATABASE_URL'])"
        Write-Output ("Gemini configured: {0}" -f ([string][bool]$env:GEMINI_API_KEY).ToLower())
        $exitCode = Invoke-BackendPython -PythonPath $pythonPath -Arguments @("--version") -Environment $defaultEnvironment
        exit $exitCode
    }
    "test" {
        $exitCode = Invoke-BackendPython -PythonPath $pythonPath -Arguments @("-m", "pytest", "-q") -Environment $defaultEnvironment
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
        ) -Environment $defaultEnvironment
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
        ) -Environment $defaultEnvironment
        exit $exitCode
    }
    "smoke" {
        if ($RunPreview -and -not $env:GEMINI_API_KEY) {
            Write-Error "GEMINI_API_KEY is required when -RunPreview is set."
        }

        $smokeEnvironment = Get-BackendEnvironment -DisableScheduler
        $migrateExitCode = Invoke-BackendPython -PythonPath $pythonPath -Arguments @(
            "-m",
            "alembic",
            "-c",
            "alembic.ini",
            "upgrade",
            "head"
        ) -Environment $smokeEnvironment

        if ($migrateExitCode -ne 0) {
            exit $migrateExitCode
        }

        $serverProcess = $null
        try {
            $serverProcess = Start-BackendProcess -PythonPath $pythonPath -Environment $smokeEnvironment

            $baseUrl = "http://$BindHost`:$Port"
            $health = Wait-ForBackendEndpoint -Uri "$baseUrl/health"
            $ready = Wait-ForBackendEndpoint -Uri "$baseUrl/health/ready"
            $settings = Invoke-BackendRequest -Uri "$baseUrl/api/automation/settings"

            $payload = @{
                enabled = $false
                scheduleMode = "fixed_time"
                postTime = "08:00"
                intervalMinutes = 30
                sources = @("tiktok", "threads")
                trendRangeMode = "week"
                customDateRange = @{
                    start = $null
                    end = $null
                }
                tone = "gan_gui"
                focusPrompt = "uu tien goc nhin cho nguoi moi bat dau"
            }

            $updatedSettings = Invoke-BackendRequest -Uri "$baseUrl/api/automation/settings" -Method "Put" -Body $payload
            $history = Invoke-BackendRequest -Uri "$baseUrl/api/automation/history"

            Write-Output ("Health: {0}" -f $health.status)
            Write-Output ("Ready: {0} / database={1}" -f $ready.status, $ready.database)
            Write-Output ("Settings tone: {0}" -f $updatedSettings.tone)
            Write-Output ("History items: {0}" -f $history.Count)

            if ($RunPreview) {
                $preview = Invoke-BackendRequest -Uri "$baseUrl/api/automation/preview" -Method "Post" -Body $payload -TimeoutSec 60
                if ($preview.Count -lt 1) {
                    throw "Preview smoke expected at least one generated candidate."
                }

                Write-Output ("Preview title: {0}" -f $preview[0].title)
            } else {
                Write-Output "Preview smoke skipped. Use -RunPreview to spend one controlled Gemini call."
            }
        } finally {
            Stop-BackendProcess -Process $serverProcess
        }
    }
}
