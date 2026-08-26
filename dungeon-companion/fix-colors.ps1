$files = Get-ChildItem -Path "src" -Filter "*.jsx" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw

    # Backgrounds
    $content = $content -replace "'white'", "'var(--bg-white)'"
    $content = $content -replace '"white"', "'var(--bg-white)'"
    $content = $content -replace "'#ffffff'", "'var(--bg-white)'"
    $content = $content -replace "'#f8fafc'", "'var(--bg-white)'"
    $content = $content -replace "'#f1f5f9'", "'var(--bg-sidebar)'"
    $content = $content -replace "'#fdfaf3'", "'var(--bg-paper)'"
    $content = $content -replace "'#f8f9fa'", "'var(--bg-white)'"
    $content = $content -replace "'#fafafa'", "'var(--bg-white)'"
    $content = $content -replace "'#f9fafb'", "'var(--bg-white)'"
    $content = $content -replace "'#f3f4f6'", "'var(--bg-white)'"
    $content = $content -replace "'#fdf9ec'", "'var(--bg-paper)'"
    
    # Text colors
    $content = $content -replace "'#111827'", "'var(--color-ink)'"
    $content = $content -replace "'#1f2937'", "'var(--color-ink)'"
    $content = $content -replace "'#333333'", "'var(--color-ink)'"
    $content = $content -replace "'#1e293b'", "'var(--color-ink)'"
    $content = $content -replace "'#000'", "'var(--color-ink)'"
    
    # Gray text
    $content = $content -replace "'#6b7280'", "'var(--color-gray)'"
    $content = $content -replace "'#475569'", "'var(--color-gray)'"
    $content = $content -replace "'#334155'", "'var(--color-gray)'"
    $content = $content -replace "'#64748b'", "'var(--color-gray)'"
    $content = $content -replace "'#4b5563'", "'var(--color-gray)'"
    $content = $content -replace "'#94a3b8'", "'var(--color-gray)'"
    
    # Borders
    $content = $content -replace "'#e5e7eb'", "'var(--border-color)'"
    $content = $content -replace "'#cbd5e1'", "'var(--border-color)'"
    $content = $content -replace "'#d1d5db'", "'var(--border-color)'"
    $content = $content -replace "'#e2e8f0'", "'var(--border-color)'"
    $content = $content -replace "'#e2d8c3'", "'var(--border-color)'"

    Set-Content -Path $file.FullName -Value $content -NoNewline
}
Write-Output "Done replacing colors"
