# Cline PreToolUse hook (Windows/PowerShell) -> shared MindMosaic safety gate.
# Cline ignores a hook that crashes, so this wrapper converts EVERY failure into a cancel.
$ErrorActionPreference = 'Stop'
try {
    $raw = [Console]::In.ReadToEnd()
    $gate = Join-Path $PSScriptRoot '..\..\.agents\scripts\safety-gate.mjs'
    if (-not (Test-Path -LiteralPath $gate)) { throw 'safety-gate.mjs not found' }
    $out = $raw | & node $gate
    if (-not $out) { throw 'safety gate produced no output' }
    ($out -join "`n")
} catch {
    @{ cancel = $true; contextModification = ''; errorMessage = "MindMosaic safety gate failed closed: $($_.Exception.Message)" } | ConvertTo-Json -Compress
}
