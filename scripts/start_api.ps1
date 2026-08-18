param(
    [string]$EnvFile = ".env.local"
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$selectedEnv = Join-Path $repoRoot $EnvFile

if (-not (Test-Path -LiteralPath $selectedEnv)) {
    throw "Environment file not found: $selectedEnv"
}

$env:MEENAMMA_ENV_FILE = $selectedEnv
$env:RAZORPAY_WEBHOOK_SECRET = if ($env:RAZORPAY_WEBHOOK_SECRET) {
    $env:RAZORPAY_WEBHOOK_SECRET
} else {
    "test_webhook_secret"
}

$python = Join-Path $repoRoot "api\venv\Scripts\python.exe"
if (-not (Test-Path -LiteralPath $python)) {
    throw "Python virtual environment not found: $python"
}

Write-Host "Starting Meenamma API with environment file $EnvFile"
& $python -m uvicorn api.index:app --host 127.0.0.1 --port 8000
