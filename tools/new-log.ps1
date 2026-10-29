param(
  [Parameter(Mandatory = $true)][string]$Title,
  [string]$Body = '',
  [string]$Date = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'),
  [string]$Slug = ''
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$dir = Join-Path $root 'source\_logs'
New-Item -ItemType Directory -Path $dir -Force | Out-Null

if ($Slug) {
  $fileName = $Slug + '.md'
} else {
  $fileName = (Get-Date -Format 'yyyyMMdd-HHmmss') + '.md'
}

$path = Join-Path $dir $fileName
$text = "---`ntitle: $Title`ndate: $Date`n---`n`n$Body`n"

[System.IO.File]::WriteAllText($path, $text, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "New log created: $path"
Write-Host "Remember to run: npx hexo clean; npx hexo deploy"
