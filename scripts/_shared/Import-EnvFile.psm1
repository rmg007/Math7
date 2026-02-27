<#
.SYNOPSIS
    Import environment variables from .env files into the current PowerShell process.
.DESCRIPTION
    Parses KEY=VALUE lines from environment files and sets them as process-level
    environment variables. Only sets variables that are not already defined in the
    current environment (shell values take precedence).
.PARAMETER FilePaths
    Array of file paths to load, in priority order. First file found wins.
.PARAMETER RequiredVars
    Array of variable names that must be set after loading (either from env or files).
.OUTPUTS
    Hashtable containing all loaded variables (for logging/verification)
.EXAMPLE
    $loaded = Import-EnvFile -FilePaths @("../.secrets", "../.env.local")
    if ($loaded['SUPABASE_DB_PASSWORD']) { Write-Host "Password loaded" }
#>
function Import-EnvFile {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [string[]]$FilePaths,

        [Parameter(Mandatory=$false)]
        [string[]]$RequiredVars = @()
    )

    $loaded = @{}
    $filesRead = @()

    foreach ($filePath in $FilePaths) {
        $fullPath = $null

        # Handle relative paths by resolving from script location
        if ([System.IO.Path]::IsPathRooted($filePath)) {
            $fullPath = $filePath
        } else {
            $scriptDir = $PSScriptRoot
            if (-not $scriptDir) {
                $scriptDir = Split-Path -Parent $MyInvocation.ScriptName
            }
            if (-not $scriptDir) {
                $scriptDir = Get-Location
            }
            $fullPath = Join-Path $scriptDir $filePath
        }

        if (Test-Path $fullPath) {
            Write-Verbose "Loading environment from: $fullPath"
            Get-Content $fullPath | ForEach-Object {
                $line = $_.Trim()

                # Skip empty lines and comments
                if ([string]::IsNullOrWhiteSpace($line) -or $line.StartsWith('#')) {
                    return
                }

                # Parse KEY=VALUE format
                if ($line -match '^([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
                    $key = $Matches[1]
                    $value = $Matches[2].Trim()

                    # Remove quotes if present
                    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or
                        ($value.StartsWith("'") -and $value.EndsWith("'"))) {
                        $value = $value.Substring(1, $value.Length - 2)
                    }

                    # Only set if not already defined in environment
                    if (-not [Environment]::GetEnvironmentVariable($key)) {
                        [Environment]::SetEnvironmentVariable($key, $value, "Process")
                        $loaded[$key] = $value
                    }
                }
            }
            $filesRead += $fullPath
            break  # Stop after first successful file
        }
    }

    # Log summary
    if ($filesRead.Count -gt 0) {
        Write-Host "  Loaded $($loaded.Count) variables from: $($filesRead[0])" -ForegroundColor DarkGray
    } else {
        Write-Warning "No environment files found in: $($FilePaths -join ', ')"
    }

    # Check required variables
    $missing = @()
    foreach ($var in $RequiredVars) {
        if (-not [Environment]::GetEnvironmentVariable($var)) {
            $missing += $var
        }
    }

    if ($missing.Count -gt 0) {
        throw "Required environment variables not set: $($missing -join ', ')"
    }

    return $loaded
}

# Export the function for use by dot-sourcing scripts
Export-ModuleMember -Function Import-EnvFile
