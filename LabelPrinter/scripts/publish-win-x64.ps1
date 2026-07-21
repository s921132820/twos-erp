[CmdletBinding()]
param(
    [string]$Configuration = "Release"
)

$ErrorActionPreference = "Stop"

$solutionRoot = Split-Path -Parent $PSScriptRoot
$projectPath = Join-Path $solutionRoot "src\LabelPrinter\LabelPrinter.csproj"
$outputPath = Join-Path $solutionRoot "artifacts\publish\win-x64"

if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
    throw ".NET 8 SDK를 찾을 수 없습니다. Visual Studio Installer에서 '.NET 데스크톱 개발' 워크로드를 설치하세요."
}

$installedSdks = @(dotnet --list-sdks)
if (-not ($installedSdks | Where-Object { $_ -match '^8\.' })) {
    throw ".NET 8 SDK가 설치되어 있지 않습니다. Visual Studio Installer에서 .NET 8 SDK를 설치하세요."
}

dotnet restore $projectPath
if ($LASTEXITCODE -ne 0) {
    throw "NuGet 패키지 복원에 실패했습니다."
}

dotnet publish $projectPath `
    --configuration $Configuration `
    --runtime win-x64 `
    --self-contained true `
    --no-restore `
    --output $outputPath `
    -p:PublishSingleFile=true `
    -p:IncludeNativeLibrariesForSelfExtract=true `
    -p:EnableCompressionInSingleFile=true `
    -p:DebugType=None `
    -p:DebugSymbols=false

if ($LASTEXITCODE -ne 0) {
    throw "LabelPrinter 게시에 실패했습니다."
}

$executablePath = Join-Path $outputPath "LabelPrinter.exe"
if (-not (Test-Path -LiteralPath $executablePath)) {
    throw "게시 결과에서 LabelPrinter.exe를 찾을 수 없습니다."
}

Write-Host "게시 완료: $outputPath"
Write-Host "실행 파일: $executablePath"
Write-Host "배포 전에 appsettings.json의 API 설정을 확인하세요."
