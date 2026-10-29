<#
Step 1: take the safety-net dump AND prove it restores, in one command.
  .\dump-and-prove.ps1
Writes five files to C:\Users\vishw\mindmosaic-backups\hosted-<yyyy-MM-dd-HHmm>-pre-9-10 (outside every git tree),
prints sizes and SHA-256, restores roles + schema-all + data-all into a throwaway local container, and compares a
fingerprint (schema hashes, ledger, row counts, md5 of auth.users/profiles) between hosted and the restored copy.
The dump only READS hosted. Container and port are removed at the end.
-DbUrl / -DumpUrl override hosted (rehearsal against a local throwaway; -DumpUrl is how the CLI's docker sees it).
Caveat: if a user signs in between dump and compare, the auth.users md5 can differ legitimately; re-run the compare.
#>
param([string]$DbUrl, [string]$DumpUrl)
. "$PSScriptRoot\_common.ps1"
$url = Get-DbUrl $DbUrl
$dumpUrl = if ($DumpUrl) { $DumpUrl } else { $url }
if ($DbUrl -and $DbUrl -match '127\.0\.0\.1|localhost') { $env:PGSSLMODE = "disable" }
$d = "C:\Users\vishw\mindmosaic-backups\hosted-$(Get-Date -Format 'yyyy-MM-dd-HHmm')-pre-9-10"
$null = New-Item -ItemType Directory -Force (Split-Path $d -Parent)
cmd /c "git -C `"$(Split-Path $d -Parent)`" rev-parse --git-dir >nul 2>nul"
if ($LASTEXITCODE -eq 0) { throw "Backup folder is inside a git tree. STOP." }
New-Item -ItemType Directory $d | Out-Null
Write-Host "Target: $(Mask $url)`nFolder: $d"

$null = supabase db dump --db-url $dumpUrl --role-only -f "$d\roles.sql" 2>&1
$null = supabase db dump --db-url $dumpUrl -s public,auth,storage,supabase_migrations -f "$d\schema-all.sql" 2>&1
$null = supabase db dump --db-url $dumpUrl -s public,auth,storage,supabase_migrations --data-only --use-copy -f "$d\data-all.sql" 2>&1
$null = supabase db dump --db-url $dumpUrl -s public,supabase_migrations -f "$d\schema-public-and-ledger.sql" 2>&1
$null = supabase db dump --db-url $dumpUrl -s public,supabase_migrations --data-only --use-copy -f "$d\data-public-and-ledger.sql" 2>&1
$files = Get-ChildItem $d
if ($files.Count -ne 5 -or ($files | Where-Object Length -lt 300)) { throw "Dump incomplete. STOP." }
$files | ForEach-Object { Write-Host ("{0,-34} {1,9} bytes  sha256 {2}" -f $_.Name, $_.Length, (Get-FileHash $_.FullName).Hash.Substring(0, 16)) }

# Fingerprint hosted FIRST (read-only), then restore, then compare.
$fp = Join-Path $script:Checks "fingerprint.sql"
$hostedFp = Invoke-Psql $url @("-c", "set default_transaction_read_only=on", "-f", $fp) | Where-Object { $_ -match '\|' }

$name = "mm-restore-proof"; $port = 54399
docker rm -f $name 2>&1 | Out-Null
docker run -d --name $name -e POSTGRES_PASSWORD=proof -p "127.0.0.1:${port}:5432" public.ecr.aws/supabase/postgres:17.6.1.141 | Out-Null
try {
  for ($i = 0; $i -lt 40; $i++) { Start-Sleep 3; if ((docker exec $name pg_isready -U supabase_admin -h 127.0.0.1 2>&1) -match 'accepting') { break } }
  Start-Sleep 5
  docker cp $d "${name}:/tmp/bk" | Out-Null
  docker cp $fp "${name}:/tmp/fp.sql" | Out-Null
  $adm = @("exec", "-e", "PGPASSWORD=proof", $name, "psql", "-U", "supabase_admin", "-h", "127.0.0.1", "-d", "postgres", "-X")
  & docker @adm -At -c "drop schema if exists auth cascade; drop schema if exists storage cascade;" 2>&1 | Out-Null
  foreach ($f in "roles.sql", "schema-all.sql", "data-all.sql") {
    $o = & docker @adm -q -f "/tmp/bk/$f" 2>&1
    $errs = @($o | Where-Object { $_ -match 'ERROR' })
    Write-Host "restore $f : errors=$($errs.Count)"
    if ($errs.Count) { $errs | Select-Object -First 5 | ForEach-Object { Write-Host $_ }; throw "Restore had errors. The dump is NOT proven. STOP." }
  }
  $restored = docker exec -e PGPASSWORD=proof $name psql -U postgres -h 127.0.0.1 -d postgres -X -At -f /tmp/fp.sql | Where-Object { $_ -match '\|' }
  $bad = 0
  for ($i = 0; $i -lt $hostedFp.Count; $i++) {
    $ok = $hostedFp[$i] -eq $restored[$i]; if (-not $ok) { $bad++ }
    Write-Host ("{0,-6} hosted {1}  |  restored {2}" -f $(if ($ok) { "MATCH" } else { "DIFF" }), $hostedFp[$i], $restored[$i])
  }
  if ($bad) { throw "$bad fingerprint line(s) differ. Investigate before relying on this dump." }
  Write-Host "`nOK: dump restores and matches hosted on all $($hostedFp.Count) fingerprint lines. Folder: $d"
} finally { docker rm -f $name 2>&1 | Out-Null }
