$projectRef = '[YOUR-PROJECT-ID]'
$anonKey = '[YOUR-ANON-KEY]'

Get-ChildItem -Recurse -File | ForEach-Object {
    $content = Get-Content $_.FullName
    $changed = $false
    
    if ($content -match $projectRef) {
        $content = $content -replace $projectRef, '[YOUR-PROJECT-ID]'
        $changed = $true
    }
    
    if ($content -match $anonKey) {
        $content = $content -replace $anonKey, '[YOUR-ANON-KEY]'
        $changed = $true
    }
    
    if ($changed) {
        Set-Content $_.FullName $content
    }
}
