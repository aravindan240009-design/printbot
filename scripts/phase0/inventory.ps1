param([string]$OutputPath = "$PSScriptRoot/../../docs/licenses/windows-inventory.json")
$ErrorActionPreference = 'Stop'
# Read-only. Never retrieves jobs, document names, usernames, serials or IP addresses.
$failures = [System.Collections.Generic.List[string]]::new()
function Read-Safe([string]$Label, [scriptblock]$Action) {
    try { @(& $Action) } catch { $failures.Add("${Label}: unavailable ($($_.Exception.GetType().Name))"); @() }
}
$queues = @(Read-Safe 'queues' { Get-Printer })
$queueRecords = @()
$index = 0
foreach ($queue in $queues) {
    $index++
    $config = @(Read-Safe 'configuration' { Get-PrintConfiguration -PrinterName $queue.Name | Select-Object Collate,Color,DuplexingMode,PaperSize })
    $queueRecords += [ordered]@{ queue_id="queue-$index"; driver=$queue.DriverName; type=[string]$queue.Type; status=[string]$queue.PrinterStatus; virtual=($queue.DriverName -match 'PDF|OneNote|XPS'); configuration=$config }
}
$os = @(Read-Safe 'os' { Get-CimInstance Win32_OperatingSystem | Select-Object Caption,Version,BuildNumber,OSArchitecture })
$drivers = @(Read-Safe 'drivers' { Get-PrinterDriver | Select-Object Name,Manufacturer,MajorVersion,PrinterEnvironment })
$ports = @(Read-Safe 'ports' { Get-PrinterPort | ForEach-Object { [ordered]@{ type=$_.PortMonitor; description=$_.Description; network_configured=[bool]$_.PrinterHostAddress } } })
$pnp = @(Read-Safe 'pnp' { Get-PnpDevice -PresentOnly | Where-Object { $_.Class -in @('Printer','PrintQueue','Image') } | Select-Object Class,Status })
$spooler = @(Read-Safe 'spooler' { Get-Service Spooler | Select-Object Status,StartType })
$record = [ordered]@{ schema_version=1; collected_utc=[DateTime]::UtcNow.ToString('o'); read_only=$true; privacy='Queue/port names, IPs, serials, host/user names, PnP instance IDs and document/job data omitted'; os=$os; queues=$queueRecords; drivers=$drivers; ports=$ports; pnp=$pnp; spooler=$spooler; errors=@($failures) }
$parent = Split-Path -Parent ([IO.Path]::GetFullPath($OutputPath))
[IO.Directory]::CreateDirectory($parent) | Out-Null
$record | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $OutputPath -Encoding utf8
Write-Output "Read-only inventory saved: $OutputPath"
