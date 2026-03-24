param(
    [ValidateSet("init", "start", "stop", "status", "reset")]
    [string]$Action = "status",
    [int]$Port = 3307
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$sandboxRoot = Join-Path $repoRoot ".mysql-dev"
$dataDir = Join-Path $sandboxRoot "data"
$logsDir = Join-Path $sandboxRoot "logs"
$mysqlBase = "C:\Program Files\MySQL\MySQL Server 8.0"
$mysqld = Join-Path $mysqlBase "bin\mysqld.exe"
$mysql = Join-Path $mysqlBase "bin\mysql.exe"
$mysqlAdmin = Join-Path $mysqlBase "bin\mysqladmin.exe"
$errorLog = Join-Path $logsDir "mysqld.err"
$databaseName = "blog_ai_nam_lun"
$appUser = "blogai"
$appPassword = "blogai"

function Assert-BinaryExists([string]$Path) {
    if (-not (Test-Path $Path)) {
        throw "Missing required binary: $Path"
    }
}

function Test-PortOpen([int]$TestPort) {
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $async = $client.BeginConnect("127.0.0.1", $TestPort, $null, $null)
        $connected = $async.AsyncWaitHandle.WaitOne(400)
        if (-not $connected) {
            $client.Close()
            return $false
        }

        $client.EndConnect($async)
        $client.Close()
        return $true
    } catch {
        return $false
    }
}

function Ensure-Directories() {
    New-Item -ItemType Directory -Force -Path $sandboxRoot, $dataDir, $logsDir | Out-Null
}

function Initialize-Database() {
    Ensure-Directories

    if (Test-Path (Join-Path $dataDir "mysql")) {
        return
    }

    & $mysqld "--initialize-insecure" "--basedir=$mysqlBase" "--datadir=$dataDir" | Out-Null
}

function Wait-ForPort([int]$TargetPort, [int]$Attempts = 80) {
    for ($index = 0; $index -lt $Attempts; $index += 1) {
        if (Test-PortOpen $TargetPort) {
            return
        }

        Start-Sleep -Milliseconds 250
    }

    throw "MySQL sandbox did not open port $TargetPort in time."
}

function Invoke-RootSql([string]$Sql) {
    & $mysql -u root --protocol=TCP -h 127.0.0.1 -P $Port --password= -e $Sql
}

function Wait-ForQueryReady([int]$Attempts = 80) {
    for ($index = 0; $index -lt $Attempts; $index += 1) {
        try {
            Invoke-RootSql "SELECT 1;" | Out-Null
            return
        } catch {
            Start-Sleep -Milliseconds 250
        }
    }

    throw "MySQL sandbox did not become query-ready in time."
}

function Ensure-AppDatabase() {
    $sql = @"
CREATE DATABASE IF NOT EXISTS $databaseName;
CREATE USER IF NOT EXISTS '$appUser'@'127.0.0.1' IDENTIFIED BY '$appPassword';
CREATE USER IF NOT EXISTS '$appUser'@'localhost' IDENTIFIED BY '$appPassword';
GRANT ALL PRIVILEGES ON $databaseName.* TO '$appUser'@'127.0.0.1';
GRANT ALL PRIVILEGES ON $databaseName.* TO '$appUser'@'localhost';
FLUSH PRIVILEGES;
"@
    Invoke-RootSql $sql
}

function Start-Sandbox() {
    if (Test-PortOpen $Port) {
        Write-Output "MySQL sandbox is already running on 127.0.0.1:$Port"
        return
    }

    Initialize-Database

    $argumentString = @(
        "--basedir=""$mysqlBase""",
        "--datadir=""$dataDir""",
        "--port=$Port",
        "--bind-address=127.0.0.1",
        "--mysqlx=0",
        "--log-error=""$errorLog"""
    ) -join " "

    Start-Process -FilePath $mysqld -ArgumentList $argumentString -WindowStyle Hidden | Out-Null
    Wait-ForPort $Port
    Wait-ForQueryReady
    Ensure-AppDatabase
    Write-Output "MySQL sandbox started on 127.0.0.1:$Port"
}

function Stop-Sandbox() {
    if (-not (Test-PortOpen $Port)) {
        Write-Output "MySQL sandbox is not running on 127.0.0.1:$Port"
        return
    }

    & $mysqlAdmin -u root --protocol=TCP -h 127.0.0.1 -P $Port --password= shutdown | Out-Null
    Write-Output "MySQL sandbox stopped"
}

function Show-Status() {
    if (Test-PortOpen $Port) {
        Write-Output "running"
    } else {
        Write-Output "stopped"
    }
}

function Reset-Sandbox() {
    if (Test-PortOpen $Port) {
        Stop-Sandbox
        Start-Sleep -Seconds 1
    }

    if (Test-Path $sandboxRoot) {
        Remove-Item -Recurse -Force $sandboxRoot
    }

    Write-Output "MySQL sandbox data removed"
}

Assert-BinaryExists $mysqld
Assert-BinaryExists $mysql
Assert-BinaryExists $mysqlAdmin

switch ($Action) {
    "init" {
        Initialize-Database
        Write-Output "MySQL sandbox data initialized"
    }
    "start" {
        Start-Sandbox
    }
    "stop" {
        Stop-Sandbox
    }
    "status" {
        Show-Status
    }
    "reset" {
        Reset-Sandbox
    }
}
