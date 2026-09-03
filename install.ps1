# Install decoded.exe for PAYG.
# irm https://raw.githubusercontent.com/SaniaAnees/dECODED/main/install.ps1 | iex

$ErrorActionPreference = "Stop"
$Repo = if ($env:DECODED_REPO) { $env:DECODED_REPO } else { "SaniaAnees/dECODED" }
$BinDir = if ($env:BIN_DIR) { $env:BIN_DIR } else { Join-Path $env:LOCALAPPDATA "decoded" }
$Module = "github.com/$Repo/cmd/decoded"

New-Item -ItemType Directory -Force -Path $BinDir | Out-Null

$arch = "amd64"
if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64") { $arch = "arm64" }

function Install-FromRelease {
    $asset = "decoded_Windows_$arch.zip"
    $url = "https://github.com/$Repo/releases/latest/download/$asset"
    $zip = Join-Path $env:TEMP $asset
    try {
        Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing
    } catch {
        return $false
    }
    $dest = Join-Path $env:TEMP "decoded-extract"
    if (Test-Path $dest) { Remove-Item -Recurse -Force $dest }
    Expand-Archive -Path $zip -DestinationPath $dest -Force
    $exe = Get-ChildItem -Path $dest -Filter "decoded.exe" -Recurse | Select-Object -First 1
    if (-not $exe) { return $false }
    Copy-Item $exe.FullName (Join-Path $BinDir "decoded.exe") -Force
    return $true
}

function Install-WithGo {
    if (-not (Get-Command go -ErrorAction SilentlyContinue)) { return $false }
    Write-Host "decoded install: no GitHub release yet, using go install"
    $env:GOBIN = $BinDir
    go install "$Module@latest"
    return $LASTEXITCODE -eq 0
}

if (Install-FromRelease) {
    Write-Host "installed $(Join-Path $BinDir 'decoded.exe') (release)"
} elseif (Install-WithGo) {
    Write-Host "installed $(Join-Path $BinDir 'decoded.exe') (go install)"
} else {
    Write-Error "decoded install: need a GitHub release or Go 1.22+. go install $Module@latest"
    exit 1
}

Write-Host "run: decoded start"
$pathDirs = $env:Path -split ";"
if ($pathDirs -notcontains $BinDir) {
    Write-Host "add to PATH:  `$env:Path += `";$BinDir`""
}
