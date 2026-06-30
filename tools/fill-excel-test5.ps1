$xlsx = "C:\Users\Bernt-JanBosma(Yenlo\src\RomfixVisuals\sterkteberekingen funderingswapening Romfix.xlsx"
try {
  $excel = [Runtime.InteropServices.Marshal]::GetActiveObject("Excel.Application")
} catch {
  $excel = New-Object -ComObject Excel.Application
  $excel.Visible = $true
}
$wb = $null
foreach ($w in $excel.Workbooks) {
  if ($w.FullName -eq $xlsx) { $wb = $w; break }
}
if (-not $wb) { $wb = $excel.Workbooks.Open($xlsx) }

function Set-Cells($sheet, $map) {
  foreach ($addr in $map.Keys) {
    $sheet.Range($addr).Value2 = $map[$addr]
  }
}

$c = $wb.Sheets.Item("Capping_Romfix")
Set-Cells $c @{
  "B12" = 1050; "B13" = 250; "B14" = 300
  "C13" = 150; "C14" = 150; "C15" = 11
  "B19" = 250; "B20" = 300
  "D19" = 10; "D20" = 10
  "E19" = 4.5; "E20" = 4.8
  "F13" = "vrij"
}

$r = $wb.Sheets.Item("RoadBase_Romfix")
Set-Cells $r @{
  "B12" = 550; "B13" = 250; "B14" = 250
  "C13" = 150; "C14" = 150; "C15" = 105
  "B19" = 250; "B20" = 250
  "D19" = 10; "D20" = 10
  "E19" = 4.3; "E20" = 3.8
  "F13" = "vrij"
}

$excel.CalculateFull()
$c.Activate()
$c.Range("E13").Select()

Write-Host "Capping E13=$($c.Range('E13').Value2) E14=$($c.Range('E14').Value2)"
Write-Host "RoadBase E13=$($r.Range('E13').Value2) E14=$($r.Range('E14').Value2)"
Write-Host "OK: Test 5 ingevuld"