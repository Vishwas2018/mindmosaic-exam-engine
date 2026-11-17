<#
Steps 2 and 3: apply ONE migration to the database, from a throwaway checkout of origin/main.
  .\apply-migration.ps1 -Which 9     # 20261005090000 revision-bound publication approvals
  .\apply-migration.ps1 -Which 10    # 20261013090000 timed writing + parent marking
Refuses unless the ledger is at the expected count, the dry run lists EXACTLY that one file,
and (after) the M9/M10 check script prints FAILURES = 0.
-DbUrl overrides SUPABASE_DB_URL (used to rehearse against a local throwaway).
-DryRunOnly stops after the dry run.
#>
param([Parameter(Mandatory)][ValidateSet(9, 10)][int]$Which, [string]$DbUrl, [switch]$DryRunOnly)
. "$PSScriptRoot\_common.ps1"
$url = Get-DbUrl $DbUrl
$m = @{ 9 = "20261005090000_revision_bound_publication_approvals.sql"; 10 = "20261013090000_timed_writing_parent_marking.sql" }
$expectBefore = @{ 9 = 47; 10 = 48 }[$Which]
$wt = "C:\tmp\wt-rel-apply"
if ($DbUrl -and $DbUrl -match '127\.0\.0\.1|localhost') { $env:PGSSLMODE = "disable" }

Write-Host "Target: $(Mask $url)"
$before = Get-Ledger $url
Write-Host "Ledger before: $($before.Count) rows, newest $($before.Newest)"
if ($before.Count -ne $expectBefore) { throw "Expected ledger count $expectBefore before migration $Which, found $($before.Count). STOP." }

git -C $script:Repo fetch origin 2>&1 | Out-Null
if (Test-Path $wt) { git -C $script:Repo worktree remove --force $wt 2>&1 | Out-Null }
git -C $script:Repo worktree add --detach $wt origin/main 2>&1 | Out-Null
$need = if ($Which -eq 9) { @($m[9]) } else { @($m[9], $m[10]) }
foreach ($f in $need) {
  $dest = Join-Path $wt "supabase\migrations\$f"
  cmd /c "git -C `"$script:Repo`" show origin/dev:supabase/migrations/$f > `"$dest`""
  $want = [int](git -C $script:Repo cat-file -s "origin/dev:supabase/migrations/$f")
  $got = (Get-Item $dest).Length
  if ($want -ne $got) { throw "Byte mismatch on $f (git $want vs file $got). STOP." }
}
Write-Host "Worktree: origin/main $(git -C $wt rev-parse --short HEAD) + $($need.Count) migration file(s), sizes verified"

Push-Location $wt
try {
  $dry = Clean-Cli ((supabase db push --include-all --dry-run --db-url $url 2>&1) | Out-String)
  Write-Host $dry
  $listed = @([regex]::Matches($dry, '\d{14}_[A-Za-z0-9_]+\.sql') | ForEach-Object { $_.Value } | Select-Object -Unique)
  if ($listed.Count -ne 1 -or $listed[0] -ne $m[$Which]) { throw "Dry run must list exactly $($m[$Which]). STOP." }
  if ($DryRunOnly) { Write-Host "DRY RUN OK (one migration listed). Nothing applied."; return }

  $out = Clean-Cli ((supabase db push --include-all --yes --db-url $url 2>&1) | Out-String)
  Write-Host $out
  if ($LASTEXITCODE -ne 0) { throw "db push failed. STOP; report the ledger." }
} finally { Pop-Location }

$after = Get-Ledger $url
Write-Host "Ledger after: $($after.Count) rows, newest $($after.Newest)"
$chk = Invoke-Psql $url @("-f", (Join-Path $script:Checks "m$Which.sql"))
$chk | Where-Object { $_ -notmatch '^SET$' } | ForEach-Object { Write-Host $_ }
if (-not ($chk -contains "FAILURES = 0")) { throw "CHECKS FAILED. Do not continue. Report; rollback only on the owner's word: docs/plans/rollback/rollback-$Which.sql" }
Write-Host "`nSNAPSHOT"
Invoke-Psql $url @("-f", (Join-Path $script:Checks "snapshot.sql")) | Where-Object { $_ -ne "SET" } | ForEach-Object { Write-Host $_ }
Write-Host "`nOK: migration $Which applied, ledger $($after.Count), checks passed."
