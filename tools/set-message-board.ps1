param(
  [Parameter(Mandatory = $true)][string]$SupabaseUrl,
  [string]$AnonKey = '',
  [string]$AnonKeyFile = '',
  [string]$Proxy = 'socks5h://127.0.0.1:1080',
  [switch]$SkipVerify,
  [switch]$SkipDeploy
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not $AnonKey -and $AnonKeyFile) {
  if (-not (Test-Path $AnonKeyFile)) { throw "AnonKeyFile not found: $AnonKeyFile" }
  $AnonKey = (Get-Content $AnonKeyFile -Raw -Encoding UTF8).Trim()
}
if (-not $AnonKey) {
  throw "Provide -AnonKey or -AnonKeyFile (Supabase anon public key)."
}

$SupabaseUrl = $SupabaseUrl.Trim().TrimEnd('/')
if ($SupabaseUrl -notmatch '^https://[^/]+$') {
  throw "SupabaseUrl must look like https://xxxx.supabase.co"
}
if ($AnonKey -notmatch '^[A-Za-z0-9._\-]+$') {
  throw "AnonKey format looks invalid."
}

function Get-JwtRole([string]$token) {
  try {
    $parts = $token.Split('.')
    if ($parts.Count -lt 2) { return $null }
    $payload = $parts[1].Replace('-', '+').Replace('_', '/')
    while ($payload.Length % 4 -ne 0) { $payload += '=' }
    $json = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($payload))
    return ($json | ConvertFrom-Json).role
  } catch {
    return $null
  }
}

$role = Get-JwtRole $AnonKey
if ($role -eq 'service_role') {
  throw "REFUSED: service_role key must never be used in frontend. Use the anon public key instead."
}
if ($role -and $role -ne 'anon') {
  throw "REFUSED: token role is '$role', expected 'anon'."
}
if (-not $role) {
  Write-Host "Note: could not decode JWT role (new publishable keys are not JWTs)." -ForegroundColor Yellow
  Write-Host "      Make sure this is the anon/public key, never a secret/service_role key." -ForegroundColor Yellow
}

$configPath = Join-Path $root 'source\_data\body-end.njk'
if (-not (Test-Path $configPath)) { throw "Config not found: $configPath" }

$text = [IO.File]::ReadAllText($configPath, [Text.Encoding]::UTF8)
$newText = [regex]::Replace($text, 'supabaseUrl:\s*"[^"]*"', 'supabaseUrl: "' + $SupabaseUrl + '"')
$newText = [regex]::Replace($newText, 'supabaseAnonKey:\s*"[^"]*"', 'supabaseAnonKey: "' + $AnonKey + '"')
if ($newText -eq $text) {
  throw "Could not find supabaseUrl / supabaseAnonKey placeholders in body-end.njk."
}

[IO.File]::WriteAllText($configPath, $newText, (New-Object Text.UTF8Encoding($false)))
Write-Host "Updated source/_data/body-end.njk with $SupabaseUrl (key not echoed)." -ForegroundColor Cyan

if (-not $SkipVerify) {
  try {
    $headers = @{ apikey = $AnonKey; Authorization = "Bearer $AnonKey" }
    $null = Invoke-RestMethod -Uri ($SupabaseUrl + '/rest/v1/messages?select=id&limit=1') -Headers $headers -Method Get -TimeoutSec 20
    Write-Host "Supabase REST check: messages table is readable." -ForegroundColor Green
  } catch {
    Write-Host "Supabase REST check failed: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "Check: SQL executed? table name messages? RLS policies? URL/key correct?" -ForegroundColor Yellow
  }
}

if (-not $SkipDeploy) {
  $env:HTTPS_PROXY = $Proxy
  $env:HTTP_PROXY = $Proxy
  $env:GIT_TERMINAL_PROMPT = '0'

  npx hexo clean
  if ($LASTEXITCODE -ne 0) { throw "hexo clean failed" }

  npx hexo generate
  if ($LASTEXITCODE -ne 0) { throw "hexo generate failed" }

  npx hexo deploy
  if ($LASTEXITCODE -ne 0) { throw "hexo deploy failed (check VPN/proxy)" }

  Write-Host "Deployed: https://nosferatuxada.github.io/blog/message/" -ForegroundColor Green
}

Write-Host "Next: open /message/, submit a test message, verify it from another browser." -ForegroundColor Cyan
