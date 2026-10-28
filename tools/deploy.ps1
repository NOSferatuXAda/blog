param(
  [string]$Proxy = 'socks5h://127.0.0.1:1080'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "使用代理: $Proxy" -ForegroundColor Cyan
$env:HTTPS_PROXY = $Proxy
$env:HTTP_PROXY = $Proxy
$env:GIT_TERMINAL_PROMPT = '0'

Write-Host "==> hexo clean" -ForegroundColor Cyan
npx hexo clean
Write-Host "==> hexo generate" -ForegroundColor Cyan
npx hexo generate
Write-Host "==> hexo deploy" -ForegroundColor Cyan
npx hexo deploy

if ($LASTEXITCODE -eq 0) {
  Write-Host "部署完成：https://nosferatuxada.github.io/blog/" -ForegroundColor Green
} else {
  Write-Host "部署失败，请检查 VPN/代理是否开启。" -ForegroundColor Red
  exit $LASTEXITCODE
}
