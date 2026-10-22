"""
Windows Native Printing Bridge & Hardware Verification Tool.
Provides real-time interface to Windows Print Spooler (winspool) via PowerShell & Win32 APIs.
"""

import subprocess
import json
import sys


def get_windows_printers():
    """Queries real Windows installed printers."""
    cmd = [
        "powershell",
        "-NoProfile",
        "-Command",
        "Get-Printer | Select-Object Name, Type, DriverName, PrinterStatus, Default | ConvertTo-Json"
    ]
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, check=True)
        data = json.loads(proc.stdout)
        if isinstance(data, dict):
            data = [data]
        return data
    except Exception as e:
        print(f"Failed to query Windows printers: {e}", file=sys.stderr)
        return []


def verify_printer_capabilities():
    printers = get_windows_printers()
    print("=" * 60)
    print(f"Windows Native Printing Subsystem: {len(printers)} Printers Discovered")
    print("=" * 60)
    for p in printers:
        is_default = p.get("Default", False)
        print(f"- {p.get('Name')} [{'DEFAULT' if is_default else 'AVAILABLE'}]")
        print(f"  Driver: {p.get('DriverName')}, Status: {p.get('PrinterStatus')}")
    print("=" * 60)
    return len(printers) > 0


if __name__ == "__main__":
    success = verify_printer_capabilities()
    sys.exit(0 if success else 1)
