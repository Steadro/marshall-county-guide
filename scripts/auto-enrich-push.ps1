<#
.SYNOPSIS
  Applies new enrichment batches to Neon locally. No git, no CI.

.DESCRIPTION
  Cowork writes batch JSON into data/enrichment/ on local disk but cannot reach
  Neon. This watcher is the missing link: a Windows Task Scheduler job runs it on
  an interval; when it finds batch files that have not been applied yet, it applies
  each to Neon via scripts/apply-enrichment.ts, then moves it into
  data/enrichment/.applied/ (gitignored) so it is not applied again. A batch that
  fails (exit 2 = rejected by validation, nothing written; any other non-zero =
  crashed mid-run) moves to data/enrichment/.needs-attention/ (gitignored) instead
  of being retried every tick: fix it and move it back to retry. Files starting
  with _ or . are scratch/working files and are never picked up.

  Batch files are NEVER committed. This repo is public and the notes inside the
  batches are the maintainer's private research; Neon is the system of record.
  apply-enrichment.ts is idempotent (UPDATE-by-slug), so a re-run is harmless.

  Fast no-op when no batches are pending. Applies run on the maintainer's machine,
  which has .env (DATABASE_URL) and can reach Neon.

  NOTE: the filename is kept as auto-enrich-push.ps1 (despite no longer pushing) so
  the existing Task Scheduler job and run-enrich-push-hidden.vbs wrapper keep working.

.PARAMETER DryRun
  List what would be applied, but apply nothing and move nothing.
#>
[CmdletBinding()]
param([switch]$DryRun)

# Not 'Stop': npx/tsx write normal progress to stderr, which PowerShell 5.1 would
# otherwise turn into a terminating error. We detect real failures via $LASTEXITCODE.
$ErrorActionPreference = 'Continue'

$repo = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repo

$enrichDir  = Join-Path $repo 'data\enrichment'
$appliedDir = Join-Path $enrichDir '.applied'
$needsDir   = Join-Path $enrichDir '.needs-attention'
$logDir     = Join-Path $PSScriptRoot 'logs'
foreach ($d in @($appliedDir, $needsDir, $logDir)) {
  if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d | Out-Null }
}
$log = Join-Path $logDir 'auto-enrich-apply.log'
function Write-Log($msg) {
  Add-Content -LiteralPath $log -Encoding utf8 -Value ("{0}  {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $msg)
}

# Fast path: any batch files waiting directly under data/enrichment/? Names
# starting with _ or . are scratch files; we pass names explicitly, which would
# bypass apply-enrichment.ts's own skip rule, so filter them here.
$pending = @(Get-ChildItem -LiteralPath $enrichDir -Filter '*.json' -File -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -notmatch '^[_.]' })
if ($pending.Count -eq 0) { exit 0 }

$names = ($pending | ForEach-Object { $_.Name }) -join ', '
Write-Log "Pending batches: $names"

if ($DryRun) {
  Write-Output "DRY RUN - would apply: $names"
  Write-Log   "DRY RUN - would apply: $names"
  exit 0
}

$applied = @()
foreach ($file in $pending) {
  $name = $file.Name
  Write-Log "Applying: $name"
  # apply-enrichment.ts resolves a bare filename against data/enrichment/.
  $out = & npx tsx scripts/apply-enrichment.ts $name 2>&1
  $out | ForEach-Object { Write-Log "  $_" }
  if ($LASTEXITCODE -ne 0) {
    $why = if ($LASTEXITCODE -eq 2) { 'rejected, nothing written' } else { 'crashed, may be partly applied' }
    Move-Item -LiteralPath $file.FullName -Destination (Join-Path $needsDir $name) -Force
    Write-Log "ERROR applying $name (exit $LASTEXITCODE, $why) - moved to .needs-attention/; fix it and move it back to retry."
    continue
  }
  Move-Item -LiteralPath $file.FullName -Destination (Join-Path $appliedDir $name) -Force
  Write-Log "Applied + archived: $name"
  $applied += $name
}

if ($applied.Count -gt 0) { Write-Output ("Applied to Neon: {0}" -f ($applied -join ', ')) }
