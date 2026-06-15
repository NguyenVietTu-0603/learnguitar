#Requires -Version 5.1
<#
.SYNOPSIS
    Generate .env files from .env.example for all 3 services in the monorepo.

.DESCRIPTION
    Walks through learn-guitar-backend/, learn-guitar-frontend/, and Flask-AI-API/.
    For each folder that has a .env.example but no .env, this script will copy
    .env.example to .env so the developer can fill in real values.

.PARAMETER Force
    Overwrite existing .env files. Default: $false (skips files that already exist).

.EXAMPLE
    .\setup-env.ps1
    # Creates .env in any project that has .env.example but is missing .env.

.EXAMPLE
    .\setup-env.ps1 -Force
    # Overwrites any existing .env files with the contents of .env.example.
#>
[CmdletBinding()]
param(
    [switch]$Force
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSCommandPath
$targets = @('learn-guitar-backend', 'learn-guitar-frontend', 'Flask-AI-API')

function Write-Section($msg) {
    Write-Host ''
    Write-Host ('=== {0} ===' -f $msg) -ForegroundColor Cyan
}

Write-Section 'Setting up .env files from .env.example'

foreach ($folder in $targets) {
    $path = Join-Path $repoRoot $folder
    $example = Join-Path $path '.env.example'
    $env = Join-Path $path '.env'

    if (-not (Test-Path $example)) {
        Write-Host ("[skip] {0}: no .env.example" -f $folder) -ForegroundColor DarkGray
        continue
    }

    if ((Test-Path $env) -and -not $Force) {
        Write-Host ("[keep] {0}: .env already exists (use -Force to overwrite)" -f $folder) -ForegroundColor Yellow
        continue
    }

    Copy-Item -Path $example -Destination $env -Force
    Write-Host ("[done] {0}: .env created from .env.example" -f $folder) -ForegroundColor Green
}

Write-Section 'Done'
Write-Host 'Next steps:'
Write-Host '  1. Open each .env file and fill in real values (MongoDB URI, JWT secret, etc.)'
Write-Host '  2. See RAILWAY_DEPLOY.md and VERCEL_DEPLOY.md for production values.'
