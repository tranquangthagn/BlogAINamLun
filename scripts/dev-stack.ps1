param(
    [ValidateSet("up", "down")]
    [string]$Action = "up",
    [int]$ApiPort = 8000,
    [int]$FrontendPort = 5173
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$scriptsRoot = Join-Path $repoRoot "scripts"
$runRoot = Join-Path $repoRoot ".run"
$frontendRoot = Join-Path $repoRoot "frontend"
$localHost = "127.0.0.1"

$mysqlSandboxScript = Join-Path $scriptsRoot "mysql-sandbox.ps1"
$backendScript = Join-Path $scriptsRoot "backend-dev.ps1"

$backendPidPath = Join-Path $runRoot "backend.pid"
$frontendPidPath = Join-Path $runRoot "frontend.pid"

$backendStdoutLog = Join-Path $runRoot "backend.out.log"
$backendStderrLog = Join-Path $runRoot "backend.err.log"
$frontendStdoutLog = Join-Path $runRoot "frontend.out.log"
$frontendStderrLog = Join-Path $runRoot "frontend.err.log"

function Ensure-RunRoot {
    New-Item -ItemType Directory -Force -Path $runRoot | Out-Null
}

function Get-StoredProcess {
    param(
        [string]$PidPath
    )

    if (-not (Test-Path $PidPath)) {
        return $null
    }

    $rawPid = (Get-Content -Path $PidPath -ErrorAction SilentlyContinue | Select-Object -First 1).Trim()
    if (-not $rawPid -or $rawPid -notmatch '^\d+$') {
        return $null
    }

    try {
        return Get-Process -Id ([int]$rawPid) -ErrorAction Stop
    } catch {
        return $null
    }
}

function Save-ProcessId {
    param(
        [string]$PidPath,
        [System.Diagnostics.Process]$Process
    )

    Set-Content -Path $PidPath -Value "$($Process.Id)"
}

function Clear-ProcessId {
    param(
        [string]$PidPath
    )

    Remove-Item -Path $PidPath -ErrorAction SilentlyContinue
}

function Get-ListeningProcess {
    param(
        [int]$Port
    )

    try {
        $connection = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction Stop |
            Select-Object -First 1
        if ($null -eq $connection) {
            return $null
        }

        return Get-Process -Id $connection.OwningProcess -ErrorAction Stop
    } catch {
        return $null
    }
}

function Get-ListeningProcesses {
    param(
        [int]$Port
    )

    try {
        $processIds = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction Stop |
            Select-Object -ExpandProperty OwningProcess -Unique

        $processes = @()
        foreach ($processId in $processIds) {
            try {
                $processes += Get-Process -Id $processId -ErrorAction Stop
            } catch {
            }
        }

        return $processes
    } catch {
        return @()
    }
}

function Test-BackendReady {
    param(
        [int]$Attempts = 60
    )

    $healthUrl = "http://$localHost`:$ApiPort/health/ready"
    for ($index = 0; $index -lt $Attempts; $index += 1) {
        try {
            $response = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 2
            if ($response.status -eq "ok" -and $response.database -eq "ok") {
                return $true
            }
        } catch {
        }

        Start-Sleep -Milliseconds 500
    }

    return $false
}

function Test-FrontendReady {
    param(
        [int]$Attempts = 60
    )

    $frontendUrl = "http://$localHost`:$FrontendPort/"
    for ($index = 0; $index -lt $Attempts; $index += 1) {
        & curl.exe --silent --fail --head --max-time 2 $frontendUrl | Out-Null
        if ($LASTEXITCODE -eq 0) {
            return $true
        }

        Start-Sleep -Milliseconds 500
    }

    return $false
}

function Start-BackendIfNeeded {
    $existingProcess = Get-StoredProcess -PidPath $backendPidPath
    if ($existingProcess) {
        Write-Output "Backend already running on http://$localHost`:$ApiPort"
        return
    }

    $listeningProcess = Get-ListeningProcess -Port $ApiPort
    if ($listeningProcess) {
        Save-ProcessId -PidPath $backendPidPath -Process $listeningProcess
        Write-Output "Backend already running on http://$localHost`:$ApiPort"
        return
    }

    if (Test-BackendReady -Attempts 1) {
        $attachedProcess = Get-ListeningProcess -Port $ApiPort
        if ($attachedProcess) {
            Save-ProcessId -PidPath $backendPidPath -Process $attachedProcess
        }
        Write-Output "Backend already running on http://$localHost`:$ApiPort"
        return
    }

    $backendProcess = Start-Process `
        -FilePath "powershell" `
        -ArgumentList @(
            "-ExecutionPolicy",
            "Bypass",
            "-File",
            $backendScript,
            "-Action",
            "serve",
            "-Port",
            "$ApiPort"
        ) `
        -WorkingDirectory $repoRoot `
        -WindowStyle Hidden `
        -PassThru `
        -RedirectStandardOutput $backendStdoutLog `
        -RedirectStandardError $backendStderrLog

    Save-ProcessId -PidPath $backendPidPath -Process $backendProcess

    if (-not (Test-BackendReady)) {
        throw "Backend did not become ready on http://$localHost`:$ApiPort"
    }
}

function Start-FrontendIfNeeded {
    $existingProcess = Get-StoredProcess -PidPath $frontendPidPath
    if ($existingProcess) {
        Write-Output "Frontend already running on http://$localHost`:$FrontendPort"
        return
    }

    $listeningProcess = Get-ListeningProcess -Port $FrontendPort
    if ($listeningProcess) {
        Save-ProcessId -PidPath $frontendPidPath -Process $listeningProcess
        Write-Output "Frontend already running on http://$localHost`:$FrontendPort"
        return
    }

    if (Test-FrontendReady -Attempts 1) {
        $attachedProcess = Get-ListeningProcess -Port $FrontendPort
        if ($attachedProcess) {
            Save-ProcessId -PidPath $frontendPidPath -Process $attachedProcess
        }
        Write-Output "Frontend already running on http://$localHost`:$FrontendPort"
        return
    }

    $frontendProcess = Start-Process `
        -FilePath "npm.cmd" `
        -ArgumentList @(
            "run",
            "dev",
            "--",
            "--host",
            "127.0.0.1",
            "--strictPort"
        ) `
        -WorkingDirectory $frontendRoot `
        -WindowStyle Hidden `
        -PassThru `
        -RedirectStandardOutput $frontendStdoutLog `
        -RedirectStandardError $frontendStderrLog

    Save-ProcessId -PidPath $frontendPidPath -Process $frontendProcess

    if (-not (Test-FrontendReady)) {
        throw "Frontend did not become ready on http://$localHost`:$FrontendPort"
    }
}

function Stop-StoredProcess {
    param(
        [string]$PidPath,
        [string]$Label
    )

    $process = Get-StoredProcess -PidPath $PidPath
    if ($process) {
        try {
            Stop-Process -Id $process.Id -Force
            Wait-Process -Id $process.Id -ErrorAction SilentlyContinue
            Write-Output "$Label stopped"
        } catch {
            Write-Output "$Label was already stopping"
        }
    } else {
        Write-Output "$Label was not running"
    }

    Clear-ProcessId -PidPath $PidPath
}

function Stop-ProcessesListeningOnPort {
    param(
        [int]$Port,
        [string]$Label
    )

    $processes = Get-ListeningProcesses -Port $Port
    foreach ($process in $processes) {
        try {
            Stop-Process -Id $process.Id -Force
            Wait-Process -Id $process.Id -ErrorAction SilentlyContinue
            Write-Output "$Label cleanup stopped PID $($process.Id)"
        } catch {
        }
    }
}

Ensure-RunRoot

switch ($Action) {
    "up" {
        try {
            & $mysqlSandboxScript -Action start
            & $backendScript -Action migrate -Port $ApiPort
            Start-BackendIfNeeded
            Start-FrontendIfNeeded

            Write-Output ""
            Write-Output "BlogAINamLun is ready:"
            Write-Output "Frontend: http://$localHost`:$FrontendPort"
            Write-Output "Backend:  http://$localHost`:$ApiPort/health"
        } catch {
            Stop-StoredProcess -PidPath $frontendPidPath -Label "Frontend"
            Stop-StoredProcess -PidPath $backendPidPath -Label "Backend"
            throw
        }
    }
    "down" {
        Stop-StoredProcess -PidPath $frontendPidPath -Label "Frontend"
        Stop-StoredProcess -PidPath $backendPidPath -Label "Backend"
        Stop-ProcessesListeningOnPort -Port $FrontendPort -Label "Frontend"
        Stop-ProcessesListeningOnPort -Port $ApiPort -Label "Backend"
        & $mysqlSandboxScript -Action stop
    }
}
