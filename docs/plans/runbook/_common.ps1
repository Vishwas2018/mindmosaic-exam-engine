# Shared helpers for the release runbook scripts. Dot-sourced; never run directly.
$ErrorActionPreference = "Continue"  # native stderr is not an error in PS 5.1; failures are checked explicitly
$script:Repo   = "C:\Users\vishw\Vish\Vish\mindmosaic-exam-engine"
$script:Checks = Join-Path $script:Repo "docs\plans\checks"
$script:Psql   = "C:\Users\vishw\pgclient\pg17\pgsql\bin\psql.exe"

function Get-DbUrl([string]$Override) {
  if ($Override) { return $Override }
  $line = Get-Content (Join-Path $script:Repo ".env.local") | Where-Object { $_ -match '^SUPABASE_DB_URL=' } | Select-Object -First 1
  if (-not $line) { throw "SUPABASE_DB_URL not found in .env.local" }
  return $line.Substring(16).Trim('"')
}
function Mask([string]$s) { $s -replace '(://[^:]+:)[^@]*@', '$1***@' }
function Invoke-Psql([string]$Url, [string[]]$PsqlArgs) {
  # Native psql; stderr merged so errors surface in the returned text.
  $out = & $script:Psql $Url -X -At @PsqlArgs 2>&1
  if ($LASTEXITCODE -ne 0) { throw "psql failed ($LASTEXITCODE): $($out -join ' ')" }
  return $out
}
function Get-Ledger([string]$Url) {
  $r = Invoke-Psql $Url @("-c", "select count(*) || '|' || max(version) from supabase_migrations.schema_migrations")
  $c, $v = ("$r").Split("|"); return [pscustomobject]@{ Count = [int]$c; Newest = $v }
}
function Clean-Cli([string]$o) {
  ($o -split "`n" | Where-Object { $_ -notmatch 'WARN|auto_expose|adopt the new|^\s*$|At line|CategoryInfo|FullyQualified|~~~|^\+ |^supabase :' }) -join "`n"
}
