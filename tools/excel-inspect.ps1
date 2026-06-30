$xlsx = "C:\Users\Bernt-JanBosma(Yenlo\src\RomfixVisuals\sterkteberekingen funderingswapening Romfix.xlsx"
try {
  $excel = [Runtime.InteropServices.Marshal]::GetActiveObject("Excel.Application")
} catch {
  $excel = New-Object -ComObject Excel.Application
  $excel.Visible = $true
  $excel.Workbooks.Open($xlsx) | Out-Null
}
Write-Host "Workbooks:"
foreach ($w in $excel.Workbooks) {
  Write-Host " - $($w.Name) | $($w.FullName)"
  foreach ($s in $w.Sheets) {
    Write-Host "   Sheet: $($s.Name)"
  }
}
$wb = $excel.Workbooks | Where-Object { $_.FullName -eq $xlsx } | Select-Object -First 1
if ($wb) {
  $s = $wb.Sheets.Item(1)
  Write-Host "First sheet: $($s.Name)"
  Write-Host "B12 was: $($s.Range('B12').Text)"
}